// qmk bundle validation for the reference layouts: json parses, pins are
// real rp2040 gpios and unique, keymap count matches switch count, vial
// matrix dims match the netlist, encoder config present exactly when the
// board has encoders. structural bar only — the container worker compiles.
import { generatePcb } from "../src/index.ts";
import { placeComponents } from "../src/layout.ts";
import { FOOTPRINTS } from "../src/footprints.ts";
import { buildQmkBundle } from "../src/firmware.ts";
import { layouts } from "./layouts.ts";
import { mkdirSync, writeFileSync } from "node:fs";

const RP2040_GPIOS = new Set(Array.from({ length: 30 }, (_, i) => i)); // 0..29
let failed = false;

for (const [name, layout] of layouts) {
  const out = generatePcb(layout);
  const ctx = placeComponents(layout);
  const { files, warnings } = buildQmkBundle(ctx, out.netlist, out.qmkInfo as Record<string, unknown>);

  mkdirSync(`out/qmk/${name}`, { recursive: true });
  for (const [fname, content] of Object.entries(files)) writeFileSync(`out/qmk/${name}/${fname}`, content);

  const info = JSON.parse(files["info.json"]);
  const vial = JSON.parse(files["vial.json"]);

  // info.json sanity
  if (info.processor !== "RP2040") { console.log(`${name}: bad processor`); failed = true; }
  if (!info.keyboard_folder.startsWith("keeberia/")) { console.log(`${name}: bad keyboard_folder`); failed = true; }
  const pins: string[] = [
    ...(info.matrix_pins?.direct ?? []),
    ...(info.matrix_pins?.rows ?? []), ...(info.matrix_pins?.cols ?? []),
    ...(info.encoder?.encoder_pins ?? []).flat(),
  ].filter(Boolean);
  for (const p of pins) {
    const gp = Number(p.replace("GP", ""));
    if (!RP2040_GPIOS.has(gp)) { console.log(`${name}: bad gpio ${p}`); failed = true; }
  }
  if (new Set(pins).size !== pins.length) { console.log(`${name}: duplicate matrix/encoder pins: ${pins}`); failed = true; }

  // keymap matches switch count
  const switchCount = ctx.placements.filter((p) => FOOTPRINTS[p.library]?.category === "switch").length;
  const encoderCount = ctx.placements.filter((p) => FOOTPRINTS[p.library]?.category === "encoder").length;
  // count entries inside the LAYOUT macro only
  const layoutBlock = files["keymap.c"].split(/LAYOUT_\w+\(/)[1]?.split("\n);")[0] ?? "";
  const keymapKeys = (layoutBlock.match(/KC_\w+/g) ?? []).length;
  if (keymapKeys !== switchCount) { console.log(`${name}: keymap has ${keymapKeys} entries, board has ${switchCount} switches`); failed = true; }

  // vial dims
  const expectedRows = out.netlist.mode === "direct" ? 1 : out.netlist.matrix!.rowPins.length;
  const expectedCols = out.netlist.mode === "direct" ? switchCount : out.netlist.matrix!.colPins.length;
  if (vial.matrix.rows !== expectedRows || vial.matrix.cols !== expectedCols) { console.log(`${name}: vial dims ${vial.matrix.rows}x${vial.matrix.cols} != ${expectedRows}x${expectedCols}`); failed = true; }
  if (vial.layouts.keymap.length !== switchCount) { console.log(`${name}: vial keymap length mismatch`); failed = true; }

  // encoder config present exactly when encoders exist
  const hasEncCfg = files["rules.mk"].includes("ENCODER_ENABLE = yes");
  if (hasEncCfg !== (encoderCount > 0)) { console.log(`${name}: encoder rules mismatch`); failed = true; }

  for (const w of warnings) console.log(`${name}: note — ${w}`);
  console.log(`${name}: qmk bundle — ${Object.keys(files).length} files, ${keymapKeys} keymap entries, mode=${out.netlist.mode}, pins=${pins.join(",")}`);
}

if (failed) { console.log("qmk bundle: FAILED"); process.exit(1); }
console.log("qmk bundle: all reference layouts pass structural validation");
