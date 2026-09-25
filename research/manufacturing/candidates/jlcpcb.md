# jlcpcb

status: drafted (evidence-backed, capabilities extracted)

## finding

jlcpcb is a chinese pcb fab + assembly house offering 1-32 layer rigid fr-4 with economical
prototyping tiers, and it is the primary target for keeberia's gerber/drill exports. the
numbers that matter to our boards (all two-layer, 1oz, thru-hole heavy):

- min track width / spacing: **0.10 / 0.10 mm** (1oz, 1-2 layer) — our engines default to
  0.25mm traces, 3x headroom
- min drill: **0.15 mm** (2-layer); our smallest drills are 1.2mm (choc pins) and 1.7mm
  (locating pegs) — nowhere near the floor
- hole tolerance: **+0.13 / -0.08 mm** — matters for press-fit encoder mounts; the ec11's
  3.4mm+ slots are drilled, tolerance is generous
- pth annular ring: **≥0.20 mm** (0.25 recommended; absolute min 0.18 for 1oz 2-layer)
- npth: min **0.50 mm** drilled, pad annular ring ≥0.45mm if masked — our switch peg holes
  (1.7mm) are fine; the 4mm mx center peg reads as npth in our export
- board thickness options: **0.4 / 0.6 / 0.8 / 1.0 / 1.2 / 1.6 / 2.0 mm**, tolerance ±10%
  (boards ≥1.0) — our cases assume 1.6mm default; ±0.16mm on the pcb thickness is inside the
  case's standoff tolerance (walls derive from switch stacks, floor clearance is 0.7mm+)
- silkscreen: min line width **0.15 mm**, min text height **1.0 mm** — our silks are 1mm
  reference-designator text: exactly at the floor, keep an eye on it
- copper clearance from routed edges: **≥0.2 mm**; from v-cut: ≥0.4mm
- pad-to-pad clearance (different nets): **0.15 mm**; pad-to-track 0.10 mm
- finishes: hasl (leaded/lead-free), enig, osp (not on single-sided/aluminum)
- min board: 3×3 mm; max 2-layer fr4: 670×600 mm; dimension tolerance ±0.1 (precision
  routing) / ±0.2 (regular)
- min plated slot: 0.5 mm (2-layer); non-plated slot: 1.0 mm

## conditions and caveats

- the capabilities page is marketing-adjacent documentation: values are the fab's stated
  limits, not measured first-article results. calibration against a real order (anne's a1
  mini print test is the analogue for the case side) would upgrade this file to verified
- osp is unavailable for single-sided fr4; enig costs more but is the right call for
  gold-plated usb pads if we ever expose the xiao's shell contacts
- economic tiers push you toward their parts library for assembly; our designs are
  thru-hole-first and hand-solderable, so the library matters less for us
- prices/lead times are deliberately not recorded here (they drift; record a dated quote
  when one is actually pulled)

## sources

- [pcb capabilities — jlcpcb](https://jlcpcb.com/capabilities/pcb-capabilities): full
  capability tables (layers, drill, annular rings, silkscreen, panelization, finishes);
  fetched via firecrawl, retrieved 2026-09-25. excerpts preserved in evidence.jsonl
  (evid-jlc-001..012)

## how this enters the engine

circuitron gets a **fab profile**: research/manufacturing/capabilities/jlcpcb.json, imported
as the design-rule source for drc when the user targets jlcpcb. the drc stops being generic:
min trace/space, drill floor, annular ring, silkscreen floor, edge clearance all check against
the fab's own numbers. a second profile (pcbway, osh park) later gives users an honest
fab choice with the rules visible.
