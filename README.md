# keeberia ☆.ᐟ

> a visual, parametric way to design custom macropads, keyboards, and other little physical input devices without manually rebuilding the same stuff every single time»

## what is this

keeberia is basically me trying to make the process of making a keyboard less annoying. <br>
for context, i loooove keyboards, and i've made end-to-end macropad pcbs + cases before, and while making them is really fun, there is also a very specific point each type where i'm like *"ugh. there's got to be a better way than this"* because so much of the process is repetitive, which, my adhd be damned, feels like walking on legos to me. i mean, come on, we

- have a layout.
- place switches.
- place their footprints.
- make the matrix.
- route it.
- then you go make a plate.
- then you go make a case.
- then you add screw holes.
- then you add standoffs.
- then you make sure the usb port isn't blocked.
- then you realize you changed the pcb layout.
- so now you have to go fix the case.
- and then you change the switch.
- and now the clearance is different.
- and then you have to fix something else.

none of these things are necessarily difficult individually. the annoying part is that the same information keeps having to be translated between different programs and rebuilt manually.

and keyboards are structured enough that a LOT of this could just be generated.

so... why not?

---

## the problem

custom keyboard design currently involves a weird collection of tools that each know about one part of the device.

you might use:

- kicad for the pcb
- fusion 360 / onshape / openscad / etc. for the case
- another thing for firmware
- another thing for keycap models
- spreadsheets for parts
- manufacturer tools for production
- random websites for component footprints and references

and then somehow the person making the keyboard is responsible for making sure all of those things agree with each other.

- the layout knows where the keys are.
- the pcb knows where the footprints are.
- the cad file knows where the case is.
- the keycap knows how tall it is.

but they don't necessarily know about each other.

so the human becomes the middleware.

which feels kind of silly when the relationships are often extremely predictable.

---

## the repetitive part

this is the part that really bothers me.

- a switch has a footprint.
- a switch has a known spacing.
- a 2u key has predictable geometry.
- an encoder has predictable mounting requirements.
- a display has predictable dimensions.
- a usb connector needs a predictable opening.
- a screw needs a hole.
- a standoff needs somewhere to go.
- a case needs clearance around the pcb.

these are not random artistic decisions.

they're relationships.

and computers are very good at relationships.

- if i move something, the other things that depend on it should know that i moved it.
- if i change my switch type, the pcb and case should know that too.
- if i make my pcb wider, my case should not sit there pretending it didn't happen.

---

## what keeberia is trying to do

keeberia is a design environment where you describe the device at a higher level and let the boring/repetitive parts get generated from that.

instead of starting with:

*"place footprint + assign net + route trace + draw wall + cut hole + measure clearance"*

you start with:

*"i want a 4x4 macropad"*

then:

- «this is a knob»
- «these two spaces are an eink display»
- «these are choc switches»
- «i want rgb»
- «i want a weird shaped pcb»
- «i want a chunky case»

and keeberia figures out how those decisions translate into the actual hardware.

---

# the five flows

keeberia is split into five major design flows.

they aren't meant to be five separate files or five completely separate programs.

they're five ways of looking at the same device.


```
layout
  ↓
components
  ↓
pcb
  ↓
case
  ↓
keys + knobs
```

but you can jump between them whenever you want.

- if you change something in components, the pcb and case should update.
- if you change the pcb shape, the case should react.
- if you change the keycap profile, the 3d preview should change.

the project is one object. the flows are just different views into it.

---

## the first flow — layout

this is the "where does everything go" part.

you can start with something like:

- 2x2
- 3x3
- 4x4
- numpad
- blank

or start blank and use a google-docs-style grid selector.

once you're in the editor, every space starts as a key.

```
□ □ □ □
□ □ □ □
□ □ □ □
```

you can drag-select cells, merge them, split them, or right click them and do something like:

```
switch to →
    key
    encoder
    knob
    oled
    eink
    joystick
    spacer
```

so if i select two cells and turn them into an eink display, keeberia knows that those two cells are now one physical region.

this stage is deliberately not pcb design.

i just want to figure out the shape and arrangement of the device first.

---

## the second flow — components

now we figure out what everything actually is.

the layout might know that something is a key.

components tells keeberia:

- "okay, this is a cherry mx switch"
- "this is a kailh choc v1"
- "this is an ec11 encoder"
- "this is a 128x64 oled"

this is where you choose things like:

- switch type
- hotswap / solder
- stabilizers
- encoder model
- display model
- controller
- rgb
- other hardware

the ui should feel very notion-ish here.

select one thing, or select 12 things, then change a property.

for example:

```
switch

[ cherry mx ]
[ choc v1 ]
[ choc v2 ]
[ gateron low profile ]
```

then:

```
mounting

[ solder ]
[ hotswap ]
```

then:

```
rgb

[ none ]
[ per-key ]
[ underglow ]
```

and if i select every key, i should be able to change all of them at once.

the important part is that users don't have to know the footprint implementation just to choose a component.

if i choose an ec11, keeberia should know what an ec11 requires.

---

## the third flow — pcb

this is where the abstract design becomes an actual board.

the user should be able to control things like:

- pcb shape
- rounded corners
- custom dxf outlines
- silkscreen
- text
- graphics
- logos
- front/back artwork

but i don't want the first experience to be:

"congratulations, here are 900 traces"

the repetitive pcb work should be generated from the component information.

keeberia already knows:

