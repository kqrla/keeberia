// test harness: run sample layouts through the engine
import { generatePcb } from "../src/index.ts";
import { KeeberiaLayout } from "../src/types.ts";
import { layouts } from "./layouts.ts";
import { writeFileSync, mkdirSync } from "node:fs";



mkdirSync("out", { recursive: true });
let failed = 0;
for (const [name, layout] of layouts) {
  try {
    const t0 = Date.now();
    const out = generatePcb(layout);
    const ms = Date.now() - t0;
    const { result } = out;
    console.log(`\n=== ${name} (${ms}ms) ===`);
    console.log(`board: ${result.outline.width.toFixed(1)} x ${result.outline.height.toFixed(1)} mm, mode=${out.netlist.mode}`);
    console.log(`stats:`, result.stats);
    const errs = result.warnings.filter((w) => w.level === "error");
    console.log(`warnings: ${result.warnings.length} (errors: ${errs.length})`);
    for (const w of result.warnings.slice(0, 8)) console.log(`  [${w.level}] ${w.message}`);
    writeFileSync(`out/${name}.kicad_pcb`, out.kicadPcb);
    writeFileSync(`out/${name}-bom.csv`, out.bomCsv);
    writeFileSync(`out/${name}-info.json`, JSON.stringify(out.qmkInfo, null, 2));
    writeFileSync(`out/${name}-result.json`, JSON.stringify({
      stats: result.stats, warnings: result.warnings,
      nets: result.nets.map((n) => ({ name: n.name, pads: n.pads.map((p) => `${p.ref}.${p.pad}`) })),
    }, null, 2));
    if (out.netlist.mode === "matrix") console.log(`matrix: rows=${(out.netlist as any).matrix?.rowPins} cols=${(out.netlist as any).matrix?.colPins}`);
  } catch (e) {
    failed++;
    console.error(`\n!!! ${name} FAILED:`, e.message);
    console.error(e.stack?.split("\n").slice(0, 4).join("\n"));
  }
}
process.exit(failed ? 1 : 0);
