/**
 * budget.ts: what a macropad asks of a xiao, before anything gets routed.
 *
 * the netlist throws when a design cannot fit. throwing is correct but late:
 * a person picking "4x4 with a knob and a screen" deserves to hear that the
 * knob and the screen ate the pins the keys needed, at the moment they pick
 * it, in words about their parts rather than about gpio names.
 *
 * so this is the same arithmetic the netlist uses, run as a report instead of
 * a gate, plus a plain-language archetype guess so the frontend can say what
 * kind of pad someone is building.
 */

/** the default board's gpio count, kept for callers that pass no mcu */
import { getMcu } from "./mcu.ts";

export const XIAO_GPIO_TOTAL = 11;

export interface BudgetInput {
  keys: number;
  /** the layout's own grid, when known: a matrix should follow the keys */
  rows?: number;
  cols?: number;
  encoders?: number;
  displays?: number;
  rgb?: boolean;
  forceMatrix?: boolean;
  /** mcu record id, defaults to the xiao rp2040 */
  mcu?: string;
}

export interface BudgetReport {
  /** what this looks like, in macropad words. a guess, not a classification */
  archetype: string;
  gpioTotal: number;
  /** pins the design needs, folded the way the netlist folds them */
  pins: {
    i2c: number;
    encoders: number;
    keys: number;
    total: number;
  };
  mode: "direct" | "matrix" | "does-not-fit";
  matrix?: { rows: number; cols: number };
  fits: boolean;
  /** why it does not fit, phrased in parts rather than pins */
  reason?: string;
  /** capabilities asked for that the engine does not generate yet */
  unsupported: string[];
  /** which board this budget was computed against */
  mcu: string;
  notes: string[];
}

/** smallest rows x cols grid that holds n keys within p pins, biased to fewer rows */
export function matrixShape(n: number, pins: number): { rows: number; cols: number } | null {
  for (let r = 1; r <= n; r++) {
    const c = Math.ceil(n / r);
    if (r + c <= pins) return { rows: r, cols: c };
  }
  return null;
}

export function budgetReport(input: BudgetInput): BudgetReport {
  const board = getMcu(input.mcu);
  const gpioTotal = board.gpios.length;
  const keys = Math.max(0, Math.floor(input.keys));
  const encoders = Math.max(0, Math.floor(input.encoders ?? 0));
  const displays = Math.max(0, Math.floor(input.displays ?? 0));
  const unsupported: string[] = [];
  const notes: string[] = [];

  const i2c = displays > 0 ? 2 : 0; // the record always keeps a two-pad i2c pair
  const encoderPins = encoders * 2;
  const freeForKeys = gpioTotal - i2c - encoderPins;

  if (input.rgb) {
    // evid-kc-016: sk6812 wants 3.4v on data when the chain runs at 5v, so a
    // a 3.3v board needs either a 3.3v chain or a level shifter. not a wiring
    // detail we can guess at, so the chain is not generated yet.
    unsupported.push("per-key rgb (sk6812 chain not generated: needs a 5v or 3.3v chain decision, evid-kc-016)");
  }

  let mode: BudgetReport["mode"] = "does-not-fit";
  let matrix: { rows: number; cols: number } | undefined;
  let keyPins = 0;

  if (keys <= freeForKeys && !input.forceMatrix) {
    mode = "direct";
    keyPins = keys;
  } else {
    // prefer the physical grid: a 4x5 pad wants 4+5, not 3+7, even when both
    // fit. falling back to the synthetic shape only when the real grid is too
    // big for the pins available.
    const physical =
      input.rows && input.cols && input.rows * input.cols >= keys && input.rows + input.cols <= freeForKeys
        ? { rows: input.rows, cols: input.cols }
        : null;
    const shape = physical ?? matrixShape(keys, freeForKeys);
    if (shape) {
      mode = "matrix";
      matrix = shape;
      keyPins = shape.rows + shape.cols;
    }
  }

  const total = i2c + encoderPins + keyPins;
  const fits = mode !== "does-not-fit";

  let reason: string | undefined;
  if (!fits) {
    const parts = [`${keys} keys`];
    if (encoders) parts.push(`${encoders} knob${encoders > 1 ? "s" : ""}`);
    if (displays) parts.push(`${displays} screen${displays > 1 ? "s" : ""}`);
    reason =
      `${parts.join(" + ")} needs more pins than a ${board.label} has. ` +
      `a matrix only helps if rows + columns fit in ${freeForKeys} free pins, and they do not. ` +
      `drop a part, or use an mcu with more gpio (the pico option is parked).`;
  }

  if (mode === "matrix") notes.push("keys are wired as a diode matrix; one diode per key on the back");
  if (encoders > 0) notes.push("each knob takes two pins and its own ground return");
  if (displays > 0) notes.push("the screen reserves the i2c pair, which is why the key budget drops by two");

  return {
    archetype: guessArchetype(keys, encoders, displays),
    mcu: board.id,
    gpioTotal,
    pins: { i2c, encoders: encoderPins, keys: keyPins, total },
    mode,
    matrix,
    fits,
    reason,
    unsupported,
    notes,
  };
}

/**
 * macropad archetype, in the words the community uses. deliberately coarse:
 * it names the shelf a design sits on, it does not decide anything.
 */
export function guessArchetype(keys: number, encoders: number, displays: number): string {
  if (keys <= 3) return "shortcut pad";
  if (encoders >= 2) return "rotary pod";
  if (keys <= 9) return displays > 0 ? "screen pad" : encoders > 0 ? "knob pad" : "micro pad";
  if (keys <= 12) return "3x4 pad";
  if (keys <= 20 && keys % 4 === 0) return "numpad";
  if (keys <= 20) return "compact pad";
  return "grid pad";
}
