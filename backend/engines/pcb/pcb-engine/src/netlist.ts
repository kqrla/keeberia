/**
 * Netlist synthesis.
 * Direct mode: every key gets its own GPIO (micropads). Falls back to a
 * matrix (rows x cols, one diode per key) when keys exceed the GPIO budget.
 * XIAO RP2040: 11 GPIO (D0..D10), I2C hard-reserved on D4(SDA)/D5(SCL) when
 * an OLED is present.
 */
import { BoardCtx, padAbsPos } from "./layout.ts";
import { FootprintDef, Net, Placement, Pt } from "./types.ts";
import { FOOTPRINTS, MX_SOLDER, MX_HOTSWAP, DIODE } from "./footprints.ts";


const XIAO_GPIOS = ["D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10"];
const I2C = { sda: "D4", scl: "D5" };

export interface NetlistResult {
  nets: Net[];
  mode: "direct" | "matrix";
  matrix?: { rows: string[]; cols: string[]; rowPins: string[]; colPins: string[] };
  keyNetOf: Record<string, { pin: string; net: string }>; // ref -> the "drive" pad/net for qmk
}

function mkNet(name: string, kind: Net["kind"]): Net {
  return { name, number: 0, pads: [], kind };
}

function addPad(net: Net, ref: string, pad: string, pos: Pt, side: "F" | "B") {
  net.pads.push({ ref, pad, pos, side });
}

