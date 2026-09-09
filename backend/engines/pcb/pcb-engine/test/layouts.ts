// regression fixtures — the three reference layouts
import { KeeberiaLayout } from "../src/types.ts";

const layouts: Array<[string, KeeberiaLayout]> = [
  ["hackpad-3key", {
    name: "hackpad-3key",
    grid: { rows: 1, cols: 3 },
    options: { boardName: "keeberia-hackpad", hotswap: false, mcu: "xiao_rp2040" },
    cells: [
      { row: 0, col: 0, type: "key", label: "ESC" },
      { row: 0, col: 1, type: "key", label: "2" },
      { row: 0, col: 2, type: "key", label: "3" },
    ],
  }],
  ["ninepad", {
    name: "ninepad",
    grid: { rows: 3, cols: 3 },
    options: { boardName: "keeberia-ninepad", hotswap: true },
    cells: [
      { row: 0, col: 0, type: "key", label: "1" },
      { row: 0, col: 1, type: "key", label: "2" },
      { row: 0, col: 2, type: "encoder", label: "VOL" },
      { row: 1, col: 0, type: "key", label: "4" },
      { row: 1, col: 1, type: "key", label: "5" },
      { row: 1, col: 2, type: "key", label: "6" },
      { row: 2, col: 0, type: "key", label: "7" },
      { row: 2, col: 1, type: "key", label: "8" },
      { row: 2, col: 2, type: "key", label: "9" },
    ],
  }],
  ["streamdeck", {
    name: "streamdeck",
    grid: { rows: 3, cols: 4 },
    options: { boardName: "keeberia-streamdeck", hotswap: true },
    cells: [
      { row: 0, col: 0, type: "key", label: "M1" },
      { row: 0, col: 1, type: "key", label: "M2" },
      { row: 0, col: 2, type: "encoder", label: "MIX" },
      { row: 0, col: 3, type: "oled" },
      { row: 1, col: 0, type: "key", label: "M5" },
      { row: 1, col: 1, type: "key", label: "M6" },
      { row: 1, col: 2, type: "key", label: "M7" },
      { row: 1, col: 3, type: "key", label: "M8" },
      { row: 2, col: 0, type: "key", label: "M10" },
      { row: 2, col: 1, type: "key", label: "M11" },
      { row: 2, col: 2, type: "key", label: "M12" },
      { row: 2, col: 3, type: "key", label: "M13" },
    ],
  }],
  ["ninepad-choc", {
    name: "ninepad-choc",
    grid: { rows: 3, cols: 3 },
    options: { boardName: "keeberia-ninepad-choc", hotswap: false, mcu: "xiao_rp2040" },
    cells: [
      { row: 0, col: 0, type: "key", label: "1", switchType: "choc_v1" },
      { row: 0, col: 1, type: "key", label: "2", switchType: "choc_v1" },
      { row: 0, col: 2, type: "key", label: "3", switchType: "choc_v1" },
      { row: 1, col: 0, type: "key", label: "4", switchType: "choc_v1" },
      { row: 1, col: 1, type: "key", label: "5", switchType: "choc_v1" },
      { row: 1, col: 2, type: "key", label: "6", switchType: "choc_v1" },
      { row: 2, col: 0, type: "key", label: "7", switchType: "choc_v1" },
      { row: 2, col: 1, type: "key", label: "8", switchType: "choc_v1" },
      { row: 2, col: 2, type: "key", label: "9", switchType: "choc_v1" },
    ],
  }],
];

export { layouts };
