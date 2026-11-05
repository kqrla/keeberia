/**
 * keeberia-pcb-engine — orchestrator.
 * layout JSON → PCB result (placements, nets, routed traces, warnings)
 * + exports (.kicad_pcb, BOM csv, QMK info.json).
 */
import { KeeberiaLayout, PcbResult, Pt } from "./types.ts";
import { placeComponents } from "./layout.ts";
import { buildNetlist } from "./netlist.ts";
import { routeAll } from "./route.ts";
import { routeViaFreerouting } from "./freeroute.ts";
import { buildSilkscreen } from "./silkscreen.ts";
import { runDrc } from "./drc.ts";
import { buildBom, buildQmkInfo } from "./bom.ts";
import { exportKicadPcb } from "./kicad.ts";
import { FabProfile, FabSpec, resolveFab } from "./fab.ts";
import { NetlistResult } from "./netlist.ts";
import { FOOTPRINTS, MX_SOLDER, MX_HOTSWAP, EC11, XIAO, OLED_091 } from "./footprints.ts";

export interface EngineOutput {
  result: PcbResult;
  kicadPcb: string;
  bomCsv: string;
  qmkInfo: Record<string, unknown>;
  netlist: NetlistResult;
  /** which fab rules shaped this board; engine-default when none was chosen */
  fab: Pick<FabProfile, "id" | "source" | "thicknessMm" | "layers" | "maxBoardMm" | "notes">;
}

export function generatePcb(
  layout: KeeberiaLayout,
  router: "engine" | "freerouting" = "engine",
  fab?: FabSpec,
): EngineOutput {
  const profile = resolveFab(fab);
  // 1. place
  const ctx = placeComponents(layout);
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
  return { result, kicadPcb, bomCsv, qmkInfo, netlist, fab: fabInfo };
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
