---
title: kle, keyboard layout editor
summary: prior art study: the layout editor every keyboard project already uses
---

# kle: keyboard layout editor

> thesis: kle is the de facto shared language of keyboard layouts: the web
> editor whose json every downstream tool consumes. keeberia should treat
  its format as an import surface, not a competitor.

## questions for the phase 15 dispatch (verify everything, no folklore)

- who maintains it, under what license, and how stable is the json format
- what it does well (fast 2d layout sketching, the raw json as interchange)
  and what it deliberately does not do (no components, no pcb, no case)
- how ergogen and the kicad template projects consume kle json today, which
  is the provenance for keeberia's own kle import path
- status: is it maintained, and does that matter for a pure import format

deliverable: evidence-backed page + a row in the parent comparison table.
