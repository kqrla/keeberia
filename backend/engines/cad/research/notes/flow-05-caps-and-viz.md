# flow 05 — caps, knob covers, and the viz that sells it

research: sept 9 2026 · prior art studied, not copied (anne's rule: keeberia is its own flow that works with our front end) · companion to component-geometry-pipeline.md — the cap is the **last projection** of a component record

## the thesis

the caps flow is not a new engine — it's the final projection of the same records. the switch record already knows its family (mx → cross stem, choc → three-prong); the cell knows its row (row → tilt); the profile knows the rest (height, taper, dish). flow 05 composes them into a parametric keycap + knob-cover generator, deterministic openscad codegen, customizer-annotated like the case engine — and the front end renders the same geometry in three.js so the user *sees* their dream macropad before printing it.

or simply put: case flow cuts the holes, cap flow fills them.

## prior art, studied

**nur-modkeys** (nuroctane/nur-modkeys, browser configurator, live at nuroctane.xyz/modkeys — the closest existing thing to keeberia's end product). what it does: three.js preview (orbit/pan/zoom, pmrem environment, soft shadows), 7 keycap profiles with "accurate geometry, dish, and row tilt", colorways, per-key legends, case/plate/switch modeling, exports (kle, svg, pdf). what we take: **its profile data model** — `{ h, taper, dish, tilt[5 rows] }` — and its cap technique (rounded-rect extrusion, tapered by height, dish carved by radial falloff `min(1, nx²+nz²)` on the top region). what we don't take: its code, its scope (it's a configurator for full boards; keeberia generates *your* board). its mobile/desktop dual-shell idea is noted for keeberia-front.

**keycap_playground** (riskable/keycap_playground, 547⭐, parametric openscad keycap generator). **license: none on record** — so nothing gets ported wholesale. the takeaway is the parametrization model, verified against its module defaults: per-profile cap modules with baked-in geometry (dsa: 18.41mm cap, dish .8, top_difference 6.08, key_height 7.39; dcs: 18.15; kat: 18.2, key_height 9.15; kam: 18.3), and a stem system with box_cherry + round_cherry stems, tolerances, side supports. physical values = data, fine to carry with provenance; the scad that turns them into caps is ours.

**mint three.js skills** (mintdotgg/mint-threejs-skills, installed sept 9 to /root/.agents/skills/mint-threejs-skills — skills/ + references/ + scripts/). for keeberia-front's result viewer: three.js is webgl (it's the standard abstraction layer, not an alternative to it), so these apply directly. use when the viewer/wasm-preview spike starts.

## the caps engine, spec'd (next build)

`backend/engines/cad/caps-engine/` mirroring the case engine's shape:

- `generateCaps(pcb, options)` → customizer-annotated .scad + stats + warnings
- inputs from the records: switch family per key (stem type), cell row (profile row tilt), colSpan (cap width in units), encoder cells (knob covers)
- customizer sliders, makerlab style: profile (cherry/oem/dsa/sa/xda — value dropdown), wall thickness, dish override, homing bumps; pcb-derived values under [Hidden] so the cap always matches *its* board
- profiles.ts: the profile data table with provenance comments (keycap_playground defaults cross-checked against nur-modkeys' h/taper/dish/tilt + community spec sheets — values extracted at build time, not from memory)
- knob cover: cylinder with grip ridges + d-shaft bore, driven by the encoder record's plate hole projection
- render-verified like everything else: caps for all reference layouts → stls, propagation check (mx board → cross stems, choc board → choc stems)

## the viz path (keeberia-front)

the same cap/case/board geometry the engine generates gets rendered by three.js in the lovable front end — flow four's wasm preview spike (openscad-wasm) covers the .scad; the three.js skills cover scene composition, materials (pbt roughness vs abs sheen — nur-modkeys' material table is a good reference point), and lighting. what the user sees: their macropad, capped and colored, rotating — never an eda.
