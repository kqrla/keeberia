# keeberia roadmap

> micropads first, keebs later. one flow perfect end to end before the next. the five flows: **layout → components → pcb → case → caps/knob covers.**

## where we are

**v0 done** (see [versions/v0.md](versions/v0.md)) — deterministic pcb engine routes three test boards clean and exports kicad 8. engine lives at `backend/engines/pcb/pcb-engine/`.

## phase map

| flow | v0 | v1 | v2 |
|---|---|---|---|
| 1. layout grid | engine-side format | lovable frontend wired | stabilizers, spans |
| 2. components (switch/knob/oled) | footprints + netlist verified | full component picker | choc properly, per-key rgb |
| 3. pcb (shape, silk, hidden routing) | deterministic routing + drc + kicad export | xano api + autolayout daemon + gerbers | bigger matrices, splits |
| 4. case | — | openscad generator (stl/step) | keeb cases, plates |
| 5. caps + knob covers | — | knob covers minimum | keycap/cover configurator |

## immediate (blocked → unblock → build)

0. **protoflow verification harness** — open each of the three v0 boards in protoflow (mcp), run its drc/erc, cross-check footprints against its part library. three green boards from a second opinion = v0 truly done
1. ~~unblock xano~~ — done (sept 7): `design_jobs` + `POST /generate` + `GET /job` live
2. ~~autolayout daemon~~ — done (sept 7): portable worker behind a queue interface, xano-rest transport, render.com blueprint. job #1 went queued → done end to end with artifacts
3. **freerouting bridge** — the deterministic autorouting partner: engine emits placement + netlist as dsn, freerouting routes headless (java, render/amd — not xano), ses applies back to the board. until it lands, the engine's own a* router stays the v1 router and retry-ladder fallback
4. **gerber + excellon export** — jlc-orderable output is the v1 bar; kicad_pcb alone doesn't order a board
5. **case generator** — openscad + slider-based configurator controls (makerworld makerlab vibes) from engine output (outline + part heights); print test on the a1 mini
6. **frontend wiring** — job flow + webgl result viewer (board + case), notion/canva vibes strictly enforced

## standing decisions (don't re-litigate)

- no ai in the copper path. ever. protoflow is the ai one; keeberia is the deterministic one — but protoflow **stays in the loop as the verifier**: every exported board gets cross-checked by protoflow's drc/erc + part library (its mcp) before it's called done. it can veto boards; it can't draw them
- the keeberia website (layout-to-device.lovable.app) is the product — the repo serves it. every backend milestone ends with something the website can show
- logical objects → manufacturing footprints. users never see nets, pads, or edas
- xano hosts the public api for now — but nothing hard-depends on it: the daemon's queue is a pluggable transport and the whole backend must run without xano later. hosting: the daemon on render.com; heavy compute on amd cloud hardware when boards demand it
- rendering: webgl (result viewer — board and case). the user sees a clean board, never a ratsnest
- cad/case: openscad code with intuitive slider-based controls, makerworld makerlab style — parametric and deterministic, same traceparency argument as the copper
- autorouting: freerouting (open source, deterministic — the right kind of "no ai") joins the copper path via a dsn in / ses out bridge. the engine's a* router stays as fallback until the bridge is proven
- format: kicad everywhere — schema and pcb interchange
- component ecosystem: jlcpcb — the bom carries jlc part numbers and footprints are verified against jlc's library
- protoflow keeps its role (verifier only, anne has credits); tensormux glm credits available for non-copper llm work; browserbase/firecrawl on request for scraping (jlc parts library, community builds)
- design language: notion/figma/canva. never kicad/eda

## risks to watch

- protoflow is mac-only desktop — its mcp is the automation path; if mcp access runs dry (1000 credits), fall back to manual spot-checks per release
- xano custom-code bundle/timeout limits vs a ~2k-line engine — fallback is self-hosted on aws, same contract
- oled/encoder breakouts constrain small board outlines — accept bigger boards over cramped ones
- footprint drift — every value keeps provenance notes in `backend/engines/pcb/research/`; new parts get verified before they touch the netlist
