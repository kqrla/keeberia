# frontend

the frontend shell lives in this repo: **/frontend**.

it was born in [kqrla/keeberia-front](https://github.com/kqrla/keeberia-front)
and ported verbatim from that repo's final state (commit 9e483e5, "added BTS
engine pages"). the platform-specific parts were stripped in the port: the
build wrapper, deploy config, lockfile, and error-reporting stub are gone —
what remains is a plain react + vite + tailwind + shadcn app (tanstack start,
bun) with a standard vite config and no external platform in the build.
kqrla/keeberia-front stays frozen as the provenance snapshot; /frontend is
the living source.

what the shell is: a client of the engines. it submits layouts through the
supabase queue (anon key enqueues + watches design_jobs) and renders what
circuitron + paracraft deterministically produce. no design intelligence
lives in it, and the no-ai-in-the-copper-path rule holds at this boundary
too.

current state: ported, stripped, not yet wired — see /frontend/README.md.
next: bun install (lockfile regenerates), wire to the queue, artifact
download flow.
