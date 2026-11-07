/**
 * budget test: the pin cliff between macropad types, in the engine's own numbers.
 *
 * every case below is a real archetype from the taxonomy, so a regression here
 * means the engine started lying about what it can build.
 */
import { budgetReport, matrixShape } from "../src/budget.ts";

let failed = 0;
const check = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { failed++; console.log(`FAIL ${label}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); }
};

// 3x3 shortcut pad with a knob and a screen: the v1 default
{
  const b = budgetReport({ keys: 9, rows: 3, cols: 3, encoders: 1, displays: 1 });
  check("3x3+knob+screen fits", b.fits, true);
  check("3x3+knob+screen mode", b.mode, "matrix");
  check("3x3 matrix shape", b.matrix, { rows: 3, cols: 3 });
  check("3x3 archetype", b.archetype, "screen pad");
}

// the cliff: 16 keys with a knob and a screen cannot fit a xiao
{
  const b = budgetReport({ keys: 16, rows: 4, cols: 4, encoders: 1, displays: 1 });
  check("4x4+knob+screen refuses", b.fits, false);
  check("4x4+knob+screen mode", b.mode, "does-not-fit");
  if (!b.reason || !/16 keys/.test(b.reason)) { failed++; console.log("FAIL no reason in parts"); }
}

// the same 16 keys drop the knob and suddenly fit as a 4x4 matrix
{
  const b = budgetReport({ keys: 16, rows: 4, cols: 4, displays: 1 });
  check("4x4+screen fits", b.fits, true);
  check("4x4 shape", b.matrix, { rows: 4, cols: 4 });
  check("4x4 archetype", b.archetype, "numpad");
}

// a 20 key numpad with no screen and no knob: needs a 4x5 grid
{
  const b = budgetReport({ keys: 20, rows: 4, cols: 5 });
  check("20 keys fit", b.fits, true);
  check("20 key shape", b.matrix, { rows: 4, cols: 5 });
}

// small pad, no extras: direct gpio, one pin per key
{
  const b = budgetReport({ keys: 6 });
  check("6 keys direct", b.mode, "direct");
  check("6 keys pins", b.pins.total, 6);
}

// border: 9 keys + 2 knobs + screen leaves nothing for a matrix
{
  const b = budgetReport({ keys: 9, rows: 3, cols: 3, encoders: 2, displays: 1 });
  check("9 keys + 2 knobs + screen refuses", b.fits, false);
}

// 9 keys + 2 knobs, no screen: 7 free pins, 3x3 matrix
{
  const b = budgetReport({ keys: 9, rows: 3, cols: 3, encoders: 2 });
  check("9 keys + 2 knobs fits", b.fits, true);
  check("9 keys + 2 knobs shape", b.matrix, { rows: 3, cols: 3 });
  check("2 knob archetype", b.archetype, "rotary pod");
}

// rgb is asked for but not generated, and says so
{
  const b = budgetReport({ keys: 9, rgb: true });
  check("rgb reported unsupported", b.unsupported.length, 1);
}

// matrixShape refuses when the grid cannot fit the pins
check("matrix too tight", matrixShape(16, 4), null);

// the engine's real boards agree with the report
import { generatePcb } from "../src/index.ts";
import { layouts } from "./layouts.ts";
for (const [name, layout] of layouts) {
  const out = generatePcb(layout);
  const b = out.budget;
  const agree = (out.netlist.mode === "matrix") === (b.mode === "matrix");
  if (!agree || !b.fits) { failed++; console.log(`FAIL ${name}: netlist ${out.netlist.mode} vs budget ${b.mode}`); }
  else console.log(`ok   ${name.padEnd(14)} ${b.archetype.padEnd(12)} ${b.mode.padEnd(7)} pins ${b.pins.total}/${b.gpioTotal}`);
}

if (failed) { console.log(`\nbudget: ${failed} failure(s)`); process.exit(1); }
console.log("\nbudget: every archetype reports honestly");
