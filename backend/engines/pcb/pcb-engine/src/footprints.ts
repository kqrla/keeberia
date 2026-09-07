/**
 * keeberia footprint library — verified geometry (FootprintDef format).
 *
 * Sources: KiCad official library pad geometry, Hack Club Hack Pad care
 * package, component datasheets (docs/footprints-research.md has per-part
 * provenance). Coordinates in mm, origin = part center, footprint as seen
 * from the FRONT. These are the "manufacturing implementation" of
 * keeberia's logical objects — the components flow only ever says "mx
 * hotswap" or "ec11"; everything here stays invisible to the user.
 */
import { FootprintDef } from "./types.ts";

const rectSilks = (w: number, h: number, inset = 0.3) => {
  const hw = w / 2 - inset, hh = h / 2 - inset;
  return [
    { kind: "line" as const, start: { x: -hw, y: -hh }, end: { x: hw, y: -hh } },
    { kind: "line" as const, start: { x: hw, y: -hh }, end: { x: hw, y: hh } },
    { kind: "line" as const, start: { x: hw, y: hh }, end: { x: -hw, y: hh } },
    { kind: "line" as const, start: { x: -hw, y: hh }, end: { x: -hw, y: -hh } },
  ];
};

/** Cherry MX switch, soldered — unified-footprint geometry (14×14 window) */
export const MX_SOLDER: FootprintDef = {
  id: "keeberia:MX_solder",
  kicadName: "keeberia:SW_Cherry_MX_1.00u_PCB_solder",
  description: "Cherry MX switch, soldered, PCB mount",
  size: { w: 14, h: 14 },
  keepoutRadius: 7.6,
  category: "switch",
  pads: [
    // electrical pins — datasheet asymmetric placement
    { pad: "1", pos: { x: -3.81, y: -2.54 }, size: { w: 1.75, h: 1.75 }, shape: "circle", type: "thru_hole", drill: 1.0, layer: "*.Cu" },
    { pad: "2", pos: { x: 2.54, y: -5.08 }, size: { w: 1.75, h: 1.75 }, shape: "circle", type: "thru_hole", drill: 1.0, layer: "*.Cu" },
    // plastic: 4mm center peg + two 1.7mm guide pegs at ±5.08 (NPTH copper-less)
    { pad: "peg", pos: { x: 0, y: 0 }, size: { w: 4.0, h: 4.0 }, shape: "circle", type: "thru_hole", drill: 4.0, layer: "*.Cu" },
    { pad: "peg1", pos: { x: -5.08, y: 0 }, size: { w: 1.7, h: 1.7 }, shape: "circle", type: "thru_hole", drill: 1.7, layer: "*.Cu" },
    { pad: "peg2", pos: { x: 5.08, y: 0 }, size: { w: 1.7, h: 1.7 }, shape: "circle", type: "thru_hole", drill: 1.7, layer: "*.Cu" },
  ],
  silks: rectSilks(14, 14),
};

/** Kailh MX hotswap socket — solder pads offset outside the 14mm window
 *  with 3.05mm latch relief. The switch peg holes are still needed. */
export const MX_HOTSWAP: FootprintDef = {
  id: "keeberia:MX_hotswap",
  kicadName: "keeberia:SW_Cherry_MX_Hotswap_1.00u_PCB",
  description: "Kailh MX hotswap socket",
  size: { w: 14, h: 14 },
  keepoutRadius: 8.6, // pad2 extends to x=8.6
  category: "switch",
  pads: [
    { pad: "1", pos: { x: -5.842, y: -5.08 }, size: { w: 3.05, h: 2.0 }, shape: "oval", type: "smd", layer: "B.Cu" },
    { pad: "2", pos: { x: 7.085, y: -2.54 }, size: { w: 3.05, h: 2.0 }, shape: "oval", type: "smd", layer: "B.Cu" },
    { pad: "peg", pos: { x: 0, y: 0 }, size: { w: 4.0, h: 4.0 }, shape: "circle", type: "thru_hole", drill: 4.0, layer: "*.Cu" },
    { pad: "peg1", pos: { x: -5.08, y: 0 }, size: { w: 1.7, h: 1.7 }, shape: "circle", type: "thru_hole", drill: 1.7, layer: "*.Cu" },
    { pad: "peg2", pos: { x: 5.08, y: 0 }, size: { w: 1.7, h: 1.7 }, shape: "circle", type: "thru_hole", drill: 1.7, layer: "*.Cu" },
  ],
  silks: rectSilks(14, 14),
  flipSilkWhenBack: true,
};

