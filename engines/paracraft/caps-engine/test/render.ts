// generate caps.scad for the reference layouts; compile each to stl
import { generatePcb } from "../../../circuitron/src/index.ts";
import { generateCaps } from "../src/index.ts";
import { layouts as LAYOUTS } from "../../../circuitron/test/layouts.ts";
import { mkdirSync, writeFileSync, existsSync, statSync } from "node:fs";
import { execSync } from "node:child_process";

mkdirSync("out", { recursive: true });
const oscad = process.env.KEEBERIA_OPENSCAD_BIN ?? "openscad";

let failed = false;
for (const [name, layout] of LAYOUTS) {
  const pcb = generatePcb(layout).result;
  const c = generateCaps(pcb);
  const file = `out/${name}-caps.scad`;
  writeFileSync(file, c.scad);
  for (const w of c.warnings) console.log(`${name}: [${w.level}] ${w.message}`);
  console.log(`${file} — caps: ${c.stats.caps}, knobs: ${c.stats.knobs}, profile: ${c.stats.profile}, ${c.scad.length} bytes`);
  const errs = c.warnings.filter((w) => w.level === "error");
  if (errs.length > 0) { failed = true; continue; }
  try {
    execSync(`QT_QPA_PLATFORM=offscreen ${oscad} -o out/${name}-caps.stl ${file}`, { stdio: "pipe", timeout: 120000 });
    const stl = `out/${name}-caps.stl`;
    if (existsSync(stl)) console.log(`  compiled → ${stl} (${(statSync(stl).size / 1024).toFixed(1)} kb)`);
  } catch (e: any) {
    console.log(`  openscad FAILED: ${String(e.stdout ?? e.message).slice(0, 500)}`);
    failed = true;
  }
}
if (failed) process.exit(1);
console.log("caps engine: all reference layouts generated");
