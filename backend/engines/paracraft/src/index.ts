/**
 * keeberia-case-engine — the parametric case compiler.
 * pcb result → readable, dependency-free openscad source.
 * same board, same case, forever: everything below is derived from the
 * board the pcb engine produced — nothing is modeled by hand, nothing is
 * guessed. the .scad file is the canonical artifact (per the spec: the
 * case is parametric source, not a dead mesh).
 */
import type { PcbResult, Placement } from "../../circuitron/src/types.ts";
import { FOOTPRINTS } from "../../circuitron/src/footprints.ts";

export interface CaseOptions {
  wallThickness: number;   // mm, side walls
  baseThickness: number;   // mm, case floor
  caseMargin: number;      // mm, pcb edge to inner wall (3d print tolerance)
  cornerRadius: number;    // mm, OUTER corner radius of the case
  frontHeight: number;    // mm, wall height at the usb edge (v1: level walls)
  rearHeight: number;      // mm, wall height at the far edge
  screwSize: number;       // mm, screw drill (m2 = 2.2)
  standoffHeight: number;  // mm, pcb floats this far above the floor
  usbClearance: number;    // mm, added around the usb-c slot
  plateThickness: number;  // mm, switch plate (mx 1.5 / choc 1.2)
}

export const DEFAULT_CASE_OPTIONS: CaseOptions = {
  wallThickness: 3,
  baseThickness: 2.4,
  caseMargin: 1.6,
  cornerRadius: 4,
  frontHeight: 10,
  rearHeight: 10,
  screwSize: 2.2,
  standoffHeight: 5,    // xiao module + usb shell stack is 4.26mm; 5 clears the floor
  usbClearance: 0.6,
  plateThickness: 1.5,
};

export interface CaseWarning {
  level: "warning" | "error";
  message: string;
}

export interface CaseResult {
  scad: string;
  params: Record<string, number>;       // the slider values this case was built with
  warnings: CaseWarning[];
  stats: {
    standoffs: number;
    usbWall: string;                    // which wall the usb slot is cut into
    plateOpenings: number;              // keys + encoders + displays
  };
}

// one record, many projections: this engine never hardcodes component
// geometry. cutouts, windows, usb shells all come from the component
// records' case projections (CaseProjection, pcb engine) — change the
// switch and the cutout changes, because they are the same data.
// (backend/engines/pcb/research/notes/component-geometry-pipeline.md)
const REC = (libId: string) => FOOTPRINTS[libId];

const fmt = (n: number) => (Math.round(n * 100) / 100).toString();

