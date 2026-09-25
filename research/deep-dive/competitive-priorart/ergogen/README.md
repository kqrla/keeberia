---
title: ergogen, the closest prior art
summary: prior art study: the yaml-in, pcb + case out generator keeberia gets compared to most
---

# ergogen: the closest prior art

> thesis: ergogen is the existing tool closest to keeberia's pitch: a
> config-driven generator that turns a layout into pcb and case files
> without manual eda work. that makes it the most important study in this
  folder: what it got right, where it stopped, and what its users say it
  lacks. study-don't-copy applies to its code; its design decisions are
  evidence.

## questions for the phase 15 dispatch (verify everything, no folklore)

- what it actually generates today (footprints? routed copper or just
  placement? case/plate via scad? firmware scaffolding?) and what it
  explicitly leaves manual
- author, license, repo health: is it maintained, abandoned, or forked
- the yaml ergonomics: what its users praise and complain about
- why the community that adopted it still hand-routes: is autorouting the
  wall, or export fidelity
- keeberia's honest deltas, each with an evidence line: the logical-object
  model (knob, not footprint), checkman's evidence-backed validation,
  the no-ai-in-copper determinism claim

deliverable: evidence-backed page + a row in the parent comparison table.
