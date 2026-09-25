# frontend

or simply put: this is the keeberia shell — the actual app the user sees —
living in the main repo.

it was born in [kqrla/keeberia-front](https://github.com/kqrla/keeberia-front)
and ported verbatim from that repo's final state (commit 9e483e5, "added BTS
engine pages"). the platform-specific parts did not come along: the build
wrapper, the deploy config, the lockfile, and the error-reporting stub are
gone. what remains is a plain react + vite + tailwind + shadcn app
(tanstack start for routing/ssr, bun for packages) that builds from a
standard vite config with no external platform in the loop. the source repo
stays frozen as provenance; this folder is the living source.

the contract: the shell is a client of the engines. it submits layouts
through the supabase queue (anon key enqueues design jobs, watches status)
and renders what circuitron + paracraft deterministically produce. no design
intelligence lives here — the no-ai-in-the-copper-path rule holds at this
boundary too: the ui can only submit layouts and display results, never
invent geometry.

## status

ported, stripped, not yet wired — the shell still carries its pre-port
placeholders. next steps: `bun install` to regenerate the lockfile, wire to
the supabase queue (backend/supabase), and the artifact download flow.
component contracts are documented in docs/frontend.md.
