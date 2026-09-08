# keeberia — the manifesto (v2, sept 8 2026)

> verbatim from the author. supersedes the sept 7 version. this is the authoritative
> product spec — the backend serves this, never the reverse. lives in keeberia-front's
> readme in spirit; kept here so the generators can be checked against it.

keeberia
«a visual, parametric way to design custom macropads, keyboards, and other little physical input devices without manually rebuilding the same stuff every single time»

## what is this

> keeberia is basically me trying to make the process of making a keyboard less annoying.
> i've made macropad pcbs + cases before, and while making them is really fun, there is also a very specific point where i'm like
>
> «wait. why am i doing this manually again»
>
> because so much of the process is repetitive.
>
> you make the layout. then you go into kicad. then you place every footprint. then you figure out the matrix. then you route it. then you go into cad. then you make the plate. then you make the case. then you realize the usb cutout is in the wrong place. then you change the layout. then the case is wrong. then you change the switch. then the clearance is different. and somehow we're still manually doing this.
>
> none of these things are necessarily difficult individually. the annoying part is that the same information keeps having to be translated between different programs and rebuilt manually.
>
> and keyboards are structured enough that a LOT of this could just be generated.
>
> so... why not?

## the problem

custom keyboard design currently involves a weird collection of tools that each know about one part of the device: kicad for the pcb, fusion 360 / onshape / openscad for the case, another thing for firmware, another for keycap models, spreadsheets for parts, manufacturer tools for production, random websites for footprints and references.

the layout knows where the keys are. the pcb knows where the footprints are. the cad file knows where the case is. the keycap knows how tall it is. but they don't necessarily know about each other.

**so the human becomes the middleware.** which feels kind of silly when the relationships are often extremely predictable.

## the repetitive part

a switch has a footprint. a switch has a known spacing. a 2u key has predictable geometry. an encoder has predictable mounting requirements. a display has predictable dimensions. a usb connector needs a predictable opening. a screw needs a hole. a standoff needs somewhere to go. a case needs clearance around the pcb.

these are not random artistic decisions. **they're relationships.** and computers are very good at relationships.

if i move something, the other things that depend on it should know that i moved it. if i change my switch type, the pcb and case should know that too. if i make my pcb wider, my case should not sit there pretending it didn't happen.

## so what is keeberia?

keeberia is basically a visual keeb builder. you don't start by staring at a schematic. you start with:

«i want a 4x4 macropad.» — cool, make a grid. then:

- «actually this one should be a knob.» — click it.
- «these two spaces should be an oled.» — select them, merge them, replace them.
- «i want choc switches.» — select them.
- «i want rgb.» — click it.
- «i want a weird custom pcb outline.» — draw/import it.
- «i want a chunky case.» — choose it.
- «give me xda caps and a stupid little knob.» — done.

and then keeberia figures out how all of those decisions relate to each other.

## the important bit: the canvas is editable

one of the biggest parts of keeberia is that components aren't just things you select from a settings form. **the actual layout is the interface.** think canva.

if there are four key spaces on the canvas, i should be able to select both of them, merge them into one region, and say «make this an oled» — and the merged region becomes an oled. no deleting the keys. no manually creating a new rectangle. no going back to a setup screen. **the existing objects on the canvas are the building blocks.**

## layout manipulation

the layout editor should work more like a design tool than a pcb editor:

- click a key
- shift-click multiple keys
- drag-select a region
- merge selected spaces
- split merged spaces
- duplicate components
- move regions
- resize regions where supported
- replace a region with another component
- drag components onto the canvas

select the middle two cells, click merge, then `switch to → oled` — and that region becomes an oled. as natural as selecting two objects in canva and turning them into one thing.

## components aren't locked to the grid

the grid is the starting point, not a prison. a key occupies one unit by default, but the user can turn multiple units into one larger component — a merged oled region, a knob, an eink block spanning several cells. the underlying system still knows the original grid coordinates, but the user interacts with **regions** rather than individual cells.

## the five flows

**layout → components → pcb → case → keys + knobs**

they aren't five separate files or programs. they're five ways of looking at the same device, and you can jump between them whenever you want. change something in components, the pcb and case update. change the pcb shape, the case reacts. change the keycap profile, the 3d preview changes. **the project is one object. the flows are just views into it.**

