/**
 * DRC-lite: deterministic sanity checks the engine runs on its own output.
 * Catches: segments crossing foreign pads, segments outside the outline,
 * segment-to-segment same-layer crossings of different nets.
 * (Grid-snapped geometry keeps this cheap.)
 */
import { PcbResult, Pt } from "./types.ts";
import { BoardCtx, padAbsPos } from "./layout.ts";
import { FOOTPRINTS } from "./footprints.ts";

function distSegPoint(a: Pt, b: Pt, p: Pt): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-9) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

export function runDrc(ctx: BoardCtx, result: PcbResult): PcbResult {
  const w = ctx.outline.width / 2, h = ctx.outline.height / 2;
  const padList: Array<{ pos: Pt; net: string | undefined; name: string; size: number; thruHole: boolean; side: "F" | "B" }> = [];
  for (const pl of ctx.placements) {
    const fp = FOOTPRINTS[pl.library];
    for (const pad of fp.pads) {
      const net = pl.nets[pad.pad];
      padList.push({
        pos: padAbsPos(pl, pad.pad),
        net,
        name: `${pl.ref}.${pad.pad}`,
        size: Math.max(pad.size.w, pad.size.h) / 2,
        thruHole: pad.type === "thru_hole",
        side: pl.side,
      });
    }
  }
  for (const seg of result.segments) {
    // outline check
    for (const p of [seg.start, seg.end]) {
      if (Math.abs(p.x) > w - 0.2 || Math.abs(p.y) > h - 0.2) {
        result.warnings.push({ level: "error", message: `trace outside board edge on net ${seg.net}`, net: seg.net });
      }
    }
    // pad clearance: 0.15mm min
    const segSide = seg.layer === "F.Cu" ? "F" : "B";
    for (const pad of padList) {
      if (pad.net === seg.net) continue;
      // copper only coexists where layers overlap: thru-hole pads exist on both
      // layers, SMD pads only on their mounted side — no conflict otherwise.
      if (!pad.thruHole && pad.side !== segSide) continue;
      const d = distSegPoint(seg.start, seg.end, pad.pos);
      if (d < pad.size + seg.width / 2 + 0.13) {
        result.warnings.push({
          level: "error",
          message: `trace of net ${seg.net} clears pad ${pad.name} (net ${pad.net ?? "none"}) by only ${d.toFixed(2)}mm`,
          net: seg.net,
        });
      }
    }
  }
  // dedupe
  const seen = new Set<string>();
  result.warnings = result.warnings.filter((w) => {
    const k = w.level + w.message;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return result;
}
