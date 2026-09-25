---
title: competitive and prior art map
summary: what exists, what was tried, where keeberia sits, one folder per tool plus the comparison table
---

# competitive + prior art: the honest map

> thesis: keeberia was not born in a vacuum: kle standardized layouts,
  ergogen generated boards from config, kicad scripting made boards
  programmable, commercial eda welded itself to fabs. this folder maps
  that territory tool by tool, with evidence, so keeberia's position is
  a cited fact instead of a marketing sentence.

## the comparison table

> this table is the point of the folder. today it is a skeleton: cells
> marked **tbd** are unverified until their phase 15 worker lands evidence
> lines. nothing in a verified column gets filled from memory.

| tool | one-liner | input | outputs | automation level | license | maintained | keeberia's relation |
|---|---|---|---|---|---|---|---|
| kle | the layout sketching standard every tool consumes | clicks | layout json | layout only | tbd | tbd | import surface, not competitor |
| ergogen | config-driven board generator, the closest prior art | yaml | tbd (pcb? placement only? case?) | tbd | tbd | tbd | study its stop-points, cite deltas |
| skidl / kicad scripting | boards-as-code in python | python | netlists, boards | pcb, code-first | tbd | tbd | lineage cousin, browser vs local |
| commercial (flux, easyeda) | funded eda with fab lock-in or ai assistance | gui | boards, orders | varies | proprietary | yes | positioning contrast |

keeberia's own row (the last column folded into the thesis): one layout
in, pcb + case + caps + firmware out, deterministic, no ai in the copper
path, fab-agnostic. every cell of that row must survive contact with the
evidence above.

## folder index

- kle/ | ergogen/ | kicad-scripting/ | commercial/

each has its own README with the research questions for the phase 15
dispatch. new tools get a folder + a row here when they surface, the
table grows with the corpus.
