/**
 * qmk export bundle — the one-click firmware artifact.
 *
 * anne's call (sept 10 2026): performance + live remap first → qmk with vial
 * is the v1 primary. this module emits a complete, ready-to-compile qmk
 * keyboard directory: info.json (data-driven, rp2040), keymap.c, rules.mk,
 * vial.json (live browser remapping via webhid), and a readme. deterministic
 * as always: same board, same bundle, forever.
 *
 * honest boundary: the bundle is structurally validated here, but it is
 * compiled into a .uf2 by the containerized qmk worker (qmkfm/qmk_cli) —
 * that infra lands with the render.com deployment. no compile claims here.
 */
import type { BoardCtx } from "./layout.ts";
import type { NetlistResult } from "./netlist.ts";
import { FOOTPRINTS } from "./footprints.ts";

export interface QmkBundle {
  files: Record<string, string>;
  warnings: string[];
}

/** layout key order: placements filtered to switches, in placement order */
function keyOrder(ctx: BoardCtx): Array<{ ref: string; label: string }> {
  return ctx.placements
    .filter((p) => FOOTPRINTS[p.library]?.category === "switch")
    .map((p) => ({ ref: p.ref, label: p.label ?? p.ref }));
}

/** label → qmk keycode. small, honest table; unknown labels map to KC_NO. */
const KEYCODES: Record<string, string> = {
  "0": "KC_0", "1": "KC_1", "2": "KC_2", "3": "KC_3", "4": "KC_4",
  "5": "KC_5", "6": "KC_6", "7": "KC_7", "8": "KC_8", "9": "KC_9",
  A: "KC_A", B: "KC_B", C: "KC_C", D: "KC_D", E: "KC_E", F: "KC_F",
  G: "KC_G", H: "KC_H", I: "KC_I", J: "KC_J", K: "KC_K", L: "KC_L",
  M: "KC_M", N: "KC_N", O: "KC_O", P: "KC_P", Q: "KC_Q", R: "KC_R",
  S: "KC_S", T: "KC_T", U: "KC_U", V: "KC_V", W: "KC_W", X: "KC_X",
  Y: "KC_Y", Z: "KC_Z",
  ESC: "KC_ESC", ENTER: "KC_ENTER", SPACE: "KC_SPACE",
  VOL: "KC_VOLU", VOLD: "KC_VOLD", MUTE: "KC_MUTE",
  PLAY: "KC_MEDIA_PLAY_PAUSE",
};

function keycodeFor(label: string): { code: string; note: string } {
  const up = label.trim().toUpperCase();
  if (KEYCODES[up]) return { code: KEYCODES[up], note: "" };
  if (/^F\d{1,2}$/.test(up)) return { code: `KC_F${up.slice(1)}`, note: "" };
  return { code: "KC_NO", note: label };
}

/** stable uid chunks for vial, derived from the board name */
function vialUid(name: string): [string, string, string] {
  let h1 = 0x811c9dc5, h2 = 0x1000193;
  for (let i = 0; i < name.length; i++) {
    h1 = ((h1 ^ name.charCodeAt(i)) * 0x01000193) >>> 0;
    h2 = ((h2 + name.charCodeAt(i) * (i + 1)) * 0x85ebca6b) >>> 0;
  }
  const hex = (n: number) => (n >>> 0).toString(16).padStart(8, "0").slice(0, 8);
  return [`0x${hex(h1)}`, `0x${hex(h2)}`, `0x${hex(h1 ^ h2)}`];
}

/** deterministic usb pid from the board name */
function pidFor(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return "0x" + (0x1000 + (h & 0xfff)).toString(16);
}

function sanitise(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "pad";
}

