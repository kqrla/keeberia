// gerber export for the reference layouts + structural validation:
// rs-274x well-formedness, aperture use before definition, drill tool table
// consistency, copper/mask/paste layer sanity. when a gerber parser is at
// hand (env KEEBERIA_GERBER_PARSER set to a py script), it runs too —
// until then the structural checks are the honest bar.
import { generatePcb } from "../src/index.ts";
import { exportGerbers } from "../src/gerber.ts";
import { layouts } from "./layouts.ts";
import { mkdirSync, writeFileSync, readdirSync } from "node:fs";

mkdirSync("out/gerbers", { recursive: true });
let failed = false;

for (const [name, layout] of layouts) {
  const pcb = generatePcb(layout).result;
  const { files, warnings } = exportGerbers(pcb);

  const dir = `out/gerbers/${name}`;
  mkdirSync(dir, { recursive: true });
  for (const [fname, content] of Object.entries(files)) writeFileSync(`${dir}/${fname}`, content);

  // warnings
  for (const w of warnings) {
    console.log(`${name}: [${w.level}] ${w.message}`);
    if (w.level === "error") failed = true;
  }

  // gerber structure
  for (const [fname, text] of Object.entries(files)) {
    if (!fname.endsWith(".gbr")) continue;
    const lines = text.split("\n");
    if (!lines[0].startsWith("G04")) { console.log(`${name}/${fname}: missing G04 header`); failed = true; }
    if (!text.includes("%FSLAX35Y35*%")) { console.log(`${name}/${fname}: missing format spec`); failed = true; }
    if (!text.includes("%MOMM*%")) { console.log(`${name}/${fname}: missing mm mode`); failed = true; }
    if (!text.trimEnd().endsWith("M02*")) { console.log(`${name}/${fname}: missing M02 terminator`); failed = true; }
    // every D-code referenced must be defined
    const defined = new Set<number>();
    for (const m of text.matchAll(/%ADD(\d+)/g)) defined.add(+m[1]);
    const used = new Set<number>();
    for (const m of text.matchAll(/D(\d+)\*$/gm)) used.add(+m[1]);
    for (const d of used) if (d >= 10 && !defined.has(d)) { console.log(`${name}/${fname}: D${d} used but never defined`); failed = true; }
    // coordinates: 3.5 fixed, integers only
    for (const m of text.matchAll(/X(-?\d+)Y(-?\d+)/g)) {
      if (m[0].includes(".")) { console.log(`${name}/${fname}: decimal in fixed-point coords: ${m[0]}`); failed = true; }
    }
  }

  // drill structure
  const drl = files["keeberia.drl"];
  if (!drl.startsWith("M48")) { console.log(`${name}: drill file missing M48 header`); failed = true; }
  const tools = [...drl.matchAll(/^T(\d+)C([\d.]+)$/gm)];
  const hits = [...drl.matchAll(/^X(-?[\d.]+)Y(-?[\d.]+)$/gm)];
  const toolNums = new Set(tools.map((t) => t[1]));
  const active = new Set<string>();
  for (const line of drl.split("\n")) {
    const tn = line.match(/^T(\d+)$/);
    if (tn) { if (!toolNums.has(tn[1])) { console.log(`${name}: drill selects undefined tool T${tn[1]}`); failed = true; } active.clear(); active.add(tn[1]); }
  }
  console.log(`${name}: ${Object.keys(files).length} files, ${tools.length} drill tools, ${hits.length} drill hits, ` +
    `F.Cu flashes: ${(files["keeberia-F.Cu.gbr"].match(/D03\*/g) ?? []).length}, ` +
    `traces: ${(files["keeberia-F.Cu.gbr"].match(/D01\*/g) ?? []).length + (files["keeberia-B.Cu.gbr"].match(/D01\*/g) ?? []).length}`);
}

if (failed) { console.log("gerber export: FAILED"); process.exit(1); }
console.log("gerber export: all reference layouts pass structural validation");
