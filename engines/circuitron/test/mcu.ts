/**
 * mcu regression: the board is a record, not a constant.
 *
 * circuitron grew up around one module: the xiao was hardcoded in the netlist
 * pin list, the budget arithmetic, the bom's gpio naming and the qmk info.json.
 * adding a board meant four edits in four files, and missing one shipped a
 * silent lie (a 32u4 design carrying xiao gpio numbers).
 *
 * these checks hold the record contract: the same pad generates on every board
 * in the catalogue, each one spends its own pads and power rails, a wider board
 * really does change the budget arithmetic, an unknown id refuses by name, and a
 * radio board says out loud that its keymap is not ours to generate.
 */
import { generatePcb } from "../src/index.ts";
import { layouts } from "./layouts.ts";
import { MCUS, MCU_IDS, getMcu, pinLabel } from "../src/mcu.ts";
import { budgetReport, matrixShape } from "../src/budget.ts";
import { buildQmkBundle } from "../src/firmware.ts";
import { placeComponents } from "../src/layout.ts";
import { FOOTPRINTS } from "../src/footprints.ts";
import { pointInShape } from "../src/outline.ts";
import { padAbsPos } from "../src/layout.ts";

let failed = 0;
const check = (label: string, cond: boolean, detail = "") => {
  if (!cond) { failed++; console.log(`FAIL ${label}${detail ? `: ${detail}` : ""}`); }
  else console.log(`ok   ${label}`);
};

const ninepad = [...layouts][1][1] as any;
const withMcu = (id: string, layout: any = ninepad) =>
  generatePcb({ ...layout, options: { ...layout.options, mcu: id } });

// ── 1. every board in the catalogue generates the same pad cleanly ─────────
for (const id of MCU_IDS) {
  const mcu = MCUS[id];
  const out = withMcu(id);
  const errors = out.result.warnings.filter((w) => w.level === "error");
  check(`${id}: generates with no errors`, errors.length === 0, errors.map((e) => e.message).join("; "));
  check(`${id}: every net routes`, out.result.stats.failedNets === 0,
    `${out.result.stats.routedNets}/${out.result.stats.netCount} routed`);
  check(`${id}: no drc complaints in the warnings`,
    out.result.warnings.every((w) => w.level !== "error"), out.result.warnings.filter((w) => w.level === "error").map((w) => w.message).join("; "));
  check(`${id}: output names the board`, out.mcu.id === id && out.mcu.gpios === mcu.gpios.length, `${out.mcu.id} ${out.mcu.gpios}`);

  // the carrier that shipped is the record's carrier, not a hardcoded one
  const ctx = placeComponents({ ...ninepad, options: { ...ninepad.options, mcu: id } } as any);
  const placed = ctx.placements.find((p) => p.ref === "U1");
  check(`${id}: places its own carrier`, placed?.library === mcu.footprint, `${placed?.library} vs ${mcu.footprint}`);

  // every pad that carries a net must be on the board
  if (ctx.shape) {
    let outside = 0;
    for (const pl of ctx.placements) {
      for (const pad of FOOTPRINTS[pl.library].pads) {
        if (!pointInShape(ctx.shape as any, padAbsPos(pl, pad.pad), 0)) outside++;
      }
    }
    check(`${id}: every pad lands on the board`, outside === 0, `${outside} outside`);
  }
}

// ── 2. pads are spent from the record, not from the xiao's list ────────────
const xiaoDirect = withMcu("xiao_rp2040").netlist.keyNetOf;
const proDirect = withMcu("pro_micro").netlist.keyNetOf;
const pinOf = (m: any, ref: string) => m[ref]?.pin;
check("xiao keys sit on D-pads", Object.keys(xiaoDirect).every((ref) => /^D\d+$/.test(pinOf(xiaoDirect, ref))));
check("pro micro keys sit on its own pads", Object.keys(proDirect).length > 0 && Object.keys(proDirect).every((ref) => {
  const p = pinOf(proDirect, ref);
  return typeof p === "string" && getMcu("pro_micro").gpios.includes(p);
}));

// power rails: xiao 3V3, pro micro VCC. the netlist must follow the record.
const mcuPadsOf = (id: string) =>
  generatePcb({ ...ninepad, options: { ...ninepad.options, mcu: id } } as any)
    .result.placements.find((p) => p.ref === "U1")!.nets;
const xiaoPads = mcuPadsOf("xiao_rp2040");
const proPads = mcuPadsOf("pro_micro");
check("xiao powers the parts from 3V3", xiaoPads["3V3"] === "+3V3", String(xiaoPads["3V3"]));
check("pro micro powers the parts from VCC", proPads["VCC"] === "+3V3", String(proPads["VCC"]));

