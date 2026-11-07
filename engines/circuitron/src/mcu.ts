/**
 * mcu.ts: the microcontroller is a record, not a constant.
 *
 * circuitron grew up around one module. the xiao was hardcoded in the netlist
 * pin list, the budget arithmetic, the bom's gpio naming and the qmk info.json,
 * which meant "add a different board" was four edits in four files and a silent
 * lie if you missed one (a 32u4 design would have shipped xiao gpio numbers).
 *
 * a record carries what actually differs: the carrier footprint, which pads are
 * general purpose, where i2c landed, which pads are power, the chip, the
 * bootloader, the firmware toolchain, and what radio (if any) the module brings.
 * everything downstream reads the record. nothing downstream names a board.
 *
 * provenance: pad names and counts are facts from the vendors' pinouts. the
 * carrier outline is already in footprints.ts. firmware toolchain choice follows
 * the chip, rp2040 and 32u4 run qmk, nrf52840 runs zmk. nothing here is copied
 * from another project's code.
 */

export interface McuPower {
  /** the pad that carries the logic supply the parts run on */
  logic: string;
  /** what that pad actually is when the board is usb powered */
  logicVolts: 3.3 | 5;
  gnd: string;
  /** usb 5v / raw input, when the carrier exposes it */
  vbus?: string;
  /** battery pads, when the module has them */
  battery?: { plus: string; minus: string };
}

export interface McuDef {
  /** layout.options.mcu value; this is the only public name */
  id: string;
  /** what a person reads on the silkscreen and in the bom */
  label: string;
  /** FOOTPRINTS key for the carrier */
  footprint: string;
  /** qmk's processor field / the chip family */
  chip: string;
  bootloader: string;
  /** pads usable as gpio, in the order the engine should spend them */
  gpios: string[];
  i2c: { sda: string; scl: string };
  power: McuPower;
  /**
   * how firmware gets built for it. "qmk-board" has a named qmk board string,
   * "qmk-handwired" is a qmk keyboard folder that declares its own mcu, "zmk"
   * needs a different toolchain entirely
   */
  firmware: { kind: "qmk-board"; board: string } | { kind: "qmk-handwired" } | { kind: "zmk" };
  /** pad -> chip gpio number, where the vendor numbers them (rp2040) */
  gpioNumbers?: Record<string, number>;
  /** radio the module brings, and whether the engine wires its support parts */
  wireless?: { ble: boolean; batteryWiring: boolean };
  /** one line of why you would pick it */
  note: string;
}

/** seeed xiao carrier, rp2040: 11 gpio, i2c on d4/d5, uf2 drag and drop */
const XIAO_RP2040: McuDef = {
  id: "xiao_rp2040",
  label: "Seeed XIAO RP2040",
  footprint: "keeberia:XIAO",
  chip: "RP2040",
  bootloader: "rp2040-bootloader",
  gpios: ["D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10"],
  i2c: { sda: "D4", scl: "D5" },
  power: { logic: "3V3", logicVolts: 3.3, gnd: "GND", vbus: "5V" },
  firmware: { kind: "qmk-board", board: "seeed_xiao_rp2040" },
  gpioNumbers: { D0: 26, D1: 27, D2: 28, D3: 29, D4: 6, D5: 7, D6: 0, D7: 1, D8: 2, D9: 4, D10: 3 },
  note: "the default: cheap, uf2 flashing, 11 gpio is plenty for a pad up to about 9 keys",
};

/** same carrier, nrf52840: drop in footprint, adds ble and battery pads */
const XIAO_NRF52840: McuDef = {
  id: "xiao_nrf52840",
  label: "Seeed XIAO nRF52840",
  footprint: "keeberia:XIAO",
  chip: "nRF52840",
  bootloader: "adafruit-nrf52-dfu",
  gpios: ["D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10"],
  i2c: { sda: "D4", scl: "D5" },
  power: { logic: "3V3", logicVolts: 3.3, gnd: "GND", vbus: "5V", battery: { plus: "BAT+", minus: "BAT-" } },
  firmware: { kind: "zmk" },
  wireless: { ble: true, batteryWiring: false },
  note: "the wireless pad path: same footprint as the rp2040, so it is a swap, but it runs zmk and wants a battery switch the engine does not generate yet",
};

/** pro micro class (atmega32u4): bigger carrier, more pins, 5v logic */
const PRO_MICRO: McuDef = {
  id: "pro_micro",
  label: "Pro Micro (ATmega32U4)",
  footprint: "keeberia:PRO_MICRO",
  chip: "ATmega32U4",
  bootloader: "caterina",
  // d2 boards name serial pins d0/d1 and the analog pins as a0..a3 (also d18..d21)
  gpios: [
    "D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10",
    "D14", "D15", "D16", "A0", "A1", "A2", "A3",
  ],
  i2c: { sda: "D2", scl: "D3" },
  power: { logic: "VCC", logicVolts: 5, gnd: "GND", vbus: "RAW" },
  firmware: { kind: "qmk-handwired" },
  note: "18 gpio and 5v logic: the board for a bigger pad or a 5v led chain, at twice the footprint",
};

export const MCUS: Record<string, McuDef> = {
  xiao_rp2040: XIAO_RP2040,
  xiao_nrf52840: XIAO_NRF52840,
  pro_micro: PRO_MICRO,
};

/** every id a layout may name, in the order a person should see them */
export const MCU_IDS = Object.keys(MCUS);

export const DEFAULT_MCU = "xiao_rp2040";

/** resolve by id, refusing unknown boards by name instead of guessing */
export function getMcu(id: string | undefined): McuDef {
  const key = id ?? DEFAULT_MCU;
  const mcu = MCUS[key];
  if (!mcu) {
    throw new Error(`unknown mcu "${key}": pick one of ${MCU_IDS.join(", ")}`);
  }
  return mcu;
}

/** the label a person reads for a pad: gpio number on rp2040, pad name elsewhere */
export function pinLabel(mcu: McuDef, pad: string): string {
  const n = mcu.gpioNumbers?.[pad];
  return n === undefined ? pad : `GP${n}`;
}
