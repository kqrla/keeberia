/**
 * DSN (Specctra) export — the freerouting bridge, out-bound.
 *
 * freerouting is the designated autorouter (anne's call, sept 2026): open
 * source, deterministic, no ai in the copper path. this module writes the
 * board exactly as circuitron sees it, and src/ses.ts reads the routes back.
 *
 * honesty note on geometry: every image is emitted per-placement with pin
 * coordinates already mirrored + rotated into the board frame (angle 0,
 * side front). freerouting then applies no transforms of its own, so the
 * DSN is bit-for-bit the engine's own geometry — no convention drift.
 * pad layers stay true (smd on F.Cu/B.Cu as defined; thru on both).
 *
 * scale: (resolution um 10) → 1 unit = 0.1µm → 1mm = 10000 units.
 */
import { padAbsPos } from "./layout.ts";
import { Net, PcbResult, Placement } from "./types.ts";
import { FOOTPRINTS } from "./footprints.ts";

const U = (mm: number): number => Math.round(mm * 1000); // mm → µm-valued coords (kicad dsn convention: um 10)

export interface DsnOptions {
  traceWidthMm?: number;   // default 0.25
  clearanceMm?: number;    // default 0.26 (house drc: padR + trace/2 + 0.13)
  viaSizeMm?: number;      // default 0.6
  viaDrillMm?: number;     // default 0.3
}

export function exportDsn(result: PcbResult, nets: Net[], opts: DsnOptions = {}): string {
  const w = opts.traceWidthMm ?? 0.25;
  const clr = opts.clearanceMm ?? 0.26;
  const vs = opts.viaSizeMm ?? 0.6;
  const vd = opts.viaDrillMm ?? 0.3;
  const name = (result.boardName || "keeberia-pad").replace(/[()\s]/g, "_");
  const out: string[] = [];

  // ── header ──
  out.push(`(pcb ${name}`);
  out.push(`  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "keeberia circuitron")
    (host_version "1.0")
  )`);
  out.push(`  (resolution um 10)`);
  out.push(`  (unit um)`);

  // ── structure: layers, boundary, via, rules ──
  const o = result.outline;
  out.push(`  (structure
    (layer F.Cu
      (type signal)
      (property
        (index 0)
      )
    )
    (layer B.Cu
      (type signal)
      (property
        (index 1)
      )
    )
    (boundary
      (path pcb 0 ${boundaryPoints(inset(o, 0.3)).join(" ")})
    )
    (via "keeberia_via")
    (rule
      (width ${w * 1000})
      (clearance ${clr * 1000})
      (clearance ${clr * 1000} (type default_smd))
      (clearance ${clr * 1000} (type smd_smd))
    )
  )`);

  // ── placement: one entry per placement, images defined below ──
  out.push(`  (placement`);
  for (const p of result.placements) {
    out.push(`    (component "img_${p.ref}"
      (place ${p.ref} ${U(p.pos.x)} ${U(p.pos.y)} front 0)
    )`);
  }
  out.push(`  )`);

  // ── library: padstacks + one image per placement (board-frame pins) ──
  const padstacks = new Map<string, string>(); // name → definition
  const imageBlocks: string[] = [];
  for (const p of result.placements) {
    const fp = FOOTPRINTS[p.library];
    if (!fp) continue;
    const img: string[] = [];
    img.push(`    (image "img_${p.ref}"`);
    // courtyard outline, same rect as the silk
    const hw = U(fp.size.w / 2), hh = U(fp.size.h / 2);
    img.push(`      (outline (path signal 150 ${-hw} ${-hh} ${hw} ${-hh} ${hw} ${hh} ${-hw} ${hh} ${-hw} ${-hh}))`);
    for (const pad of fp.pads) {
      const rel = relPadPos(result.placements, p.ref, pad.pad);
      const stack = padstackFor(pad, padstacks, vs);
      img.push(`      (pin ${stack} ${pad.pad} ${U(rel.x)} ${U(rel.y)})`);
    }
    img.push(`    )`);
    imageBlocks.push(img.join("\n"));
  }
  out.push(`  (library`);
  // the via as a padstack of the same name as (via "keeberia_via")
  out.push(`    (padstack "keeberia_via"
      (shape (circle F.Cu ${U(vs)}))
      (shape (circle B.Cu ${U(vs)}))
      (attach off)
    )`);
  out.push(`    (padstack "keeberia_via_drill"
      (shape (circle F.Cu ${U(vd)}))
      (shape (circle B.Cu ${U(vd)}))
      (attach off)
    )`);
  for (const def of padstacks.values()) out.push(def);
  for (const img of imageBlocks) out.push(img);
  out.push(`  )`);

  // ── network ──
  out.push(`  (network`);
  for (const net of nets) {
    if (!net.pads.length) continue;
    out.push(`    (net ${q(net.name)}
      (pins ${net.pads.map((pd) => `${pd.ref}-${pd.pad}`).join(" ")})
    )`);
  }
  const netNames = nets.filter((n) => n.pads.length).map((n) => q(n.name));
  out.push(`    (class keeberia ${netNames.join(" ")}
      (circuit
        (use_via "keeberia_via")
      )
      (rule
        (width ${w * 1000})
        (clearance ${clr * 1000})
      )
    )`);
  out.push(`  )`);

  out.push(`  (wiring
  )`);
  out.push(`)`);
  return out.join("\n") + "\n";
}

