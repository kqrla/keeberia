/**
 * edge + firmware regression: the two silent failures the typecheck found.
 *
 * 1. the cutout-to-edge web rule. index.ts read a fab field that does not exist,
 *    so the floor became NaN and every comparison against it was false, which
 *    means the rule silently passed everything whenever a fab was selected.
 *    a NaN floor is worse than no rule: it looks enforced in the code and is
 *    enforced nowhere.
 *
 * 2. the qmk keymap. firmware read placement.label, a field placements never
 *    had (the legend lives in value), so every key fell through to its ref and
 *    every generated keymap was KC_NO.
 *
 * both are asserted here against real reference boards and real fab records.
 */
import { generatePcb } from "../src/index.ts";
import { layouts } from "./layouts.ts";
import { loadFab } from "../../../daemons/checkman/src/index.ts";
import { placeComponents } from "../src/layout.ts";
import { buildQmkBundle } from "../src/firmware.ts";

let failed = 0;
const check = (label: string, cond: boolean, detail = "") => {
  if (!cond) { failed++; console.log(`FAIL ${label}${detail ? `: ${detail}` : ""}`); }
  else console.log(`ok   ${label}`);
};

const base = [...layouts][1][1] as any; // ninepad
const plain = generatePcb(base);
const w = (plain.outline as any).bbox.width as number;

/** a rectangular loop whose right edge sits `inset` mm inside the silhouette */
const loopAt = (inset: number) => [[
  { x: w / 2 - inset - 6, y: -3 }, { x: w / 2 - inset, y: -3 },
  { x: w / 2 - inset, y: 3 }, { x: w / 2 - inset - 6, y: 3 },
]];

const withVanity = (inset: number, fab?: any) =>
  generatePcb({ ...base, vanity: { cutouts: loopAt(inset) } }, undefined, fab);

const webErrors = (out: any) => out.result.warnings.filter((r: any) => r.message.includes("closer than"));

// ── 1. the web rule, with and without a fab ────────────────────────────────
for (const fabName of ["jlcpcb", "aisler", "oshpark"]) {
  const fab = { id: fabName, record: loadFab(fabName) };
  const tight = withVanity(0.35, fab);
  const errs = webErrors(tight);
  check(`${fabName}: cutout 0.35mm from edge is refused`, errs.length === 1, `${errs.length} errors`);
  check(`${fabName}: refused cutout is dropped, not shipped`, (tight.outline as any).cutouts.length === 0);
  if (errs[0]) {
    check(`${fabName}: floor is a finite number`, !/NaN|Infinity|undefined/.test(errs[0].message), errs[0].message);
  }

  const safe = withVanity(4, fab);
  check(`${fabName}: cutout 4mm from edge is kept`, webErrors(safe).length === 0 && (safe.outline as any).cutouts.length === 1);
}

// no fab selected: the engine floor still applies
const noFab = withVanity(0.35);
check("no fab: engine floor still refuses a tight cutout", webErrors(noFab).length === 1);

// the silent-pass shape of the old bug: a NaN floor never fires
const nanProbe = generatePcb(base);
check("no NaN floor anywhere in board warnings", !nanProbe.result.warnings.some((r: any) => /NaN/.test(r.message)));

// ── 2. the keymap, on reference boards ─────────────────────────────────────
for (const [name, layout] of layouts) {
  const out = generatePcb(layout);
  const ctx = placeComponents(layout);
  const fw = buildQmkBundle(ctx, out.netlist, out.qmkInfo);
  // the encoder actions live in their own map block, so only count the keymap
  const keySection = (fw.files["keymap.c"] ?? "").split("keymaps[][MATRIX_ROWS]")[1] ?? "";
  const codes = keySection.match(/KC_[A-Z0-9]+/g) ?? [];

  const keyCount = Object.keys(out.netlist.keyNetOf).length;
  check(`${name}: keymap has one code per key`, codes.length === keyCount,
    `${codes.length} codes vs ${keyCount} keys`);

  const refsAsKeys = codes.filter((c) => /^KC_SW\d|^KC_ENC\d/.test(c)).length;
  check(`${name}: no key is its own ref-des`, refsAsKeys === 0, `${refsAsKeys} refs leaked into the keymap`);
}

// the labelled board proves real keycodes, not just non-empty
{
  const out = generatePcb([...layouts][0][1]); // hackpad-3key: ESC, 2, 3
  const ctx = placeComponents([...layouts][0][1]);
  const km = buildQmkBundle(ctx, out.netlist, out.qmkInfo).files["keymap.c"] ?? "";
  check("hackpad-3key keymap starts with KC_ESC", km.includes("KC_ESC"));
  check("hackpad-3key keymap has no KC_NO", !km.includes("KC_NO,") && !km.includes("KC_NO\n"));
}

if (failed) { console.log(`\nedge: ${failed} failure(s)`); process.exit(1); }
console.log("\nedge: silhouette web rule and keymap both enforced");
