extracted from kqrla/keeberia-front src/routes/bts.engines.paracraft.tsx, sept 25 2026 — the live site remains the source of truth for this copy.

# paracraft: the case engine

paracraft is keeberia's enclosure engine. it compiles a finished board into a printable, parametric enclosure — producing a tray bottom with standoffs and a usb slot, plus a switch plate, as one dependency-free openscad file.

## engine summary

- role: turns the finished pcb into a tray bottom, switch plate, and cutout geometry.
- thesis: component-driven geometry, not example-driven. dimensions come from the parts themselves (usb-c shell at 9.4×3.26mm, ec11 shaft needing 10mm clearance, mx plate opening at 14mm). no measurement is copied from an existing keyboard.
- output files: dependency-free openscad file, case bottom STL, top plate STL (when openscad is present).

## case parts generated

1. 01 case bottom: a tray with a floor and walls, standoffs sitting under the board's own mounting holes, and a usb-c slot cut into the wall nearest the mcu's usb edge. that wall location is worked out from the placement rotation, never hardcoded.
2. 02 top plate: the switch plate with 14mm mx openings, 10mm encoder shaft holes, an oled window where the display sits, and m2 screw holes lining up with the standoffs below.

## configurable parameters (openscad sliders)

the generated scad file exposes named parameters so editor sliders and printed parts cannot drift apart:
- pcb_width
- pcb_height
- case_margin
- wall_thickness
- base_thickness
- corner_radius
- front_height
- rear_height
- standoff_height
- screw_size
- plate_thickness

## validation & human-language checks

validation produces human sentences rather than error codes:
- hard errors stop the job: e.g., "the usb port would breach the case floor. raise the standoff height above 4.3mm."
- warnings ride along: e.g., "this board has no mounting holes, so the case cannot anchor the pcb."
