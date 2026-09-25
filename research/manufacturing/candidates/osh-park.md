# osh-park

status: researched (evidence-backed, numbers from their published docs)

## finding

osh park is a US pcb fabrication broker specializing in signature purple soldermask boards with lead-free enig finish. the numbers that matter to keeberia's boards (all two-layer, 1oz, thru-hole heavy):

- min track width / spacing: **0.1524 / 0.1524 mm** (6 / 6 mil) for 2-layer service — our engines default to 0.25mm traces, ~1.6x headroom
- min drill: **0.254 mm** (10 mil) for 2-layer; our smallest drills are 1.2mm (choc pins) and 1.7mm (locating pegs) — far above the floor. max drilled hole is 6.604mm (260 mil), larger holes are routed/milled
- hole tolerance: **±0.0635 mm** (±2.5 mil max), **±0.0254 mm** (±1.0 mil typical); drill positional tolerance ±0.0635 mm max — generous for ec11 encoder slots and kailh switch pins
- pth annular ring: **≥0.127 mm** (5 mil) for 2-layer (0.1016mm / 4 mil for 4-layer)
- npth annular ring / pad clearance: **not published** as a specific pad removal ring size (unlike jlcpcb's 0.45mm npth requirement); npth cutouts/holes simply require copper cleared from beneath
- slots: min plated drill slot width **0.508 mm** (20 mil); must be specified on drill layer as native drill slots
- board thickness options: **1.6 mm** (63 mil nominal fr4, 60mil core ±0.1524mm / ±6mil tolerance) default 2-layer; **0.8 mm** (32 mil, 2oz copper) thin option. keeberia cases assume 1.6mm default; ±0.1524mm thickness tolerance fits within case standoff tolerances
- silkscreen: high-res dlp; min line width **0.0762 mm** (3 mil, text/graphics) / **0.127 mm** (5 mil recommended); min font height in mm is **not published** (keeberia's 1.0mm reference designators easily clear line width limits)
- copper clearance from routed edges: **0.381 mm** (15 mil) keepout from nominal board edge; v-cut scoring rules are **not published** (tab routing used)
- finishes: enig (gold) standard on all orders (no hasl or osp options)
- min board: **6.35 × 6.35 mm** (0.25 × 0.25 in); max 2-layer fr4: **406.4 × 558.8 mm** (16 × 22 in)
- panelization: customer panels require **2.54 mm** (0.1 in) spacing between board outlines and a **5.08 mm** (0.2 in) minimum frame width
- per-piece pricing shape: **$5.00 per sq in** per set of 3 boards (2-layer prototype, free worldwide shipping); **$1.00 per sq in** for 2-layer medium run (100 sq in / $100 min order, multiples of 10); **$10.00 per sq in** per set of 3 boards (4-layer prototype)

## conditions and caveats

- specs are extracted from official documentation on docs.oshpark.com; values represent stated manufacturing limits, not measured first-article inspection results
- enig finish is standard across all tiers (no extra charge), making gold-plated contacts default-ready
- per-square-inch pricing makes large macropads significantly more expensive on osh park than jlcpcb for prototypes, though small switch-tester daughterboards remain affordable
- no smt assembly service offered directly by osh park; keeberia's designs are thru-hole heavy and hand-solderable so fab-only orders fit
- unstated specs: minimum silkscreen font height in mm, npth pad clearance ring size, pad-to-pad clearance beyond 6mil trace clearance, and v-cut scoring limits are **not published**. circuitron drc rules should maintain conservative defaults (0.25mm trace/space, 0.20mm pad clearance) when targeting osh park

## sources

- [fabrication services — osh park docs](https://docs.oshpark.com/services/): tier specs, pricing, turn times, trace/drill floors; retrieved 2026-09-25. excerpts preserved in incoming-oshpark.jsonl (evid-osh-001..003, 014..016)
- [2 layer prototype service — osh park docs](https://docs.oshpark.com/services/two-layer/): material specs, thickness, core tolerance, min/max board size, edge keepout, silkscreen line widths; retrieved 2026-09-25 (evid-osh-005..009, 017)
- [drill specs — osh park docs](https://docs.oshpark.com/submitting-orders/drill-specs/): hole size tolerance, positional tolerance, max drilled hole; retrieved 2026-09-25 (evid-osh-004)
- [slots — osh park docs](https://docs.oshpark.com/submitting-orders/slots/): slot support, minimum slot width; retrieved 2026-09-25 (evid-osh-010)
- [board outline — osh park docs](https://docs.oshpark.com/submitting-orders/board-outline/): milling bit diameters, minimum cutout size; retrieved 2026-09-25 (evid-osh-011..012)
- [submitting panels and panelized designs — osh park docs](https://docs.oshpark.com/troubleshooting/panelized-designs/): panel spacing and frame thickness rules; retrieved 2026-09-25 (evid-osh-013)

## how this enters the engine

circuitron gets a **fab profile**: `research/manufacturing/capabilities/oshpark.json`, imported as the design-rule source for drc when the user targets osh park. min trace/space (0.1524mm), drill floor (0.254mm), annular ring (0.127mm), edge keepout (0.381mm), and slot floor (0.508mm) check against osh park's own published numbers.
