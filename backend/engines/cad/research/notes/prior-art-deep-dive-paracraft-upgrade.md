# prior art deep dive: what the scad keyboard universe teaches paracraft

deep study: sept 11 2026 · follow-up to prior-art-round-3 · sources cloned to study (not vendored): lenbok/scad-keyboard-cases, alexives/keyboard_lib, ijprest/kle parser logic, anne's genKeyboard files · companion: stack/tradeoffs.md (openscad call), component-geometry-pipeline.md (records→projections)

## thesis

three libraries, three licenses, one lesson: everyone solved *one* slice — layout parsing, case modules, printable strata — and left the connections manual. paracraft's edge is exactly the missing slice. and keyboard_lib (MIT, alex ives 2021) hands us two gifts no one else did: per-family switch modules done right, and a **spec-test architecture** that is the answer to "how do we train the scad engine."

## what each repo actually contains

### alexives/keyboard_lib — gitlab · MIT (code liftable with attribution)

- `lib/switches/{base,mx,choc_v1,footprints,rgb,stabilizers}.scad` — switch families as modules with per-family data: `height_for_style("mx")=5.334`, `"choc_v1"=2.2` (plate-to-pcb), plate `hole=14`. **cross-check these against our component records** — they're independent confirmation values
- `lib/case.scad` + `specs/feature/generated_case/` — **the spec architecture**: every feature (top case, bottom case, plate, pcb outline) has a spec file + a reference artifact (`board_spec.scad.reference.stl`, `top_plate_drawing_spec.scad.reference.svg`) — golden-master testing, in scad, from 2021. this is how a parametric library proves a geometry change didn't silently break a case
- `lib/circuits.scad` — pcb-level modeling in scad (traces as geometry). noted, not adopted: copper is circuitron's domain, forever
- examples: circle_macropad, stabilizer_macro_pad, rotater — non-grid layouts exist in the wild

### lenbok/scad-keyboard-cases — github · gpl-3.0 (patterns only, never code)

- `jsonPositions.py` — the KLE json walk, as a spec to reimplement in TS: rows accumulate x/y; a dict entry sets properties of the NEXT key (`x,y,w,h,r,rx,ry`); output = `[pos, size, [rot_angle, rot_offset]]` triples. KLE rotation is about a pivot point `(rx,ry)` in units — our grid model needs per-cell `rotation` + pivot to speak it
- the scad rotation pattern for rotated keys: `translate(rot_off) rotate() translate(-rot_off)` — about the offset, not the center
- module decomposition worth mirroring in spirit: `switch_hole` vs `case_switch_hole` (plate vs case holes differ), `reset_microswitch`, `mini_usb_hole`/`micro_usb_hole`, `top_plate`/`top_case`/`bottom_case` as separate parametric modules, `tent_support(position, angle, height, lift)` for ergo tenting, and chamfers as first-class params (`chamfer_height, chamfer_width, chamfer_faces` — per-edge control)

### genKeyboard — anne's attached ecosystem (license unknown → study-don't-copy)

- `assembled(spec, expld)` — the exploded view as a single call: each layer (keys/cover/springs/base) lifted by `expld`-scaled z offsets, colors per layer, some flipped 180° to read correctly. the pattern for paracraft's preview module and the manifesto's exploded diagram
- legends as data: `genTxt(txt, font, size, dx, dy)` + `genSvg(file, size, dx, dy)` — the flow 05 legend model, both kinds
- base types as enum (crosspoint/tactile 6+12mm/three dome types) — the component-geometry pipeline in miniature: one record field switches the whole base

### kle format (via the parser — the interchange spec)

- json = array of rows; row entries are a key string OR a dict that modifies the next key. keys carry `x,y,w,h,r,rx,ry` in 1u units, legends, colors
- speaking it = interop with via, kle2kicad, plate/case generators, the whole ecosystem. the license question is only about *code* reuse; a data format is interop

## what's missing in all of them (the keeberia row of the table)

- no propagation: change a switch family in keyboard_lib, nothing tells the case; lenbok's is a manual per-board pipeline
- no netlist, no copper, no fab export anywhere
- layouts are hand-authored data; nothing derives case from pcb from components
- none regenerate when the *source record* changes — the one thing paracraft exists for

