# circuitron status audit (nov 5 2026)

> thesis: circuitron is the furthest-along engine in the repo, and its debt is not missing features. the debt is that the generator does not read the fab rules it is checked against, and its only verification authority is itself.

or simply put: the boards build and route cleanly every time, but circuitron decides clearance from its own constants and then grades its own homework. the corpus knows better than that, and so does the protoflow credit sitting unused.

---

## 1. what was run today

all four reference boards generated from `engines/circuitron/test/run.ts`:

| board | keys | nets routed | vias | trace mm | drc |
|---|---|---|---|---|---|
| streamdeck | 27 | 24/24 | 13 | 1262 (approx) | 0 errors |
| ninepad | 14 | 13/13 | 4 | 0 errors logged | 0 |
| hackpad-3key | 8 | 6/6 | 3 | | 0 |
| ninepad-choc | 9 | 11/11 | 9 | 409 | 0 |

also verified in this environment:

- `test/validate.ts`: all 4 kicad_pcb files parse, balanced s-expressions, 0 bad net refs, 0 pad issues
- `test/gerber.ts`: all 4 boards export 10 files each, drill tools and copper flashes cross-check against pad counts
- `test/freeroute.ts`: **skipped**, `FREEROUTING_BIN` unset, so the dsn/ses round trip is unproven here (4 dsn files exist on disk)

scale: 2853 lines of typescript across 17 source files, zero runtime deps. the worker pipeline imports it for real: `generatePcb → generateCase → exportGerbers → buildQmkBundle → renderSvg`, and checkman reads circuitron footprints directly.

## 2. the gaps, ranked by risk

### 2.0 the mcu was hardcoded (closed nov 7 2026)

the netlist pin list, budget arithmetic, bom gpio labels and qmk info.json all named the xiao. now `src/mcu.ts` holds one record per carrier and everything downstream reads it: three boards (xiao rp2040, xiao nrf52840, pro micro) generate the same pad cleanly, with their own pads, power rails and firmware toolchain. see docs/mcu.md. what this does not fix: zmk is still not generated, and battery/charge/power-switch parts are still missing, so wireless is a swap rather than a product.

### 2.1 verification authority is the engine itself

`drc.ts` is circuitron checking circuitron. there is no independent second opinion:

- protoflow (standing instruction: use it for erc/drc/footprint check on mcp credits) is not wired anywhere
- `kicad-cli pcb drc` is not wired either, it appears only in research notes
- no external netlist comparison (kicad eeschema export vs circuitron netlist)

this is the same-engine-grades-its-own-homework problem sculptura avoided by separating generation from validation. two independent checks would catch both engine bugs and discourse drift between drc.ts and the real kicad rule set.

### 2.2 fab rules do not drive generation

routing and stack constants are hardcoded in source:

- `route.ts`: `RES = 0.5` grid, `EDGE_CLEAR = 0.6`, `PAD_CLEAR = 0.35`, `PAD_CORE = 0.18`
- `kicad.ts`: `(thickness 1.6)` fixed, 2-layer stack fixed

the evidence-backed capabilities json in `research/manufacturing/capabilities/` reaches checkman only, after generation. consequence: a jlcpcb board and an osh park board generate identical geometry, and only the post-check report changes. the modularity promise (fab choice is an export-axis choice) holds only as long as every fab's rules sit inside circuitron's hardcoded envelope, which is not stated anywhere.

corpus lines that already know the difference and are going unused by the generator: `evid-jlc-001`, `evid-osh-001`, `evid-ais-001`, `evid-see-001` (trace and spacing minima that differ per fab), `evid-jlc-004` vs `evid-ais-005` (annular ring minima), `evid-jlc-014` / `evid-see-009` (surface finish options).

### 2.3 4-layer is corpus-backed but unsupported

`evid-osh-016` and the jlc capability file carry 4-layer rules. circuitron is 2-layer only. fine as a v1 constraint, but it should be an explicit assumption in the README (with the routing grid and clearance constants) so nobody generates a dense board expecting a 4-layer escape route.

### 2.4 oleds are i2c only

`spi` appears in zero source files. the oled footprint set (including the 1.3in gap flagged in `docs/footprints-research.md`) is treated as i2c. real modules ship in both variants, so a part record claiming spi is silently misrouted or unsupported.

### 2.5 freeroute round trip unproven

dsn export exists for 4 boards; the ses import path exists; neither has been exercised end to end in this environment because the java jar is not installed. that is a one-line environment fix, not an engine fix, but the claim "dsn/ses bridge validated" should stay unclaimed until a ses file comes back into `route.ts`.

## 3. what this means

the pcb front is not neglected. it is ahead of the case side in engine completeness and behind it in one crucial habit: the case side's numbers come from the corpus (checkman margins, print profiles), while the pcb side's numbers come from constants a developer chose. closing that is a small code change (load route constants from the active fab capability record) and a medium verification change (wire protoflow and kicad-cli as an independent gate).

## 4. suggested order

1. load `RES`/`EDGE_CLEAR`/`PAD_CLEAR`/thickness/layer count from the selected fab capability record, defaulting to the current constants (cheap, no behavior change for jlcpcb)
2. wire the protoflow erc/drc/footprint check into the worker after checkman (mcp credits are already allocated for this)
3. exercise dsn/ses with a real freerouting jar and record the round trip in a test
4. add the 2-layer-only assumption to the README's constraint list
5. decide the spi oled question at the part-record level, not the footprint level


## fix landed (nov 5 2026, same day)

the cheapest item from the list is done: circuitron now takes a fab profile
(`src/fab.ts`) and derives the routing floors and drc thresholds from
`research/manufacturing/capabilities/<id>.json`. no fab selected still means
the engine's own numbers. `test/fab.ts` runs all five records against all
four boards, and the matrix immediately paid for itself: our vias were
0.7mm over a 0.35mm drill, a 0.175mm annular ring, under jlcpcb's 0.20
minimum and well under its 0.25 recommendation. vias are 0.85mm now and the
engine drc refuses anything thinner.

protoflow: dropped by anne, not needed for this. kicad-cli: wired as an
optional second opinion (`test/kicad_drc.ts`), server/ci only, skipped when
the binary is absent. the user never needs kicad.

still open: 4-layer, oled spi, freeroute round trip, stackup choice.
