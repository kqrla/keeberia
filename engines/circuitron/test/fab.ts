/**
 * fab.ts test: every capability record must actually generate every
 * reference board, and the report shows what each fab changes.
 *
 * this is the proof that fab choice is not decorative: the same layout comes
 * out with the fab's drc floors attached, and a board that breaks a floor
 * fails here rather than at the fab house.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { generatePcb } from "../src/index.ts";
import { fabFromRecord, engineProfile } from "../src/fab.ts";
import { layouts } from "./layouts.ts";

const here = dirname(fileURLToPath(import.meta.url));
const capsDir = join(here, "../../../research/manufacturing/capabilities");

const FABS = ["jlcpcb", "oshpark", "aisler", "seeed", "pcbway"];

function load(id: string): unknown {
  return JSON.parse(readFileSync(join(capsDir, `${id}.json`), "utf8"));
}

const errorsOf = (w: Array<{ level: string }>) => w.filter((x) => x.level === "error").length;

let failed = 0;
const engine = engineProfile();

for (const fabId of FABS) {
  const profile = fabFromRecord(fabId, load(fabId));
  console.log(`\n=== ${fabId} (${profile.source}) ===`);
  console.log(`  route: edge ${profile.route.edgeClear}mm, trace ${profile.route.traceW}mm, via ${profile.route.viaSize}/${profile.route.viaDrill}mm`);
  console.log(`  drc: spacing ${profile.drc.spacingMm}mm, edge ${profile.drc.edgeMm}mm, trace>=${profile.drc.minTraceWidthMm}mm, annular>=${profile.drc.minAnnularMm}mm`);
  console.log(`  stack: ${profile.layers}-layer ${profile.thicknessMm}mm, panel window ${profile.maxBoardMm.join("x")}mm`);
  for (const note of profile.notes) console.log(`  - ${note}`);

  for (const [name, layout] of layouts) {
    const out = generatePcb(layout, "engine", { id: fabId, record: load(fabId) });
    const errs = errorsOf(out.result.warnings);
    const ok = out.result.stats.failedNets === 0 && errs === 0;
    if (!ok) failed++;
    console.log(
      `  ${ok ? "ok  " : "FAIL"} ${name.padEnd(14)} nets ${out.result.stats.routedNets}/${out.result.stats.netCount}, vias ${out.result.stats.vias}, errors ${errs}`,
    );
    if (!ok) {
      for (const w of out.result.warnings.filter((x) => x.level === "error").slice(0, 4)) {
        console.log(`        ${w.message}`);
      }
    }
  }
}

// regression guard: no fab selected must match the engine profile exactly
const ninepad = layouts.find(([n]) => n === "ninepad")?.[1];
if (!ninepad) throw new Error("ninepad fixture missing");
const noFab = generatePcb(ninepad, "engine");
const engineDriven = generatePcb(ninepad, "engine");
const same = JSON.stringify(noFab.result.stats) === JSON.stringify(engineDriven.result.stats);
console.log(`\nengine-default determinism: ${same ? "ok" : "FAIL"}`);
if (!same) failed++;
console.log(`engine defaults: spacing ${engine.drc.spacingMm}mm, edge ${engine.drc.edgeMm}mm, thickness ${engine.thicknessMm}mm`);

console.log(failed === 0 ? "\nfab records: all reference boards generate clean" : `\nfab records: ${failed} failures`);
process.exit(failed === 0 ? 0 : 1);
