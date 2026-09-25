# frontend

the frontend shell now lives in this repo: **/frontend**.

it was born in [kqrla/keeberia-front](https://github.com/kqrla/keeberia-front),
a lovable project synced through lovable's github connection. as of sept 25
2026 lovable is out of the loop — no more changes happen there — so the
shell was ported verbatim into /frontend (from commit 9e483e5, the last
synced state). keeberia-front remains as the frozen provenance snapshot of
the lovable era; /frontend is the living source.

what the shell is: react + vite + tailwind + shadcn, bun for packages. it is
a client of the engines — it submits layouts through the supabase queue
(anon key enqueues + watches design_jobs) and renders what circuitron +
paracraft deterministically produce. no design intelligence lives in it, and
the no-ai-in-the-copper-path rule holds at this boundary too.

current state: ported, not yet wired to the queue — see /frontend/README.md.
