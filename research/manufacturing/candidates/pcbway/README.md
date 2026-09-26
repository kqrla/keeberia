# pcbway

status: drafted (evidence-backed, capabilities extracted)

## finding

pcbway is a premier chinese pcb prototype and assembly house offering 1 to 14 layer standard fr-4 boards (up to 64 layers in advanced tier) with broad finish and copper weight options. key parameters for keeberia boards (two-layer, 1oz fr-4, thru-hole heavy):

- min track width / spacing: **0.10 / 0.10 mm** (4 mil) standard (down to 2 mil / 0.05 mm on advanced 1/3oz boards)
- min drill: **0.15 mm** mechanical CNC drill; 0.1 mm (0.076 mm) laser drill for HDI
- hole tolerance: **±0.08 mm** (PTH) and **±0.05 mm** (NPTH)
- pth annular ring: **≥0.15 mm** (6 mil) minimum for pads with center via
- board thickness options: **0.2 mm to 3.2 mm** (1.6 mm default), tolerance ±10% for ≥1.0 mm
- silkscreen: min line width **0.15 mm**, min text height **0.8 mm** (ratio 1:5)
- finishes: HASL (leaded/lead-free), ENIG, OSP, hard gold, immersion silver, immersion tin, ENEPIG
- panelization: V-scoring (zero clearance) or tab-routing (1.6 mm clearance)
- quality: free flying probe E-test and free AOI testing on all standard orders
- ordering / pricing: prototype runs starting at $5 for 5 pcs (100x100 mm), express 24h lead time for standard prototypes
- pcba: turnkey, partial turnkey, and consigned assembly supporting IPC-A-610 Class 2 standards
- sponsorship: active open hardware sponsorship program (over 13,800 projects sponsored via sponsor@pcbway.com and community project portal)

## conditions and caveats

- pcbway is generally slightly higher priced than jlcpcb for baseline 5-piece bare boards, but offers 24/7 human engineering review before payment and wider material/stackup options
- standard prototype pricing ($5 for 5 pcs) applies to boards up to 100x100 mm; larger keyboard designs enter standard area-based pricing
- assembly requires Gerber, BOM, and Centroid (Pick-and-Place) files with explicit component overage allowances for reel feeder setup

## sources

- [pcb capabilities - pcbway](https://www.pcbway.com/capabilities.html): standard fabrication capability table; retrieved 2026-09-25. excerpts preserved in incoming-pcbway.jsonl (evid-pw-001..007)
- [advanced pcb capabilities - pcbway](https://www.pcbway.com/advanced-pcb-capabilities.html): advanced roadmap and HDI limits; retrieved 2026-09-25 (evid-pw-008..009)
- [quick turn pcb fabrication - pcbway](https://www.pcbway.com/quickturn-pcb-fabrication.html): lead times and turn-around schedule; retrieved 2026-09-25 (evid-pw-010)
- [pcb assembly faq - pcbway](https://www.pcbway.com/assembly-faq.html): PCBA files, sourcing models, and IPC-A-610 Class 2 standards; retrieved 2026-09-25 (evid-pw-011..013)
- [sponsorship platform - pcbway](https://www.pcbway.com/project/sponsor/): open-hardware and educational project sponsorship; retrieved 2026-09-25 (evid-pw-014..015)
- [pcbway mini-review - eevblog](https://www.eevblog.com/forum/manufacture/pcbway-cnc-sheet-metal-3d-printing/): maker community feedback on quality and customer support; retrieved 2026-09-25 (evid-pw-016)

## how this enters the engine

circuitron receives a **fab profile**: research/manufacturing/capabilities/pcbway.json, imported as a target design-rule set for DRC when selecting PCBWay. circuitron verifies trace clearances, minimum drill sizes, annular rings, and silkscreen height against PCBWay constraints before exporting production gerbers.