/** Kailh Choc v1 (CPG1353, low profile) — 15×15 window */
export const CHOC_V1: FootprintDef = {
  id: "keeberia:Choc_v1",
  kicadName: "keeberia:SW_Kailh_Choc_V1",
  description: "Kailh Choc v1 low-profile switch",
  size: { w: 15, h: 15 },
  keepoutRadius: 7.8,
  category: "switch",
  pads: [
    { pad: "1", pos: { x: -3.81, y: -2.54 }, size: { w: 1.75, h: 1.75 }, shape: "circle", type: "thru_hole", drill: 1.0, layer: "*.Cu" },
    { pad: "2", pos: { x: 2.54, y: -5.08 }, size: { w: 1.75, h: 1.75 }, shape: "circle", type: "thru_hole", drill: 1.0, layer: "*.Cu" },
    { pad: "peg", pos: { x: 0, y: 0 }, size: { w: 3.8, h: 3.8 }, shape: "circle", type: "thru_hole", drill: 3.8, layer: "*.Cu" },
  ],
  silks: rectSilks(15, 15),
};

/** Alps EC11 vertical rotary encoder (switched, 5-pin + 2 mounting slots) */
export const EC11: FootprintDef = {
  id: "keeberia:EC11",
  kicadName: "keeberia:RotaryEncoder_Alps_EC11-Switched_Vertical",
  description: "Alps EC11 rotary encoder with push switch",
  size: { w: 14.5, h: 16.5 },
  keepoutRadius: 8.3,
  category: "encoder",
  pads: [
    // encoder row (top): A, common, B at 2.54 pitch
    { pad: "A", pos: { x: -2.54, y: 7.62 }, size: { w: 1.75, h: 2.2 }, shape: "oval", type: "thru_hole", drill: 1.0, layer: "*.Cu" },
    { pad: "C", pos: { x: 0, y: 7.62 }, size: { w: 1.75, h: 2.2 }, shape: "oval", type: "thru_hole", drill: 1.0, layer: "*.Cu" },
    { pad: "B", pos: { x: 2.54, y: 7.62 }, size: { w: 1.75, h: 2.2 }, shape: "oval", type: "thru_hole", drill: 1.0, layer: "*.Cu" },
    // push switch row (bottom): usable as a key press (v2)
    { pad: "D", pos: { x: -2.54, y: -7.62 }, size: { w: 1.75, h: 2.2 }, shape: "oval", type: "thru_hole", drill: 1.0, layer: "*.Cu" },
    { pad: "E", pos: { x: 2.54, y: -7.62 }, size: { w: 1.75, h: 2.2 }, shape: "oval", type: "thru_hole", drill: 1.0, layer: "*.Cu" },
    // mounting tabs with 3.05×2.2 slots
    { pad: "MP1", pos: { x: -5.6, y: 3.0 }, size: { w: 3.05, h: 2.2 }, shape: "oval", type: "thru_hole", drill: 1.2, layer: "*.Cu" },
    { pad: "MP2", pos: { x: 5.6, y: 3.0 }, size: { w: 3.05, h: 2.2 }, shape: "oval", type: "thru_hole", drill: 1.2, layer: "*.Cu" },
  ],
  silks: [...rectSilks(11.9, 13.2), { kind: "circle" as const, center: { x: 0, y: 0 }, radius: 3.75 }],
};

/** Seeed XIAO (RP2040 / SAMD21 / nRF52840 / ESP32-C3 common carrier):
 *  21×17.5mm module, 14 castellated pads at 2mm pitch (7 per edge, y ±6),
 *  pad copper extends past the module edge for side soldering. */
export const XIAO: FootprintDef = {
  id: "keeberia:XIAO",
  kicadName: "keeberia:Module_Seeed_XIAO",
  description: "Seeed XIAO carrier (castellated, pads extend past edge)",
  size: { w: 21, h: 17.5 },
  keepoutRadius: 11,
  category: "mcu",
  pads: (() => {
    const left = ["5V", "GND", "3V3", "D0", "D1", "D2", "D3"];
    const right = ["D4", "D5", "D6", "D7", "D8", "D9", "D10"];
    const pads: FootprintDef["pads"] = [];
    left.forEach((p, i) =>
      pads.push({ pad: p, pos: { x: -9.9, y: -6 + i * 2 }, size: { w: 2.0, h: 1.6 }, shape: "oval", type: "smd", layer: "B.Cu" }));
    right.forEach((p, i) =>
      pads.push({ pad: p, pos: { x: 9.9, y: -6 + i * 2 }, size: { w: 2.0, h: 1.6 }, shape: "oval", type: "smd", layer: "B.Cu" }));
    return pads;
  })(),
  silks: [...rectSilks(21, 17.5), { kind: "line" as const, start: { x: -3.0, y: -9.6 }, end: { x: 3.0, y: -9.6 } }],
  flipSilkWhenBack: true,
};

/** 0.91" 128×32 SSD1306 OLED on a 38×12mm breakout, 4-pin header at the
 *  right edge (2.54 pitch): GND VCC SCL SDA */
