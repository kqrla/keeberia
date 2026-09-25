-- 0002: explicit grants for the job queue.
-- newer supabase projects ship WITHOUT the old blanket default privileges on
-- the public schema — anon/authenticated/service_role get nothing unless the
-- migration grants it. 0001 created the table + policies + rpcs but no grants,
-- so every call failed with 42501 (permission denied).
-- apply once: supabase dashboard → sql editor → paste → run.

-- the front end (anon/publishable key): enqueue + watch, gated by RLS policies.
grant select, insert on public.design_jobs to anon;

-- the daemon (service/secret key): claim, complete, requeue — bypasses RLS.
grant select, update, delete on public.design_jobs to service_role;

-- queue rpcs are daemon-only: close the public-execute default so anon can
-- never call claim/complete/requeue directly (harmless under RLS, but closed
-- is closed). service_role keeps explicit execute.
revoke execute on function public.claim_job() from anon, authenticated;
revoke execute on function public.complete_job(bigint, jsonb, text) from anon, authenticated;
revoke execute on function public.requeue_stale(int) from anon, authenticated;
grant execute on function public.claim_job() to service_role;
grant execute on function public.complete_job(bigint, jsonb, text) to service_role;
grant execute on function public.requeue_stale(int) to service_role;
