/**
 * KiCad .kicad_pcb exporter (KiCad 7 compatible, version 20221018).
 */
import { Sexpr, sexp, at, start, end, center } from "./sexp.ts";
import { BoardCtx, padAbsPos } from "./layout.ts";
import { FOOTPRINTS } from "./footprints.ts";
import { Net, PcbResult, Pt, Segment, Via } from "./types.ts";

const PAD_SHAPE: Record<string, string> = {
  circle: "circle", rect: "rect", oval: "oval", roundrect: "roundrect",
};

function padLayers(pad: any, side: string): string {
  if (pad.type === "thru_hole") return ["*.Cu", "*.Mask"];
  // smd pads live on the side the part is mounted on
  const cu = side === "B" ? "B.Cu" : "F.Cu";
  const mask = side === "B" ? "B.Mask" : "F.Mask";
  return [cu, mask];
}

export function netNumber(netName: string, nets: Net[]): number {
  if (netName === "") return 0;
  const n = nets.find((q) => q.name === netName);
  if (!n) throw new Error(`net not found: ${netName}`);
  return n.number;
}

export function exportKicadPcb(ctx: BoardCtx, result: PcbResult): string {
  const parts: string[] = [];
  parts.push(`(kicad_pcb (version 20221018) (generator keeberia_pcb_engine)`);
  parts.push(`  (general (thickness 1.6))`);
  parts.push(`  (paper "A4")`);
  parts.push(`  (layers`);
  const layers = [
    "0 F.Cu signal", "31 B.Cu signal", "32 B.Paste user", "33 F.Paste user",
    "34 B.SilkS user", "35 F.SilkS user", "36 B.Mask user", "37 F.Mask user",
    "38 Dwgs.User user", "39 Cmts.User user", "40 Eco1.User user", "41 Eco2.User user",
    "42 Edge.Cuts user", "43 Margin user", "44 B.CrtYd user", "45 F.CrtYd user",
    "46 B.Fab user", "47 F.Fab user",
  ];
  for (const l of layers) parts.push(`    (${l})`);
  parts.push(`  )`);
  parts.push(`  (setup`);
  parts.push(`    (pad_to_mask_clearance 0.05)`);
  parts.push(`    (pcbplotparams (layerselection 0x0000000) (usegerberextensions false) (excludeedgelayer true) (linewidth 0.100000) (plotframeref false) (viasonmask false) (mode 1) (useauxorigin false) (hpglpencid 1) (psnegative false) (psa4size false) (psreference false) (psoffset 0.0) (psscale 1.0) (pscolor false) (pstype false) (mirror false) (textmode true) (outputformat 1) (drillshape 1) (scaleselection 1) (outputdirectory ""))`);
  parts.push(`  )`);
  // nets
  parts.push(`  (net 0 "")`);
  for (const n of result.nets) {
    parts.push(`  (net ${n.number} ${JSON.stringify(n.name)})`);
  }
  // footprints
  const netNumOf = (netName: string | undefined) =>
    netName == null || netName === "" ? 0 : netNumber(netName, result.nets);
  for (const pl of ctx.placements) {
    const fp = FOOTPRINTS[pl.library];
    const atS = pl.side === "B" ? [pl.pos.x, pl.pos.y, -(pl.rotation || 0)] : [pl.pos.x, pl.pos.y, pl.rotation || 0];
    const body: string[] = [];
    body.push(`(footprint ${JSON.stringify(fp.kicadName)} (layer ${pl.side === "B" ? "B.Cu" : "F.Cu"}) (at ${atS[0]} ${atS[1]}${atS[2] ? " " + atS[2] : ""}) (tedit 00000000)`);
    const attr = fp.category === "hole"
      ? `(attr board_only exclude_from_pos_files exclude_from_bom allow_missing_courtyard)`
      : `(attr ${fp.pads.some((p) => p.type === "smd") && !fp.pads.some((p) => p.type === "thru_hole") ? "smd" : "through_hole"})`;
    body.push(`  ${attr}`);
    const refLayer = pl.side === "B" ? "B.SilkS" : "F.SilkS";
    body.push(`  (fp_text reference ${JSON.stringify(pl.ref)} (at 0 ${pl.side === "B" ? -(fp.size.h / 2 + 1.2) : fp.size.h / 2 + 1.2}) (layer ${refLayer}) (effects (font (size 1 1) (thickness 0.15))))`);
    body.push(`  (fp_text value ${JSON.stringify(pl.value)} (at 0 ${pl.side === "B" ? fp.size.h / 2 + 1.2 : -(fp.size.h / 2 + 1.2)}) (layer ${pl.side === "B" ? "B.Fab" : "F.Fab"}) (effects (font (size 1 1) (thickness 0.15))))`);
    // body silkscreen
    for (const s of fp.silks) {
      if (s.kind === "line") {
        const sx = pl.side === "B" ? -s.start!.x : s.start!.x;
        const ex = pl.side === "B" ? -s.end!.x : s.end!.x;
        body.push(`  (fp_line (start ${f(sx)} ${f(s.start!.y)}) (end ${f(ex)} ${f(s.end!.y)}) (stroke (width 0.15) (type solid)) (fill solid) (layer ${refLayer}))`);
      } else if (s.kind === "circle") {
        body.push(`  (fp_circle (center ${f(s.center!.x)} ${f(s.center!.y)}) (end ${f(s.center!.x + s.radius!)} ${f(s.center!.y)}) (stroke (width 0.15) (type solid)) (fill none) (layer ${refLayer}))`);
      }
    }
    // pads
    for (const pad of fp.pads) {
      const px = pl.side === "B" ? -pad.pos.x : pad.pos.x;
      const nn = netNumOf(pl.nets[pad.pad]);
      const netStr = nn === 0 ? "" : ` (net ${nn} ${JSON.stringify(pl.nets[pad.pad])})`;
      const padLine = [
        `  (pad ${JSON.stringify(pad.pad)} ${pad.type} ${PAD_SHAPE[pad.shape]}`,
        `(at ${f(px)} ${f(pad.pos.y)})`,
        `(size ${f(pad.size.w)} ${f(pad.size.h)})`,
      ];
      if (pad.drill) padLine.push(`(drill ${f(pad.drill)})`);
      padLine.push(`(layers ${padLayers(pad, pl.side).map((l: string) => JSON.stringify(l)).join(" ")})`);
      padLine.push(`(remove_unused_layers) (keep_end_layers)`);
      padLine.push(netStr.trim());
      const line = padLine.filter(Boolean).join(" ");
      body.push(line + `)`);
    }
    parts.push(indent(body.join("\n")) + ")");
  }
  // segments
  for (const seg of result.segments) {
    parts.push(`  (segment (start ${f(seg.start.x)} ${f(seg.start.y)}) (end ${f(seg.end.x)} ${f(seg.end.y)}) (width ${f(seg.width)}) (layer ${seg.layer}) (net ${netNumber(seg.net, result.nets)} ${JSON.stringify(seg.net)}))`);
  }
  for (const via of result.vias) {
    parts.push(`  (via (at ${f(via.at.x)} ${f(via.at.y)}) (size ${f(via.size)}) (drill ${f(via.drill)}) (layers "F.Cu" "B.Cu") (net ${netNumber(via.net, result.nets)} ${JSON.stringify(via.net)}))`);
  }
  // edge cuts: rounded rect
  parts.push(...edgeCuts(ctx));
  // GND pour zone on B.Cu
  parts.push(...gndZone(ctx, result));
  // silkscreen texts
  for (const s of result.silkscreen) {
    if (s.kind === "text") {
      parts.push(`  (gr_text ${JSON.stringify(s.text)} (at ${f(s.pos.x)} ${f(s.pos.y)}${s.rot ? " " + f(s.rot) : ""}) (layer ${s.layer}) (effects (font (size ${f(s.size ?? 1)} ${f(s.size ?? 1)}) (thickness 0.15))))`);
    }
  }
  parts.push(`)`);
  return parts.join("\n");
}