- **01 layout** — the "where does everything go" part. start from presets (2x2, 3x3, 4x4, numpad, blank) or a google-docs-style grid selector. every space starts as a key. select, merge, split, move, replace. right-click a region for contextual actions (merge / split / duplicate / delete / switch to →). the layout is an editable canvas, not a one-time setup screen.
- **02 components** — what everything actually is. notion-ish: select one thing or 12 things, change a property. switch type, hotswap/solder, stabilizers, encoder model, display model, controller, rgb. the component library provides the engineering information behind the choices — the user doesn't have to know the footprint dimensions. keeberia does.
- **03 pcb** — the abstract design becomes an actual board. user controls: pcb shape, rounded corners, custom dxf outlines, silkscreen, text, graphics, logos, front/back artwork. the repetitive pcb work is generated from the component information. advanced users can still expose traces, vias, nets — but nobody making a tiny macropad should have to.
- **04 case** — "this is where i really want to kill the repetitive cad nonsense." a macropad case is often basically pcb + clearance + walls + mounting + cutouts, so generate the geometry parametrically: tray mount / sandwich / top mount / integrated plate, wall thickness, pcb margin, front/rear height, typing angle, screw type, heatset inserts, usb cutout, reset access, feet. if the pcb changes, the case changes. if the encoder moves, its opening moves. that's the whole point.
- **05 keys + knobs** — the fun part. keycap profiles (cherry, oem, dsa, xda, sa, mt3, choc), legends, knob styles, sizes, the finished device in the preview.

## the preview

not a thumbnail in the corner — the device lives in the middle of the application. 2d view (layout, pcb, silkscreen, case dimensions, exact placement), 3d view (case shape, component clearance, keycaps, knobs, appearance), and an exploded view: keycaps → switches → plate → pcb → case. the preview is driven by the same underlying project model as the actual generators — it shouldn't be a fake mockup that looks right while the generated files are doing something else.

## the part i care about most

mx → choc affects footprint, plate, switch height, keycap clearance, case height. 3x3 → 4x3 affects pcb dimensions, case dimensions, mounting locations, plate, preview. moving an encoder moves its pcb footprint, its case opening, its knob in 3d. **i don't want to manually tell five different programs that i moved something. that's what the project model is for.**

## under the hood

keeberia isn't trying to reinvent every existing hardware tool. it's a layer on top of them:

- pcb → kicad-compatible output, eventually full kicad projects, gerbers, drill files, bom, pick-and-place files
- cad → cadquery / openscad-style parametric generation, step, stl, dxf
- browser preview → three.js / webgl
- firmware → qmk / kmk / rmk config generated from the same project model (comparison in [firmware.md](firmware.md))

```
my design
    ↓
keeberia project model
    ↓
pcb / cad / manufacturing / preview
```

## why keyboards

the keyboard ecosystem is already incredibly modular — switches, keycaps, pcbs, plates, cases, encoders, displays, controllers, leds, stabilizers, knobs, cables, artisan parts, diy kits, 3d printed parts, cnc parts. huge customization is already happening, and yet the actual design workflow still involves a lot of manual work. that's the opportunity.

## and it doesn't have to stay keyboards

a macropad is just one example of a customizable physical input device. the same system could eventually work for midi controllers, stream deck-style devices, simulator panels, synth interfaces, custom desktop controllers, accessibility interfaces, maker electronics, weird one-off control panels.

because the actual abstraction isn't *keyboard*. it's: **a bunch of physical inputs arranged into a device.**

## what i want keeberia to feel like

not kicad in a browser. not fusion 360 but worse. not another form with 700 dimensions. it should feel like: «i have an idea for a weird little device» — drag some squares around, merge two of them, turn that merged space into an oled, turn another one into a knob, pick some switches, draw a weird pcb shape, make a case, put stupid little keycaps on it, rotate it in 3d, hit export, get the actual files.

because if the computer can already figure out the boring, repetitive relationships between all of these parts, i would much rather let it do that and spend my time on the parts that are actually fun.

**and in the end the download is a .zip file :3**
