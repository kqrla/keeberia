/**
 * keeberia-pcb-engine — orchestrator.
 * layout JSON → PCB result (placements, nets, routed traces, warnings)
 * + exports (.kicad_pcb, BOM csv, QMK info.json).
 */
import { KeeberiaLayout, PcbResult, Pt } from "./types.ts";
import { placeComponents, padAbsPos } from "./layout.ts";
import { buildNetlist } from "./netlist.ts";
import { routeAll } from "./route.ts";
import { routeViaFreerouting } from "./freeroute.ts";
import { buildSilkscreen } from "./silkscreen.ts";
import { runDrc } from "./drc.ts";
import { buildBom, buildQmkInfo } from "./bom.ts";
import { exportKicadPcb } from "./kicad.ts";
import { FabProfile, FabSpec, resolveFab } from "./fab.ts";
import { buildScene3d, Scene3d, Scene3dOptions } from "./scene3d.ts";
import { budgetReport, BudgetReport } from "./budget.ts";
import { OutlineSpec, resolveOutline, pointInShape, shapePolygon } from "./outline.ts";
import { VanitySpec, validateVanity } from "./vanity.ts";
import { NetlistResult } from "./netlist.ts";
import type { QmkInfo } from "./types.ts";
import { FOOTPRINTS, MX_SOLDER, MX_HOTSWAP, EC11, XIAO, OLED_091 } from "./footprints.ts";

export interface EngineOutput {
  result: PcbResult;
  kicadPcb: string;
  bomCsv: string;
  qmkInfo: QmkInfo;
  netlist: NetlistResult;
  /** which fab rules shaped this board; engine-default when none was chosen */
  fab: Pick<FabProfile, "id" | "source" | "thicknessMm" | "layers" | "maxBoardMm" | "notes">;
  /** deterministic 3d scene for the viewer: pcb only, or pcb plus case */
  scene3d: Scene3d;
  /** what the design asks of the mcu, phrased in parts */
  budget: BudgetReport;
  /** the silhouette actually used, plus anything the user's shape got wrong */
  outline: {
    shape: "rect" | "polygon";
    /** the silhouette in board coords (mm). rect is normalised to a 4 point polygon. */
    points: Array<{ x: number; y: number }>;
    cornerRadius: number;
    cutouts: Array<Array<{ x: number; y: number }>>;
    bbox: { width: number; height: number };
    warnings: string[];
    errors: string[];
  };
}

