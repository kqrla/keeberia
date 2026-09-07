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

1. **unblock xano** — fresh metadata api token (they expire in 7 days by default) with database/content/api-groups scopes. then: pull the workspace multidoc, push the engine endpoint + job tables, smoke-test it
2. **autolayout daemon** — job worker skeleton exists in `backend/daemons/autolayout/`; make it real: claim → run → retry ladder → persist
3. **gerber + excellon export** — jlc-orderable output is the v1 bar; kicad_pcb alone doesn't order a board
4. **case generator** — openscad from engine output (outline + part heights); print test on the a1 mini
5. **frontend wiring** — job flow + result viewer, notion/canva vibes strictly enforced

## standing decisions (don't re-litigate)

- no ai in the copper path. ever. protoflow is the ai one; keeberia is the deterministic one
- logical objects → manufacturing footprints. users never see nets, pads, or edas
- xano hosts the public api; aws hosts the daemon if xano timeouts bite
- design language: notion/figma/canva. never kicad/eda

## risks to watch

- xano custom-code bundle/timeout limits vs a ~2k-line engine — fallback is self-hosted on aws, same contract
- oled/encoder breakouts constrain small board outlines — accept bigger boards over cramped ones
- footprint drift — every value keeps provenance notes in `backend/engines/pcb/research/`; new parts get verified before they touch the netlist
