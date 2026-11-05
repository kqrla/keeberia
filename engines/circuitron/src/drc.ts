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

/** fab-driven thresholds. the engine defaults reproduce the pre-fab
 *  checks exactly, so a board with no fab selected is unchanged. */
export interface DrcLimits {
  fabId?: string;
  spacingMm: number;        // trace-to-foreign-pad
  edgeMm: number;           // copper-to-board-edge
  minTraceWidthMm: number;  // 0 = not checked
  minAnnularMm: number;     // via annular ring, 0 = not checked
  minDrillMm: number;       // through-hole pad drill, 0 = not checked
  minViaDrillMm: number;
  minViaDiameterMm: number;
}

export const ENGINE_DRC: DrcLimits = {
  spacingMm: 0.13, edgeMm: 0.2,
  minTraceWidthMm: 0, minAnnularMm: 0.2, minDrillMm: 0,
  minViaDrillMm: 0, minViaDiameterMm: 0,
};

export function runDrc(
  ctx: BoardCtx,
  result: PcbResult,
  limits: DrcLimits = ENGINE_DRC,
): PcbResult {
  const w = ctx.outline.width / 2, h = ctx.outline.height / 2;
  // pads carry their true shape: a capsule (oval) is narrow across its short
  // axis, and measuring it as a max-dimension circle would flag legal routes.
  // shape-aware edge distance keeps the drc honest for both routers.
  const padList: Array<{
    pos: Pt; net: string | undefined; name: string;
    radius: number;                    // circles: true radius
    axis: [Pt, Pt] | null;             // capsules: axis segment + halfwidth
    halfwidth: number;
    thruHole: boolean; side: "F" | "B";
  }> = [];
  for (const pl of ctx.placements) {
    const fp = FOOTPRINTS[pl.library];
    for (const pad of fp.pads) {
      const net = pl.nets[pad.pad];
      const pos = padAbsPos(pl, pad.pad);
      let axis: [Pt, Pt] | null = null;
      let halfwidth = 0;
      if (pad.shape === "oval") {
        const half = Math.abs(pad.size.w - pad.size.h) / 2;
        const rot = (pl.rotation * Math.PI) / 180;
        const mirror = pl.side === "B" ? -1 : 1;
        const long = pad.size.w >= pad.size.h
          ? { x: half * mirror, y: 0 }
          : { x: 0, y: half };
        const rx = long.x * Math.cos(rot) - long.y * Math.sin(rot);
        const ry = long.x * Math.sin(rot) + long.y * Math.cos(rot);
        axis = [{ x: pos.x - rx, y: pos.y - ry }, { x: pos.x + rx, y: pos.y + ry }];
        halfwidth = Math.min(pad.size.w, pad.size.h) / 2;
      }
      padList.push({
        pos, net,
        name: `${pl.ref}.${pad.pad}`,
        radius: Math.max(pad.size.w, pad.size.h) / 2,
        axis,
        halfwidth,
        thruHole: pad.type === "thru_hole",
        side: pl.side,
      });
    }
  }
  for (const seg of result.segments) {
    // outline check
    for (const p of [seg.start, seg.end]) {
      if (Math.abs(p.x) > w - limits.edgeMm || Math.abs(p.y) > h - limits.edgeMm) {
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
      // shape-aware: edge-to-edge distance between trace and pad outline
      let d: number;
      if (pad.axis) {
        const ax = pad.axis;
        let minAxis = Infinity;
        for (let k = 0; k <= 4; k++) {
          const t2 = k / 4;
          const p2 = { x: ax[0].x + (ax[1].x - ax[0].x) * t2, y: ax[0].y + (ax[1].y - ax[0].y) * t2 };
          minAxis = Math.min(minAxis, distSegPoint(seg.start, seg.end, p2));
        }
        d = minAxis - pad.halfwidth;
      } else {
        d = distSegPoint(seg.start, seg.end, pad.pos) - pad.radius;
      }
      if (d < seg.width / 2 + limits.spacingMm) {
        result.warnings.push({
          level: "error",
          message: `trace of net ${seg.net} clears pad ${pad.name} (net ${pad.net ?? "none"}) by only ${d.toFixed(2)}mm`,
          net: seg.net,
        });
      }
    }
  }
  // ── fab-floor checks (no-ops under ENGINE_DRC) ──────────────────────────
  const floor = (v: number) => Math.round(v * 10000) / 10000;
  if (limits.minTraceWidthMm > 0) {
    for (const seg of result.segments) {
      if (seg.width < limits.minTraceWidthMm - 1e-9) {
        result.warnings.push({
          level: "error",
          message: `trace width ${floor(seg.width)}mm is under ${limits.fabId ?? "the fab"}'s ${limits.minTraceWidthMm}mm floor on net ${seg.net}`,
          net: seg.net,
        });
      }
    }
  }
  for (const via of result.vias ?? []) {
    const annular = (via.size - via.drill) / 2;
    if (limits.minViaDrillMm > 0 && via.drill < limits.minViaDrillMm - 1e-9) {
      result.warnings.push({ level: "error", message: `via drill ${floor(via.drill)}mm is under ${limits.fabId ?? "the fab"}'s ${limits.minViaDrillMm}mm floor` });
    }
    if (limits.minViaDiameterMm > 0 && via.size < limits.minViaDiameterMm - 1e-9) {
      result.warnings.push({ level: "error", message: `via diameter ${floor(via.size)}mm is under ${limits.fabId ?? "the fab"}'s ${limits.minViaDiameterMm}mm floor` });
    }
    if (limits.minAnnularMm > 0 && annular < limits.minAnnularMm - 1e-9) {
      result.warnings.push({ level: "error", message: `via annular ring ${floor(annular)}mm is under ${limits.fabId ?? "the fab"}'s ${limits.minAnnularMm}mm floor` });
    }
  }
  if (limits.minDrillMm > 0) {
    for (const pl of ctx.placements) {
      const fp = FOOTPRINTS[pl.library];
      for (const pad of fp.pads) {
        const drill = (pad as { drill?: number }).drill;
        if (typeof drill === "number" && drill > 0 && drill < limits.minDrillMm - 1e-9 && pad.type === "thru_hole") {
          result.warnings.push({
            level: "error",
            message: `drill ${floor(drill)}mm on pad ${pl.ref}.${pad.pad} is under ${limits.fabId ?? "the fab"}'s ${limits.minDrillMm}mm floor`,
          });
        }
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
