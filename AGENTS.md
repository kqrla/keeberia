# agents.md

rules for any human or coding agent building keeberia. the product spec lives in [scope/product.md](scope/product.md), the manifesto in [scope/vision.md](scope/vision.md). this file is the contract.

## what keeberia is

keeberia is a browser-based visual and parametric design environment for keyboards, macropads, and other physical input devices.

the application is intentionally an abstraction layer over existing hardware design ecosystems. do not turn keeberia into a proprietary replacement for kicad or a generic cad application.

the user should design visually. keeberia should generate the engineering artifacts.

## core principle

there must be one canonical project model. all major representations derive from it:

```text
project model
├── layout
├── components
├── schematic
├── pcb
├── case
└── appearance
```

do not create separate disconnected representations of the same geometry. if a component moves, every dependent representation must be able to derive the new position from the project model.

## workflow

the application has five major views: layout, components, pcb, case, keys + knobs. these are views of one project, not separate projects. users must be able to move between them freely.

always preserve this separation:

```text
layout       = where something is
components   = what something is
pcb          = how it becomes an electronic board
case         = how it is physically enclosed
keys + knobs = how the finished device is interacted with and presented
```

do not collapse all of these into one giant settings panel.

## layout rules

layout is spatial. it should not expose unnecessary electrical or manufacturing information. default grid cells are keys.

users must be able to: select cells, multi-select, drag-select, merge cells, split merged regions, replace regions, move regions, duplicate regions, delete regions, drag components onto the canvas.

important: merging existing cells must preserve the spatial region. cell + cell → merged region → replace with oled. do not require the user to delete the original cells and create a new object manually. the interaction should feel like canva/figma.

## components rules

components resolve abstract layout objects into actual hardware. a component definition may include: physical dimensions, footprint, mounting requirements, clearance requirements, electrical information, connector information, height, plate requirements, case requirements.

users should select components through simple visual controls, with multi-selection editing: select 12 keys → switch = choc v1 → all 12 update. do not make users manually edit every component individually when the property can safely be applied to a selection.

component definitions are data-driven. do not hardcode individual components throughout the ui. a component is reusable metadata that can eventually support a community library (switches, encoders, displays, controllers, leds, connectors, other modules) without rewriting the editor.

## schematic + pcb rules

schematic and pcb output must target native kicad: generate `.kicad_sch` and `.kicad_pcb`. do not invent a proprietary schematic format. the files must be editable after export in kicad. the generator derives symbols, connections, footprints, nets, matrix structure, board outline, mounting holes, and clearances from the project model.

## routing rules

routing is automatic by default. the user should not need to manually route repetitive keyboard matrix connections.

```text
components → nets → matrix → placement → autorouting → validation
```

advanced users may be given access to traces, vias, nets, routing, footprint placement — but advanced pcb editing should not dominate the normal interface.

routing stays deterministic (traceparency): no ai in the copper path.

## pcb shape + silkscreen

shape options: rectangle, rounded rectangle, generated component boundary, custom dxf outline. custom dxf geometry is actual board geometry, not a visual background.

silkscreen (front + back): text, svg graphics, logos, labels — it should feel like a lightweight design canvas.

## cad rules

case generation is parametric. the primary editable source is openscad (`.scad`) — do not make stl the canonical case representation. generated openscad stays readable with meaningful parameters:

```text
pcb_width, pcb_height, case_margin, wall_thickness,
corner_radius, front_height, rear_height, screw_size
```

the user can export the .scad file and continue editing it independently.

case geometry derives from: pcb dimensions + outline, component locations/dimensions/heights, mounting locations, required clearances, selected case style. changing the pcb updates the case; moving an encoder updates its opening; moving a connector updates its cutout.

## preview rules

the browser preview is not the canonical engineering artifact — it is a live representation of the project model. three.js/webgl, supporting 2d, 3d, and exploded view (keycaps → switches → plate → pcb → case), all derived from the same project state. do not maintain a fake preview that can become inconsistent with generated files.

the preview progresses with the flows: layout shows abstract regions, components shows actual components, pcb shows the board, case shows the enclosure, keys + knobs shows the finished device.

## validation

validation is continuous and attached to the relevant object. detect: component outside pcb, insufficient edge clearance, case collision, usb cutout obstruction, encoder/display collision, keycap/case collision, mounting hardware collision.

avoid generic errors ("error 38291"). prefer "the encoder is too close to the case wall."

## portability

portability is a product requirement. never intentionally lock the user into keeberia. target outputs: .kicad_sch, .kicad_pcb, .scad, .dxf, .stl, .3mf, gerbers, bom, cpl. the generated files should be usable outside keeberia.

## architecture principle

keeberia sits above the engineering engines:

```text
project model → kicad schematic / kicad pcb / openscad cad → manufacturing
project model → three.js / webgl → browser preview
```

the engines have names:

- **circuitron** (`backend/engines/circuitron/`) — pcb + schematic generation
- **paracraft** (`backend/engines/paracraft/`) — scad generation: cases now, keycaps + knob covers later

do not replace these engines with proprietary equivalents unless there is a very strong reason.

## data layer

the project model is a dependency graph — every flow is a view of the same object, and "what depends on what" is the product. the backend data layer is a **graph database, not a generic relational store: falkordb** (redis-based, cypher queries). relational tables flatten the relationships the whole product is built on; the graph keeps them first-class.

## ui philosophy

the interface should feel like notion, figma, canva, google docs — not kicad, altium, fusion 360, solidworks.

prefer: visual manipulation, contextual menus, multi-select, property chips, drag and drop, live previews, progressive disclosure.

avoid exposing technical complexity before the user needs it.

## product direction

keeberia starts with macropads because they are a constrained and highly repetitive hardware design problem. do not hardcode the architecture so tightly that the system can never support other physical interfaces. future targets may include keyboards, midi controllers, stream deck-style devices, simulator panels, synth interfaces, custom desktop controllers, maker electronics, accessibility devices, industrial controls, and weird one-off input devices.
