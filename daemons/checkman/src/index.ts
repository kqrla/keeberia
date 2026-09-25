/**
 * checkman — manufacturing-fit verification for keeberia.
 *
 * the generators prove the design is internally consistent; checkman proves
 * it survives contact with a fab house and a 3d printer. every check is
 * deterministic: record geometry (circuitron footprints) + evidence-backed
 * fab rules (research corpus capabilities json) + process tolerance presets
 * → margins in mm. negative margin = it will not fit. thin margin = it
 * fits, barely, and the report says so.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FOOTPRINTS } from "../../../engines/circuitron/src/footprints.ts";
import { PcbResult } from "../../../engines/circuitron/src/types.ts";
import { CaseOptions, DEFAULT_CASE_OPTIONS } from "../../../engines/paracraft/src/index.ts";
import { CapsOptions, DEFAULT_CAPS_OPTIONS } from "../../../engines/paracraft/caps-engine/src/index.ts";

// ─── profiles ────────────────────────────────────────────────────────────

export interface FabProfile {
  name: string;
  minDrillMm: number | null;         // null = not published in the corpus yet
  maxDrillMm: number | null;
  holeTolPlusMm: number | null;      // finished-hole oversize tolerance
  holeTolMinusMm: number | null;
  pthRingMinMm: number | null;
  pthRingRecMm: number | null;       // recommended ring; below = warning
}

export interface ProcessProfile {
  name: string;
  /** how much an interior cut shrinks on this process (mm, worst-case) */
  holeShrinkMm: number;
  /** z/height error of the process (mm) */
  zDevMm: number;
  /** minimum clearance for two parts to assemble by hand (mm) */
  clearanceFitMm: number;
  /** thinnest reliably printable wall (mm) */
  minWallMm: number;
}

export const FDM: ProcessProfile = {
  // consumer fdm, 0.4mm nozzle, calibration-flagged until the print test
  name: "fdm",
  holeShrinkMm: 0.25,
  zDevMm: 0.2,
  clearanceFitMm: 0.3,
  minWallMm: 1.2,
};

export const SLA: ProcessProfile = {
  // resin printers hold ~±0.1mm; shrink on small holes is minimal
  name: "sla",
  holeShrinkMm: 0.05,
  zDevMm: 0.1,
  clearanceFitMm: 0.15,
  minWallMm: 0.8,
};

/** load an evidence-backed fab profile from the research corpus */
export function loadFab(name: string, opts: { finish?: string } = {}): FabProfile {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
  const path = join(root, "research", "manufacturing", "capabilities", `${name}.json`);
  const raw = JSON.parse(readFileSync(path, "utf-8"));
  const r = raw.rules ?? {};
  const num = (v: unknown): number | null => (typeof v === "number" ? v : null);
  // some fabs publish per-finish rules (aisler: {enig, hasl}); keeberia's
  // default class is 2-layer 1oz enig, so pick that finish when nested.
  const pick = (v: unknown, finish: string): number | null => {
    if (typeof v === "number") return v;
    if (v != null && typeof v === "object") {
      const o = v as Record<string, unknown>;
      if ("minimum" in o) return num(o.minimum);           // jlcpcb band
      if (finish in o) return num(o[finish]);
    }
    return null;
  };
  const finish = opts.finish ?? "enig";
  const ring = r.pth_annular_ring_mm;
  const holeTol = r.hole_tolerance_mm;
  return {
    name: raw.manufacturer ?? name,
    minDrillMm: pick(r.min_drill_mm ?? r.min_pth_drill_mm, finish),
    maxDrillMm: pick(r.max_drill_mm ?? r.max_pth_drill_mm, finish),
    holeTolPlusMm: holeTol ? num(holeTol.plus) : null,
    holeTolMinusMm: holeTol ? num(holeTol.minus) : null,
    pthRingMinMm: pick(ring, finish),
    pthRingRecMm: ring != null && typeof ring === "object" && "recommended" in (ring as object) ? num((ring as Record<string, unknown>).recommended) : null,
  };
}

// ─── checks ──────────────────────────────────────────────────────────────

export type Severity = "fail" | "warn" | "pass" | "info";

