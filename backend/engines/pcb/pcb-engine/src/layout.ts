/**
 * Layout normalization + physical placement.
 * Grid coords: cell (0,0) top-left, pitch in mm (default 19.05).
 * Board coords: re-centered so the board outline is centered at (0,0), KiCad y-down.
 */
import { Cell, KeeberiaLayout, LayoutOptions, Placement, Pt, PcbResult } from "./types.ts";
import { FOOTPRINTS, MX_SOLDER, MX_HOTSWAP, EC11, OLED_091, XIAO, M2_HOLE } from "./footprints.ts";

export const DEFAULT_PITCH = 19.05;

export interface BoardCtx {
  pitch: number;
  rows: number;
  cols: number;
  /** cell map, index = row*cols + col */
  cells: Cell[];
  options: Required<Pick<LayoutOptions, "mcu" | "hotswap" | "boardName" | "mounting" | "forceMatrix">>;
  /** board bounds in board coords (after centering) */
  outline: { width: number; height: number; cornerRadius: number };
  placements: Placement[];
  /** offset applied: boardPt = gridPt - centerOffset */
  gridToBoard: (p: Pt) => Pt;
}

export function normalizeCells(layout: KeeberiaLayout): Cell[] {
  const { rows, cols } = layout.grid;
  if (!rows || !cols) throw new Error("grid.rows and grid.cols are required");
  if (rows > 8 || cols > 12) throw new Error("micropad engine supports up to 8 rows x 12 cols");
  const map = new Array(rows * cols);
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      map[r * cols + c] = { row: r, col: c, type: "key" as const };
  for (const cell of layout.cells ?? []) {
    const { row, col } = cell;
    if (row == null || col == null || row < 0 || col < 0 || row >= rows || col >= cols)
      throw new Error(`cell out of bounds: ${JSON.stringify(cell)}`);
    map[row * cols + col] = { colSpan: 1, rowSpan: 1, ...cell };
  }
  return map;
}

/** cell center in grid coords (mm) */
export function cellCenter(cell: Cell, pitch: number): Pt {
  const cSpan = cell.colSpan ?? 1;
  const rSpan = cell.rowSpan ?? 1;
  return {
    x: (cell.col + (cSpan - 1) / 2) * pitch + pitch / 2,
    y: (cell.row + (rSpan - 1) / 2) * pitch + pitch / 2,
  };
}

/**
 * Place all components deterministically:
 * - keys/encoders/oled at their grid cell centers (front side; hotswap pads on back)
 * - XIAO on the BACK, centered below the bottom row of keys
 * - M2 mounting holes at the 4 corners
 */
