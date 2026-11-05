/**
 * fab.ts: fab capability records as engine inputs.
 *
 * the routing constants and drc thresholds stop being magic numbers here: a
 * board can be generated for a named fab, and the generator reads that fab's
 * evidence-backed record (research/manufacturing/capabilities/<id>.json).
 *
 * rules of the road:
 *  - no fab selected = ENGINE numbers, byte-identical to the pre-fab output
 *  - a fab can only make the engine stricter on geometry, never looser. the
 *    route constants clamp to engine floors so validated boards never move
 *    silently, while the drc thresholds take the fab's real published floors
 *  - the engine stays pure: it never reads files. callers pass the parsed
 *    capability record in; tests and the worker load the json themselves
 */
import { RouteConstants, ENGINE_ROUTE } from "./route.ts";
import { DrcLimits, ENGINE_DRC } from "./drc.ts";

export interface FabSpec {
  id: string;
  record: unknown;
}

export interface FabProfile {
  id: string;
  source: string;
  manual: string | null;
  route: RouteConstants;
  drc: DrcLimits;
  thicknessMm: number;
  layers: 1 | 2;
  minBoardMm: [number, number];
  maxBoardMm: [number, number];
  silkMinLineMm: number;
  silkMinTextMm: number;
  /** human-readable deltas vs the engine defaults, for reports and the ui */
  notes: string[];
}

type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
/** a rule may be a number or a per-finish object; the floor is the strictest value */
const floorNum = (v: unknown): number | null => {
  if (typeof v === "number") return v;
  if (!isObj(v)) return null;
  const vals = Object.values(v).map(num).filter((n): n is number => n !== null);
  return vals.length ? Math.max(...vals) : null;
};
const pick = (o: unknown, ...keys: string[]): unknown => {
  if (!isObj(o)) return undefined;
  for (const k of keys) if (o[k] !== undefined) return o[k];
  return undefined;
};
const firstNum = (o: unknown, ...keys: string[]): number | null => {
  for (const k of keys) {
    const n = floorNum(pick(o, k));
    if (n !== null) return n;
  }
  return null;
};

/** engine defaults as a profile: what a board gets when no fab is chosen */
export function engineProfile(): FabProfile {
  return {
    id: "engine-default",
    source: "engines/circuitron/src/route.ts + drc.ts",
    manual: null,
    route: { ...ENGINE_ROUTE },
    drc: { ...ENGINE_DRC },
    thicknessMm: 1.6,
    layers: 2,
    minBoardMm: [3, 3],
    maxBoardMm: [670, 600],
    silkMinLineMm: 0.15,
    silkMinTextMm: 1.0,
    notes: ["no fab selected: engine floors only"],
  };
}

/**
 * map one capability record to engine inputs. tolerates the real record
 * shapes: numbers, per-finish objects (aisler), nested clearances, and the
 * inconsistent key names across manufacturers (min_drill_mm vs
 * min_pth_drill_mm, min_silk vs min_stroke, edge keepout vs routed).
 */
