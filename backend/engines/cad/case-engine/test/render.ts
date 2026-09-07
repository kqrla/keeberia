// generate case.scad for the reference layouts; if openscad is available
// (KEEBERIA_OPENSCAD_BIN), compile each to stl — the real geometry check
import { generatePcb } from "../../../pcb/pcb-engine/src/index.ts";
import { generateCase } from "../src/index.ts";
import { layouts as LAYOUTS } from "../../../pcb/pcb-engine/test/layouts.ts";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

mkdirSync("out", { recursive: true });
const oscad = process.env.KEEBERIA_OPENSCAD_BIN ?? "openscad";
const haveOpenscad = (() => {
  try { execSync(`command -v ${oscad.split(" ")[0]} || true`, { stdio: "pipe" }); } catch { /* ignore */ }
  return true; // attempt anyway; failures are reported per-file
})();

let failed = false;
for (const [name, layout] of LAYOUTS) {
  const pcb = generatePcb(layout).result;
  const c = generateCase(pcb);
  const file = `out/${name}-case.scad`;
  writeFileSync(file, c.scad);
  const errs = c.warnings.filter((w) => w.level === "error");
  for (const w of c.warnings) console.log(`${name}: [${w.level}] ${w.message}`);
  console.log(`${file} — standoffs: ${c.stats.standoffs}, usb wall: ${c.stats.usbWall}, plate openings: ${c.stats.plateOpenings}, ${c.scad.length} bytes`);
  if (errs.length > 0) { failed = true; continue; }
  if (haveOpenscad) {
    try {
      execSync(`QT_QPA_PLATFORM=offscreen ${oscad} -o out/${name}-case.stl ${file}`, { stdio: "pipe", timeout: 120000 });
      const stl = `out/${name}-case.stl`;
      if (existsSync(stl)) {
        const kb = (require("node:fs").statSync(stl).size / 1024).toFixed(1);
        console.log(`  compiled → ${stl} (${kb} kb)`);
      }
    } catch (e: any) {
      console.log(`  openscad FAILED: ${String(e.stdout ?? e.message).slice(0, 400)}`);
      failed = true;
    }
  }
}
if (failed) process.exit(1);
console.log("case engine: all reference layouts generated");