export const OLED_128X32_091: FootprintDef = {
  id: "keeberia:OLED_091",
  kicadName: "keeberia:Display_SSD1306_128x32_0.91in",
  description: "0.91\" OLED 128x32 breakout",
  size: { w: 38, h: 12 },
  keepoutRadius: 19,
  category: "display",
  pads: [
    { pad: "GND", pos: { x: 17.5, y: -3.81 }, size: { w: 1.8, h: 1.8 }, shape: "circle", type: "thru_hole", drill: 1.0, layer: "*.Cu" },
    { pad: "VCC", pos: { x: 17.5, y: -1.27 }, size: { w: 1.8, h: 1.8 }, shape: "circle", type: "thru_hole", drill: 1.0, layer: "*.Cu" },
    { pad: "SCL", pos: { x: 17.5, y: 1.27 }, size: { w: 1.8, h: 1.8 }, shape: "circle", type: "thru_hole", drill: 1.0, layer: "*.Cu" },
    { pad: "SDA", pos: { x: 17.5, y: 3.81 }, size: { w: 1.8, h: 1.8 }, shape: "circle", type: "thru_hole", drill: 1.0, layer: "*.Cu" },
  ],
  silks: [...rectSilks(38, 12), ...rectSilks(22.4, 10, -0.15)],
};

/** 1.3" 128×64 SSD1306 OLED, 36×33mm breakout, 4-pin header at bottom edge */
export const OLED_128X64_13: FootprintDef = {
  id: "keeberia:OLED_13",
  kicadName: "keeberia:Display_SSD1306_128x64_1.3in",
  description: "1.3\" OLED 128x64 breakout",
  size: { w: 36, h: 33 },
  keepoutRadius: 18,
  category: "display",
  pads: [
    { pad: "GND", pos: { x: -3.81, y: 14.5 }, size: { w: 1.8, h: 1.8 }, shape: "circle", type: "thru_hole", drill: 1.0, layer: "*.Cu" },
    { pad: "VCC", pos: { x: -1.27, y: 14.5 }, size: { w: 1.8, h: 1.8 }, shape: "circle", type: "thru_hole", drill: 1.0, layer: "*.Cu" },
    { pad: "SCL", pos: { x: 1.27, y: 14.5 }, size: { w: 1.8, h: 1.8 }, shape: "circle", type: "thru_hole", drill: 1.0, layer: "*.Cu" },
    { pad: "SDA", pos: { x: 3.81, y: 14.5 }, size: { w: 1.8, h: 1.8 }, shape: "circle", type: "thru_hole", drill: 1.0, layer: "*.Cu" },
  ],
  silks: [...rectSilks(36, 33), ...rectSilks(26, 13, -0.15)],
};

/** 1N4148W / SOD-123 signal diode (hand-solder friendly), back side */
export const DIODE: FootprintDef = {
  id: "keeberia:Diode_SOD123",
  kicadName: "keeberia:D_SOD-123",
  description: "SOD-123 signal diode (1N4148W)",
  size: { w: 3.7, h: 2.6 },
  keepoutRadius: 2.0,
  category: "diode",
  pads: [
    { pad: "A", pos: { x: -1.45, y: 0 }, size: { w: 1.3, h: 1.2 }, shape: "rect", type: "smd", layer: "B.Cu" },
    { pad: "K", pos: { x: 1.45, y: 0 }, size: { w: 1.3, h: 1.2 }, shape: "rect", type: "smd", layer: "B.Cu" },
  ],
  silks: [{ kind: "line", start: { x: 0.5, y: -1.15 }, end: { x: 0.5, y: 1.15 } }], // cathode band
  flipSilkWhenBack: true,
};

/** M2 mounting hole (NPTH), 2.2mm drill */
export const MOUNT_M2: FootprintDef = {
  id: "keeberia:Mount_M2",
  kicadName: "keeberia:MountingHole_2.2mm_M2",
  description: "M2 mounting hole, 2.2mm NPTH",
  size: { w: 4.4, h: 4.4 },
  keepoutRadius: 2.2,
  category: "hole",
  pads: [
    { pad: "1", pos: { x: 0, y: 0 }, size: { w: 4.4, h: 4.4 }, shape: "circle", type: "thru_hole", drill: 2.2, layer: "*.Cu" },
  ],
  silks: [{ kind: "circle", center: { x: 0, y: 0 }, radius: 2.2 }],
};

/** USB-C passthrough intentionally NOT used in v1 — the XIAO's own
 *  connector is exposed through the case opening instead. */

export const FOOTPRINTS: Record<string, FootprintDef> = {};
for (const fp of [MX_SOLDER, MX_HOTSWAP, CHOC_V1, EC11, XIAO, OLED_128X32_091, OLED_128X64_13, DIODE, MOUNT_M2]) {
  FOOTPRINTS[fp.id] = fp;
}

// compatibility aliases (legacy export names)
export const OLED_091 = OLED_128X32_091;
export const M2_HOLE = MOUNT_M2;
