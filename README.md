# keeberia

«a visual, parametric way to design custom macropads, keyboards, and other little physical input devices without manually rebuilding the same stuff every single time»

custom keyboard design currently involves a weird collection of tools that each know about one part of the device — kicad knows the pcb, fusion knows the case, a spreadsheet knows the parts, some website knows the footprints — and somehow the person making the keyboard is responsible for making sure all of those things agree with each other.

or simply put, the human becomes the middleware. the layout knows where the keys are, the pcb knows where the footprints are, the cad file knows where the case is, but none of them know about each other, so every time something moves you translate the same information between five programs by hand. and keyboards are structured enough that a lot of this could just be generated. so... why not?

## the actual abstraction isn't keyboard

a switch has a footprint. a switch has a known spacing. a 2u key has predictable geometry. an encoder has predictable mounting requirements. a display has predictable dimensions. a usb connector needs a predictable opening. a screw needs a hole. a standoff needs somewhere to go. a case needs clearance around the pcb.

these are not random artistic decisions — **they're relationships**, and computers are very good at relationships. that's why the system won't stay keyboards: midi controllers, stream decks, sim panels, synth interfaces, accessibility interfaces, weird one-off control panels. the common abstraction is *a bunch of physical inputs arranged into a device.*

## the canvas is the interface

you don't start by staring at a schematic. you make a grid, then select two cells, merge them, and say «make this an oled» — and the merged region becomes an oled. click another one and it's a knob. select every key, switch mx → choc. the existing objects are the building blocks; the grid is the starting point, not a prison. notion-ish property editing, canva-ish manipulation, never a form with 700 dimensions.

five flows — **layout → components → pcb → case → keys + knobs** — but they're five ways of looking at the same device, not five separate programs. change mx → choc and the footprint, plate, switch height, keycap clearance, and case height all know. move an encoder and its pcb footprint, case opening, and 3d knob move together. the project is one object. the flows are just views into it.

## traceparency

we started from a simple position: **the copper path is not creative work.** routing a macropad is deterministic transformation of intent, closer to a compiler than a collaborator — and every ai-authored pcb tool treats it as a generation problem, which means boards ship with artifacts nobody can explain.

keeberia instead compiles. a layout is source code, the pcb is the binary, the engine is the compiler. the same layout always compiles to the same board, today and in two years. no ai in the copper path, ever — it sits one layer out, at verification (protoflow may veto a board; it can never draw one). we call this **traceparency**: nothing in the copper path is generated, guessed, or probabilistic, so every trace has a reason you can point to in the pipeline.

## the loop (live today)

```
keeberia-front (lovable)      the canvas: five flows, 2d/3d preview, the device front and center
   │  design a device — figma vibes, zero eda concepts
   ▼
xano api                     validate + queue the job (POST /generate → design_jobs)
   ▼
autolayout daemon            claims the job, runs the engines, persists every artifact
   │   pcb engine — placement → netlist → fan-out → negotiated-congestion routing → kicad 8
   │   case compiler — pcb result → parametric openscad → verified stls
   │   fab exports — rs-274x gerbers + excellon drills, validated on all reference boards
   ▼
protoflow                    drc/erc + footprint cross-check on exported boards (verification only)
   ▼
back to the website          preview, bom, case, firmware config (qmk / kmk / rmk) —
                             and in the end the download is a .zip file :3
```

job #4 ran this end to end: 17 artifacts, gerbers through drills, one queue round trip.

## repo

```
backend/
  engines/pcb/
    pcb-engine/    the pcb compiler: layout → netlist → routing → kicad 8 + gerbers (ts)
    pcb-engine/fab/ gerber + excellon export, stroke-font silk
    case/          the case compiler: parametric openscad from pcb results
    research/      footprint geometry + firmware + community research, verified with provenance
  daemons/
    autolayout/    the worker: xano queue → engines → artifacts, with a retry ladder
  xano/            deployed xanoscripts + the deploy gotchas (live state, versioned)
scope/
  product.md       the canonical product spec — five flows, the build contract
  vision.md        the manifesto, verbatim
  firmware.md     qmk / kmk / rmk comparison (decision pending)
  versions/        v0 (done) · v1 (micropad mvp) · v2 (keebs later)
  roadmap.md       the five flows mapped to versions + standing decisions
```

- **frontend** — keeberia-front (lovable app, layout-to-device)
- **journal** — [journal.md](journal.md), the build log (failures included)
- **spec** — [scope/product.md](scope/product.md) + [scope/vision.md](scope/vision.md)
- **decisions** — [scope/roadmap.md](scope/roadmap.md)

## inspired by

sibling of *sculptura* — same belief that tools should dissolve into the work, same build-in-public journal, same lowercase energy. indebted to the hack club care package, the hackpad parts ecosystem, and every keyboard person who ever posted a board file so the next person didn't have to start from zero.
