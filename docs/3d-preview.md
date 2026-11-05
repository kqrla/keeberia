# 3d preview: two views, one scene

> thesis: the result viewer shows the same deterministic scene description in
> two framings, board alone and board assembled with its case. the scene comes
> from circuitron as millimetre numbers, the browser draws it with three.js
> and never parses step, and the part bodies come from a prefetched library
> with licenses and hashes on record.

or simply put: numbers for the layout, files for the part bodies, one scene
for both views.

## what the engine emits

`buildScene3d(ctx, result, opts)` in `engines/circuitron/src/scene3d.ts`
returns:

- `board`: width, height, thickness, corner radius
- `components[]`: ref, footprint, side, position, rotation, footprint body
  size, z base and top, `flipZ` for back-side parts, and either a bound model
  reference or `proxy: true`
- `case` (optional): plate thickness, standoff height, wall, the plate's z
  band, and the shell envelope derived from the board outline
- `warnings[]`: any component that fell back to a proxy

z convention: 0 is the board bottom face, the board spans 0 to thickness, a
front-side part's body starts at the top face, back-side parts hang below with
`flipZ` set. everything in millimetres, no exceptions.

## view 1: pcb only

components only, `case: null`. this is the fast view, and it is also the one
that answers "does the encoder clear the oled" for a builder.

## view 2: pcb with case

`case: {}` or explicit numbers. the plate sits on the shared stack facts
(plate thickness and standoff come from the same records paracraft uses), so
this view is the first real visual of the stack: board at the bottom, switches
poking through plate openings, encoder shaft through its bore, shell around
the outline. it is a render of the same numbers checkman measures, not a
second model that can drift.

## asset resolution

1. bound model from `assets/models/manifest.json` (glb mesh plus measured
   bbox), resolved by footprint id through `DEFAULT_MODEL_BY_LIB`
2. proxy box at the recorded footprint size when no model is bound or the
   caller passes no bindings

the engine never reads files. callers load the manifest and pass `models` in,
the same way fab records are passed in.

## why step never reaches the browser

step is a cad interchange format, not a web format. `tools/prefetch-models.ts`
converts step to mesh json with `occt-import-js` at build time and records the
result in the manifest. the viewer loads meshes. the conversion tool is a dev
dependency, never a runtime one, so the engines stay zero-dep and the worker
never converts anything per request.

## open items

- oled modules are proxies until licensed files land (grabcad is manual)
- the model set covers the current footprint library only. usb-c receptacles,
  stabilizers, and keycaps enter when their footprints do
- orientation calibration: models are authored upstream with their own origins
  and axis conventions. the scene builder trusts the bbox for height and the
  footprint for position, but per-model rotation offsets will need a small
  calibration table once the viewer is wired
