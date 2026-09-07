/**
 * keeberia-pcb-engine — types
 * The layout contract between the keeberia frontend and the deterministic PCB backend.
 */

export type CellType =
  | "key"        // MX-compatible switch
  | "encoder"    // EC11 rotary encoder (replaces a key cell, 1u)
  | "oled"       // 0.91" SSD1306 I2C module
  | "joystick"  // analog stick (v2)
  | "spacer"    // empty cell, part of board but no component
  | "blocker"    // cut-out / not part of board (v2)
  | "touch"      // touch strip (v2)
  | "eink";      // e-ink display (v2)

export type SwitchType = "mx" | "choc_v1" | "choc_v2" | "lp_gl" | "mx_ks"; // ks = kailh speed
export type EncoderModel = "ec11" | "ec11_lp" | "side";
export type DisplayModel = "oled_128x32_091" | "oled_128x64_10" | "eink_29";
export type MountType = "hotswap" | "soldered";
export type RgbType = "none" | "per_key" | "underglow";

export interface Cell {
  row: number;
  col: number;
  /** width in grid units (for merged cells), default 1 */
  colSpan?: number;
  /** height in grid units (for merged cells), default 1 */
  rowSpan?: number;
  type: CellType;
  /** legend printed on silkscreen, e.g. "1", "VOL", "ESC" */
  label?: string;
  ref?: string; // override auto ref-des (SW1, ENC1, ...)
  // ── flow two: component resolution (defaults applied per type) ──
  switchType?: SwitchType;
  mount?: MountType;
  rgb?: RgbType;
  encoderModel?: EncoderModel;
  displayModel?: DisplayModel;
}

export interface SilkscreenItem {
  kind: "text"; // "svg" later
  text: string;
  x: number;            // mm, board coords (0,0 = board center)
  y: number;
  size?: number;         // mm cap height, default 1
  rot?: number;          // degrees
  layer: "F.SilkS" | "B.SilkS";
}

export interface LayoutOptions {
  /** microcontroller module */
  mcu?: "xiao_rp2040" | "xiao_samd21" | "xiao_nrf52840" | "xiao_esp32c3";
  /** board outline shape */
  boardShape?: "rect" | "rounded" | "hull";
  /** rounded rectangle corner radius, mm */
  cornerRadius?: number;
  /** user silkscreen items (flow three design surface) */
  silkscreen?: SilkscreenItem[];
  /** MX hotswap sockets instead of solder pads (global default; per-cell mount overrides) */
  hotswap?: boolean;
  /** include per-key SK6812 MINI-E RGB (v2) */
  rgb?: boolean;
  /** board name for silkscreen + filenames */
  boardName?: string;
  /** mounting hole style */
  mounting?: "corner" | "none";
  /** force matrix scanning even when direct pins would fit */
  forceMatrix?: boolean;
  /** key pitch in mm (default 19.05) */
  pitch?: number;
}

export interface KeeberiaLayout {
  name?: string;
  grid: { rows: number; cols: number };
  cells?: Cell[]; // omitted cells default to `key`
  options?: LayoutOptions;
}

// ── internal representation ──────────────────────────────────────────────

export interface Pt { x: number; y: number }

/** A physical footprint instance placed on the board. */
export interface Placement {
  ref: string;             // SW1, ENC1, U1, H1...
  library: string;         // footprint library id, e.g. "keeberia:MXHotswap"
  pos: Pt;                 // mm, board coords (KiCad convention: y down)
  rotation: number;        // degrees
  side: "F" | "B";         // front / back copper
  value: string;
  nets: Record<string, string | undefined>; // pad number -> net name
  /** grid cell this came from (for keys/encoders), for silkscreen labels */
  cellRef?: Cell;
  kicadFootprintName: string; // e.g. "keeberia:Kailh_MX_Hotswap"
}

export interface Net {
  name: string;
  number: number;
  /** pads as {ref, pad, x, y, side} */
  pads: Array<{ ref: string; pad: string; pos: Pt; side: "F" | "B" }>;
  kind: "signal" | "power";
}

export interface Segment {
  start: Pt; end: Pt;
  width: number;
  layer: "F.Cu" | "B.Cu";
  net: string;
  via?: boolean; // this segment ends at a via
}

export interface Via { at: Pt; size: number; drill: number; net: string }

export interface RouteWarning {
  level: "warning" | "error";
  message: string;
  net?: string;
}

export interface PcbResult {
  boardName: string;
  outline: { width: number; height: number; cornerRadius: number };
  placements: Placement[];
  nets: Net[];
  segments: Segment[];
  vias: Via[];
  silkscreen: Array<{ kind: "text" | "line"; pos: Pt; text?: string; size?: number; rot?: number; layer: string }>;
  bom: Array<{ refs: string; value: string; footprint: string; qty: number; notes?: string }>;
  warnings: RouteWarning[];
  stats: {
    keys: number;
    encoders: number;
    oleds: number;
    netCount: number;
    routedNets: number;
    failedNets: number;
    vias: number;
    traceMm: number;
  };
}

/** Physical footprint definition (geometry centered on part origin). */
export interface FootprintDef {
  id: string;
  kicadName: string;      // "keeberia:Kailh_MX_Hotswap"
  description: string;
  size: { w: number; h: number };
  /** keepout radius for the router (mm from center, circular approx) */
  keepoutRadius: number;
  pads: Array<{
    pad: string;          // pad number/name
    pos: Pt;              // mm relative to part center
    size: { w: number; h: number };
    shape: "circle" | "rect" | "oval" | "roundrect";
    drill?: number;       // through-hole drill diameter
    type: "thru_hole" | "smd";
    layer: string;        // "*.Cu" for tht, "F.Cu"/"B.Cu" for smd
  }>;
  /** silkscreen outline (footprint body), relative coords */
  silks: Array<{ kind: "line" | "circle"; start?: Pt; end?: Pt; center?: Pt; radius?: number }>;
  category: "switch" | "mcu" | "encoder" | "display" | "hole" | "led" | "diode" | "passive";
  flipSilkWhenBack?: boolean;
}