export function placeComponents(layout: KeeberiaLayout): BoardCtx {
  const pitch = layout.options?.pitch ?? DEFAULT_PITCH;
  const cells = normalizeCells(layout);
  const { rows, cols } = layout.grid;
  const opts = {
    mcu: layout.options?.mcu ?? ("xiao_rp2040" as const),
    hotswap: layout.options?.hotswap ?? true,
    boardName: layout.options?.boardName ?? layout.name ?? "keeberia",
    mounting: layout.options?.mounting ?? ("corner" as const),
    forceMatrix: layout.options?.forceMatrix ?? false,
  };

  const keyArea = {
    x: 0, y: 0,
    w: (cols - 1) * pitch,
    h: (rows - 1) * pitch,
  };

  // XIAO sits on the back, below the key field.
  // keyArea.x/y mark cell edges; cell centers sit at +pitch/2.
  const centersMidX = keyArea.w / 2 + pitch / 2; // midpoint of key CENTERS
  const mcuW = XIAO.size.w;   // 21
  const mcuH = XIAO.size.h;    // 17.5
  const gapKeysMcu = 3;        // clearance between key courtyard and module
  const mcuCenterGrid: Pt = {
    x: centersMidX,
    y: keyArea.h + pitch / 2 + 7.6 + gapKeysMcu + mcuH / 2, // key half-courtyard + gap + module half
  };

  const placements: Placement[] = [];
  let swN = 0, encN = 0, oledN = 0;

  for (const cell of cells) {
    if (cell.type === "spacer" || cell.type === "blocker") continue;
    const center = cellCenter(cell, pitch);
    if (cell.type === "key") {
      swN++;
      const fp = opts.hotswap ? MX_HOTSWAP : MX_SOLDER;
      placements.push({
        ref: cell.ref ?? `SW${swN}`,
        library: fp.id,
        kicadFootprintName: fp.kicadName,
        pos: center,
        rotation: 0,
        side: opts.hotswap ? "B" : "F", // hotswap sockets solder on back
        value: cell.label ?? `SW${swN}`,
        nets: {},
        cellRef: cell,
      });
    } else if (cell.type === "encoder") {
      encN++;
      placements.push({
        ref: cell.ref ?? `ENC${encN}`,
        library: EC11.id,
        kicadFootprintName: EC11.kicadName,
        pos: center,
        rotation: 0,
        side: "F",
        value: cell.label ?? `ENC${encN}`,
        nets: {},
        cellRef: cell,
      });
    } else if (cell.type === "oled") {
      oledN++;
      placements.push({
        ref: cell.ref ?? `OLED${oledN}`,
        library: OLED_091.id,
        kicadFootprintName: OLED_091.kicadName,
        pos: center,
        rotation: 0,
        side: "F",
        value: "SSD1306 0.91in I2C",
        nets: {},
        cellRef: cell,
      });
    } else {
      throw new Error(`component type "${cell.type}" is not supported yet in v1 (micropads)`);
    }
  }

  if (swN + encN === 0) throw new Error("layout has no components");

  // MCU on the back. KiCad mirrors footprint geometry automatically for B-side
  // footprints; in our exporter we mirror pad x ourselves.
  placements.push({
    ref: "U1",
    library: XIAO.id,
    kicadFootprintName: XIAO.kicadName,
    pos: mcuCenterGrid,
    // 180°: the usb-c edge (module local -y) faces the board edge, not the
    // key field — the case compiler cuts the usb slot in the wall from this.
    rotation: 180,
    side: "B",
    value: "XIAO " + opts.mcu.replace("xiao_", "").toUpperCase(),
    nets: {},
  });

  // outline: bounding box over every part courtyard (pads included via
  // keepoutRadius when wider), plus edge margin. Computed AFTER placement so
  // oversize parts (OLED breakouts) grow the board instead of overflowing.
  const margin = 2.5; // mm from courtyard to edge
  const m2Inset = 3.5; // mounting hole center inset from edge
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const pl of placements) {
    const fp = FOOTPRINTS[pl.library];
    const ext = Math.max(fp.size.w / 2, fp.keepoutRadius ?? 0);
    const extY = Math.max(fp.size.h / 2, fp.keepoutRadius ?? 0);
    minX = Math.min(minX, pl.pos.x - ext);
    maxX = Math.max(maxX, pl.pos.x + ext);
    minY = Math.min(minY, pl.pos.y - extY);
    maxY = Math.max(maxY, pl.pos.y + extY);
  }
  minX -= margin; maxX += margin; minY -= margin; maxY += margin;

  const outline = {
    width: Math.round((maxX - minX) * 100) / 100,
    height: Math.round((maxY - minY) * 100) / 100,
    cornerRadius: 2.5,
  };
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const gridToBoard = (p: Pt): Pt => ({ x: p.x - cx, y: p.y - cy });
  for (const pl of placements) pl.pos = gridToBoard(pl.pos);

  // mounting holes
  if (opts.mounting === "corner") {
    const hx = outline.width / 2 - m2Inset;
    const hy = outline.height / 2 - m2Inset;
    const holes: Pt[] = [
      { x: -hx, y: -hy }, { x: hx, y: -hy },
      { x: -hx, y: hy }, { x: hx, y: hy },
    ];
    holes.forEach((p, i) => {
      placements.push({
        ref: `H${i + 1}`,
        library: M2_HOLE.id,
        kicadFootprintName: M2_HOLE.kicadName,
        pos: p,
        rotation: 0,
        side: "F",
        value: "M2",
        nets: {},
      });
    });
  }

  return {
    pitch, rows, cols, cells, options: opts,
    outline, placements, gridToBoard,
  };
}

/** absolute pad position of a placed footprint pad */
export function padAbsPos(placement: Placement, padName: string): Pt {
  const fp = FOOTPRINTS[placement.library];
  const pad = fp.pads.find((p) => p.pad === padName);
  if (!pad) throw new Error(`pad ${padName} not found in ${placement.library}`);
  const rot = (placement.rotation * Math.PI) / 180;
  let dx = pad.pos.x, dy = pad.pos.y;
  if (placement.side === "B") dx = -dx; // mirror on back
  const rx = dx * Math.cos(rot) - dy * Math.sin(rot);
  const ry = dx * Math.sin(rot) + dy * Math.cos(rot);
  return { x: placement.pos.x + rx, y: placement.pos.y + ry };
}
