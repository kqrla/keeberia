extracted from kqrla/keeberia-front src/routes/bts.engines.circuitron.tsx, sept 25 2026 — the live site remains the source of truth for this copy.

# circuitron: the pcb engine

circuitron is keeberia's pcb and schematic engine. written in typescript with zero runtime dependencies and no ai anywhere inside it, circuitron converts a keeberia layout model into a fully routed, manufacturable board. the same layout produces the same board on every run.

## engine summary

- role: placement, netlist, routing, design rule checks, bom, silkscreen, and firmware generation.
- thesis: determinism is the feature — no timestamps, no randomness, no leaks from map iteration order. if you send a board to a fab today and regenerate it in a year, the files match.
- pipeline flow: layout json → circuitron → paracraft → exports you can send out.

## six pipeline stages

1. 01 placement: grid cells become real components. switches, mcu, mounting holes and the board outline are derived from where you put things, not from a template board.
2. 02 netlist: direct gpio when there are enough pins, diode matrix when there are not. i2c and encoder budgets are checked before anything is routed.
3. 03 routing: fan-out stubs first, then negotiated-congestion routing on a 0.5mm grid with keepouts and vias. the router is never allowed to leave the board edge.
4. 04 kicad export: a kicad 8 .kicad_pcb file written as s-expressions, openable and editable in kicad if you want to take over by hand.
5. 05 design rule check: pad clearance, shorts, edge violations and unrouted nets. the drc and the router agree on the same edge margin, so they never argue.
6. 06 bom, silkscreen, preview: a parts list you can order from, board labelling, and an svg render of the finished board for the editor to show you.

## export folder artifacts

- keeberia.kicad_pcb (kicad 8 board file)
- gerber layers (front and back copper, mask, paste, silkscreen, edge cuts, drill file)
- bom csv
- board preview svg
- qmk info.json, keymap.c, rules.mk
- vial.json

## regression & validation fixtures

tested continuously against four reference boards:
- hackpad-3key
- ninepad
- ninepad-choc
- streamdeck

every change to the engine must keep producing valid, balanced, fully referenced boards for all four.

## rules we do not bend

- pad geometry lives in exactly one file, verified against kicad official libraries, the hackclub care package and perigoso.
- a new part is footprint-verified against three sources or a datasheet before it is allowed into the library.
- the router stays 0.45mm inside the board edge, and the design rule check enforces the same number.
- output is deterministic: no timestamps, no randomness, no leaks from map iteration order.