- where the switches are
- what switches they are
- where the encoder is
- what encoder it is
- where the display is
- what controller is being used

so it should be able to use that information to generate the pcb structure.

advanced users can still expose traces, vias, nets, etc.

i just don't want every person making a tiny macropad to have to manually deal with everything.

---

## the forth flow — case

this is probably where the whole idea gets even more useful.

cases are so repetitive.

a lot of them are basically some variation of:

```
pcb
+
clearance
+
walls
+
mounting
+
cutouts
```

so instead of manually modeling the whole thing every time, keeberia should generate the geometry parametrically.

you choose things like:

- tray mount
- sandwich
- top mount
- integrated plate
- wall thickness
- pcb margin
- front/rear height
- typing angle
- screw type
- heatset inserts
- usb cutout
- reset access
- feet

and the case updates.

- if the pcb changes, the case changes.
- if the encoder moves, its opening moves.
- if the usb moves, the cutout moves.

that's the whole point.

---

## 05 — keys + knobs

and then we get to the fun part.

this is basically:

«okay now make the thing look and feel how i actually want it to»

choose keycap profiles:

- cherry
- oem
- dsa
- xda
- sa
- mt3
- choc

choose legends. choose knob styles. change knob diameter/height.

and see the actual finished device in the preview.

---

## the preview

the preview is not just some little thumbnail in the corner.

i want the device to basically live in the middle of the application.

there should be a 2d and 3d view.

2d is useful for:

- layout
- pcb
- silkscreen
- case dimensions
- exact placement

3d is useful for:

- case shape
- component clearance
- keycap profiles
- knobs
- overall appearance

and then there can be an exploded view:

```
keycaps
↓
switches
↓
plate
↓
pcb
↓
case
```

so you can actually see how the thing goes together.

the preview should be powered by the same underlying project data as the generators, so it isn't just a pretty fake rendering.

---

## the part i care about most

keeberia should understand that these things are related.

if i change:

```
mx → choc
```

that can affect:

- footprint
- plate
- switch height
- keycap clearance
- case height

if i change:

```
3x3 → 4x3
```

that can affect:

- pcb dimensions
- case dimensions
- mounting locations
- plate
- preview

if i move an encoder:

- its pcb footprint moves
- its case opening moves
- its knob moves in 3d

i don't want to manually tell five different programs that i moved something.

that's what the project model is for.

---

## under the hood

**autorouting is a two-rung ladder.** rung one is circuitron's own a* router — fast, in-process, deterministic. when a board is too dense for it, the worker escalates to [freerouting](https://freerouting.org) (open source, battle-tested push-and-shove) through a dsn/ses bridge: the board exports to specctra dsn at kicad's exact conventions, freerouting routes it headless, and the ses session imports back into the engine's own segment/via model — then judged by the same drc as the engine's routes. wire it up with `FREEROUTING_BIN` (jar or binary) and optional `FREEROUTING_JAVA` + `FREEROUTING_TIMEOUT_MS`; the rung is skipped cleanly when unset.

**all rendering happens on the viewer's hardware.** previews are client-side webgl/three.js computed from the same project model the generators consume — the server never touches a gpu.


keeberia isn't trying to reinvent every existing hardware tool.

it's more like a layer on top of them.

for pcb generation, the target is kicad-compatible output and eventually things like:

- kicad projects
- gerbers
- drill files
- bom
- pick-and-place files

for cad:

- openscad (parametric, printable — the tradeoffs are on record in [backend/engines/cad/stack/tradeoffs.md](backend/engines/cad/stack/tradeoffs.md))
- stl
- 3mf
- dxf

for the browser preview:

- three.js / webgl

the idea is basically:

```
my design
    ↓
keeberia project model
    ↓
pcb / cad / manufacturing / preview
```

rather than manually keeping all of those things synchronized.

---

## why start with keyboards?

because this is a really good problem to attack with software.

the keyboard ecosystem is already incredibly modular.

you have:

- switches
- keycaps
- pcbs
- plates
- cases
- encoders
- displays
- controllers
- leds
- stabilizers
- knobs
- cables
- artisan parts
- diy kits
- 3d printed parts
- cnc parts

people are already designing and buying all of these things.

there's a huge amount of customization happening.

and yet the actual design workflow still involves a lot of manual work.

that's kind of the opportunity.

---

## and it doesn't have to stay keyboards

the more i think about it, the less this is really a "keyboard tool."

a macropad is just one example of a customizable physical input device.

the same system could eventually work for:

- midi controllers
- stream deck-style devices
- simulator panels
- synth controllers
- custom desktop controllers
- accessibility interfaces
- maker electronics
- weird little one-off control panels

the common thing is basically:

```
inputs
+
electronics
+
physical layout
+
enclosure
```

which is exactly the kind of thing a parametric system can handle.

---

## what i want keeberia to feel like

- not kicad in a browser.
- not fusion 360 but worse.
- not another form where i have to enter 700 dimensions.

i want it to feel like:

"i have a weird little device idea"

and then i can just start making it.

- drag some squares around.
- turn one into a knob.
- merge two into a display.
- pick some switches.
- draw a weird pcb shape.
- make a case.
- put stupid little keycaps on it.
- rotate it in 3d.

then eventually hit:

export

and get the actual files needed to build the thing.

because if the computer can already figure out the boring, repetitive relationships between all of these parts, i would much rather let it do that and spend my time on the parts that are actually fun.
