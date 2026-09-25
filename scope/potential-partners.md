# potential partners

> thesis: keeberia's cad side is exactly what the printer and pcb ecosystems are spending
> money on right now — parametric, printable, hardware-validated geometry, one button from a
> real parts list. we don't need to convince them it's interesting; we need to show up with
> the demo. or simply put: every keeberia board ships with a case and caps their machines
> can print, and gerbers their fabs can etch.

checked sept 25 2026. programs drift — re-verify terms before any application. sources kept
per program; unverified names are flagged, not invented.

## what we bring to the table (the pitch, same for every tier)

- a funnel of **printable, parametric designs**: every macropad design generates a
  print-ready case stl + keycap stls, derived from real switch-stack geometry, not vibes
- **makerlab-style configurators, web-native**: the paracraft engine emits parametric
  openscad with customizer annotations — the exact pattern maker ecosystems are building
  around (makerworld's parameterized models, nexprint's generators)
- **evidence-disciplined fab data**: capabilities matrices with sources, dates, and
  verbatim excerpts (research/manufacturing/) — a partner's machines become *documented*
  design-rule targets in our engine, which is a story none of our competitors tell
- for pcb partners: jlc-ready gerbers + drill from a browser, no eda install

## tier 1 — printer ecosystems (the cad-side fit anne named)

**bambu lab / makerworld — "let's make it fund"** — verified: grants up to $300k for
"the boldest makers"; first batches already announced (real projects, real money).
designed for big projects — our pitch is the macropad configurator as a platform play:
every design on makerworld's community could generate its printed case through keeberia.
apply when the end-to-end demo (design → gerbers + printable case) is one video long.

**elegoo / nexprint — the $1m creator fund** — verified: nexprint is elegoo's model
platform, fund launched with $1m, plus running challenges ("make it real", "sparkmake").
the signal we like: nexprint already hosts **parametric web generators** (the vase
generator) — keeberia's engine is a deeper version of exactly that. probably the best
cultural fit of the printer tier.

**creality cloud** — no formal developer fund found in this pass; contest/points culture
on the platform. direct partnership pitch (their printers as keeberia-verified targets),
not a grant application.

**snapmaker / formlabs / prusa** — no formal dev programs verified. formlabs = resin
(sla cases are a keeberia process-research target anyway); prusa's community is the most
open-source-native and would resonate with the evidence discipline; snapmaker unknown.
all three: direct outreach, low effort, worth a short email each once the demo exists.

## tier 2 — pcb side (the order funnel)

**jlcpcb** — three angles, one family: (1) jlcpcb sponsors open hardware directly (they
backed lh-stinger, the open-source 3d printer); (2) **easyeda spark** — $85k in prizes
plus prototype sponsorship; (3) **oshwlab stars 2026** — their open-hardware contest.
keeberia's gerbers are already jlc-shaped (see research/manufacturing/capabilities/
jlcpcb.json) — "design it in a browser, one click to jlc" is their funnel as much as ours.

**pcbway — cool projects sponsorship** — verified and proven: their sponsorship platform
explicitly backs students + open-source hardware; countless open projects ship with
pcbway's "sponsored by" silks. the lowest-friction first pitch of the whole list: we
are exactly their archetype (open toolchain, open hardware, community-first).

**oshwlab / easyeda** — integration is the ask, not money: keeberia exports kicad 8
files; an easyeda import path (or oshwlab project publishing) makes us a content source
for their ecosystem. pairs naturally with a jlcpcb conversation.

## tier 3 — grants

**nlnet** — verified: funds open software + open hardware serving an open internet;
**next deadline november 3** (checked sept 25). the catch is their honest one: full
openness — all deliverables open-licensed and public. that's a real decision for
keeberia: the engines are already public, but the license question has never been
settled. if we want this door open, the license decision has to happen first.

**protomakers** — flagged, not verified: no grant program by this name found. anne —
did you mean a specific org? (there's a local makers association by the name, nothing
national.) tell me the right name or link and i'll do the research pass.

## pitch order (my honest read)

1. **pcbway cool projects** — established, low friction, we fit the archetype today
2. **elegoo/nexprint creator fund** — best cultural + technical fit; the parametric
   generator angle is already their vocabulary
3. **nlnet before nov 3** — only if the open-license decision lands in time; money is
   real and the ethos matches the evidence discipline
4. **easyeda spark / oshwlab stars** — contest exposure in the jlc ecosystem while the
   bigger jlc sponsorship conversation matures
5. **let's make it fund** — when the demo is undeniable; aim big with the platform story
6. direct emails to creality / snapmaker / formlabs / prusa once tier-1 wins exist

## principles (non-negotiable, in this doc on purpose)

- sponsorship never bends the evidence: a partner's machines enter the capabilities
  matrix through the same evidence lines as anyone's. no favorable drc for funders
- no exclusive fab deals that break the honest fab-choice story — users see real rules
- applications quote real artifacts (stls, gerbers, evidence lines), not promises