export function buildQmkBundle(ctx: BoardCtx, netlist: NetlistResult, qmkInfo: Record<string, unknown>): QmkBundle {
  const warnings: string[] = [];
  const files: Record<string, string> = {};
  const name = ctx.options.boardName || "keeberia-pad";
  const keys = keyOrder(ctx);
  const encoderCount = ctx.placements.filter((p) => FOOTPRINTS[p.library]?.category === "encoder").length;
  const hasOled = ctx.placements.some((p) => FOOTPRINTS[p.library]?.category === "display");

  // ── info.json: qmkInfo (from bom.ts) carries matrix pins + layout geometry ──
  const info: Record<string, unknown> = {
    ...qmkInfo,
    keyboard_folder: `keeberia/${sanitise(name)}`,
    bootloader: "rp2040-bootloader",
    processor: "RP2040",
    board: "seeed_xiao_rp2040",
    usb: { vid: "0xFEED", pid: pidFor(name), device_version: "1.0.0" },
    features: {
      ...((qmkInfo.features as object) ?? {}),
      ...(encoderCount ? { encoder_keys: true, extrakey: true } : {}),
      ...(hasOled ? { oled: true, extrakey: true } : {}),
    },
  };
  files["info.json"] = JSON.stringify(info, null, 2) + "\n";

  // ── keymap.c ──
  const direct = netlist.mode === "direct";
  const kcs = keys.map((k) => keycodeFor(k.label));
  const keymapBody = direct
    ? `    ${kcs.map((k) => k.code).join(", ")}`
    : kcs.map((k) => `    ${k.code}`).join(",\n");
  const layoutMacro = direct
    ? `LAYOUT_direct(\n${keymapBody}\n)`
    : `LAYOUT_default(\n${keymapBody}\n)`;
  const encoderBlock = encoderCount
    ? `\n\n// encoder actions — defaults; remap live in vial\n#if defined(ENCODER_MAP_ENABLE)\nconst uint16_t PROGMEM encoder_map[][NUM_ENCODERS][2] = {\n` +
      Array.from({ length: encoderCount }, (_, i) =>
        `    { { ${i === 0 ? "KC_VOLU, KC_VOLD" : "KC_TRNS, KC_TRNS"} } }`).join(",\n") +
      `\n};\n#endif`
    : "";
  const unmapped = keys.filter((k) => keycodeFor(k.label).code === "KC_NO");
  if (unmapped.length) {
    warnings.push(`default keymap leaves ${unmapped.length} label(s) unmapped (${unmapped.map((k) => k.label).join(", ")}) — they flash as KC_NO and can be set live in vial`);
  }
  files["keymap.c"] = `// ${name} — generated by keeberia. edit live in vial, or fork this keymap.
#include QMK_KEYBOARD_H
${hasOled ? "\n// oled enabled in rules; a default oled task ships in keeberia's board glue" : ""}${encoderBlock}

const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {
    [0] = ${layoutMacro}
};
`;

  // ── rules.mk ──
  files["rules.mk"] = [
    "# generated by keeberia",
    "VIAL_ENABLE = yes",
    "ENCODER_ENABLE = " + (encoderCount ? "yes" : "no"),
    "ENCODER_MAP_ENABLE = " + (encoderCount ? "yes" : "no"),
    "OLED_ENABLE = " + (hasOled ? "yes" : "no"),
    hasOled ? "OLED_DRIVER = SSD1306" : "# no display on this board",
    "EXTRAKEY_ENABLE = yes",
    "LTO_ENABLE = yes",
  ].join("\n") + "\n";

  // ── vial.json: live browser remapping via webhid ──
  const matrix = netlist.matrix;
  files["vial.json"] = JSON.stringify({
    name,
    vendorId: "0xFEED",
    productId: pidFor(name),
    lighting: "none",
    uid: vialUid(name),
    matrix: {
      rows: direct ? 1 : matrix!.rowPins.length,
      cols: direct ? keys.length : matrix!.colPins.length,
    },
    layouts: {
      keymap: keys.map((k) => [{ x: cellX(ctx, k.ref), y: cellY(ctx, k.ref), w: 1 }]),
    },
  }, null, 2) + "\n";

  // ── readme ──
  files["readme.md"] = [
    `# ${name}`,
    "",
    "generated by keeberia — qmk + vial firmware bundle.",
    "",
    `- ${keys.length} keys, ${encoderCount} encoder(s), ${hasOled ? "ssd1306 oled" : "no display"}`,
    `- matrix: ${direct ? "direct pins (one gpio per key)" : `${matrix!.rowPins.length}x${matrix!.colPins.length} diode matrix`}`,
    "- flash the .uf2 (hold boot while plugging in, drag the file), then remap live at vial.today or in keeberia's embedded webhid remapper.",
    "",
    `compiles with the qmk cli: \`qmk compile -kb keeberia/${sanitise(name)} -km default\``,
  ].join("\n") + "\n";

  return { files, warnings };
}

// cell lookup for vial layout coords (matrix mode)
function cellOf(ctx: BoardCtx, ref: string) {
  return ctx.cells.find((c: { ref?: string }) => c.ref === ref);
}
function cellX(ctx: BoardCtx, ref: string): number {
  return cellOf(ctx, ref)?.col ?? 0;
}
function cellY(ctx: BoardCtx, ref: string): number {
  return cellOf(ctx, ref)?.row ?? 0;
}
