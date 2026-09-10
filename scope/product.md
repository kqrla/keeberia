# product — what keeberia is and what its parts are

> the canonical product description, from anne (sept 7, 2026). this file defines the five flows, the parts, and the rules that must not be compromised. the manifesto lives in [vision.md](vision.md); this is the working spec.

## why keeberia exists

i've made macropad pcbs and cases before.

the actual designing part is fun.

the repetitive translation between tools is not.

you make a layout, then recreate that layout in kicad. you place footprints. you make the matrix. you route it. then you go into cad and recreate the board shape. then you make the plate. then you make the case. then you add mounting holes and usb cutouts. then you change something about the pcb and suddenly the case is wrong too.

and a lot of this is not novel engineering.

a switch has a known footprint. a key has a known spacing. an encoder has known dimensions. a display has known dimensions. a screw needs a hole. a case needs clearance around the pcb.

these relationships are predictable enough that software should be able to handle them.

the problem is that the information is currently scattered across different tools, so the person making the device becomes the thing keeping everything synchronized.

keeberia is meant to remove that repetitive middle layer.

## the idea

keeberia is a visual design environment sitting above real hardware design and manufacturing tools.

the user should be able to think:

> i want a 4x4 macropad

then:

> make this one a knob
> merge these two spaces and make them an oled
> use choc switches
> add per-key rgb
> give me this weird pcb outline
> make the case thicker
> use xda keycaps

and have all of those decisions propagate through the rest of the design.

the user should not have to manually recreate the same information in five different programs.

## keeberia is not trying to replace everything

keeberia should not become "kicad but in a browser" or "fusion 360 but worse."

the goal is to provide a much nicer high-level interface and use existing, portable formats underneath it:

```text
keeberia  = the design interface + parametric project model
kicad     = the actual schematic + pcb engineering format
openscad  = the actual parametric cad source
three.js / webgl = the browser preview

keeberia connects them. it does not trap them.
```

## the five design flows

keeberia is one project with five different views into the same device:

```text
layout → components → pcb → case → keys + knobs
```

these are not five separate files. changing something in one flow should update the parts of the project that depend on it.

- **layout** — *where does everything go?* grid presets or blank start (table-picker vibes), every cell a key by default, merge cells into regions and replace a region with an oled without deleting anything. feels like canva/figma, not cad.
- **components** — *what are these things?* abstract regions get hardware identities: key → cherry mx / choc v1, circle → ec11, merged region → 128x64 oled. notion-like property controls, multi-select chips: select 12 keys, change their switch type once. the library carries the engineering metadata.
- **pcb** — *how does this become a real board?* shape (rectangle, rounded, convex hull, custom dxf), silkscreen as a design surface (text, logos, svg — keyboard people care deeply about pcb aesthetics), and keeberia handles the repetitive implementation: footprints, nets, matrix, routing, validation. autorouting is the default; traces/vias are an advanced layer.
- **case** — *how do i physically house this thing?* parametric and pcb-aware: pcb resizes → case reacts, encoder moves → its opening moves. configurable style, walls, margin, typing angle, mounting, screw size, heatsets, usb cutout, feet. the source is readable openscad with named parameters (pcb_width, wall_thickness, ...), plus stl/3mf/dxf exports.
- **keys + knobs** — *what does the finished device look and feel like?* keycap profiles (cherry, oem, xda, dsa, sa, choc), materials, legends, knob styles/diameter/height. changing a profile changes the actual preview.

## the cad universe (cases are just the beginning)

the case compiler is the first cad generator, not the last. the same parametric openscad approach ultimately covers:

- **cases** — v0 done: trays, standoffs, usb cutouts, switch plates
- **keycaps** — generated, printable caps in standard profiles and custom colors/legends, parametric like everything else
- **knob covers** — encoder caps in styles, diameters, heights, matched to the board's colorway
- **artisan bespoke keycaps** — custom-requested, commission-style: a user describes or picks a theme, keeberia generates a printable (or printable-then-castable) bespoke cap for their build. the artisan keycap scene is commission/raffle-driven today; a generator that turns "make me a matching cap" into files is the keeberia move

keeberia is a canva-esque builder for the whole macropad/keyboard universe: layout → components → pcb → case → caps + knobs + covers, one project model underneath.

## the preview

persistent across the application — not a preview button, the live representation of the project. three.js/webgl, driven by the same project model that drives the engineering files. 2d (layout, outlines, silkscreen, exact placement), 3d (clearance, case geometry, keycaps, finished device), exploded view (keycaps → switches → plate → pcb → case).

the preview should not be a fake representation separate from the actual generated design.

## one source of truth

the most important technical idea in keeberia is the project model: one representation of the device from which everything else is derived.

```text
keeberia project
        |
   ┌────┴────────────┐
   ↓      ↓          ↓
schematic  pcb       cad
 (kicad)  (kicad)  (openscad)
   \       |        /
    └──────┼───────┘
           ↓
     preview engine (three.js/webgl)
```

if something changes, the dependent representations update. do not maintain separate unrelated copies of the same geometry.

## version history

canva and figma got this right and keeberia needs it too: every project has version history. save a version before a big change, restore when it goes wrong, diff two versions to see what moved. a version is a snapshot of the whole project model — layout, components, pcb, case, keys, all of it — never a partial export. the graph data layer (falkordb) stores versions as graph snapshots, so "what changed between these two" is a traversal, not a table join. forked designs carry the history of the board they forked.

## portability is a feature

a user's design should never be trapped inside keeberia. a complete project should be exportable as: keeberia project, kicad schematic, kicad pcb, openscad case, dxf plate/outline, stl/3mf geometry, gerbers, bom, cpl, firmware configuration.

the user should be able to take those files somewhere else and continue: edit the pcb manually, modify the cad, send files straight to a manufacturer, put the project on github, fork someone else's design.

keeberia should make that easier, not harder.

## why start with keyboards

keyboards are extremely modular, with established ecosystems around switches, keycaps, pcbs, plates, cases, encoders, displays, controllers, leds, stabilizers, knobs, cables, diy kits, 3d printing, cnc manufacturing. many parts have known dimensions, footprints, standards, and relationships — unusually suitable for parametric automation.

## the bigger idea

keeberia is not really about keyboards. it's about making custom physical interfaces easier to design. a keyboard is just a very good first place to start. the same architecture eventually applies to macropads, midi controllers, stream deck-style devices, simulator panels, synth interfaces, custom desktop controllers, maker electronics, accessibility devices, industrial controls, weird one-off input devices.

## the thesis

if a design process contains a huge amount of predictable, repetitive work, we should probably automate the repetitive part.

not every hardware problem can be automated. not every keyboard is simple. and advanced users should always be able to take control.

but there is a massive difference between *automating the engineering decisions that actually require expertise* and *making someone manually reproduce the same known geometry for the hundredth time.*

keeberia is for the second one.

the goal is simple: have an idea for a little physical device, build it visually, and let the computer deal with the boring parts.