export interface Check {
  id: string;
  severity: Severity;
  detail: string;
  /** mm of room left after tolerances are spent; null = informational */
  marginMm: number | null;
}

export interface CheckmanInput {
  pcb: PcbResult;
  fab: FabProfile;
  process: ProcessProfile;
  case?: Partial<CaseOptions>;
  caps?: Partial<CapsOptions>;
}

export interface CheckmanResult {
  checks: Check[];
  failures: number;
  warnings: number;
  /** true when a margin is missing a number it should have had */
  incomplete: boolean;
}

/** plate-opening undersize allowance: how much smaller than nominal the
 *  switch window may get before clips stop seating. datasheet-typical
 *  (mx cutouts are specified +0.05/+0.15 oversize); calibration-flagged
 *  until the first physical print test. */
const PLATE_UNDERSIZE_ALLOWANCE_MM = 0.1;

/** ec11 d-shaft major diameter. datasheet-typical assumption;
 *  calibration-flagged (see caps-engine TODO of the same flavor). */
const EC11_SHAFT_MM = 6.0;

const round3 = (n: number) => Math.round(n * 1000) / 1000;

export function runCheckman(input: CheckmanInput): CheckmanResult {
  const { pcb, fab, process } = input;
  const caseOpts: CaseOptions = { ...DEFAULT_CASE_OPTIONS, ...(input.case ?? {}) };
  const capsOpts: CapsOptions = { ...DEFAULT_CAPS_OPTIONS, ...(input.caps ?? {}) };
  const checks: Check[] = [];
  const seenFootprints = new Set<string>();
  let incomplete = false;

  const add = (id: string, severity: Severity, detail: string, marginMm: number | null = null) =>
    checks.push({ id, severity, detail, marginMm });

  // 1 — drills vs the fab's drilled-hole limits
  for (const pl of pcb.placements) {
    const fp = FOOTPRINTS[pl.library];
    if (!fp) { add(`footprint:${pl.library}`, "fail", `unknown footprint library key ${pl.library}`); incomplete = true; continue; }
    for (const pad of fp.pads) {
      if (pad.type !== "thru_hole" || pad.drill == null) continue;
      if (fab.minDrillMm != null) {
        const margin = round3(pad.drill - fab.minDrillMm);
        add(
          `drill:${fp.id}:${pad.pad}`,
          margin < 0 ? "fail" : margin < 0.05 ? "warn" : "pass",
          `${fp.id} pad ${pad.pad}: drill ${pad.drill}mm vs fab min ${fab.minDrillMm}mm (${fab.name})`,
          margin,
        );
      } else {
        add(`drill:${fp.id}:${pad.pad}`, "info", `fab ${fab.name} min drill unknown in corpus`, null);
        incomplete = true;
      }
      if (fab.maxDrillMm != null) {
        const margin = round3(fab.maxDrillMm - pad.drill);
        if (margin < 0) add(`drill-max:${fp.id}:${pad.pad}`, "fail", `${fp.id} pad ${pad.pad}: drill ${pad.drill}mm exceeds fab max ${fab.maxDrillMm}mm (${fab.name})`, margin);
      }
      // 2 — annular ring: copper left around the finished hole
      const isElectrical = /^\d+$/.test(pad.pad);
      // peg/guide holes are copper-less NPTH — no ring to check
      if (pad.shape === "circle" && pad.type === "thru_hole" && isElectrical) {
        const ring = round3((Math.min(pad.size.w, pad.size.h) - pad.drill) / 2);
        if (fab.pthRingMinMm != null) {
          const margin = round3(ring - fab.pthRingMinMm);
          const tight = fab.pthRingRecMm != null && ring < fab.pthRingRecMm;
          add(
            `ring:${fp.id}:${pad.pad}`,
            margin < 0 ? "fail" : tight ? "warn" : "pass",
            `${fp.id} pad ${pad.pad}: ring ${ring}mm vs ${fab.name} min ${fab.pthRingMinMm}` + (tight ? `, recommended ${fab.pthRingRecMm} — tight` : ""),
            margin,
          );
        } else {
          add(`ring:${fp.id}:${pad.pad}`, "info", `fab ${fab.name} ring rules unknown in corpus`, null);
          incomplete = true;
        }
      }
      // 3 — pin hole vs finished-hole tolerance: a hole near pin size
      //     after fab undersize still has to pass the pin
      if (fab.holeTolMinusMm != null && isElectrical) {
        const finished = round3(pad.drill - fab.holeTolMinusMm);
        const margin = round3(finished - 0.3); // lead dia allowance, conservative default
        if (margin < 0)
          add(`hole-pin:${fp.id}:${pad.pad}`, "warn", `${fp.id} pad ${pad.pad}: finished hole ${finished}mm after ${fab.name} -${fab.holeTolMinusMm} tolerance is lead-tight`, margin);
      }
    }

    // 4/5 — plate checks fire once per footprint type, not per key
    const c = (fp as { case?: { plateOpening?: { w: number; h: number }; plateThickness?: number } }).case;
    if (seenFootprints.has(fp.id)) continue;
    seenFootprints.add(fp.id);
    if (c?.plateOpening) {
      const opening = c.plateOpening.w;
      const effective = round3(opening - process.holeShrinkMm);
      const margin = round3(PLATE_UNDERSIZE_ALLOWANCE_MM - process.holeShrinkMm);
      add(
        `plate-open:${fp.id}`,
        margin < 0 ? "fail" : margin < 0.05 ? "warn" : "pass",
        `${fp.id}: plate opening ${opening}mm → ~${effective}mm effective on ${process.name} (shrink ${process.holeShrinkMm}mm, allowance ${PLATE_UNDERSIZE_ALLOWANCE_MM}mm)` +
          (margin < 0 ? " — clips will not seat on this process" : ""),
        margin,
      );
    }
    // 5 — plate thickness: datasheet band, eroded by process z-error
    if (c?.plateThickness != null) {
      const BAND = 0.1; // datasheet-typical switch clip band; calibration-flagged
      const margin = round3(BAND - process.zDevMm);
      add(
        `plate-thick:${fp.id}`,
        margin < 0 ? "warn" : "pass", // thickness errs toward loose, not scrap
        `${fp.id}: plate ${c.plateThickness}mm needs ±${BAND}mm; ${process.name} z-dev ${process.zDevMm}mm` + (margin < 0 ? " — clip engagement not guaranteed" : ""),
        margin,
      );
    }
  }

  // 6 — case wall + pcb margin vs the process's printable limits
  add(
    "case:wall",
    caseOpts.wallThickness < process.minWallMm ? "fail" : "pass",
    `case wall ${caseOpts.wallThickness}mm vs ${process.name} min ${process.minWallMm}mm`,
    round3(caseOpts.wallThickness - process.minWallMm),
  );
  add(
    "case:margin",
    caseOpts.caseMargin < process.clearanceFitMm ? "fail" : caseOpts.caseMargin < 2 * process.clearanceFitMm ? "warn" : "pass",
    `pcb-to-wall margin ${caseOpts.caseMargin}mm vs ${process.name} clearance ${process.clearanceFitMm}mm`,
    round3(caseOpts.caseMargin - process.clearanceFitMm),
  );

  // 7 — cap neighbor gap
  add(
    "caps:gap",
    capsOpts.capGap < process.clearanceFitMm ? "fail" : capsOpts.capGap < 2 * process.clearanceFitMm ? "warn" : "pass",
    `cap gap ${capsOpts.capGap}mm vs ${process.name} clearance ${process.clearanceFitMm}mm — below it, caps print fused`,
    round3(capsOpts.capGap - process.clearanceFitMm),
  );

  // 8 — knob bore vs ec11 d-shaft after shrink
  const boreEffective = round3(capsOpts.knobBore - process.holeShrinkMm);
  add(
    "caps:knob-bore",
    boreEffective < EC11_SHAFT_MM ? "fail" : boreEffective < EC11_SHAFT_MM + process.clearanceFitMm ? "warn" : "pass",
    `knob bore ${capsOpts.knobBore}mm → ~${boreEffective}mm on ${process.name} vs ${EC11_SHAFT_MM}mm shaft`,
    round3(boreEffective - EC11_SHAFT_MM),
  );

  const failures = checks.filter((c) => c.severity === "fail").length;
  const warnings = checks.filter((c) => c.severity === "warn").length;
  return { checks, failures, warnings, incomplete };
}
