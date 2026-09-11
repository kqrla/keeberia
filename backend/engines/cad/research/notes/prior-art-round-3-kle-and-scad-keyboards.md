# prior art round three: kle + the scad keyboard universe

research: sept 11 2026 · anne pointed at three repos + attached the genKeyboard scad ecosystem · companion to flow-05-caps-and-viz.md and component-geometry-pipeline.md

## the thesis

three independent systems, built by different people for different reasons, converge on the same data model for keyboards: **keys as relative-unit rectangles with rotation and legends**. kle's json says it, genkeyboard's islands say it, keeberia's grid cells say it. or simply put: the layout layer is a solved problem shape-wise — what keeberia adds is what none of these have, the propagation into pcb/case/caps.

## keyboard-layout-editor (kle) — github.com/ijprest/keyboard-layout-editor

- 1517⭐, javascript web app, license: noassertive on the api (license file not found at master — verify before any code reuse; the json *format* itself is the community interchange standard, and speaking a data format is interop, not copying)
- keys as rows of `{x, y, w, h, r, x2?, ...}` in 1u units with rotation support + legend arrays. the format everyone already speaks: via, kle2kicad, plate generators, case generators
- **what keeberia takes: kle json as the flow 01 import/export target.** users bring their kle layout, keeberia builds the device; the keeberia grid stays the internal format. instant ecosystem access, zero new format invented

## scad-keyboard-cases — github.com/Lenbok/scad-keyboard-cases

- 240⭐, gpl-3.0 → study-don't-copy, patterns only
- the pipeline proof: **kle json → openscad case + plate**, handles rotated keys on split keyboards where existing kle→openscad tools broke
- what it validates: keeberia's flow 01→04 path (layout in, case geometry out) exists in the wild as a manual, per-keyboard affair. ours is parametric, record-driven, and regenerates when anything changes

## keyboard_lib — gitlab.com/alexives/keyboard_lib

- "an openscad library for 3d printing or milling keyboards", structured like a real library: lib/ specs/ examples/ docs/ + docker + gitlab-ci. license in license.md — check before use
- notable: milling is in its headline — a second fabrication lane already in the wild (see stack/tradeoffs.md for our cnc/step revisit trigger)

## genKeyboard — anne's attached ecosystem (filed verbatim)

- three files, filed at `backend/engines/cad/research/reference/genkeyboard/`: the library, a 104-key build, a 2x3 keypad. license unknown — treat as study-don't-copy until anne knows its source
- the strongest flow-05-adjacent prior art yet:
  - **island spec model**: `genIsland(x, y, w, d, kw, kd, txt, spx, sps)` — position, size, *key* size, legends, stabilizer hints in one record. keeberia's cells, said in scad
  - **rows/columns from relative offsets**: `genRow`/`genColumn` walk a spec, accumulating x/y — exactly how keeberia's grid builds placements
  - **base types as an enum**: crosspoint / 6mm tactile / 12mm tactile / three dome types — switch-family→base-geometry mapping, the component-geometry pipeline in miniature
  - **separate printable layers**: base() / springs() / cover() / keys() — a keyboard decomposed into printable strata
  - **`assembled(spec, explode)`** — the exploded view from the manifesto, as a single call
  - **legends as data**: genTxt (font, size, dx, dy) + genSvg (file, size) — the flow 05 legend model
- what it doesn't have: no pcb, no netlist, no propagation. it's a static geometry library; keeberia is a project model. complementary, not competing

## the convergence table (for the product docs later)

| system | layout model | propagation | fabrication targets |
|---|---|---|---|
| kle | relative-unit keys + rotation | none (editor only) | none — feeds other tools |
| scad-keyboard-cases | kle json | manual params per build | print (stl) |
| keyboard_lib | spec files | library-level | print + mill |
| genKeyboard | island records | none (static) | print, layered |
| **keeberia** | grid cells (records) | **full: layout→components→pcb→case→caps** | fab (gerbers) + print (stl/3mf) |

the row that matters is ours. the format that gets us users is kle.
