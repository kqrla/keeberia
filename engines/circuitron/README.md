# circuitron

**circuitron** — the pcb + schematic engine. the deterministic pcb generator. typescript, zero runtime deps. **no ai anywhere in here** — same layout in, same board out, every time.


## fab rules drive the board

the generator's clearances and drc thresholds come from the fab's evidence
record, `research/manufacturing/capabilities/<id>.json`. pass a fab and the
board is generated and checked against that fab's published floors:

```ts
generatePcb(layout, "engine", { id: "jlcpcb", record: jlcpcbJson })
```

rules of the road:

- no fab selected = the engine's own floors, the pre-fab behaviour exactly
- a fab never loosens the engine, only tightens it. route constants clamp to
  engine floors so validated boards do not move silently, while drc
  thresholds take the fab's real published numbers (spacing, edge, trace
  width, via annular ring, plate drills) and the outline is measured against
  the fab's panel window
- the engine stays pure: it never reads files, the caller passes the record
- the first thing this caught: engine vias were 0.7mm over a 0.35mm drill, a
  0.175mm annular ring, under jlcpcb's own 0.20 minimum. vias are now 0.85mm
  (0.25 annular) and the engine drc refuses anything thinner

`test/fab.ts` runs all five fab records against all four reference boards.

## independent verification

`test/kicad_drc.ts` asks `kicad-cli` for a second opinion on the exported
board. it runs on the server/ci image only and skips cleanly when the binary
is absent. nobody using keeberia needs kicad: the browser sends a layout, the
daemon generates, and this gate runs before a human can order the artifacts.


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

entry: `generatePcb(layout, router?, fab?)` → `{ kicadPcb, bom, qmkInfo, result, fab }` (see `src/index.ts`).

## run tests

```bash
cd engines/circuitron
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
