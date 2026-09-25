# behind the scenes pages

three new marketing pages that explain how keeberia actually turns a layout into a real object, written from the repo's own engine docs so nothing is invented.

## /bts — behind the scenes

the hub page. what happens after you stop dragging things around.

- opening statement: you design a macropad like a figma file, and a deterministic pipeline turns it into copper, plastic and firmware. no ai in the copper path, same input gives the same board forever.
- the pipeline shown as a single line: layout json → circuitron (board) → paracraft (case and plate) → exports you can send to a factory.
- two large cards linking to the engine pages, each with a lucide icon, a one-line summary and the outputs it produces.
- a short "what you get out" strip: kicad board file, gerbers and drill, bill of materials, svg preview, qmk and vial firmware, openscad and stl case parts.
- a note on determinism and on validation being written in plain human sentences rather than error codes.
- closing call to action into the editor.

## /bts/engines/circuitron — the pcb engine

- headline: layout in, manufacturable board out.
- the pipeline stages as numbered blocks: placement, netlist (direct gpio or diode matrix fallback), routing (fan-out stubs plus negotiated-congestion a star on a 0.5mm grid with keepouts and vias), kicad 8 export, design rule check, bom, silkscreen, svg preview.
- outputs list with the real artifact names.
- a rules section quoting the engine's own guarantees: pad geometry lives in one verified place, new parts get footprint-verified against three sources or a datasheet before entering the library, the router never leaves the board edge, no timestamps or randomness in the output.
- reference boards it is tested against: hackpad-3key, ninepad, ninepad-choc, streamdeck.

## /bts/engines/paracraft — the case engine

- headline: the board becomes an enclosure.
- the two printed parts explained: case bottom tray with floor, walls, standoffs and a usb-c slot cut on the side the mcu actually faces, and the top plate with 14mm mx openings, 10mm encoder shaft holes, oled window and m2 screw holes.
- the parameter block presented as the slider set the configurator exposes: pcb width and height, case margin, wall thickness, base thickness, corner radius, front height, rear height, standoff height, screw size, plate thickness.
- component-driven sizing: dimensions come from part metadata such as the usb-c shell and mx plate opening, not from copying an existing keyboard.
- validation examples written the way the engine writes them, as sentences a person can act on.
- output: one dependency-free openscad file per board, plus stl when openscad is available.

## technical notes

- new route files, flat naming so no extra layout wrapper is needed: `src/routes/bts.index.tsx`, `src/routes/bts.engines.circuitron.tsx`, `src/routes/bts.engines.paracraft.tsx`.
- each page reuses `SiteHeader` / `SiteFooter` and the existing section rhythm from `philosophy.tsx` and `about.tsx`: mono eyebrow labels, `font-display` lowercase headings, alternating `bg-secondary/40` bands, `analog-shadow-sm` cards.
- lucide icons only, no emojis, all copy lowercase, no em dashes.
- add "behind the scenes" and the two engine entries to the "other" dropdown in `src/components/keeberia/SiteChrome.tsx`, under a new group label.
- each route gets its own `head()` with a unique title, description and og tags. no og:image, since there is no absolute hosted image for these pages.
- content only, no backend work and no changes to the editor.
