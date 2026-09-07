# pcb-engine

the deterministic pcb generator. typescript, zero runtime deps. **no ai anywhere in here** — same layout in, same board out, every time.

## pipeline

```
keeberia layout json
  → layout.ts     placement: grid cells → components, mcu, holes, outline bbox
  → netlist.ts    direct-gpio or diode-matrix fallback, i2c/encoder budgets
  → route.ts      fan-out stubs + negotiated-congestion a* (0.5mm grid, keepouts, vias)
  → kicad.ts      kicad 8 .kicad_pcb export (s-expressions via sexp.ts)
  → drc.ts       pad clearance, shorts, edge, unrouted nets
  → bom.ts        bom csv        → silkscreen.ts   → preview.ts (svg)
```

entry: `generateBoard(layout)` → `{ kicadPcb, bom, previewSvg, drc, outline, mode }` (see `src/index.ts`).

## run tests

```bash
cd backend/engines/pcb/pcb-engine
npx tsx test/run.ts        # 3 boards: hackpad-3key, ninepad, streamdeck → out/
npx tsx test/validate.ts   # s-expression balance + net/pad reference checks
npx tsx test/render.ts     # svg renders
```

## source layout

- `src/footprints.ts` — **the only place pad geometry lives**, verified against kicad official / hackclub care package / perigoso. provenance in `../research/`
- `src/types.ts` — layout schema + internal types (FootprintDef, Placement, Net…)
- `test/layouts.ts` — the three reference layouts (hackpad-3key, ninepad, streamdeck); regression fixtures — the autolayout daemon smoke-tests against these too

## rules

- new parts get footprint-verified (three sources or datasheet) **before** entering `footprints.ts`
- the router never gets to leave the board edge (0.45mm inside) — drc and router agree on this
- output determinism is a feature: no timestamps, no randomness, no map-iteration-order leaks
