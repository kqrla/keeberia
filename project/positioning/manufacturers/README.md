# manufacturers positioning

(positioning notes for manufacturers. seed content lands with the keeberia-front copy extraction and the partners research.)

## seed copy from keeberia-front

extracted from kqrla/keeberia-front src/routes/about.tsx, bts.index.tsx, bts.engines.circuitron.tsx, bts.engines.paracraft.tsx, sept 25 2026.

- system generates: pcb layouts, manufacturing-ready exports, plate files, case geometry, firmware configurations.
- manufacturing outputs: kicad pcb file export; gerbers, bom, cpl placement files; qmk / via firmware configuration export; step + dxf geometry for case and plate.
- real files, not a rendering: kicad_pcb board file, gerber set + drill file, bom csv, svg board preview, qmk keymap and rules, vial json, openscad case source, stl case parts.
- determinism is the feature: no timestamps, no randomness, no ordering that shifts between runs. if you send a board to a fab today and regenerate it in a year, the files match.
- component-driven geometry: dimensions come from the parts themselves (usb-c shell 9.4×3.26mm, ec11 shaft 10mm clearance, mx plate opening 14mm).
- validation checks: pad clearance, shorts, edge violations, unrouted nets; human-language warnings (e.g. standoff height vs usb port floor clearance).
