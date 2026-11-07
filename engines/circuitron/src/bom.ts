/**
 * BOM + QMK firmware info.json generation.
 */
import { BoardCtx } from "./layout.ts";
import { NetlistResult } from "./netlist.ts";
import { FootprintDef, PcbResult, QmkInfo } from "./types.ts";
import { FOOTPRINTS, MX_SOLDER, MX_HOTSWAP, EC11, OLED_091, M2_HOLE } from "./footprints.ts";
import { pinLabel } from "./mcu.ts";

export function buildBom(ctx: BoardCtx): PcbResult["bom"] {
  const groups = new Map<string, { refs: string[]; value: string; footprint: string; notes?: string }>();
  for (const pl of ctx.placements) {
    const fp = FOOTPRINTS[pl.library];
    if (fp.category === "hole") continue; // mounting holes excluded from BOM
    const k = `${pl.value}|${fp.kicadName}`;
    if (!groups.has(k)) groups.set(k, { refs: [], value: pl.value, footprint: fp.kicadName });
    groups.get(k)!.refs.push(pl.ref);
  }
  return [...groups.values()].map((g) => ({
    refs: g.refs.sort().join(", "),
    value: g.value,
    footprint: g.footprint,
    qty: g.refs.length,
    notes: g.notes,
  }));
}

export function buildQmkInfo(ctx: BoardCtx, netlist: NetlistResult): QmkInfo {
  const switches = ctx.placements.filter(
    (p) => FOOTPRINTS[p.library]?.category === "switch");
  const encoders = ctx.placements.filter((p) => FOOTPRINTS[p.library]?.category === "encoder");
  const hasOled = ctx.placements.some((p) => FOOTPRINTS[p.library]?.category === "display");

  // key matrix positions in grid units
  const layoutKeys = ctx.cells
    .filter((c) => c.type === "key")
    .map((c) => ({ x: c.col, y: c.row, w: c.colSpan ?? 1 }));

  const info: QmkInfo = {
    keyboard_name: ctx.options.boardName,
    manufacturer: "keeberia",
    usb: { vid: "0xFEED", pid: "0x0001", device_version: "1.0.0" },
    processor: ctx.mcu.chip,
    bootloader: ctx.mcu.bootloader,
    features: { encoder_keys: encoders.length ? true : undefined, oled: hasOled || undefined },
  };

  if (netlist.mode === "direct") {
    const pins: Record<string, string> = {};
    for (const sw of switches) {
      const pin = Object.entries(netlist.keyNetOf).find(([ref]) => ref === sw.ref)?.[1].pin;
      if (pin) pins[sw.ref] = pin;
    }
    info.matrix_pins = { direct: Object.values(pins).map((p) => pinLabel(ctx.mcu, p)) };
    info.layout = { LAYOUT_direct: layoutKeys };
  } else if (netlist.matrix) {
    info.matrix_pins = {
      rows: netlist.matrix.rowPins.map((p) => pinLabel(ctx.mcu, p)),
      cols: netlist.matrix.colPins.map((p) => pinLabel(ctx.mcu, p)),
    };
    info.diode_direction = "COL2ROW";
    info.layout = { LAYOUT_default: layoutKeys };
  }

  if (encoders.length) {
    info.encoder = { enabled: true, encoder_pins: encoders.map((_, i) => [
      pinLabel(ctx.mcu, netlistEncoderPin(netlist, i, "A")),
      pinLabel(ctx.mcu, netlistEncoderPin(netlist, i, "B")),
    ]) };
  }
  return info;
}

function netlistEncoderPin(netlist: NetlistResult, i: number, which: "A" | "B"): string {
  const net = netlist.nets.find((n) => n.name === `ENC${i + 1}_${which}`);
  const pad = net?.pads.find((p) => p.ref === "U1");
  return pad?.pad ?? "D0";
}

