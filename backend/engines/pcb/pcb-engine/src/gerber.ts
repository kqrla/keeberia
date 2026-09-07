/**
 * gerber + excellon export — the jlc-orderable output.
 * RS-274X extended gerbers, mm, absolute, y flipped so the fab view matches
 * the board as you look at it. deterministic: same board, same files, forever.
 *
 * layers: F.Cu, B.Cu, F.Mask, B.Mask, F.Paste, B.Paste, F.SilkS, B.SilkS,
 * Edge.Cuts + the drill file. the B.Cu ground pour lives in the kicad export
 * for now (gerbers carry the routed copper only) — the pour joins when the
 * zone engine lands.
 */
import type { PcbResult, Placement, Pt } from "./types.ts";
import { FOOTPRINTS } from "./footprints.ts";
import { padAbsPos } from "./layout.ts";

// a tiny stroke font for silk legends: each glyph is polylines on a
// 4×6 grid, y up. good enough for fab silks; upgraded when the case for
// prettier legends shows up.
const FONT: Record<string, number[][]> = {
  "0": [[0,0,0,6,4,6,4,0,0,0]],
  "1": [[2,0,2,6],[0,2,2,6],[1,0,3,0]],
  "2": [[0,5,1,6,3,6,4,5,4,4,0,0,4,0]],
  "3": [[0,6,3,6,4,5,2,3,4,1,3,0,0,0]],
  "4": [[3,0,3,6,0,2,4,2]],
  "5": [[4,6,0,6,0,3,3,3,4,2,4,1,3,0,0,0]],
  "6": [[4,6,1,6,0,5,0,1,1,0,3,0,4,1,4,2,3,3,0,3]],
  "7": [[0,6,4,6,1,0]],
  "8": [[0,1,0,5,1,6,3,6,4,5,4,1,3,0,1,0,0,1],[0,3,4,3]],
  "9": [[0,0,3,0,4,1,4,5,3,6,1,6,0,5,0,4,1,3,4,3]],
  A: [[0,0,2,6,4,0],[0,2,4,2]],
  B: [[0,0,0,6,3,6,4,5,4,4,3,3,0,3],[3,3,4,2,4,1,3,0,0,0]],
  C: [[4,5,3,6,1,6,0,5,0,1,1,0,3,0,4,1]],
  D: [[0,0,0,6,2,6,4,4,4,2,2,0,0,0]],
  E: [[4,6,0,6,0,0,4,0],[0,3,3,3]],
  F: [[4,6,0,6,0,0],[0,3,3,3]],
  G: [[4,5,3,6,1,6,0,5,0,1,1,0,3,0,4,1,4,3,2,3]],
  H: [[0,0,0,6],[4,0,4,6],[0,3,4,3]],
  I: [[1,0,1,6],[0,6,2,6],[0,0,2,0]],
  J: [[3,6,3,1,2,0,1,0,0,1]],
  K: [[0,0,0,6],[4,6,0,3,4,0]],
  L: [[0,6,0,0,4,0]],
  M: [[0,0,0,6,2,3,4,6,4,0]],
  N: [[0,0,0,6,4,0,4,6]],
  O: [[0,1,0,5,1,6,3,6,4,5,4,1,3,0,1,0,0,1]],
  P: [[0,0,0,6,3,6,4,5,4,4,3,3,0,3]],
  Q: [[0,1,0,5,1,6,3,6,4,5,4,1,3,0,1,0,0,1],[2.5,1.5,4.5,-0.5]],
  R: [[0,0,0,6,3,6,4,5,4,4,3,3,0,3],[1,3,4,0]],
  S: [[4,5,3,6,1,6,0,5,0,4,1,3,3,3,4,2,4,1,3,0,1,0,0,1]],
  T: [[0,6,4,6],[2,6,2,0]],
  U: [[0,6,0,1,1,0,3,0,4,1,4,6]],
  V: [[0,6,2,0,4,6]],
  W: [[0,6,1,0,2,3,3,0,4,6]],
  X: [[0,0,4,6],[0,6,4,0]],
  Y: [[0,6,2,3,4,6],[2,3,2,0]],
  Z: [[0,6,4,6,0,0,4,0]],
  "-": [[0,3,4,3]],
  ".": [[1.5,0,1.5,0.3]],
  "_": [[0,0,4,0]],
  " ": [],
};

// ── gerber writer ──
class Gerber {
  apertures = new Map<string, number>(); // key -> D code
  ops: string[] = [];

  constructor() {
    this.ops.push("%FSLAX35Y35*%", "%MOMM*%", "%LPD*%", "G01*");
  }

  /** returns the D code, defining the aperture on first use */
  aperture(def: string): number {
    let n = this.apertures.get(def);
    if (n === undefined) {
      n = 10 + this.apertures.size;
      this.apertures.set(def, n);
      this.ops.push(`%ADD${n}${def}*%`);
    }
    return n;
  }

