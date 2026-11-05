/**
 * kicad_drc.ts: optional independent drc via kicad-cli.
 *
 * purpose: a second opinion from a tool we did not write. this runs on the
 * server/ci image only. nobody using keeberia ever needs kicad installed:
 * the browser sends a layout, the daemon generates and exports, and this
 * check (when the binary is present) gates the artifacts before a human
 * can order from them.
 *
 * absent binary = skipped, never failed. the deterministic engine + fab drc
 * remain the authority; this is the outside auditor.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { generatePcb } from "../src/index.ts";
import { layouts } from "./layouts.ts";

function hasKicadCli(): boolean {
  try {
    execFileSync("kicad-cli", ["version"], { stdio: "pipe", timeout: 20000 });
    return true;
  } catch {
    return false;
  }
}

if (!hasKicadCli()) {
  console.log("kicad-cli: SKIPPED (binary not installed on this image)");
  console.log("this check is server/ci only. users never need kicad.");
  process.exit(0);
}

mkdirSync("out/kicad-drc", { recursive: true });
let failed = 0;
for (const [name, layout] of layouts) {
  const out = generatePcb(layout, "engine");
  const board = `out/kicad-drc/${name}.kicad_pcb`;
  writeFileSync(board, out.kicadPcb);
  try {
    const r = execFileSync(
      "kicad-cli",
      ["pcb", "drc", "--exit-code-violations", "--severity-all", "-o", `out/kicad-drc/${name}-drc.rpt`, board],
      { stdio: "pipe", timeout: 120000 },
    );
    console.log(`${name}: kicad drc clean`);
  } catch (e) {
    const report = existsSync(`out/kicad-drc/${name}-drc.rpt`)
      ? readFileSync(`out/kicad-drc/${name}-drc.rpt`, "utf8").split("\n").slice(0, 8).join("\n")
      : String(e).slice(0, 400);
    console.log(`${name}: kicad drc VIOLATIONS`);
    console.log(report);
    failed++;
  }
}
console.log(failed === 0 ? "kicad-cli drc: all reference boards clean" : `kicad-cli drc: ${failed} boards with violations`);
process.exit(failed === 0 ? 0 : 1);