## the paracraft improvement plan (ranked, concrete)

1. **the spec suite** (the "training" answer, no ai anywhere): mirror keyboard_lib's architecture in our own form — `backend/engines/paracraft/specs/`, one spec per module (plate, walls, usb, standoffs, caps, knob), each with a reference stl in-repo. the render test becomes a golden-master harness: geometry changes prove themselves against reference artifacts before they land. this is how the engine gets better without getting sneaky
2. **kle.ts in circuitron** (flow 01 interop): `fromKle()`/`toKle()` implementing the walk spec above, plus the layout model gaining per-cell rotation + pivot — grid stays internal, kle json becomes the import/export dialect. unlocks the entire existing-layout ecosystem on day one
3. **case engine v1.1**: chamfers (height/width/per-edge, slider-exposed), reset-access hole module (roadmap flow 04 already lists it), tenting as a future record field, plate-vs-case hole separation audited (lenbok's `switch_hole` vs `case_switch_hole` distinction — our plate openings vs case cutouts may already be conflated somewhere)
4. **exploded view module**: `assembled(layout, explode)` equivalent as a paracraft preview-mode projection — caps/switches/plate/pcb/case stacked with z offsets + per-layer colors. feeds the three.js viewer later; genKeyboard's pattern, our records
5. **legends as data on caps** (flow 05): txt + svg legend records on cells, projected into cap tops
6. **component data cross-check**: keyboard_lib's `height_for_style` values (mx 5.334, choc_v1 2.2) and `hole=14` vs our marbastlib-derived records — independent confirmation or a provenance flag

## update sept 11: the individual files, read properly + the lift policy

### what the genKeyboard files actually teach (beyond the round-3 skim)

- `key(w,d,th,r,...)` — their keycap is a **hull of four sphere∩cube corners**: rounded plate geometry without minkowski. fast, printable, simple — our profile-dished caps are more advanced; the *recipe* is the lesson (cheap fillets via corner-hull, not minkowski)
- `keyCover(w,d,kw,kd,th,r,cl=0.75,...)` — the plate opening carries **clearance as a named param** (cl=0.75mm default). that's anne's fabrication-tolerance principle from the roadmap, parametrized — our plate openings should expose the same
- `keypad-2x3` — **columns compose by bounds**: `genColumn(x=maxx(col1), y=miny(col1), ...)` — layouts built from relative bounds queries, the primitive non-grid boards need
- `keyboard104` — a 104-key board split into **three sections for printable build plates**, plus `preview(hspacing, yspacing)` assembling them side by side. print-bed packing is a real export concern we haven't hit yet (macropads don't need it; keebs will)
- base modules (`keyBaseBtn` bw=6 bh=4.3, `keyBaseDome`) — the tactile/dome family data

### the lift policy (per source, agreed with provenance rules)

| source | license | what we may take |
|---|---|---|
| keyboard_lib (alex ives) | MIT | code liftable with attribution — but prefer **values + architecture**: keep paracraft dependency-free and our own codegen; lifting files drags their conventions in. any code we do take gets a THIRD_PARTY_NOTICES.md entry + in-code provenance |
| scad-keyboard-cases | gpl-3.0 | **zero code, ever** — patterns, module decomposition, and geometry facts only. the kle walk gets reimplemented in TS from the format spec |
| genKeyboard (anne's files) | **unknown — ask anne the source** | study-don't-copy until the origin is known |
| kle format | interop | a data format is interop, not copying. always fine |
| keycap_playground | MIT (owner-confirmed on discord) | values as data with provenance — already doing this |

### the concrete lift list, ranked

1. `height_for_style` values (mx 5.334 / choc_v1 2.2, `hole=14`) → cross-check against our component records; agreement = confirmation, disagreement = provenance flag (data lift, free)
2. the spec-test architecture → our `backend/engines/paracraft/specs/` suite (architecture lift, reimplemented in TS)
3. `cl` clearance param → paracraft plate/case openings get explicit clearance sliders (the roadmap tolerance principle, made parametric)
4. corner-hull fillet recipe → wherever case geometry needs cheap rounding without minkowski cost
5. bounds-based column composition → layout model primitive for non-grid boards (parking lot: splits, keebs)
6. print-bed sectioning → future export concern for full keyboards, noted not built
