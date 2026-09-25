-- keeberia job queue, from the xano design (backend/xano) ported to postgres.
-- one row per generate request; the daemon claims, runs, reports.
-- apply once: supabase dashboard → sql editor → paste → run.

create table if not exists public.design_jobs (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  layout      jsonb not null,
  status      text not null default 'queued'
              constraint design_jobs_status_check check (status in ('queued','running','done','failed')),
  attempts    int not null default 0,
  artifacts   jsonb,
  error       text,
  claimed_at  timestamptz
);

create index if not exists design_jobs_status_id_idx on public.design_jobs (status, id);

alter table public.design_jobs enable row level security;

-- the frontend (publishable key) may enqueue and watch progress;
-- only the daemon (secret key) may mutate, via the rpcs below.
create policy "anon can enqueue" on public.design_jobs
  for insert to anon with check (status = 'queued');
create policy "anon can watch" on public.design_jobs
  for select to anon using (true);

-- claim the oldest queued job. atomic even with two daemons polling:
-- skip locked means a locked row is invisible to the other claimer,
-- and the single update either sees a row or claims nothing.
create or replace function public.claim_job()
returns setof public.design_jobs
language sql
as $$
  update public.design_jobs j
     set status = 'running', attempts = j.attempts + 1, claimed_at = now()
   where j.id = (
     select id from public.design_jobs
      where status = 'queued'
      order by id asc
      limit 1
      for update skip locked
   )
  returning j.*;
$$;

-- report a finished job: artifacts on success, error on failure.
create or replace function public.complete_job(p_id bigint, p_artifacts jsonb default null, p_error text default null)
returns setof public.design_jobs
language sql
as $$
  update public.design_jobs
     set status = case when p_error is null then 'done' else 'failed' end,
         artifacts = p_artifacts,
         error = p_error
   where id = p_id
  returning *;
$$;

-- maintenance: a job stuck in running (daemon died mid-run) returns
-- to the queue after p_minutes. attempts is kept — a job that keeps
-- dying keeps climbing, and the daemon refuses what exceeds its cap.
create or replace function public.requeue_stale(p_minutes int default 10)
returns setof public.design_jobs
language sql
as $$
  update public.design_jobs
     set status = 'queued', claimed_at = null
   where status = 'running'
     and claimed_at < now() - (p_minutes || ' minutes')::interval
  returning *;
$$;