export function generatePcb(
  layout: KeeberiaLayout,
  router: "engine" | "freerouting" = "engine",
  fab?: FabSpec,
  scene?: Scene3dOptions,
): EngineOutput {
  const profile = resolveFab(fab);
  // 1. place
  const ctx = placeComponents(layout);
  // 1b. silhouette: user spec (rect/polygon/dxf) validated against the fab
  const fabLimits = {
    minBoardMm: profile.minBoardMm,
    maxBoardMm: profile.maxBoardMm,
    minCutoutWidthMm: profile.minCutoutWidthMm,
    minWebToEdgeMm: Math.max(1.0, profile.route.edgeClear),
  };
  const outlineRes = resolveOutline(
    (layout as { outline?: OutlineSpec }).outline,
    fabLimits,
    { kind: "rect", width: ctx.outline.width, height: ctx.outline.height, cornerRadius: ctx.outline.cornerRadius },
  );
  if (outlineRes.shape.kind === "polygon") {
    ctx.shape = outlineRes.shape;
    ctx.cutouts = outlineRes.cutouts;
    ctx.outline = { width: outlineRes.bbox.width, height: outlineRes.bbox.height, cornerRadius: 0 };
  } else {
    ctx.cutouts = outlineRes.cutouts;
  }
  // a part hanging off a custom silhouette is a hard error, not a warning
  for (const pl of ctx.placements) {
    const fp = FOOTPRINTS[pl.library];
    for (const pad of fp.pads) {
      const abs = padAbsPos(pl, pad.pad);
      if (!pointInShape(outlineRes.shape, abs, 0)) {
        outlineRes.errors.push(`pad ${pad.pad} of ${pl.ref} sits outside the board silhouette`);
        break;
      }
    }
  }

  // 2. netlist
  const netlist = buildNetlist(ctx);
  // 3. route — the engine's own a* by default; freerouting's push-and-shove
  // is the big-gun retry rung for dense boards (same inputs, same outputs)
  const route = router === "freerouting"
    ? routeViaFreerouting({
        boardName: ctx.options.boardName, outline: ctx.outline, placements: ctx.placements,
        nets: netlist.nets, segments: [], vias: [], silkscreen: [], bom: [], warnings: [], stats: {} as PcbResult["stats"],
      } as PcbResult, netlist.nets)
    : routeAll(ctx, netlist.nets, profile.route);
  // 4. assemble
  const keys = ctx.placements.filter((p) => FOOTPRINTS[p.library]?.category === "switch").length;
  const encoders = ctx.placements.filter((p) => FOOTPRINTS[p.library]?.category === "encoder").length;
  const oleds = ctx.placements.filter((p) => FOOTPRINTS[p.library]?.category === "display").length;
  const result: PcbResult = {
    boardName: ctx.options.boardName,
    outline: ctx.outline,
    placements: ctx.placements,
    nets: netlist.nets,
    segments: route.segments,
    vias: route.vias,
    silkscreen: buildSilkscreen(ctx),
    bom: [],
    warnings: [...route.warnings],
    stats: {
      keys, encoders, oleds,
      netCount: netlist.nets.length,
      routedNets: route.routedNets,
      failedNets: route.failedNets,
      vias: route.vias.length,
      traceMm: Math.round(route.traceMm),
    },
  };
  result.bom = buildBom(ctx);
  // 4b. fab fit: the outline must land inside the fab's published panel window
  const [maxW, maxH] = profile.maxBoardMm;
  const [minW, minH] = profile.minBoardMm;
  const ow = ctx.outline.width, oh = ctx.outline.height;
  const fitsPanel = (ow <= maxW && oh <= maxH) || (oh <= maxW && ow <= maxH);
  if (!fitsPanel) {
    result.warnings.push({
      level: "error",
      message: `board ${ow.toFixed(1)}x${oh.toFixed(1)}mm exceeds ${profile.id}'s ${maxW}x${maxH}mm window`,
    });
  }
  if (ow < minW || oh < minH) {
    result.warnings.push({
      level: "error",
      message: `board ${ow.toFixed(1)}x${oh.toFixed(1)}mm is under ${profile.id}'s ${minW}x${minH}mm minimum`,
    });
  }
  // 4b. vanity: user art and decorative cutouts, validated before they ship
  const padsForVanity = ctx.placements.flatMap((pl) => {
    const fp = FOOTPRINTS[pl.library];
    return fp.pads.map((pad) => {
      const abs = padAbsPos(pl, pad.pad);
      const rot = (pl.rotation * Math.PI) / 180;
      const hw = Math.abs(pad.size.w / 2 * Math.cos(rot)) + Math.abs(pad.size.h / 2 * Math.sin(rot));
      const hh = Math.abs(pad.size.w / 2 * Math.sin(rot)) + Math.abs(pad.size.h / 2 * Math.cos(rot));
      return { pos: abs, halfW: hw, halfH: hh };
    });
  });
  const vanity = validateVanity(
    (layout as { vanity?: VanitySpec }).vanity,
    outlineRes.shape,
    { silkMinLineMm: profile.silkMinLineMm, silkMinTextMm: profile.silkMinTextMm, minCutoutWidthMm: profile.minCutoutWidthMm, minWebToEdgeMm: fabLimits.minWebToEdgeMm },
    padsForVanity,
  );
  ctx.cutouts = [...(ctx.cutouts ?? []), ...vanity.cutouts];
  for (const item of vanity.silkscreen) {
    result.silkscreen.push(
      item.kind === "text"
        ? { kind: "text", pos: item.at ?? { x: 0, y: 0 }, text: item.text, size: item.heightMm, rot: item.rotation, layer: "F.SilkS" }
        : { kind: "line", pos: item.points![0], text: undefined, size: undefined, rot: undefined, layer: "F.SilkS" },
    );
  }
  for (const e of vanity.errors) outlineRes.errors.push(`vanity: ${e}`);
  for (const w of vanity.warnings) outlineRes.warnings.push(`vanity: ${w}`);

  // 4c. silhouette verdicts join the board warnings
  for (const e of outlineRes.errors) result.warnings.push({ level: "error", message: e });
  for (const w of outlineRes.warnings) result.warnings.push({ level: "warning", message: w });

  // 5. drc-lite, thresholds from the fab record when a fab is selected
  runDrc(ctx, result, profile.drc);
  if (router === "freerouting") {
    result.warnings.push({ level: "info", message: `routed by freerouting (${route.routedNets} nets, ${route.vias.length} vias)` });
  }
  // 6. exports
  const kicadPcb = exportKicadPcb(ctx, result);
  const bomCsv = bomToCsv(result.bom);
  const qmkInfo = buildQmkInfo(ctx, netlist);
  const fabInfo = {
    id: profile.id,
    source: profile.source,
    thicknessMm: profile.thicknessMm,
    layers: profile.layers,
    maxBoardMm: profile.maxBoardMm,
    notes: profile.notes,
  };
  // 6b. viewer scene: mm numbers only, model bindings optional
  const scene3d = buildScene3d(ctx, result, { thicknessMm: profile.thicknessMm, ...(scene ?? {}) });

  const outlineInfo = {
    shape: outlineRes.shape.kind,
    points: shapePolygon(outlineRes.shape),
    cornerRadius: outlineRes.shape.kind === "rect" ? outlineRes.shape.cornerRadius : 0,
    cutouts: ctx.cutouts ?? [],
    bbox: outlineRes.bbox,
    warnings: outlineRes.warnings,
    errors: outlineRes.errors,
  };

  const budget = budgetReport({
    keys,
    rows: ctx.cells.length ? Math.max(...ctx.cells.map((c) => c.row)) + 1 : undefined,
    cols: ctx.cells.length ? Math.max(...ctx.cells.map((c) => c.col)) + 1 : undefined,
    encoders,
    displays: oleds,
    rgb: Boolean((layout.options ?? {}).rgb),
    forceMatrix: ctx.options.forceMatrix,
  });

  return { result, kicadPcb, bomCsv, qmkInfo, netlist, fab: fabInfo, scene3d, outline: outlineInfo, budget };
}

function bomToCsv(bom: PcbResult["bom"]): string {
  const rows = ["Ref(s),Value,Footprint,Qty"];
  for (const b of bom) {
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    rows.push([b.refs, b.value, b.footprint, String(b.qty)].map(esc).join(","));
  }
  return rows.join("\n");
}

export { FOOTPRINTS };