export function buildNetlist(ctx: BoardCtx): NetlistResult {
  const netMap = new Map<string, Net>();
  const net = (name: string, kind: Net["kind"] = "signal") => {
    let n = netMap.get(name);
    if (!n) { n = mkNet(name, kind); netMap.set(name, n); }
    return n;
  };

  const placements = ctx.placements;
  const mcu = placements.find((p) => p.ref === "U1")!;
  const switches = placements.filter((p) => p.library === MX_SOLDER.id || p.library === MX_HOTSWAP.id);
  const encoders = placements.filter((p) => p.library === "keeberia:EC11");
  const oleds = placements.filter((p) => p.library === "keeberia:OLED_091");

  const hasOled = oleds.length > 0;
  let freeGpios = [...XIAO_GPIOS];
  if (hasOled) freeGpios = freeGpios.filter((g) => g !== I2C.sda && g !== I2C.scl);
  const encBudget = encoders.length * 2;
  if (encBudget + switches.length > freeGpios.length && ctx.options.forceMatrix === false) {
    // fall through to matrix below (switches go to matrix, encoders stay direct)
  }
  const encPins = freeGpios.splice(0, encBudget);
  const keyPins = freeGpios;
  const keyCount = switches.length;
  const useMatrix = ctx.options.forceMatrix || keyCount > keyPins.length;

  // GND + power always
  const gnd = net("GND", "power");
  addPad(gnd, "U1", "GND", padAbsPos(mcu, "GND"), mcu.side);
  mcu.nets["GND"] = "GND";

  const p3v3 = net("+3V3", "power");
  addPad(p3v3, "U1", "3V3", padAbsPos(mcu, "3V3"), mcu.side);
  mcu.nets["3V3"] = "+3V3";

  // encoders: A/B on GPIO, common -> GND
  encoders.forEach((enc, i) => {
    const a = encPins[i * 2], b = encPins[i * 2 + 1];
    const na = net(`ENC${i + 1}_A`); addPad(na, enc.ref, "A", padAbsPos(enc, "A"), enc.side);
    enc.nets["A"] = na.name;
    const nb = net(`ENC${i + 1}_B`); addPad(nb, enc.ref, "B", padAbsPos(enc, "B"), enc.side);
    enc.nets["B"] = nb.name;
    addPad(gnd, enc.ref, "C", padAbsPos(enc, "C"), enc.side);
    enc.nets["C"] = "GND";
    for (const mp of ["MP1", "MP2"]) {
      addPad(gnd, enc.ref, mp, padAbsPos(enc, mp), enc.side);
      enc.nets[mp] = "GND";
    }
    addPad(na, "U1", a, padAbsPos(mcu, a), mcu.side);
    mcu.nets[a] = na.name;
    addPad(nb, "U1", b, padAbsPos(mcu, b), mcu.side);
    mcu.nets[b] = nb.name;
  });

  // OLED: GND 3V3 SCL SDA
  oleds.forEach((oled) => {
    addPad(gnd, oled.ref, "GND", padAbsPos(oled, "GND"), oled.side);
    oled.nets["GND"] = "GND";
    addPad(p3v3, oled.ref, "VCC", padAbsPos(oled, "VCC"), oled.side);
    oled.nets["VCC"] = "+3V3";
    const scl = net("SCL"); addPad(scl, oled.ref, "SCL", padAbsPos(oled, "SCL"), oled.side);
    oled.nets["SCL"] = "SCL";
    const sda = net("SDA"); addPad(sda, oled.ref, "SDA", padAbsPos(oled, "SDA"), oled.side);
    oled.nets["SDA"] = "SDA";
    addPad(scl, "U1", I2C.scl, padAbsPos(mcu, I2C.scl), mcu.side);
    mcu.nets[I2C.scl] = "SCL";
    addPad(sda, "U1", I2C.sda, padAbsPos(mcu, I2C.sda), mcu.side);
    mcu.nets[I2C.sda] = "SDA";
  });

  const keyNetOf: Record<string, { pin: string; net: string }> = {};
  let matrix: NetlistResult["matrix"] | undefined;

  if (!useMatrix) {
    // ── direct wiring: 1 GPIO per key ──
    switches.forEach((sw, i) => {
      const pin = keyPins[i];
      const kn = net(`K${i + 1}`);
      // MX solder: pin1 contact, pin2 contact, pin3 peg(NC). Hotswap: 1/2 contacts, 3 peg.
      addPad(kn, sw.ref, "1", padAbsPos(sw, "1"), sw.side);
      sw.nets["1"] = kn.name;
      addPad(gnd, sw.ref, "2", padAbsPos(sw, "2"), sw.side);
      sw.nets["2"] = "GND";
      sw.nets["3"] = undefined; // peg, no connect
      addPad(kn, "U1", pin, padAbsPos(mcu, pin), mcu.side);
      mcu.nets[pin] = kn.name;
      keyNetOf[sw.ref] = { pin, net: kn.name };
    });
    return finalize("direct");
  }

  // ── matrix mode: rows x cols, diode per key ──
  // pick smallest rows*cols with rows+cols <= keyPins.length, bias toward fewer rows
  let rows = 0, cols = 0;
  for (let r = 1; r <= keyCount; r++) {
    const c = Math.ceil(keyCount / r);
    if (r + c <= keyPins.length) { rows = r; cols = c; break; }
  }
  if (!rows) throw new Error(
    `pin budget exceeded: ${keyCount} keys need rows+cols matrix pins plus ${encBudget} encoder pins` +
    `${hasOled ? " plus 2 I2C pins" : ""}, but the XIAO has only ${XIAO_GPIOS.length} GPIO total. ` +
    `reduce keys, drop the OLED/encoder, or wait for the RP2040-Pico MCU option (26 GPIO).`);
  if (rows * cols < keyCount) throw new Error("matrix sizing bug");

  const rowPins = keyPins.slice(0, rows);
  const colPins = keyPins.slice(rows, rows + cols);

  // switch order: row-major over the grid (deterministic)
  const ordered = [...switches].sort((a, b) => {
    const ca = ctx.cells.find((c) => a.cellRef && c.row === a.cellRef.row && c.col === a.cellRef.col)!;
    const cb = ctx.cells.find((c) => b.cellRef && c.row === b.cellRef.row && c.col === b.cellRef.col)!;
    return ca.row - cb.row || ca.col - cb.col;
  });

  ordered.forEach((sw, i) => {
    const r = i % rows;
    const c = Math.floor(i / rows);
    const rowNetName = `ROW${r}`, colNetName = `COL${c}`;
    const rowNet = net(rowNetName);
    const colNet = net(colNetName);
    addPad(colNet, sw.ref, "1", padAbsPos(sw, "1"), sw.side);
    sw.nets["1"] = colNetName;
    // diode on the back, just below the switch: key pin2 -> diode anode, cathode -> row
    const dRef = `D${i + 1}`;
    const diode: Placement = {
      ref: dRef,
      library: DIODE.id,
      kicadFootprintName: DIODE.kicadName,
      pos: { x: sw.pos.x + 4.2, y: sw.pos.y + 9.6 },
      rotation: 90,
      side: "B",
      value: "1N4148W",
      nets: {},
    };
    placements.push(diode);
    // diode pads: K at (+1.45,0) A at (-1.45,0) before rotation; rotation 90 swaps axes
    const kPos = padAbsPos(diode, "K");
    const aPos = padAbsPos(diode, "A");
    sw.nets["2"] = `N_${sw.ref}`; // internal net switch -> diode
    const internal = net(`N_${sw.ref}`);
    addPad(internal, sw.ref, "2", padAbsPos(sw, "2"), sw.side);
    addPad(internal, dRef, "A", aPos, "B");
    diode.nets["A"] = internal.name;
    addPad(rowNet, dRef, "K", kPos, "B");
    diode.nets["K"] = rowNetName;
    keyNetOf[sw.ref] = { pin: colNetName, net: colNetName };
  });

  // bind row/col nets to MCU pins
  for (let r = 0; r < rows; r++) {
    const rn = net(`ROW${r}`);
    addPad(rn, "U1", rowPins[r], padAbsPos(mcu, rowPins[r]), mcu.side);
    mcu.nets[rowPins[r]] = rn.name;
  }
  for (let c = 0; c < cols; c++) {
    const cn = net(`COL${c}`);
    addPad(cn, "U1", colPins[c], padAbsPos(mcu, colPins[c]), mcu.side);
    mcu.nets[colPins[c]] = cn.name;
  }
  matrix = { rows: [], cols: [], rowPins, colPins };
  return finalize("matrix");

  function finalize(mode: "direct" | "matrix"): NetlistResult {
    // remove accidental duplicate pads (e.g. GND recorded twice for matrix switch)
    for (const n of netMap.values()) {
      const seen = new Set<string>();
      n.pads = n.pads.filter((p) => {
        const k = `${p.ref}:${p.pad}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    }
    // prune empty nets (the temp GND add for matrix peg)
    const nets = [...netMap.values()].filter((n) => n.pads.length >= 1);
    nets.sort((a, b) => (a.kind === "power" ? -1 : b.kind === "power" ? 1 : a.name.localeCompare(b.name, undefined, { numeric: true })));
    nets.forEach((n, i) => (n.number = i + 1));
    return { nets, mode: useMatrix ? "matrix" : "direct", matrix, keyNetOf };
  }
}