  circle(d: number) { return this.aperture(`C,${fmt(d)}`); }
  rect(w: number, h: number) { return this.aperture(`R,${fmt(w)}X${fmt(h)}`); }
  obround(w: number, h: number) { return this.aperture(`O,${fmt(w)}X${fmt(h)}`); }

  /** line from a to b with a round aperture */
  line(a: Pt, b: Pt, width: number) {
    const d = this.circle(width);
    this.ops.push(`D${d}*`, `X${c(a.x)}Y${c(-a.y)}D02*`, `X${c(b.x)}Y${c(-b.y)}D01*`);
  }

  flash(p: Pt, d: number) {
    this.ops.push(`D${d}*`, `X${c(p.x)}Y${c(-p.y)}D03*`);
  }

  toString(name: string) {
    return [`G04 keeberia — ${name}*`, ...this.ops, "M02*"].join("\n") + "\n";
  }
}

const fmt = (n: number) => (Math.round(n * 1e5) / 1e5).toString();
const c = (n: number) => (Math.round(n * 1e5)).toString().replace("-", "-"); // 3.5 fixed, no decimal point

/** pads of a placement in absolute board coords, per layer */
function absPads(pl: Placement) {
  const fp = FOOTPRINTS[pl.library];
  return fp.pads.map((pad) => ({
    ...pad,
    pos: padAbsPos(pl, pad.pad),
  }));
}

/** draw silk text with the stroke font */
function textStrokes(text: string, at: Pt, size: number, rotDeg: number, mirrored: boolean): Array<[Pt, Pt]> {
  const chars = text.toUpperCase().split("");
  const scale = size / 6;             // font grid is 6 tall
  const charW = 5 * scale;             // 4 units + 1 space
  const rad = (rotDeg * Math.PI) / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  const lines: Array<[Pt, Pt]> = [];
  chars.forEach((ch, i) => {
    const glyph = FONT[ch] ?? [];
    const originX = (i - (chars.length - 1) / 2) * charW;
    for (const poly of glyph) {
      for (let k = 0; k + 3 < poly.length; k += 2) {
        const map = (gx: number, gy: number): Pt => {
          let lx = originX + gx * scale;
          const ly = gy * scale;
          if (mirrored) lx = -lx;
          return { x: at.x + lx * cos - ly * sin, y: at.y + lx * sin + ly * cos };
        };
        lines.push([map(poly[k], poly[k + 1]), map(poly[k + 2], poly[k + 3])]);
      }
    }
  });
  return lines;
}

/** footprint silk geometry transformed to board coords */
function fpSilkLines(pl: Placement): Array<[Pt, Pt]> {
  const fp = FOOTPRINTS[pl.library];
  const rad = (pl.rotation * Math.PI) / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  const t = (p: Pt): Pt => {
    let x = p.x;
    if (pl.side === "B") x = -x; // mirror on back
    return { x: pl.pos.x + x * cos - p.y * sin, y: pl.pos.y + x * sin + p.y * cos };
  };
  const lines: Array<[Pt, Pt]> = [];
  for (const s of fp.silks) {
    if (s.kind === "line" && s.start && s.end) lines.push([t(s.start), t(s.end)]);
  }
  return lines;
}

const EDGE_SEGMENTS_PER_CORNER = 8;