// i2c follows the record too: D4/D5 on xiao, D2/D3 on 32u4
const i2cOf = (id: string) => {
  const out = withMcu(id, { ...ninepad, cells: [...ninepad.cells, { row: 2, col: 2, type: "oled", label: "OLED" }] });
  const sda = out.netlist.nets.find((n) => n.name === "SDA");
  return sda?.pads.filter((p) => p.ref === "U1").map((p) => p.pad)[0];
};
check("xiao i2c is on D4", i2cOf("xiao_rp2040") === "D4", String(i2cOf("xiao_rp2040")));
check("pro micro i2c is on D2", i2cOf("pro_micro") === "D2", String(i2cOf("pro_micro")));

// ── 3. the budget arithmetic follows the record ───────────────────────────
const big = { keys: 16, rows: 4, cols: 4 };
const xiaoBudget = budgetReport({ ...big, mcu: "xiao_rp2040" });
const proBudget = budgetReport({ ...big, mcu: "pro_micro" });
check("16 keys do not fit a xiao directly", !xiaoBudget.fits || xiaoBudget.mode === "matrix",
  `${xiaoBudget.mode} ${xiaoBudget.fits}`);
check("16 keys fit a pro micro directly", proBudget.fits && proBudget.mode === "direct", proBudget.mode);
check("the budget names its board", xiaoBudget.mcu === "xiao_rp2040" && xiaoBudget.gpioTotal === 11, `${xiaoBudget.mcu} ${xiaoBudget.gpioTotal}`);
check("a wider board reports a wider total", proBudget.gpioTotal === 18, String(proBudget.gpioTotal));
check("matrixShape still answers the default board", JSON.stringify(matrixShape(9, 11)) !== "null");

// ── 4. an unknown board refuses by name ───────────────────────────────────
let refused = "";
try {
  withMcu("teensy_4");
} catch (e) {
  refused = (e as Error).message;
}
check("an unknown mcu refuses and lists the real ones", /unknown mcu "teensy_4"/.test(refused) && /xiao_rp2040/.test(refused), refused);

// ── 5. a radio board says its keymap is not ours ──────────────────────────
const bleOut = withMcu("xiao_nrf52840");
check("the nrf board reports ble", bleOut.mcu.wireless === "ble", String(bleOut.mcu.wireless));
check("the nrf board reports a zmk toolchain", bleOut.mcu.firmware === "zmk", String(bleOut.mcu.firmware));
const zmkBundle = buildQmkBundle(
  placeComponents({ ...ninepad, options: { ...ninepad.options, mcu: "xiao_nrf52840" } } as any),
  bleOut.netlist,
  bleOut.qmkInfo,
);
check("a zmk board ships a firmware note instead of a broken qmk folder",
  !!zmkBundle.files["README-firmware.md"] && zmkBundle.warnings.some((w) => /zmk/.test(w)),
  zmkBundle.warnings.join("; "));
check("a zmk board still ships its matrix pins",
  JSON.stringify(zmkBundle.files["info.json"] ?? "").includes("matrix_pins"));

// qmk's processor and bootloader come from the record, never a guess
const proQmk = withMcu("pro_micro").qmkInfo as any;
check("qmk info carries the 32u4 processor", proQmk.processor === "ATmega32U4", String(proQmk.processor));
check("qmk info carries the caterina bootloader", proQmk.bootloader === "caterina", String(proQmk.bootloader));
// the board string lives in the firmware bundle, not the bom info
const bundleFor = (id: string) => {
  const out = withMcu(id);
  const ctx = placeComponents({ ...ninepad, options: { ...ninepad.options, mcu: id } } as any);
  return JSON.parse(buildQmkBundle(ctx, out.netlist, out.qmkInfo).files["info.json"]);
};
const xiaoInfo = bundleFor("xiao_rp2040");
const proInfo = bundleFor("pro_micro");
check("a named board keeps its qmk board string", xiaoInfo.board === "seeed_xiao_rp2040", String(xiaoInfo.board));
check("a handwired board declares its mcu instead of a board string",
  proInfo.mcu === "ATmega32U4" && proInfo.board === undefined, `mcu ${proInfo.mcu} board ${proInfo.board}`);

// pin labels: rp2040 numbers, other chips keep their pad names
check("xiao pins read as rp2040 gpio numbers", pinLabel(getMcu("xiao_rp2040"), "D6") === "GP0", pinLabel(getMcu("xiao_rp2040"), "D6"));
check("32u4 pins read as pad names", pinLabel(getMcu("pro_micro"), "D6") === "D6", pinLabel(getMcu("pro_micro"), "D6"));

// ── 6. the wider carrier really is wider on the board ─────────────────────
const xiaoHeight = (withMcu("xiao_rp2040").outline as any).bbox.height;
const proHeight = (withMcu("pro_micro").outline as any).bbox.height;
check("the pro micro board is taller than the xiao board", proHeight > xiaoHeight + 8,
  `${xiaoHeight} vs ${proHeight}`);

if (failed) { console.log(`\nmcu: ${failed} failed`); process.exit(1); }
console.log("\nmcu: all checks passed");
