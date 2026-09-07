# keeberia — the manifesto

> verbatim from the author, sept 7 2026 (lives in keeberia-frontend's readme). this is the
> authoritative product spec. the backend serves this, never the reverse.

keeberia is basically me trying to make the process of making a keyboard less annoying.

i've made macropad pcbs + cases before, and while making them is really fun, there is also a very specific point where i'm like

«wait. why am i doing this manually again»

because so much of the process is repetitive.

you have a layout. you place switches. you place their footprints. you make the matrix. you route it. then you go make a plate. then you go make a case. then you add screw holes. then you add standoffs. then you make sure the usb port isn't blocked. then you realize you changed the pcb layout. so now you have to go fix the case. and then you change the switch. and now the clearance is different. and then you have to fix something else.

none of these things are necessarily difficult individually. the annoying part is that the same information keeps having to be translated between different programs and rebuilt manually.

and keyboards are structured enough that a LOT of this could just be generated.

so... why not?

---

## the problem

custom keyboard design currently involves a weird collection of tools that each know about one part of the device: kicad for the pcb, fusion/onshape/openscad for the case, another thing for firmware, another for keycap models, spreadsheets for parts, manufacturer tools for production, random websites for footprints.

the layout knows where the keys are. the pcb knows where the footprints are. the cad file knows where the case is. the keycap knows how tall it is. but they don't necessarily know about each other.

**so the human becomes the middleware.**

which feels kind of silly when the relationships are often extremely predictable.

## the repetitive part

a switch has a footprint. a switch has a known spacing. a 2u key has predictable geometry. an encoder has predictable mounting requirements. a display has predictable dimensions. a usb connector needs a predictable opening. a screw needs a hole. a standoff needs somewhere to go. a case needs clearance around the pcb.

these are not random artistic decisions. **they're relationships.** and computers are very good at relationships.

if i move something, the other things that depend on it should know that i moved it. if i change my switch type, the pcb and case should know that too. if i make my pcb wider, my case should not sit there pretending it didn't happen.

## what keeberia is trying to do

a design environment where you describe the device at a higher level and let the boring/repetitive parts get generated from that.

instead of starting with «place footprint / assign net / route trace / draw wall / cut hole / measure clearance» you start with «i want a 4x4 macropad» then «this is a knob» «these two spaces are an eink display» «these are choc switches» «i want rgb» «i want a weird shaped pcb» «i want a chunky case» — and keeberia figures out how those decisions translate into the actual hardware.

## the five flows

**layout → components → pcb → case → keys + knobs**

they aren't five separate programs. they're five ways of looking at the same device, and you can jump between them whenever you want. change something in components, the pcb and case update. change the pcb shape, the case reacts. change the keycap profile, the 3d preview changes.

**the project is one object. the flows are just different views into it.**

- **01 layout** — the "where does everything go" part. grid presets or blank, drag-select cells, merge/split, right-click to switch a cell between key / encoder / knob / oled / eink / joystick / spacer. two selected cells can become one eink region. deliberately NOT pcb design.
- **02 components** — what everything actually is. notion-ish: select one thing or 12 things, change a property. switch type, mount (solder/hotswap), stabilizers, encoder model, display model, controller, rgb. users never need to know the footprint implementation to choose a component.
- **03 pcb** — the abstract design becomes an actual board. user controls shape, rounded corners, custom dxf outlines, silkscreen, text, graphics, logos, front/back artwork. the repetitive pcb work is generated from component info. advanced users can still expose traces/vias/nets — but nobody making a tiny macropad should have to.
- **04 case** — "probably where the whole idea gets even more useful." cases are: pcb + clearance + walls + mounting + cutouts, parametrically generated. tray mount / sandwich / top mount / integrated plate, wall thickness, pcb margin, front/rear height, typing angle, screw type, heatsets, usb cutout, reset access, feet. if the pcb changes the case changes. if the encoder moves its opening moves.
- **05 keys + knobs** — the fun part. keycap profiles (cherry, oem, dsa, xda, sa, mt3, choc), legends, knob styles, diameter/height, the finished device in the preview.

## the preview

not a thumbnail — the device lives in the middle of the application. 2d view (layout, pcb, silkscreen, dimensions, exact placement), 3d view (case shape, clearances, keycaps, knobs, appearance), and an exploded view: keycaps → switches → plate → pcb → case. the preview is powered by the same underlying project data as the generators — it isn't a pretty fake rendering.

## the part i care about most

mx → choc affects footprint, plate, switch height, keycap clearance, case height. 3x3 → 4x3 affects pcb dimensions, case dimensions, mounting locations, plate, preview. moving an encoder moves its pcb footprint, its case opening, its knob in 3d. **i don't want to manually tell five different programs that i moved something.** that's what the project model is for.

## under the hood

keeberia isn't trying to reinvent every existing hardware tool. it's a layer on top of them:

- pcb → kicad-compatible output, eventually full kicad projects, gerbers, drill files, bom, pick-and-place
- cad → cadquery / parametric geometry, step, stl, dxf
- browser preview → three.js / webgl

```
my design
    ↓
keeberia project model
    ↓
pcb / cad / manufacturing / preview
```

## why start with keyboards

the keyboard ecosystem is already incredibly modular — switches, keycaps, pcbs, plates, cases, encoders, displays, controllers, leds, stabilizers, knobs, cables, artisan parts, diy kits. huge customization is already happening, and yet the actual design workflow is still manual. that's the opportunity.

## and it doesn't have to stay keyboards

a macropad is just one example of a customizable physical input device. the same system could eventually handle midi controllers, stream decks, simulator panels, synth controllers, accessibility interfaces, weird one-off control panels. the common denominator: **inputs + electronics + physical layout + enclosure** — exactly what a parametric system can handle.

## what i want keeberia to feel like

not kicad in a browser. not fusion 360 but worse. not another form with 700 dimensions. it should feel like: «i have an idea for a weird little device» — drag some squares around, turn one into a knob, merge two into a display, pick switches, draw a weird pcb shape, make a case, put stupid little keycaps on it, rotate it in 3d, hit export, get the actual files. the computer handles the boring repetitive relationships, and i spend my time on the parts that are actually fun.
