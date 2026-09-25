---
title: manufacturing reality
summary: measured fab and print tolerances, real test data, where the pixel-perfect model breaks down
---

# manufacturing reality: measured, not marketed

> thesis: the capability sheets in research/manufacturing/capabilities/ say
> what fabs claim. checkman gates on those numbers. this folder is the
> deeper layer: what tolerances actually look like in distribution, what
  real prints reveal, and where the pixel-perfect model breaks down between
  the design file and the physical board. checkman's margin model should
  eventually eat from here, not from the datasheets alone.

or simply put: the datasheet says 0.15mm. the forum thread says otherwise.
the calibration print settles it.

## evidence tiers

- tier 1: anne's own calibration prints and boards (the ec11 6.0mm shaft
  and fdm knob bore are the first entries, already calibration-flagged in
  checkman)
- tier 2: community fab reviews with photos and measurements (r/pcb,
  fab review threads, hackaday fab comparisons)
- tier 3: fab marketing numbers (what the capability sheets already hold)

tier 1 beats tier 2 beats tier 3, same rule as the corpus.

## deliverable (phase 17, dispatch when anne says go)

per-process tolerance reality pages (fdm, sla, jlc-style pcba) feeding
checkman's margin model, plus a "where pixel-perfect breaks" page: the
transit gaps between design intent and physical artifact (panelization,
warpage, drill wander, print shrink, shipping damage).
