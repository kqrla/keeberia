/** checkman smoke: every reference board × every corpus fab × fdm + sla.
 *  exits 1 on FAIL when CHECKMAN_STRICT=1. expected honest finding: mx
 *  plate openings fail on fdm — that is the case checkman exists to make. */
import { generatePcb } from "../../../engines/circuitron/src/index.ts";
import { layouts as LAYOUTS } from "../../../engines/circuitron/test/layouts.ts";
import { runCheckman, loadFab, FDM, SLA } from "../src/index.ts";

const fabs = ["jlcpcb", "aisler", "oshpark"];
let failures = 0, warnings = 0, rows = 0;
for (const [name, layout] of LAYOUTS) {
  const pcb = generatePcb(layout).result;
  for (const fabName of fabs) {
    for (const proc of [FDM, SLA]) {
      const r = runCheckman({ pcb, fab: loadFab(fabName), process: proc });
      failures += r.failures; warnings += r.warnings; rows++;
      const tag = `${name}/${fabName}/${proc.name}`;
      console.log(`${tag.padEnd(36)} fail ${r.failures}  warn ${r.warnings}${r.incomplete ? "  (corpus gaps)" : ""}`);
      for (const c of r.checks) {
        if (c.severity === "fail")
          console.log(`    [${c.severity}] ${c.id}: ${c.detail}${c.marginMm != null ? ` (margin ${c.marginMm}mm)` : ""}`);
      }
    }
  }
}
console.log(`\n${rows} runs · ${failures} failures · ${warnings} warnings`);
process.exit(process.env.CHECKMAN_STRICT === "1" && failures > 0 ? 1 : 0);
