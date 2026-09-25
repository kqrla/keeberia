extracted from kqrla/keeberia-front src/routes/index.tsx, sept 25 2026 — the live site remains the source of truth for this copy.

# keeberia positioning & voice

keeberia is a spatial hardware design platform that lets users visually create custom keyboards and input devices, then automatically translates those designs into manufacturable pcb, case, and firmware outputs.

## hero & landing copy

- tagline: keeberia. design input hardware, visually.
- subhero: a browser-based design environment for custom macropads, encoder decks, and small keyboards. start with layout and interaction — pcb, case, and firmware are generated behind the scenes.
- badge: v1 · spatial hardware design
- tagline summary: a spatial design environment for custom input hardware.
- in one sentence: keeberia is a spatial hardware design platform that lets you visually create custom keyboards and input devices, then automatically translates those designs into manufacturable pcb, case, and firmware outputs.

### feels like / not like

- feels like (closer to design tools): figma, notion, canva, modular building systems.
- not like (not engineering software): kicad, fusion 360, traditional eda software.

### workflow thesis

instead of electronics → cad → manufacturing, keeberia goes layout → identity → fabrication. how humans actually think about custom devices.

### visual language

abstract symbols, not footprints. you place a "knob", not an "ec11 with 15mm shaft and mounting pads". the translation happens internally.

### what you can build

keeberia starts focused on macropads and small keyboards. the longer-term vision extends to split keyboards, midi controllers, modular desk controllers, and embedded display systems — all built through the same spatial editor.
surfaces: macropads, macro controllers, small keyboards, control surfaces, encoder decks, display-based input.

## philosophy distilled

tagline: interaction first. fabrication is an implementation detail.

most hardware design tools expose manufacturing complexity immediately. keeberia intentionally separates conceptual design from fabrication implementation so users can focus on interaction and form rather than low-level engineering details.

### core principles

1. conceptual before fabrication: users decide what goes where before they ever see a footprint. routing, clearance, and mounting geometry resolve internally.
2. logical vs physical: you edit logical regions and component occupancy. real pcb traces are a later, optional layer.
3. abstract symbols, not engineering: a knob is a circle. a display is a rectangle. visual language reads instantly without ever opening a datasheet.
4. progressive complexity: layout → components → pcb → case → caps. each flow adds detail on top of decisions already made.
5. interaction is the primary surface: drag, select, merge, switch-to. the editor feels like a productivity tool, not cad software.
6. manufacturing is a backend detail: gerbers, step files, firmware — generated from a unified project model, not assembled by hand.

### the translation layer

you place this: "encoder"
instead of this: "ec11 footprint with mounting pads and shaft clearance, matrix net, plate cutout, knob shaft height"
the system internally resolves footprint placement, spacing, routing logic, cutouts, and mounting geometry — so you can focus on interaction and form.

## about & start copy

### about

headline: a spatial design environment for custom input hardware.
overview: keeberia is a browser-based tool for creating custom macropads and small input devices without manually working through traditional pcb or cad workflows from the beginning. instead of starting with electronics software, users start with layout and interaction.

what you build: macropads, macro controllers, small keyboards, custom control surfaces, encoder decks, display-based input devices.

division of labor:
- users define: layout, components, pcb structure, enclosure / case, keycaps & tactile elements
- system generates: pcb layouts, manufacturing-ready exports, plate files, case geometry, firmware configurations

interface philosophy: calm, modular, spatial, visual, and approachable — rather than technical or intimidating. the interface emphasizes soft geometry, contextual actions, drag-and-drop composition, and minimal engineering noise. the goal is to make hardware design feel exploratory and creative rather than procedural.

made for: keyboard makers, macropad enthusiasts, indie hardware designers, studios prototyping control surfaces, people who want to skip kicad, people who think spatially.

### start page

headline: start a macropad. pick a preset to start fast, or start blank and define your own grid.
presets:
- 2 × 2: tiny macropad
- 3 × 3: classic ninepad
- 4 × 4: macro grid
- numpad: 5 × 4 numeric
- streamdeck: 3 × 5 streamer
blank option: custom matrix up to 10 rows by 12 columns.