// board-frame pad offset from its placement origin (mirror + rotation baked in)
function relPadPos(placements: Placement[], ref: string, padName: string): { x: number; y: number } {
  const p = placements.find((pl) => pl.ref === ref)!;
  const abs = padAbsPos(p, padName);
  return { x: abs.x - p.pos.x, y: abs.y - p.pos.y };
}

/** routing boundary sits 0.3mm inside the true board edge so traces land
 *  with the house margin — the physical outline is unchanged */
function inset(o: { width: number; height: number; cornerRadius: number }, m: number) {
  return {
    width: Math.max(o.width - 2 * m, 2),
    height: Math.max(o.height - 2 * m, 2),
    cornerRadius: Math.max(o.cornerRadius - m, 0),
  };
}

function boundaryPoints(o: { width: number; height: number; cornerRadius: number }): number[] {
  const hw = U(o.width / 2), hh = U(o.height / 2);
  const r = U(Math.min(o.cornerRadius, o.width / 2 - 1, o.height / 2 - 1));
  if (r <= 0) {
    return [-hw, -hh, hw, -hh, hw, hh, -hw, hh, -hw, -hh];
  }
  // rounded corners, engine frame (y down). arcs are sampled start/mid/end
  // and CHAIN: each arc's last point sits on the same edge line as the
  // next arc's first point — no jumps, a single simple polygon.
  const pts: number[] = [];
  const corner = (cx: number, cy: number, a0: number) => {
    for (let k = 0; k <= 2; k++) {
      const a = ((a0 + k * 45) * Math.PI) / 180;
      pts.push(Math.round(cx + r * Math.cos(a)), Math.round(cy + r * Math.sin(a)));
    }
  };
  corner(hw - r, -(hh - r), -90);   // top right arc: -90 (top edge) → 0 (right edge)
  corner(hw - r, hh - r, 0);        // bottom right: 0 (right edge) → 90 (bottom edge)
  corner(-(hw - r), hh - r, 90);    // bottom left: 90 (bottom edge) → 180 (left edge)
  corner(-(hw - r), -(hh - r), 180); // top left: 180 (left edge) → 270 (top edge)
  pts.push(pts[0], pts[1]);         // close
  return pts;
}

function padstackFor(pad: { shape: string; size: { w: number; h: number }; type: string; layer: string; drill?: number }, store: Map<string, string>, viaSizeMm: number): string {
  const layers = pad.layer === "*.Cu" ? ["F.Cu", "B.Cu"] : [pad.layer];
  const dims = `${U(pad.size.w)}x${U(pad.size.h)}`;
  const stackName = `${pad.shape}_${dims}_${layers.map((l) => l.replace(".", "")).join("_")}_${pad.type}`;
  if (!store.has(stackName)) {
    const shapes = layers.map((l) => {
      if (pad.shape === "circle") return `      (shape (circle ${l} ${U(pad.size.w)}))`;
      // specctra has no oval shape: a stroked path along the long axis
      // (kicad's own encoding) — stroke width = short axis
      if (pad.shape === "oval") {
        const short = Math.min(pad.size.w, pad.size.h);
        const half = Math.abs(pad.size.w - pad.size.h) / 2;
        return pad.size.w >= pad.size.h
          ? `      (shape (path ${l} ${U(short)} ${U(-half)} 0 ${U(half)} 0))`
          : `      (shape (path ${l} ${U(short)} 0 ${U(-half)} 0 ${U(half)}))`;
      }
      return `      (shape (rect ${l} ${-U(pad.size.w / 2)} ${-U(pad.size.h / 2)} ${U(pad.size.w / 2)} ${U(pad.size.h / 2)}))`;
    });
    store.set(stackName, `    (padstack "${stackName}"
${shapes.join("\n")}
      (attach off)
    )`);
  }
  return stackName;
}

function q(name: string): string {
  return `"${name}"`;
}
