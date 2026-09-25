# aisler

status: researched (evidence-backed)

## finding

aisler is a german/eu pcb fabricator catering to European makers and hardware startups with
its "purple" prototype service pool. board fabrication is based in europe (germany/netherlands),
making it an appealing target for eu-based keeberia users seeking fast local delivery and zero
import customs hassle. the numbers that matter to our boards (all two-layer, 1oz, thru-hole heavy):

- min track width / spacing: **0.125 / 0.125 mm** (5 / 5 mil) for ENIG; **0.20 / 0.15 mm**
  (8 / 6 mil) for HASL — our engines default to 0.25mm traces, clearing both HASL (1.25x)
  and ENIG (2x) floors easily
- min drill: **0.50 mm** (PTH and NPTH drill floor); via drills go down to **0.25 mm** (ENIG)
  or **0.30 mm** (HASL); our smallest drills are 1.2mm (choc pins) and 1.7mm (locating pegs) —
  well above the 0.50mm PTH floor
- hole tolerance: **not published** as an explicit ± numeric tolerance range; aisler uses drill bits
  in 0.05mm steps and enlarges raw drills (+0.10mm for ENIG, +0.15mm for HASL) to compensate
  for plating thickness and yield finished hole sizes
- pth annular ring: **≥0.30 mm** (12 mil); via annular ring ≥0.10 mm (ENIG) / ≥0.20 mm (HASL) —
  slightly stricter than JLCPCB's 0.20mm floor, but standard 1.2mm/1.7mm pads cleared comfortably
- board thickness options: **1.6 mm** (63 mil) standard for 2-layer FR-4 (other 2-layer thickness
  options are **not published** / not offered in standard pool) — matches keeberia's 1.6mm case
  standoff default
- min/max board size: min **>10 × 10 mm**; max **500 × 500 mm** — our typical macropads (80×80mm
  to 150×150mm) fit comfortably within the window
- silkscreen: min text height **0.80 mm** (32 mil); min silkscreen-to-pad clearance **0.125 mm**;
  silkscreen line/stroke width is **not published** — our 1.0mm reference text height sits safely
  above the 0.80mm floor
- copper clearance from routed edges: **≥0.30 mm** (12 mil)
- finishes: HASL (lead-free/leaded, 1–40 µm thickness) and ENIG (Nickel 4.0–7.0 µm, Gold
  0.05–0.1 µm)

## conditions and caveats

- aisler offers free standard shipping via Deutsche Post or DHL within Europe, eliminating the
  high flat-rate express freight fees common with asian fabs for small prototype orders
- pricing is denominated in euros (€); community contributions (tips and deep-dive guides) earn
  €20 to €50 store credit directly applied to user accounts
- HASL rules are significantly tighter than ENIG: HASL requires 0.20mm min trace width (vs 0.125mm
  for ENIG), 0.30mm via drill, and does not support castellated edges or missing soldermask dams
- silkscreen coverage has an explicit ceiling: maximum silkscreen fill is capped at **25% of board
  area**; dense aesthetic silkscreen artwork across the whole macropad plate will trigger DRC
  rejection
- lead times and exact tier pricing drift over time and are not recorded here

## sources

- [PCB Portfolio — AISLER](https://community.aisler.net/t/pcb-portfolio/101): base material, 1.6mm 2-layer thickness, surface finishes; retrieved 2026-09-25
- [2 Layer 1.6mm 35 µm ENIG Design Rules — AISLER](https://community.aisler.net/t/2-layer-1-6mm-35-m-enig-design-rules/3732): full capability table for ENIG 2-layer; retrieved 2026-09-25
- [2 Layer 1.6mm 35 µm HASL Design Rules — AISLER](https://community.aisler.net/t/2-layer-1-6-mm-35-m-hasl-design-rules/3735): full capability table for HASL 2-layer; retrieved 2026-09-25
- [Shipping Methods — AISLER](https://community.aisler.net/t/shipping-methods/672): free untracked shipping (Deutsche Post Großbrief / DHL Warenpost) within their service; retrieved 2026-09-25

## how this enters the engine

circuitron gets a dedicated **fab profile**: research/manufacturing/capabilities/aisler.json.
When an EU-based user selects Aisler as their fabrication target, DRC checks against Aisler's
stricter 0.30mm PTH annular ring requirement, 0.30mm edge clearance, 0.80mm text height floor,
and 25% silkscreen fill limit, ensuring error-free Gerber handoff to Aisler's automated web importer.