function f(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(Number(n.toFixed(4)));
}

function indent(s: string): string {
  return s;
}

function edgeCuts(ctx: BoardCtx): string[] {
  const { width, height, cornerRadius: r } = ctx.outline;
  const w = width / 2, h = height / 2;
  const seg = (x1: number, y1: number, x2: number, y2: number) =>
    `  (gr_line (start ${f(x1)} ${f(y1)}) (end ${f(x2)} ${f(y2)}) (stroke (width 0.1) (type solid)) (layer "Edge.Cuts"))`;
  // quarter arc from A to B around center C: mid = C + (A-C + B-C)/sqrt(2)
  const arc = (cx: number, cy: number, ax: number, ay: number, bx: number, by: number) => {
    const mx = cx + (ax - cx + bx - cx) / Math.SQRT2;
    const my = cy + (ay - cy + by - cy) / Math.SQRT2;
    return `  (gr_arc (start ${f(ax)} ${f(ay)}) (mid ${f(mx)} ${f(my)}) (end ${f(bx)} ${f(by)}) (stroke (width 0.1) (type solid)) (layer "Edge.Cuts"))`;
  };
  return [
    seg(-w + r, -h, w - r, -h),          // top
    arc(w - r, -h + r, w - r, -h, w, -h + r),   // top-right
    seg(w, -h + r, w, h - r),            // right
    arc(w - r, h - r, w, h - r, w - r, h),      // bottom-right
    seg(w - r, h, -w + r, h),            // bottom
    arc(-w + r, h - r, -w + r, h, -w, h - r),   // bottom-left
    seg(-w, h - r, -w, -h + r),          // left
    arc(-w + r, -h + r, -w, -h + r, -w + r, -h),// top-left
  ];
}

function gndZone(ctx: BoardCtx, result: PcbResult): string[] {
  const gnd = result.nets.find((n) => n.name === "GND");
  if (!gnd) return [];
  const w = ctx.outline.width / 2 - 1, h = ctx.outline.height / 2 - 1;
  const poly = `(pts (xy ${f(-w)} ${f(-h)}) (xy ${f(w)} ${f(-h)}) (xy ${f(w)} ${f(h)}) (xy ${f(-w)} ${f(h)}))`;
  return [
    `  (zone (net ${gnd.number} ${JSON.stringify(gnd.name)}) (net_name ${JSON.stringify(gnd.name)}) (layer "B.Cu") (hatch edge 0.5)`,
    `    (connect_pads (clearance 0.3))`,
    `    (min_thickness 0.25)`,
    `    (fill yes (thermal_gap 0.5) (thermal_bridge_width 0.5))`,
    `    (polygon ${poly})`,
    `  )`,
  ];
}