export function generateCase(pcb: PcbResult, partial?: Partial<CaseOptions>): CaseResult {
  const warnings: CaseWarning[] = [];

  const holes = pcb.placements.filter((p) => p.library === "keeberia:Mount_M2");
  const mcu = pcb.placements.find((p) => REC(p.library)?.category === "mcu");
  const encoders = pcb.placements.filter((p) => REC(p.library)?.category === "encoder");
  const displays = pcb.placements.filter((p) => REC(p.library)?.category === "display");
  const keys = pcb.placements.filter((p) => REC(p.library)?.category === "switch");

  // the plate thickness default follows the board's switches — the record
  // knows what plate its family clips into (mx 1.5, choc 1.2)
  const familyPlates = [...new Set(keys
    .map((k) => REC(k.library)?.case?.plateThickness)
    .filter((v): v is number => v !== undefined))];
  let plateDefault: number | undefined;
  if (familyPlates.length === 1) plateDefault = familyPlates[0];
  else if (familyPlates.length > 1) {
    plateDefault = Math.max(...familyPlates);
    warnings.push({ level: "warning", message: `mixed switch families want different plate thicknesses (${familyPlates.join(", ")}mm) — using the thickest for now; per-family plates arrive with the split-plate flow` });
  }
  // the wall height follows the switch stack too — the plate sits on the
  // wall tops and the pcb hangs from the switches, so walls must be
  // standoffHeight + plateTopToPcb tall or the pcb won't line up
  const familyStacks = [...new Set(keys
    .map((k) => REC(k.library)?.case?.plateTopToPcb)
    .filter((v): v is number => v !== undefined))];
  let stack: number | undefined;
  if (familyStacks.length === 1) stack = familyStacks[0];
  else if (familyStacks.length > 1) {
    stack = Math.max(...familyStacks);
    warnings.push({ level: "warning", message: `mixed switch families want different plate-to-pcb stacks (${familyStacks.join(", ")}mm) — using the tallest; a true mixed board needs the split-plate flow` });
  }
  const requiredWall = DEFAULT_CASE_OPTIONS.standoffHeight + (stack ?? 0);
  const wallOverride = partial?.frontHeight !== undefined || partial?.rearHeight !== undefined;
  const wallDefault = stack !== undefined ? requiredWall : DEFAULT_CASE_OPTIONS.frontHeight;
  const opts = {
    ...DEFAULT_CASE_OPTIONS,
    ...(plateDefault !== undefined ? { plateThickness: plateDefault } : {}),
    frontHeight: wallDefault,
    rearHeight: wallDefault,
    ...partial,
  };
  const wallTop = Math.max(opts.frontHeight, opts.rearHeight);
  if (stack !== undefined && Math.abs(wallTop - requiredWall) > 0.25) {
    warnings.push({ level: "warning", message: `walls want ${fmt(requiredWall)}mm so the pcb lines up with the switch plate stack (standoff ${fmt(opts.standoffHeight)} + plate height ${fmt(stack)}); currently ${fmt(wallTop)} — the pcb would sit off switch height` });
  } else if (stack !== undefined && wallOverride) {
    warnings.push({ level: "info", message: `walls pinned to the switch stack: ${fmt(wallTop)}mm (standoff ${fmt(opts.standoffHeight)} + plate height ${fmt(stack)})` });
  }

  if (holes.length === 0) {
    warnings.push({ level: "error", message: "this board has no mounting holes — the case cannot anchor the pcb. enable corner mounting in the pcb flow first" });
  }
  if (opts.frontHeight !== opts.rearHeight) {
    warnings.push({ level: "warning", message: "typing angle arrives with the top plate flow — for now the walls stay level at the taller height" });
  }
  const innerRadius = opts.cornerRadius - opts.wallThickness;
  if (innerRadius < 0.5) {
    warnings.push({ level: "warning", message: "outer corners are barely rounder than the walls — raise corner radius or thin the walls for visible rounding" });
  }

  // ── usb slot: derived from the mcu placement, not hardcoded ──
  // the xiao's usb-c sits on the module edge whose outward normal is
  // local (0,-1); rotate by the placement rotation to find the wall.
  const usbShell = mcu ? REC(mcu.library)?.case?.usbShell : undefined;
  if (mcu && !usbShell) {
    warnings.push({ level: "warning", message: "the mcu record carries no usb shell projection — no wall slot is cut" });
  }
  let usb: { wall: "y+" | "y-" | "x+" | "x-"; along: number } | null = null;
  if (mcu && usbShell) {
    const rad = (mcu.rotation * Math.PI) / 180;
    const nx = Math.sin(rad);            // 0*cos - (-1)*sin
    const ny = -Math.cos(rad);           // 0*sin + (-1)*cos
    const wall: "y+" | "y-" | "x+" | "x-" =
      Math.abs(ny) >= Math.abs(nx) ? (ny > 0 ? "y+" : "y-") : (nx > 0 ? "x+" : "x-");
    usb = { wall, along: wall === "y+" || wall === "y-" ? mcu.pos.x : mcu.pos.y };
  }

  // slot z: the shell hangs off the module face on the pcb's back, so it
  // sits standoff height above the floor, just below the pcb.
  const shellH = usbShell?.h ?? 0;
  const shellCenterZ = opts.baseThickness + opts.standoffHeight - (usbShell?.moduleThickness ?? 0) - shellH / 2;
  const slotZ0 = shellCenterZ - shellH / 2 - opts.usbClearance;
  const slotZ1 = shellCenterZ + shellH / 2 + opts.usbClearance;
  if (slotZ0 < opts.baseThickness) {
    warnings.push({ level: "error", message: "the usb port would breach the case floor — raise the standoff height above 4.3mm so the xiao and its shell fit inside" });
  }

  const cavityW = pcb.outline.width + 2 * opts.caseMargin;
  const cavityH = pcb.outline.height + 2 * opts.caseMargin;
  const outerW = cavityW + 2 * opts.wallThickness;
  const outerH = cavityH + 2 * opts.wallThickness;
  const wallHeight = Math.max(opts.frontHeight, opts.rearHeight);
  const screwHole = opts.screwSize + 0.2;              // screw passes, self-taps the post
  const standoffRadius = opts.screwSize / 2 + 2.5;

  // ── emit the scad ──
  const L: string[] = [];
  L.push(`// ${pcb.boardName} — case`);
  L.push(`// generated by keeberia from the project model. edit any parameter`);
  L.push(`// below and re-render: the model is parametric and dependency-free`);
  L.push(`// (vanilla openscad, no libraries — paste it into any customizer or`);
  L.push(`// makerlab configurator and the sliders just appear). coordinates match`);
  L.push(`// the pcb's board coordinates: (0,0) is the center, +y = usb wall.`);
  L.push(``);
  L.push(`// ── parameters (the app's sliders; the annotations make this file`);
  L.push(`//    a configurator — openscad customizer, makerlab, anything)`);
  L.push(`/* [Case] */`);
  L.push(`wall_thickness = ${fmt(opts.wallThickness)};   // [1.6:0.2:5] side walls (below 1.6 gets floppy)`);
  L.push(`base_thickness = ${fmt(opts.baseThickness)};   // [1.6:0.2:6] case floor`);
  L.push(`case_margin    = ${fmt(opts.caseMargin)};     // [0.2:0.1:3] pcb edge to inner wall (print tolerance)`);
  L.push(`corner_radius  = ${fmt(opts.cornerRadius)};    // [0:0.5:15] outer corner radius`);
  L.push(`front_height   = ${fmt(opts.frontHeight)};     // [5:1:30] wall height, usb edge`);
  L.push(`rear_height    = ${fmt(opts.rearHeight)};     // [5:1:30] wall height, far edge`);
  L.push(`standoff_height = ${fmt(opts.standoffHeight)};  // [4.5:0.5:12] pcb floats above the floor (xiao stack needs 4.3)`);
  L.push(`/* [Mounting] */`);
  L.push(`screw_size     = ${fmt(opts.screwSize)};    // [2:0.1:3.2] drill (m2 = 2.2, m2.5 = 2.7, m3 = 3.2)`);
  L.push(`plate_thickness = ${fmt(opts.plateThickness)};  // [1:0.1:2] switch plate (default from the board's switch records)`);
  L.push(``);
  L.push(`// ── derived from the board (regenerate the case to change these) ──`);
  L.push(`/* [Hidden] */`);
  L.push(`pcb_width      = ${fmt(pcb.outline.width)};   // from the generated board`);
  L.push(`pcb_height     = ${fmt(pcb.outline.height)};`);
  L.push(`pcb_thickness  = 1.6;    // 2-layer, 1.6mm fr4`);
  L.push(`pcb_corner_radius = ${fmt(pcb.outline.cornerRadius)};`);
  L.push(`$fn = 48;`);
  if (usbShell) L.push(`usb_slot_width  = ${fmt(usbShell.w + 2 * opts.usbClearance)};   // usb-c shell from the mcu record + clearance`);
  L.push(`usb_slot_z     = [${fmt(Math.max(slotZ0, 0.5))}, ${fmt(slotZ1)}];`);
  if (usb) L.push(`usb_slot_along = ${fmt(usb.along)};   // usb-c center along the ${wallName(usb.wall)} wall`);
  L.push(`screw_hole     = screw_size + 0.2;`);
  L.push(`standoff_radius = screw_size / 2 + 2.5;`);
  L.push(``);
  L.push(`// rounded rectangle, hull of four circles — no libraries needed`);
  L.push(`module rounded_rect(width, depth, radius) {`);
  L.push(`  r = max(radius, 0.01);`);
  L.push(`  hull()`);
  L.push(`    for (x = [-(width / 2 - r), width / 2 - r])`);
  L.push(`      for (y = [-(depth / 2 - r), depth / 2 - r])`);
  L.push(`        translate([x, y, 0]) circle(r);`);
  L.push(`}`);
  L.push(``);
  L.push(`cavity_width  = pcb_width + 2 * case_margin;`);
  L.push(`cavity_height = pcb_height + 2 * case_margin;`);
  L.push(`outer_width   = cavity_width + 2 * wall_thickness;`);
  L.push(`outer_height  = cavity_height + 2 * wall_thickness;`);
  L.push(`wall_height   = max(front_height, rear_height);`);
  L.push(``);
  L.push(`// the tray: floor + walls, hollow above the floor, open top`);
  L.push(`module case_body() {`);
  L.push(`  difference() {`);
  L.push(`    linear_extrude(wall_height)`);
  L.push(`      rounded_rect(outer_width, outer_height, corner_radius);`);
  L.push(`    translate([0, 0, base_thickness])`);
  L.push(`      linear_extrude(wall_height)`);
  L.push(`        rounded_rect(cavity_width, cavity_height, corner_radius - wall_thickness);`);
  L.push(`  }`);
  L.push(`}`);
  L.push(``);
  L.push(`// pcb anchors: posts under the board's mounting holes`);
  L.push(`module standoff(x, y) {`);
  L.push(`  translate([x, y, base_thickness])`);
  L.push(`    difference() {`);
  L.push(`      cylinder(h = standoff_height, r = standoff_radius);`);
  L.push(`      translate([0, 0, -1]) cylinder(h = standoff_height + 2, r = screw_hole / 2);`);
  L.push(`    }`);
  L.push(`}`);
  L.push(`module standoffs() {`);
  for (const h of holes) L.push(`  standoff(${fmt(h.pos.x)}, ${fmt(h.pos.y)});  // ${h.ref}`);
  L.push(`}`);
  L.push(``);
  L.push(`// usb-c slot, cut through the ${usb ? wallName(usb.wall) : "nearest"} wall`);
  L.push(`module usb_slot() {`);
  if (usb) {
    const w = "usb_slot_width";
    const d = "wall_thickness + 2";
    if (usb.wall === "y+") {
      L.push(`  translate([usb_slot_along - ${w} / 2, cavity_height / 2 - 1, usb_slot_z[0] - 0.5])`);
      L.push(`    cube([${w}, ${d}, usb_slot_z[1] - usb_slot_z[0] + 1]);`);
    } else if (usb.wall === "y-") {
      L.push(`  translate([usb_slot_along - ${w} / 2, -outer_height / 2 + wall_thickness - 1, usb_slot_z[0] - 0.5])`);
      L.push(`    cube([${w}, ${d}, usb_slot_z[1] - usb_slot_z[0] + 1]);`);
    } else if (usb.wall === "x+") {
      L.push(`  translate([cavity_width / 2 - 1, usb_slot_along - ${w} / 2, usb_slot_z[0] - 0.5])`);
      L.push(`    cube([${d}, ${w}, usb_slot_z[1] - usb_slot_z[0] + 1]);`);
    } else {
      L.push(`  translate([-outer_width / 2 + wall_thickness - 1, usb_slot_along - ${w} / 2, usb_slot_z[0] - 0.5])`);
      L.push(`    cube([${d}, ${w}, usb_slot_z[1] - usb_slot_z[0] + 1]);`);
    }
  }
  L.push(`}`);
  L.push(``);
  L.push(`module case_bottom() {`);
  L.push(`  difference() {`);
  L.push(`    union() {`);
  L.push(`      case_body();`);
  L.push(`      standoffs();`);
  L.push(`    }`);
  L.push(`    usb_slot();`);
  L.push(`  }`);
  L.push(`}`);
  L.push(``);
  L.push(`// the switch plate: sits on the wall tops, keys + knobs + display poke through`);
  L.push(`module top_plate() {`);
  L.push(`  difference() {`);
  L.push(`    linear_extrude(plate_thickness)`);
  L.push(`      rounded_rect(outer_width, outer_height, corner_radius);`);
  for (const k of keys) {
    const o = REC(k.library)?.case?.plateOpening;
    if (!o) { warnings.push({ level: "error", message: `switch record ${k.library} has no plate opening — the case flow needs a case projection for every switch family` }); continue; }
    L.push(`    translate([${fmt(k.pos.x - o.w / 2)}, ${fmt(k.pos.y - o.h / 2)}, -1])`);
    L.push(`      cube([${fmt(o.w)}, ${fmt(o.h)}, plate_thickness + 2]);  // ${k.ref} (${REC(k.library)?.description})`);
  }
  for (const e of encoders) {
    const hole = REC(e.library)?.case?.plateHole;
    if (hole === undefined) { warnings.push({ level: "error", message: `encoder record ${e.library} has no plate hole projection` }); continue; }
    L.push(`    translate([${fmt(e.pos.x)}, ${fmt(e.pos.y)}, -1])`);
    L.push(`      cylinder(h = plate_thickness + 2, d = ${fmt(hole)});  // ${e.ref} knob shaft`);
  }
  for (const d of displays) {
    const win = REC(d.library)?.case?.plateWindow;
    if (!win) { warnings.push({ level: "error", message: `display record ${d.library} has no plate window projection` }); continue; }
    L.push(`    translate([${fmt(d.pos.x - win.w / 2)}, ${fmt(d.pos.y - win.h / 2)}, -1])`);
    L.push(`      cube([${fmt(win.w)}, ${fmt(win.h)}, plate_thickness + 2]);  // ${d.ref} window`);
  }
  for (const h of holes) {
    L.push(`    translate([${fmt(h.pos.x)}, ${fmt(h.pos.y)}, -1])`);
    L.push(`      cylinder(h = plate_thickness + 2, d = screw_hole);  // ${h.ref}`);
  }
  L.push(`  }`);
  L.push(`}`);
  L.push(``);
  L.push(`// ── parts: print both, they sit side by side in this render ──────`);
  L.push(`case_bottom();`);
  L.push(`translate([outer_width / 2 + 15, 0, 0]) top_plate();`);
  L.push(``);

  return {
    scad: L.join("\n"),
    params: {
      pcb_width: pcb.outline.width,
      pcb_height: pcb.outline.height,
      case_margin: opts.caseMargin,
      wall_thickness: opts.wallThickness,
      base_thickness: opts.baseThickness,
      corner_radius: opts.cornerRadius,
      front_height: opts.frontHeight,
      rear_height: opts.rearHeight,
      standoff_height: opts.standoffHeight,
      screw_size: opts.screwSize,
      plate_thickness: opts.plateThickness,
    },
    warnings,
    stats: {
      standoffs: holes.length,
      usbWall: usb ? wallName(usb.wall) : "none",
      plateOpenings: keys.length + encoders.length + displays.length,
    },
  };
}

function wallName(wall: "y+" | "y-" | "x+" | "x-"): string {
  return wall === "y+" ? "front (+y)" : wall === "y-" ? "back (-y)" : wall === "x+" ? "right (+x)" : "left (-x)";
}
