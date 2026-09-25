---
title: kicad scripting, skidl and the kicad-python lineage
summary: prior art study: scripted pcb generation from the kicad ecosystem
---

# kicad scripting: skidl, kicad-python, pcbnew api

> thesis: the kicad world already has a code-first pcb lineage: skidl
  (python netlists), the pcbnew python api (board construction from
  scripts), and community automation around them. keeberia is a browser
  cousin of this lineage: same idea (boards as code), different surface
  (no python, no local install, logical objects instead of netlists).

## questions for the phase 15 dispatch

- skidl: scope (schematic/netlist generation in python), license,
  maintenance status, what its users build with it
- pcbnew scripting api: what is automatable (placement, zones, routing
  hooks?) and what is not
- the gap they share: none of them do the layout-to-thing journey (case,
  caps, firmware) in one place, which is keeberia's actual pitch
- real projects that scripted keyboards this way, as usage evidence

deliverable: evidence-backed page + a row in the parent comparison table.
