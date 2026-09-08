# generative openscad — the cad universe research

research: sept 8 2026 · method: firecrawl (smithery skill), github api + raw files (prior art), wikibooks customizer manual, our own case-engine output · for the flow-04/05 cad universe per scope (makerlab-configurator pattern)

## the thesis, first

"generative openscad" for keeberia means **deterministic codegen of parametric scripts** — not llm-authored geometry, not text-to-cad, not rodin-style multimodal mesh generation. the case compiler already proves the shape of it: `backend/engines/cad/case-engine` emits **vanilla, dependency-free, parametric openscad** where every knob the app exposes is a top-level variable ("these are the app's sliders"), board coordinates match the pcb's, and re-rendering with different params is the whole point. traceparency extends to geometry: same project model → same .scad, today and in two years.

that's also our differentiator vs the text-to-cad wave (CADAM, 5.1k⭐, is a well-made llm→openscad app) — their geometry is probabilistic; ours is compiled.

## the customizer protocol — the bridge to makerlab configurators

openscad's customizer is how a parametric script becomes a configurator UI. the syntax (verified against the wikibooks manual):

```openscad
/* [Mounting] */           // tab name
mount_type = "sandwich";   // [tray, sandwich, top, integrated]  ← dropdown
wall_thickness = 3;        // [1:0.5:6]                          ← slider min:step:max
heatsets = true;           // ← checkbox
/* [Hidden] */             // machinery params stay out of the ui
```

**makerworld makerlab configurators consume exactly this.** if the case compiler annotates its emitted params with customizer syntax, every keeberia case is instantly a makerlab-configurable object — the community can remix a keeberia case the way they remix any configurator model, with zero extra work on our side. this is the single highest-leverage addition to the case engine: it's comments, not geometry.

## the pipeline — why xano is the right host

the crucial property: **generating a .scad requires no cad runtime at all.** openscad (the compiler) is only needed to turn a script into a mesh. so:

```
project model
    ↓  case compiler (pure code, no cad runtime)      ← this is the "portable engine" on xano
.scad (customizer-annotated, dependency-free)
    ↓
three render paths, all from the same file:
  a. browser: openscad-wasm (official, 424⭐) — instant 3d preview + local stl export, zero infra
  b. daemon: openscad cli — verified stls, artifacts of record (what we do today)
  c. community: paste the .scad into makerworld/tinkercad/customizer — it just works, no libs to install
```

because the emitted script is dependency-free vanilla openscad (no BOSL2 include), it runs in every environment above with zero setup. that's why we keep it vanilla even though BOSL2 (attachments, rounded boxes, chamfers) is excellent — portability over power for v1. the frontend can later render the wasm preview from the exact script the daemon verifies: the preview is never a fake mockup (manifesto rule), because it's literally the same file.

## prior art teardown

- **gleorepo/Keyboard-Case-Generator** (44⭐) — layout syntax in → plate + case out, for promicro boards. the keeberia flow, done in 2019 by hand-written scad. validates both the demand and that doing it *from a project model* (not a hand-pasted keyPositions string) is the actual step forward. deprecated for a web app — same conclusion we drew.
- **Lenbok/scad-keyboard-cases** (240⭐) — modified + from-scratch openscad keyboard cases, the most-starred case scad repo. confirms the audience.
- **daprice/keyboard_parts** (30⭐) — *a library of switch cutout shapes and layout helpers as scad modules*. this is the cad-side component library concept: the same "pick an ec11, keeberia knows what it requires" promise, in openscad. our flow-04 cutout modules should follow its naming pattern (profile model per switch family).
- **riskable/keycap_playground** (547⭐) — parametric openscad keycap generator "made for generating keycaps of all shapes and sizes (and profiles)". the geometry basis for flow 05: keycap profiles as parametric surface functions (top size, height, curvature class), legends via text. study its parametrization before writing our cap modules — don't guess the geometry.
- **BOSL2** — the standard library (attachments, masks, rounding). deliberately not a dependency for v1 (see portability above); revisit for advanced geometry (chamfers, organic shapes) if we ever vendor it into the emitted script.
- **CADAM** (5.1k⭐) — text-to-cad web app (llm → openscad). the road we're not taking; useful as evidence that script-cad-in-a-browser is a product category people want.
- **smithery/arcade skill: co-labs-co/openscad-3d-modeling** — the "skills.md" reference pattern: overview → CSG concepts (union/difference/intersection + primitives) → render pipeline (preview vs full render) → workflow decision tree → reusable module patterns (hollow box, fillet, bracket) → validation before render. adopt this shape as keeberia's internal case-module authoring skill: modules in that style, always validated (openscad headless render) before a case engine release ships.

## flow 05 geometry notes (keys + knobs)

- keycap profile = parametric family: unit spacing (19.05 pitch, 18/18.5 widths), top dimensions, row height, curvature class (cylindrical vs spherical top). the concrete per-profile numbers should come from keycap_playground's parametrization, not from memory.
- knob styles: cylinder + skirt variants (simple, knurled edge, concave dish), parametric in diameter/height/shaft (ec11 d-shaft: 6mm/7mm, d-cut position) — all vanilla scad.
- legends: `text()` extruded on the cap top; unicode opens the door to the "stupid little keycaps" identity without any special tooling.

## next steps, in leverage order

1. **customizer annotation pass** on the case compiler — emit /* [Tab] */ + [min:step:max] syntax so every keeberia case is makerlab-configurable (comments, not geometry, ~an afternoon)
2. **wasm preview spike** in keeberia-front — same .scad file the daemon verifies, rendered live in the browser
3. **keycap + knob module set** — flow 05, parametrized after keycap_playground's model
4. **cutout library** — switch/encoder/usb cutout modules in daprice/keyboard_parts style, one per component in the flow-02 library
