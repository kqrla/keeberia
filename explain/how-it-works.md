extracted from kqrla/keeberia-front src/routes/howitworks.flow.tsx, sept 25 2026 — the live site remains the source of truth for this copy.

# how it works: the five flows

keeberia breaks hardware design into five flows, progressing from spatial layout to manufacturable hardware. instead of electronics → cad → manufacturing, keeberia goes layout → identity → fabrication. each flow answers a distinct mental question and increases complexity gradually — the way humans actually think about custom devices.

## overview of the pipeline

1. 01 layout ("where are things?"): pure spatial planning. grids, regions, merges.
2. 02 components ("what are these things?"): switches, encoders, displays, rgb modes.
3. 03 pcb ("what does the board look like?"): shape, edges, silkscreen, auto routing.
4. 04 case ("how is it housed?"): mount style, walls, cutouts, typing angle.
5. 05 caps & covers ("what does it feel like?"): keycap profiles, knob covers, materials, legends.

---

## flow 01 · layout

question: "where are things?"
intro: purely spatial. you place regions on a grid. every cell defaults to a key. no electronics, no footprints — just shape, position, and intent.

capabilities & details:
- default grid where every cell is a key
- drag-select or numeric input to size the matrix
- merge adjacent cells into 2u keys, encoders, displays
- split, resize, duplicate via right-click
- switch any region to a different component type
- abstract symbols: squares for keys, circles for knobs, rectangles for displays

---

## flow 02 · components

question: "what are these things?"
intro: real hardware specs, applied like notion properties. select cells, change types, edit in bulk. nothing about footprints leaks through.

capabilities & details:
- switch types: cherry mx, kailh choc, gateron low profile
- encoders: ec11, low profile, side-mount
- displays: 128×32 oled, 128×64 oled, eink modules
- hotswap or soldered mounting
- rgb: underglow, per-key sk6812, side leds, none
- stabilizers, joysticks, touch strips, sliders
- multi-select property editing across regions

---

## flow 03 · pcb

question: "what does the board look like?"
intro: fabrication structure derived from your layout. shape, edges, silkscreen — the design surface, not a schematic. routing happens for you in the background.

capabilities & details:
- auto shapes: rectangular, rounded, convex hull
- custom dxf outline import
- corner radius and edge chamfer controls
- front + back silkscreen as a design surface
- svg upload, labels, graphics on the board
- matrix routing generated automatically
- advanced trace + via editing later, off by default

---

## flow 04 · case

question: "how is it housed?"
intro: the parametric enclosure. mount style, wall thickness, typing angle, cutouts. live preview as a real object — printable or millable.

capabilities & details:
- tray mount, sandwich, top mount, integrated plate
- wall thickness, margin, typing angle
- front + rear height controls
- screw type and heatset insert placement
- usb, reset, and indicator cutouts
- rubber feet, bumpons, recessed feet
- live preview as a real object

---

## flow 05 · caps & covers

question: "what does it feel like?"
intro: the tactile identity layer. profiles, materials, legends, knob covers. the moment the project becomes a finished product.

capabilities & details:
- profiles: cherry, oem, xda, dsa, sa, choc
- materials: abs, pbt, resin
- legend styles: blank, side, dye sub, transparent
- knob cover styles: aluminum, ribbed, smooth, fluted
- diameter, height, indicator line
