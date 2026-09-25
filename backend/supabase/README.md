# supabase

> thesis: the queue is a table, the transport is a function, and nobody gets raw ddl access
> from the browser. or simply put: the xano scripts became four postgres functions.

the v2 backend for keeberia's job flow. supersedes backend/xano/ (retired sept 25; kept for
history and the design notes).

## layout

- `migrations/0001_design_jobs.sql` — the whole schema: `design_jobs` table, rls policies
  (publishable key may insert + select, only the daemon may mutate), and three rpcs:
  `claim_job` (atomic claim via `for update skip locked`), `complete_job`, `requeue_stale`
- apply once via the dashboard sql editor; later migrations are numbered files

## the rpc contract

- `claim_job()` → `setof design_jobs`; the oldest queued job flipped to running,
  attempts incremented; **empty array** when the queue is empty (no null-body quirk like
  xano — the array shape is honest)
- `complete_job(p_id, p_artifacts, p_error)` → done with artifacts, or failed with error
- `requeue_stale(p_minutes)` → running jobs whose daemon died go back to queued

## env

- `SUPABASE_URL` — the project url
- `SUPABASE_SERVICE_ROLE_KEY_2` (daemon, secret key) — claim/complete
- `SUPABASE_ANON_KEY` (frontend, publishable key) — enqueue + status polling

## daemon

`daemons/autolayout/worker.ts` — `supabaseQueue(url, key)` implements the same
`Queue` interface the xano transport had; `KEEBERIA_QUEUE=supabase` (default) or
`KEEBERIA_QUEUE=xano KEEBERIA_XANO_BASE=...` for the legacy transport. end-to-end test:
`daemons/autolayout/test/supabase.ts`.
