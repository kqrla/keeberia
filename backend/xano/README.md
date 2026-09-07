# xano deploy state

instance: `xpnx-e4ie-cfuf.z7.xano.io` · workspace 1 ("anne's Workspace #1") · api group `keeberia` (id 3, canonical `1WbTpRUh`, branch v1)

**runtime base:** `https://xpnx-e4ie-cfuf.z7.xano.io/api:1WbTpRUh:v1`

| endpoint | verb | notes |
|---|---|---|
| `/generate` | POST | body `{"layout": {...}}` → inserts `design_jobs` row, returns job |
| `/job` | GET | `?id=N` → job incl. artifacts; missing id → `null` body |
| `/claim` | POST | oldest queued job → `status=running`, `attempts+1`; returns the job; `null` body when queue empty |
| `/complete` | POST | worker reports `{id, status, artifacts, error?}` → returns updated job |

table: `design_jobs` (id 9) — layout json, status (queued/running/done/error), attempts, artifacts json, error.

the loop: frontend `POST /generate` → daemon `POST /claim` → engine runs → daemon `POST /complete` → frontend polls `GET /job`. job #1 (hackpad-3key) went end to end on sept 7: 5/5 nets routed, artifacts persisted.

redeploy via metadata api (`text/x-xanoscript`):
- table: `POST /api:meta/workspace/1/table`
- endpoint: `POST /api:meta/workspace/1/apigroup/3/api` · update: `PUT .../api/<id>` · delete: `DELETE .../api/<id>`

xanoscript gotchas (learned the hard way, by rejection):
- `error_type` only accepts built-ins (`notfound`, `accessdenied`, ...)
- `precondition ($obj == null)` misfires on db records
- there is **no `db.update`** — the edit primitive is `db.edit` with `field_name` + `field_value` (no precondition support)
- filtering is `db.query` with `where = $db.table.field == "x"` and `sort = {table.field: "asc"}`; `return = { type: "single" }` gives the first match directly
- conditionals only parse inside a `conditional { if (`$var != null`) { ... } }` wrapper — bare `if` is a syntax error
- empty strings fail required-input validation — declare optional inputs nullable (`text? error`) and send `null`
