# backend/pcb

or simply put: this folder is where the pcb side's knowledge lives — not the
engine, the *evidence*. circuitron (engines/circuitron) consumes component
records and turns them into boards; this folder is where those records came
from, sourced and provenance-kept, so no geometry in the copper path is ever
a guess.

what's here:

- **research/footprints/** — the raw footprint library sources: the hack club
  hack pad care package, the hackpad repo footprints, perigoso's kailh
  hotswap, official kicad libs, xiao variants, sk6812, ssd1306 oleds, ec11.
  every file is a downloaded original; nothing here is hand-invented.
- **research/footprints/scripts/** — the fetch + inspect tooling that pulled
  those sources (github api, standing instruction) and the inspect scripts
  used to read pad geometry out of them when the records were built. the
  scripts stay so the provenance chain is reproducible: anyone can re-run a
  fetch and diff against the stored original.
- **research/notes/** — the pcb-side architecture and prior-art notes:
  component-geometry-pipeline.md (one record, many projections — the
  keeberia component model), communities-and-switches.md, keeb-design-types,
  format-prior-art, firmware-qmk-vs-kmk-rmk.

what is deliberately NOT here:

- the engine itself (engines/circuitron — placement, netlist, routing,
  drc, gerber export)
- fab design rules and capabilities (research/ at repo root — the evidence
  corpus; checkman reads research/manufacturing/capabilities/*.json)
- the daemon and queue (daemons/, backend/supabase)

the sourcing rule for anything entering this folder: a claim needs a source,
a source needs a file or url, a number needs a datasheet or a downloaded
original. if a geometry value can't be traced back to something in
research/footprints/ or a datasheet, it is a calibration-flagged assumption
and is labeled as one in code (see the flagged constants in footprints.ts and
daemons/checkman). no hallucinated geometry — ever.
