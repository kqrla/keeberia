---
title: technical depth, the engineering under the engines
summary: routing algorithms, the dsn/ses interchange, freeroute internals, and the scad expressiveness frontier
---

# technical depth: know what we built, what we borrowed, why

> thesis: keeberia's engines make specific algorithmic bets (negotiated
> congestion a* routing, a dsn/ses interchange, deterministic parametric
> scad generation). this folder is where those bets get examined against
> how the real tools actually work, sourced properly.

## planned pages (stubbed. dispatch when anne says go)

- routing-algorithms.md: the routing landscape (maze/lee, a* variants,
  rip-up and reroute, negotiated congestion; grid vs shape-based), and
  where circuitron's a* actually sits in it.
- dsn-ses-bridge.md: the specctra interchange as a format. what a dsn file
  carries (nets, classes, vias, keepouts, wiring rules), what ses hands
  back, what each side loses in translation. note: the phase 12 kicad
  toolchain worker is already landing evidence on this layer, cite it
  rather than re-researching.
- freeroute-internals.md: freeroute under the hood: history, algorithm
  class, license situation, current maintenance status. open question:
  is it a dependency or just a prior art reference for circuitron.
- scad-expressiveness.md: what parametric openscad can and cannot express,
  at real scale. grounding start (verified sept 25 by grep, journal night
  ix): paracraft + caps emit a narrow surface today, linear_extrude (7
  call sites), hull (3), offset (2), plus booleans. that narrowness is
  load-bearing for the browser preview question, keep this page honest
  about it.
