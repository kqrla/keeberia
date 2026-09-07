# autolayout daemon

the background worker that turns design jobs into manufactured artifacts. the engine (`backend/engines/pcb/pcb-engine/`) is pure and synchronous — this daemon is what makes it a service: claim a job, run the engine, retry with adjusted parameters when routing struggles, persist the outputs.

## why a daemon (and not just an endpoint)

- routing a dense board can take seconds, not milliseconds — api timeouts shouldn't kill it
- failures deserve a **retry ladder**, not a 500: coarser grid → higher congestion budget → relaxed clearance → "here's why this layout can't route" in words a designer understands
- v2 (keebs) will push job times up; the queue pattern survives that

## job lifecycle

```
queued → claimed(running) → routing(retries…) → drc → done (artifacts persisted)
                                          ↘ error (reason: user-readable)
```

artifacts: kicad_pcb, bom csv, qmk info, svg preview, routing stats. gerbers + excellon, case stl and firmware config land in v1 as they're built.

## portability (standing decision)

the daemon has **no hard xano dependency**: the queue is one interface (`claim`, `complete`) with a pluggable transport. `xano-rest` is the v1 transport; a plain http/sqs transport drops in later without touching the run ladder. same for hosts — `render.yaml` deploys it as-is, and when denser boards need real hardware the same worker moves to amd cloud unchanged.

## run

```bash
cd backend/daemons/autolayout
KEEBERIA_ONCE=1 npx tsx worker.ts   # single pass (cron-style; exits when queue is empty)
npx tsx worker.ts                   # poll forever (the render.com mode)
```

env:
- `KEEBERIA_XANO_BASE` — queue base url (defaults to the live keeberia instance)
- `KEEBERIA_ONCE=1` — process one job then exit

deploy on render.com: blueprint in `render.yaml` (worker service; set `KEEBERIA_XANO_BASE` in the dashboard).
