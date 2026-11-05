# component models: prefetched bodies for the 3d viewer

> thesis: the engines generate geometry from numbers, so nothing in the
> pipeline needs these files to build a board. they exist so the result
> viewer can show real part bodies in the two 3d views (pcb only, pcb plus
> case) without a network round trip at render time and without the browser
> ever parsing step. every file carries its source repo, license, and sha256.

or simply put: these are what the parts look like when you want to show one.

## what lives here

- `step/` vendor step files, one per part, as authored upstream
- `glb/` the same geometry converted to mesh json at prefetch time (positions
  and indices, mm), which is what a three.js viewer uploads
- `manifest.json` the ledger: id, label, file, bytes, sha256, bounding box
  measured from the real geometry, source repo, license, and which circuitron
  footprints use it

the bounding boxes are not estimates. they are measured from the vendor mesh,
so the scene builder's z offsets and clearances come from the actual part.

## licensing

three tiers, and the manifest records which one each model is in:

1. **scriptable, permissive**: foostan/kbd (mit) covers mx and choc switch
   bodies, both hotswap sockets, the ec11/ec12 encoder, and the xiao module.
   these are checked out of one repo and refreshed by the prefetch script.
2. **kicad libraries**: kicad-packages3d is cc-by-sa 4.0. usable with
   attribution in the manifest. the keyboard switch 3d shapes are not shipped
   upstream (see `backend/cad/research/models/README.md` for the hunt that
   found this), which is why foostan/kbd is the primary source.
3. **grabcad, manual**: grabcad has no api, needs a session to download, and
   licenses vary per upload. those entries sit at `status: "manual"` with the
   license recorded before first use, and the model gets dimension-checked
   against the datasheet before any record references it. the script refuses
   to fetch from hosts outside its allowlist, so nothing lands here unvetted.

## refreshing

```
npx tsx tools/prefetch-models.ts --verify   # hash + step magic check
npx tsx tools/prefetch-models.ts --build    # step to glb, updates manifest
```

`occt-import-js` is the converter. it is a tool dependency only: the engines
stay zero-dep and the worker never converts anything at request time.

## known gaps

- `oled_128x32_091` and `oled_128x64_13` render as proxies until a licensed
  file is pulled. the 1.3 inch footprint also still lacks a downloaded
  original (flagged in docs/footprints-research.md), so fix that first.
