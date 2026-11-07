/**
 * Layout normalization + physical placement.
 * Grid coords: cell (0,0) top-left, pitch in mm (default 19.05).
 * Board coords: re-centered so the board outline is centered at (0,0), KiCad y-down.
 */
import { Cell, KeeberiaLayout, LayoutOptions, Placement, Pt, PcbResult } from "./types.ts";
import { FOOTPRINTS, MX_SOLDER, MX_HOTSWAP, CHOC_V1, EC11, OLED_091, XIAO, M2_HOLE } from "./footprints.ts";
import type { OutlineShape } from "./outline.ts";
import { rect as rectOf, rectFromCenter, boardRegion, silhouetteShape, recenterSilhouette, mountableCorners } from "./silhouette.ts";

export const DEFAULT_PITCH = 19.05;

export interface BoardCtx {
  pitch: number;
  rows: number;
  cols: number;
  /** cell map, index = row*cols + col */
  cells: Cell[];
  options: Required<Pick<LayoutOptions, "mcu" | "hotswap" | "boardName" | "mounting" | "forceMatrix">>;
  /** board bounds in board coords (after centering); bbox of `shape` when one is set */
  outline: { width: number; height: number; cornerRadius: number };
  /** the actual silhouette: rect (default) or a user polygon from a shape spec or dxf */
  shape?: OutlineShape;
  /** decorative/user cutouts, already validated against the fab profile */
  cutouts?: Pt[][];
  /** set when the cell arrangement cannot become a board (disconnected, empty) */
  silhouetteError?: string;
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
      // the switch resolution joint — this is where "changing the switch"
      // actually happens. the record carries every projection with it:
      // copper (pads), case (plate cutout + thickness), bom (part), so the
      // downstream engines never hardcode switch geometry again.
      // (component-geometry-pipeline.md)
      const mount = cell.mount ?? (opts.hotswap ? "hotswap" : "soldered");
      const fp =
        cell.switchType === "choc_v1" ? CHOC_V1 :          // choc v1 is solder-only for now (hotswap choc record pending)
        mount === "hotswap" ? MX_HOTSWAP : MX_SOLDER;
      placements.push({
        ref: cell.ref ?? `SW${swN}`,
        library: fp.id,
        kicadFootprintName: fp.kicadName,
        pos: center,
        rotation: 0,
        side: fp === MX_HOTSWAP ? "B" : "F", // hotswap sockets solder on back
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

  // silhouette: the envelope everything must fit inside (every part courtyard
  // plus margin, and every cell the board should cover), minus the cells the
  // user blocked. a part never carves a notch: the mcu and a display sit on the
  // board, they do not reshape it. an empty cell always does, because that is
  // the shape the user painted. treated as a union of part courtyards instead,
  // every display became a wing and the streamdeck lost six nets of routing.
  const margin = 2.5; // mm from courtyard to edge
  const m2Inset = 3.5; // mounting hole center inset from edge
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const grow = (x0: number, y0: number, x1: number, y1: number) => {
    minX = Math.min(minX, x0); maxX = Math.max(maxX, x1);
    minY = Math.min(minY, y0); maxY = Math.max(maxY, y1);
  };
  for (const pl of placements) {
    const fp = FOOTPRINTS[pl.library];
    const ext = Math.max(fp.size.w / 2, fp.keepoutRadius ?? 0);
    const extY = Math.max(fp.size.h / 2, fp.keepoutRadius ?? 0);
    grow(pl.pos.x - ext - margin, pl.pos.y - extY - margin, pl.pos.x + ext + margin, pl.pos.y + extY + margin);
  }
  const cellRects: ReturnType<typeof rectOf>[] = [];
  const blockRects: ReturnType<typeof rectOf>[] = [];
  const occupied = new Set(cells.filter((c) => c.type !== "blocker").map((c) => `${c.row},${c.col}`));
  for (const cell of cells) {
    const c = cellCenter(cell, pitch);
    const w = (cell.colSpan ?? 1) * pitch;
    const h = (cell.rowSpan ?? 1) * pitch;
    const r = rectFromCenter(c.x, c.y, w, h);
    if (cell.type === "blocker") {
      // a blocker with no neighbour on a side opens to that side, so an empty
      // cell at the edge cuts through the margin instead of becoming an
      // enclosed slot with a 2.5mm web of board around it
      const cut = margin + 2;
      blockRects.push(rectOf(
        occupied.has(`${cell.row},${cell.col - 1}`) ? r.x0 : r.x0 - cut,
        occupied.has(`${cell.row - 1},${cell.col}`) ? r.y0 : r.y0 - cut,
        occupied.has(`${cell.row},${cell.col + 1}`) ? r.x1 : r.x1 + cut,
        occupied.has(`${cell.row + 1},${cell.col}`) ? r.y1 : r.y1 + cut,
      ));
    } else {
      cellRects.push(r);
      grow(r.x0, r.y0, r.x1, r.y1);
    }
  }
  if (!isFinite(minX)) throw new Error("nothing placed and no cells: there is no board to make");
  const union = boardRegion(rectOf(minX, minY, maxX, maxY), blockRects);
  // a shape the tracer refuses must reach the user as an error, never as a
  // silent fall back to the bounding box
  const silhouetteError = union.ok ? undefined : union.error;
  const bb = union.ok
    ? recenterSilhouette(union.silhouette).bbox
    : { width: Math.round((maxX - minX) * 100) / 100, height: Math.round((maxY - minY) * 100) / 100 };

  const outline = { width: bb.width, height: bb.height, cornerRadius: 2.5 };
  const round6 = (v: number) => Math.round(v * 1e6) / 1e6;
  const snap = (v: number) => (Math.abs(v) < 1e-9 ? 0 : v);
  // the envelope bbox is the board bbox whether or not the trace succeeded
  const cx = round6((minX + maxX) / 2);
  const cy = round6((minY + maxY) / 2);
  const gridToBoard = (p: Pt): Pt => ({ x: snap(p.x - cx), y: snap(p.y - cy) });
  for (const pl of placements) pl.pos = gridToBoard(pl.pos);

  // the silhouette in board coords, for the engine to validate and ship
  let shape: OutlineShape | undefined;
  let cutouts: Pt[][] | undefined;
  let silhouetteForHoles: ReturnType<typeof recenterSilhouette> | undefined;
  if (union.ok) {
    const shifted = recenterSilhouette(union.silhouette);
    shape = silhouetteShape(shifted, outline.cornerRadius);
    cutouts = shifted.holes.map((h) => h.map((q) => ({ x: Math.round(q.x * 1000) / 1000, y: Math.round(q.y * 1000) / 1000 })));
    if (!shifted.holes.length) cutouts = undefined;
    if (shape.kind === "polygon") {
      shape = { kind: "polygon", points: shape.points.map((q) => ({ x: Math.round(q.x * 1000) / 1000, y: Math.round(q.y * 1000) / 1000 })) };
    }
    // mounting holes move onto real corners of a stepped board
    if (shape.kind === "rect") {
      // parity: a rectangular board keeps the exact dims it always had
      shape = { kind: "rect", width: outline.width, height: outline.height, cornerRadius: outline.cornerRadius };
    } else {
      silhouetteForHoles = shifted;
    }
  }

  // mounting holes
  if (opts.mounting === "corner") {
    const hx = outline.width / 2 - m2Inset;
    const hy = outline.height / 2 - m2Inset;
    const holes: Pt[] = silhouetteForHoles
      // a stepped board has no bounding-box corners to trust: put the holes on
      // real corners, each one verified to keep its circle on the board
      ? mountableCorners(silhouetteForHoles, M2_HOLE.pads[0].drill! / 2, 0.5, 4)
      : [
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
    outline, placements, gridToBoard, shape, cutouts, silhouetteError,
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