export function exportGerbers(result: PcbResult): { files: Record<string, string>; warnings: Array<{ level: "warning" | "error"; message: string }> } {
  const files: Record<string, string> = {};
  const warnings: Array<{ level: "warning" | "error"; message: string }> = [];
  const maskExpand = 0.1;   // mm per side, mask openings larger than pads
  const pasteShrink = 0.05;  // mm per side, paste smaller than smd pads

  const layers: Record<string, Gerber> = {};
  for (const l of ["F.Cu", "B.Cu", "F.Mask", "B.Mask", "F.Paste", "B.Paste", "F.SilkS", "B.SilkS", "Edge.Cuts"]) {
    layers[l] = new Gerber();
  }

  // ── pads ──
  for (const pl of result.placements) {
    const pads = absPads(pl);
    for (const pad of pads) {
      const onFront = pad.type === "thru_hole" || pad.layer === "F.Cu";
      const onBack = pad.type === "thru_hole" || pad.layer === "B.Cu";
      const flashTo = (g: Gerber, expand: number) => {
        const w = Math.max(pad.size.w + 2 * expand, 0.01);
        const h = Math.max(pad.size.h + 2 * expand, 0.01);
        if (pad.shape === "circle" || (w === h && (pad.shape === "roundrect" || pad.shape === "rect"))) g.flash(pad.pos, g.circle(w));
        else if (pad.shape === "oval" || pad.shape === "roundrect") g.flash(pad.pos, g.obround(w, h));
        else g.flash(pad.pos, g.rect(w, h));
      };
      if (onFront) { flashTo(layers["F.Cu"], 0); flashTo(layers["F.Mask"], maskExpand); }
      if (onBack) { flashTo(layers["B.Cu"], 0); flashTo(layers["B.Mask"], maskExpand); }
      if (pad.type === "smd" && pad.layer === "F.Cu") flashTo(layers["F.Paste"], -pasteShrink);
      if (pad.type === "smd" && pad.layer === "B.Cu") flashTo(layers["B.Paste"], -pasteShrink);
    }
  }

  // ── traces + vias ──
  for (const seg of result.segments) {
    layers[seg.layer].line(seg.start, seg.end, seg.width);
  }
  for (const via of result.vias) {
    for (const l of ["F.Cu", "B.Cu"]) layers[l].flash(via.at, layers[l].circle(via.size));
    for (const l of ["F.Mask", "B.Mask"]) layers[l].flash(via.at, layers[l].circle(via.size + 2 * maskExpand));
  }

  // ── silkscreen: footprint outlines + legends ──
  const silkWidth = 0.15;
  for (const pl of result.placements) {
    const target = pl.side === "B" ? "B.SilkS" : "F.SilkS";
    for (const [a, b] of fpSilkLines(pl)) layers[target].line(a, b, silkWidth);
  }
  for (const item of result.silkscreen) {
    const g = layers[item.layer] ?? layers["F.SilkS"];
    if (item.kind === "text" && item.text) {
      const mirrored = item.layer.startsWith("B.");
      for (const [a, b] of textStrokes(item.text, item.pos, item.size ?? 0.8, item.rot ?? 0, mirrored)) g.line(a, b, silkWidth);
    }
  }

  // ── edge cuts: rounded rect, arcs approximated by segments (deterministic) ──
  {
    const g = layers["Edge.Cuts"];
    const w = result.outline.width, h = result.outline.height, r = result.outline.cornerRadius;
    const edge = 0.1; // stroke ~ a hairline
    const hw = w / 2, hh = h / 2;
    const pts: Pt[] = [];
    const corner = (cx: number, cy: number, a0: number) => {
      for (let i = 0; i <= EDGE_SEGMENTS_PER_CORNER; i++) {
        const a = a0 + (Math.PI / 2) * (i / EDGE_SEGMENTS_PER_CORNER);
        pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
      }
    };
    // board coords, y down (gerber y is flipped at emit). the loop runs
    // right edge → bottom → left → top, corners in arc order.
    corner(hw - r, hh - r, 0);            // bottom-right: east → south
    corner(-(hw - r), hh - r, Math.PI / 2);   // bottom-left: south → west
    corner(-(hw - r), -(hh - r), Math.PI);     // top-left: west → north
    corner(hw - r, -(hh - r), 3 * Math.PI / 2); // top-right: north → east
    for (let i = 0; i < pts.length; i++) {
      g.line(pts[i], pts[(i + 1) % pts.length], edge);
    }
  }

  for (const [name, g] of Object.entries(layers)) {
    files[`keeberia-${name}.gbr`] = g.toString(name);
  }

  // ── excellon drill file ──
  {
    const hits: Array<{ x: number; y: number; d: number; plated: boolean }> = [];
    for (const pl of result.placements) {
      for (const pad of absPads(pl)) {
        if (pad.drill) hits.push({ x: pad.pos.x, y: pad.pos.y, d: pad.drill, plated: true });
      }
    }
    for (const via of result.vias) hits.push({ x: via.at.x, y: via.at.y, d: via.drill, plated: true });

    const sizes = [...new Set(hits.map((h) => h.d))].sort((a, b) => a - b);
    const toolOf = new Map(sizes.map((d, i) => [d, i + 1]));
    const L: string[] = ["M48", "METRIC,TZ", "; keeberia drill file — generated from the project model"];
    sizes.forEach((d, i) => L.push(`T${i + 1}C${d.toFixed(2)}`));
    L.push("%", "G90*", "G05*");
    for (const d of sizes) {
      L.push(`T${toolOf.get(d)}`);
      for (const h of hits.filter((x) => x.d === d)) {
        L.push(`X${h.x.toFixed(3)}Y${(-h.y).toFixed(3)}`);
      }
    }
    L.push("M95", "");
    files["keeberia.drl"] = L.join("\n");
    if (hits.length === 0) warnings.push({ level: "error", message: "this board has no drill hits — something is wrong with the pad model" });
  }

  // sanity: every copper layer got content
  for (const l of ["F.Cu", "B.Cu"]) {
    if (!files[`keeberia-${l}.gbr`].includes("D03*")) {
      warnings.push({ level: "error", message: `the ${l} gerber is empty — check placements and traces` });
    }
  }

  return { files, warnings };
}
