/**
 * keeberia-pcb-engine — orchestrator.
 * layout JSON → PCB result (placements, nets, routed traces, warnings)
 * + exports (.kicad_pcb, BOM csv, QMK info.json).
 */
import { KeeberiaLayout, PcbResult, Pt } from "./types.ts";
import { placeComponents } from "./layout.ts";
import { buildNetlist } from "./netlist.ts";
import { routeAll } from "./route.ts";
import { buildSilkscreen } from "./silkscreen.ts";
import { runDrc } from "./drc.ts";
import { buildBom, buildQmkInfo } from "./bom.ts";
import { exportKicadPcb } from "./kicad.ts";
import { NetlistResult } from "./netlist.ts";
import { FOOTPRINTS, MX_SOLDER, MX_HOTSWAP, EC11, XIAO, OLED_091 } from "./footprints.ts";

export interface EngineOutput {
  result: PcbResult;
  kicadPcb: string;
  bomCsv: string;
  qmkInfo: Record<string, unknown>;
  netlist: NetlistResult;
}

export function generatePcb(layout: KeeberiaLayout): EngineOutput {
  // 1. place
  const ctx = placeComponents(layout);
  // 2. netlist
  const netlist = buildNetlist(ctx);
  // 3. route
  const route = routeAll(ctx, netlist.nets);
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
  // 5. drc-lite
  runDrc(ctx, result);
  // 6. exports
  const kicadPcb = exportKicadPcb(ctx, result);
  const bomCsv = bomToCsv(result.bom);
  const qmkInfo = buildQmkInfo(ctx, netlist);
  return { result, kicadPcb, bomCsv, qmkInfo, netlist };
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
