# frontend

or simply put: this is the keeberia shell — the actual app the user sees —
now living in the main repo.

it was born in keeberia-front (the lovable project repo, synced there
through lovable's github connection). as of sept 25 2026 lovable is out of
the loop: no more changes happen there, and this folder is where the shell
lives from now on. the copy was taken verbatim from the last synced state
of kqrla/keeberia-front (commit 9e483e5, "added BTS engine pages").

what it is: react + vite + tailwind + shadcn (lovable's stack), bun for the
package manager. the shell talks to the backend through the queue
(backend/supabase — anon key enqueues design jobs, watches status) and
renders what the deterministic engines produce. no design intelligence lives
here — the front end is a client of circuitron + paracraft, never their
peer. the ai-in-the-copper-path rule holds at this boundary too: the ui can
only submit layouts and display results, never invent geometry.

the keeberia-front repo remains as the frozen provenance snapshot of the
lovable era; this folder is the living source. history note: the narrative
content extracted sept 25 (explain/, project/positioning/) came from the
same front source, verified verbatim before commit.

## status

ported, not yet wired — the shell still contains its lovable-era
placeholders and the component contracts are the ones documented in
docs/frontend.md. wiring it to the supabase queue and the artifact
download flow is the next frontend step.
