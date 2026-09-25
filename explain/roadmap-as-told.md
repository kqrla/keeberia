extracted from kqrla/keeberia-front src/routes/roadmap.tsx, sept 25 2026 — the live site remains the source of truth for this copy.

# roadmap as told on site

keeberia's roadmap traces the project's evolution from a macropad layout editor into a full modular human-interface design platform. verbatim copy extracted from src/routes/roadmap.tsx.

## milestones

### shipped · macropad layout editor
- project create modal with presets (2×2, 3×3, 4×4, numpad, streamdeck)
- google-docs-style drag-select grid setup
- default matrix where every cell is a key
- right-click context menu: merge, split, switch to
- abstract symbol rendering: keys, knobs, encoders, oleds

### in progress · flow two — components
- switch type picker: cherry mx, kailh choc, gateron low profile
- encoder model selection (ec11 and friends)
- display modules: 128×32 oled, 128×64 oled, eink
- rgb modes: underglow, per-key, side leds, none
- notion-style multi-select property editing

### next · flow three — pcb
- pcb shape: auto rectangular, rounded, convex hull, custom dxf
- edge controls: corner radius, chamfer, wall clearance
- silkscreen surface: text, labels, svg upload, graphics
- auto matrix routing in the background
- advanced trace + via editing later, off by default

### next · flow four — case
- mount styles: tray, sandwich, top mount, integrated plate
- parametric wall thickness, typing angle, front/rear height
- screw type and heatset insert placement
- usb, reset, and indicator cutouts
- live preview of the housed object

### next · flow five — caps & covers
- keycap profiles: cherry, oem, xda, dsa, sa, choc
- materials: abs, pbt, resin
- legend styles: blank, side, dye sub, transparent
- knob cover styles: aluminum, ribbed, smooth, fluted

### later · manufacturing outputs
- kicad pcb file export
- gerbers, bom, cpl placement files
- qmk / via firmware configuration export
- step + dxf geometry for case and plate

### later · beyond macropads
- split keyboards
- ergonomic keyboards
- modular desk controllers
- midi controllers
- industrial interfaces
- custom tactile devices
- embedded display systems

### later · shared library + community catalog
- publish your components, layouts, and case styles
- remixable templates with attribution baked in
- community switch profiles, encoder packs, knob libraries
