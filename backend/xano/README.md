# xano deploy state

instance: `xpnx-e4ie-cfuf.z7.xano.io` · workspace 1 ("anne's Workspace #1") · api group `keeberia` (id 3, canonical `1WbTpRUh`, branch v1)

**runtime base:** `https://xpnx-e4ie-cfuf.z7.xano.io/api:1WbTpRUh:v1`

| endpoint | verb | notes |
|---|---|---|
| `/generate` | POST | body `{"layout": {...}}` → inserts `design_jobs` row, returns job |
| `/job` | GET | `?id=N` → job incl. artifacts; missing id → `null` body |

table: `design_jobs` (id 9) — layout json, status (queued/running/done/error), attempts, artifacts json, error.

redeploy via metadata api (`text/x-xanoscript`):
- table: `POST /api:meta/workspace/1/table`
- endpoint: `POST /api:meta/workspace/1/apigroup/3/api` · update: `PUT .../api/<id>`
- xanoscript gotchas: `error_type` only accepts built-ins (`notfound`, `accessdenied`, ...); `precondition ($obj == null)` misfires on db records.
