# seeed

status: researched (evidence-backed)

## finding

seeed studio fusion pcb is a chinese pcb fab and turnkey pcba service provider deeply embedded in
the open-hardware maker ecosystem. seeed is best known as the creator of the XIAO series of
microcontrollers, grove modular hardware, and open parts libraries. for keeberia users building
macropads with modular mcu daughterboards (such as XIAO RP2040/ESP32C3) or turnkey assembly, seeed
is a major primary fab option. the numbers that matter to our boards (all two-layer, 1oz, thru-hole heavy):

- min track width / spacing: **0.10 / 0.10 mm** (4 / 4 mil) for 1oz copper — our engines default
  to 0.25mm traces, providing 2.5x headroom
- min drill: **0.20 mm** for both plated through-holes (0.2–5.8 mm range) and non-plated mechanical
  holes (0.2–6.3 mm range); our smallest drills are 1.2mm (choc pins) and 1.7mm (locating pegs) —
  6x above the floor
- hole tolerance: **not published** in the main FR-4 capabilities table on seeed's official wiki
- pth/via annular ring: **not published** in the official FR-4 capabilities summary table
- board thickness options: **0.6 / 0.8 / 1.0 / 1.2 / 1.6 / 2.0 / 2.5 / 3.0 mm**, tolerance ±0.1 mm
  for boards ≤1.0mm, ±10% for thicker boards — our cases assume 1.6mm default; ±0.16mm on 1.6mm
  boards is well within case standoff tolerances
- min/max board size: **10 × 10 mm** to **500 × 500 mm**, dimensional tolerance ±0.2 mm — our
  macropad outlines fit easily inside this build volume
- silkscreen: min text height **0.58 mm** (23 mil), min stroke width **0.10 mm** (4 mil); colors:
  black on white solder mask, white on green/red/yellow/blue/black masks — our 1.0mm reference text
  default clears their 0.58mm floor with ~1.7x headroom
- copper clearance from routed edges: **≥0.30 mm**
- finishes: leaded HASL, lead-free HASL, ENIG, OSP, hard gold

## conditions and caveats

- seeed fusion is tightly tied to seeed's hardware ecosystem: native support for XIAO module
  soldering (hybrid thru-hole/castellated pads), Grove interconnects, and an Open Parts Library
  (OPL) offering pre-stocked SMT components for turnkey assembly with free DFA review
- solder mask dam rules depend on color and ordering flags: green solder mask permits a **0.10 mm** dam
  (0.13mm for non-green colors) when the 0.1mm dam option is selected; without that option, the
  required dam jumps to **0.32 mm** (green) / **0.35 mm** (other colors)
- edge clearance is **0.30 mm**, which is slightly wider than JLCPCB's 0.20mm requirement; routed
  macropad edge traces need 0.30mm keepouts
- annular ring dimensions and general hole drill tolerances are omitted from the official FR-4
  capability tables on the wiki and must be treated as unpublished in automated DRC checks
- prices and turnaround times vary by freight and assembly configuration, so they are omitted here

## sources

- [Seeed Fusion PCB & PCBA Service Guide — Seeed Studio Wiki](https://wiki.seeedstudio.com/Service_for_Fusion_PCB): official FR-4 capability table, board dimensions, thickness options, solder mask dams, silkscreen limits, edge clearance; retrieved 2026-09-25
- [How to use Seeed Studio XIAO in your PCB Design — Seeed Studio Blog](https://www.seeedstudio.com/blog/2022/08/19/how-to-use-seeed-studio-xiao-in-your-pcb-design): XIAO module integration, castellated/thru-hole hybrid footprint rules; retrieved 2026-09-25

## how this enters the engine

circuitron gets a dedicated **fab profile**: research/manufacturing/capabilities/seeed.json.
When a user targets Seeed Fusion (particularly for designs featuring XIAO microcontrollers or
using Seeed's PCBA service), DRC verifies trace width against 0.10mm, board edge clearance
against 0.30mm, solder mask dams against 0.10mm/0.13mm, and silkscreen text against 0.58mm,
preventing manufacturing holds during Seeed's automated DFM review.