export function fabFromRecord(id: string, record: unknown): FabProfile {
  if (!isObj(record)) throw new Error(`fab record for "${id}" is not an object`);
  const rules = isObj(record.rules) ? record.rules : record;
  const notes: string[] = [];
  const base = engineProfile();

  const traceMinMm = firstNum(rules, "min_trace_width_mm");
  const spacingMinMm = firstNum(rules, "min_trace_spacing_mm");
  const minDrillMm = firstNum(rules, "min_drill_mm", "min_pth_drill_mm");
  const minViaDrillMm = firstNum(rules, "min_via_hole_mm", "min_via_drill_mm");
  const minViaDiaMm = firstNum(rules, "min_via_diameter_mm");
  const annularMm = firstNum(rules, "pth_annular_ring_mm");
  const viaAnnularMm = firstNum(rules, "via_annular_ring_mm");
  // vias prefer the via-specific rule, then the recommended pth value, then minimum
  const annularRecommendedMm =
    num(pick(pick(rules, "pth_annular_ring_mm"), "recommended")) ?? null;
  const viaAnnularFloorMm = viaAnnularMm ?? annularRecommendedMm ?? annularMm;
  const copperEdge = pick(rules, "copper_edge_clearance_mm");
  const edgeRoutedMm =
    floorNum(copperEdge) ??
    firstNum(pick(rules, "clearances_mm"), "copper_to_edge") ??
    null;

  // ── route constants: clamp to engine floors, note what did not move ──────
  const route: RouteConstants = { ...base.route };
  if (traceMinMm !== null && traceMinMm > route.traceW) {
    route.traceW = traceMinMm;
    notes.push(`trace width raised to the fab floor ${traceMinMm}mm`);
  }
  if (spacingMinMm !== null && spacingMinMm > base.drc.spacingMm) {
    notes.push(`trace spacing ${spacingMinMm}mm is stricter than the engine's ${base.drc.spacingMm}mm (drc threshold follows the fab)`);
  }
  if (edgeRoutedMm !== null) {
    if (edgeRoutedMm > route.edgeClear) {
      route.edgeClear = edgeRoutedMm;
      notes.push(`edge clearance raised to the fab floor ${edgeRoutedMm}mm`);
    } else {
      notes.push(`fab edge clearance ${edgeRoutedMm}mm sits under the engine's ${route.edgeClear}mm routing margin`);
    }
  }
  if (minViaDrillMm !== null && minViaDrillMm > route.viaDrill) {
    route.viaDrill = minViaDrillMm;
    notes.push(`via drill raised to the fab floor ${minViaDrillMm}mm`);
  }
  // the diameter has to keep the fab's annular ring around the drill the
  // engine actually draws, not around the fab's minimum drill
  const drillNow = Math.max(route.viaDrill, minViaDrillMm ?? 0);
  const viaDiaFloor = viaAnnularFloorMm !== null
    ? Math.max(minViaDiaMm ?? 0, drillNow + 2 * viaAnnularFloorMm)
    : minViaDiaMm;
  if (viaDiaFloor !== null && viaDiaFloor > route.viaSize) {
    route.viaSize = viaDiaFloor;
    notes.push(`via diameter raised to ${viaDiaFloor}mm to keep the fab's annular ring`);
  }

  // ── drc thresholds: the fab's real published floors win ──────────────────
  const drc: DrcLimits = {
    fabId: id,
    spacingMm: Math.max(base.drc.spacingMm, spacingMinMm ?? 0),
    edgeMm: Math.max(base.drc.edgeMm, edgeRoutedMm ?? 0),
    minTraceWidthMm: Math.max(base.drc.minTraceWidthMm, traceMinMm ?? 0),
    minAnnularMm: Math.max(base.drc.minAnnularMm, viaAnnularFloorMm ?? 0),
    minDrillMm: Math.max(base.drc.minDrillMm, minDrillMm ?? 0),
    minViaDrillMm: Math.max(base.drc.minViaDrillMm, minViaDrillMm ?? 0),
    minViaDiameterMm: Math.max(base.drc.minViaDiameterMm, minViaDiaMm ?? 0),
  };

  const thicknesses = Array.isArray(rules.board_thickness_options_mm)
    ? (rules.board_thickness_options_mm as unknown[]).map(num).filter((n): n is number => n !== null)
    : [];
  const thicknessMm = thicknesses.length
    ? thicknesses.includes(1.6)
      ? 1.6
      : thicknesses.reduce((a, b) => (Math.abs(b - 1.6) < Math.abs(a - 1.6) ? b : a))
    : base.thicknessMm;
  if (!thicknesses.includes(1.6) && thicknesses.length) {
    notes.push(`fab does not stock 1.6mm, nearest option ${thicknessMm}mm used`);
  }

  const pair = (v: unknown): [number, number] | null =>
    Array.isArray(v) && v.length === 2 && num(v[0]) !== null && num(v[1]) !== null
      ? [v[0] as number, v[1] as number]
      : null;
  const maxBoardMm = pair(pick(rules, "max_board_2layer_mm", "max_board_mm")) ?? base.maxBoardMm;
  const minBoardMm = pair(pick(rules, "min_board_mm")) ?? base.minBoardMm;

  const silk = pick(rules, "silkscreen");
  const silkMinLineMm = firstNum(silk, "min_line_width_mm", "min_stroke_width_mm") ?? base.silkMinLineMm;
  const silkMinTextMm = firstNum(silk, "min_text_height_mm") ?? base.silkMinTextMm;
  if (silkMinLineMm > base.silkMinLineMm || silkMinTextMm > base.silkMinTextMm) {
    notes.push(`silkscreen floors ${silkMinLineMm}mm line / ${silkMinTextMm}mm text`);
  }

  return {
    id,
    source: `research/manufacturing/capabilities/${id}.json`,
    manual: (pick(record, "manufacturer") as string) ?? id,
    route,
    drc,
    thicknessMm,
    layers: 2,
    minBoardMm,
    maxBoardMm,
    silkMinLineMm,
    silkMinTextMm,
    notes,
  };
}

/** resolve what generatePcb should use. id without a record still works, but says so. */
export function resolveFab(spec?: FabSpec): FabProfile {
  if (!spec) return engineProfile();
  return fabFromRecord(spec.id, spec.record);
}
