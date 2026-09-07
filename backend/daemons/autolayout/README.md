# autolayout daemon

the background worker that turns design jobs into manufactured artifacts. the engine (`backend/engines/pcb/pcb-engine/`) is pure and synchronous — this daemon is what makes it a service: claim a job, run the engine, retry with adjusted parameters when routing struggles, persist the outputs.

## why a daemon (and not just an endpoint)

- routing a dense board can take seconds, not milliseconds — api timeouts shouldn't kill it
- failures deserve a **retry ladder**, not a 500: coarser grid → higher congestion budget → relaxed clearance → "here's why this layout can't route" in words a designer understands
- v2 (keebs) will push job times up; the queue pattern survives that

## job lifecycle

```
queued → claimed → routing(retries…) → drc → exporting → done
                                   ↘ failed (reason: user-readable)
```

artifacts: kicad_pcb, gerbers + excellon (v1), drc report, bom csv, svg preview, case stl (v1), firmware config (v1).

## layout

- `worker.ts` — queue loop skeleton (poll now; swappable for sqs/xano background tasks later)
- transport is pluggable: `xano-rest` (pull from xano tables) or `http` (self-hosted queue). the engine call is identical either way

## run (once the queue exists)

```bash
cd backend/daemons/autolayout
npx tsx worker.ts            # polls, sleeps, works
```
