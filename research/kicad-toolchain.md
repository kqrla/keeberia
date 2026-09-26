# KiCad Toolchain Internals: End to End Architecture & Circuitron Mapping

## Executive Summary

KiCad operates as a modular, file-driven Electronic Design Automation (EDA) toolchain where each stage transforms explicit input files into downstream manufacturing or simulation artifacts. The pipeline transitions from symbolic logical capture to physical spatial layout, constraint verification, and vector fabrication outputs. 

Or simply put, KiCad is a sequential assembly line: schematic editors define logical connections, board editors map those connections to physical copper geometry, rules engines check for physical and electrical errors, and plotters generate vector files for manufacturing machinery.

Keeberia's Circuitron engine reimplements this exact end to end compilation pipeline in programmatic TypeScript, bypassing human GUI interactions while maintaining complete interchange compatibility with standard KiCad `.kicad_pcb` files, Specctra DSN/SES autorouting formats, and RS-274X Gerber manufacturing bundles.

---

## 1. The KiCad EDA Toolchain Pipeline Walkthrough

The KiCad toolchain comprises sequential stages. Each stage is handled by dedicated sub-applications or internal modules, communicating via explicit file formats.

### Stage 1: Schematic Capture (`eeschema` / `.kicad_sch`)
* **Concept:** Schematic capture defines the symbolic representation of the electronic circuit. Component symbols specify logical pins, while graphical wires represent electrical connections (nets) [evid-kt-001].
* **Handoff Artifact:** `.kicad_sch` S-expression files containing symbol references, pin mappings, graphical wires, net labels, and component parameters.

### Stage 2: Netlist Generation & Schematic Transfer
* **Concept:** Netlist generation extracts pure electrical connectivity from symbolic drawings. It translates component symbols and wires into an abstract graph of electrical nodes (nets) connecting specific component pins [evid-kt-002].
* **Handoff Artifact:** Internal netlist structure or legacy `.net` file mapping net names (such as `VCC`, `GND`, `ROW_0`) to list of target component pins (such as `U1-P12`, `SW1-P2`).

### Stage 3: PCB Layout (`pcbnew` / `.kicad_pcb`)
* **Concept:** Board layout realization translates abstract netlists into physical geometry. Component footprints are placed on a physical substrate, board boundaries are defined on `Edge.Cuts`, and physical layers are established across up to 32 copper layers and 14 technical layers [evid-kt-003].
* **Handoff Artifact:** `.kicad_pcb` S-expression file containing exact footprint coordinates, pad geometries, layer definitions, graphic line segments, and track objects.

### Stage 4: Design Rules Setup
* **Concept:** Design rules establish physical manufacturing constraints prior to routing. Netclasses assign specific copper clearance, minimum track width, via drill diameter, and differential pair parameters to groups of nets [evid-kt-004].
* **Handoff Artifact:** Embedded `(setup ...)` and `(netclass ...)` tokens inside the `.kicad_pcb` file.

### Stage 5: Trace Routing
* **Concept:** Routing creates continuous physical copper paths (tracks and vias) connecting pads assigned to the same net according to netclass design rules.
* **Handoff Artifact:** `(segment ...)` and `(via ...)` S-expression nodes saved into `.kicad_pcb`.

### Stage 6: Copper Zones and Power Planes
* **Concept:** Copper zones fill designated PCB regions with continuous copper tied to a specific net (typically `GND` or `VCC`) to provide low-impedance power distribution and signal shielding [evid-kt-007].
* **Handoff Artifact:** `(zone ...)` S-expression nodes defining polygonal boundary vertices, fill settings, and thermal relief spoke parameters [evid-kt-008].

### Stage 7: DRC & ERC Verification
* **Concept:** Automated verification checks validate design integrity. Electrical Rules Check (ERC) operates on schematics, while Design Rules Check (DRC) operates on physical PCB layouts [evid-kt-009, evid-kt-010].
* **Handoff Artifact:** DRC/ERC report logs and interactive highlight markers indicating physical or electrical violations.

### Stage 8: Plot Fabrication Outputs
* **Concept:** Fabrication generation converts physical PCB geometry into machine-readable vector files for manufacturing equipment [evid-kt-010].
* **Handoff Artifact:** RS-274X/X2 Gerber layer plots, Excellon drill files (`.drl`), and SMT pick-and-place position files (`.pos`) [evid-kt-011, evid-kt-012].

---

## 2. SPECCTRA DSN, SES, and Autorouting in the Open Ecosystem

### Specctra Interchange Architecture: DSN and SES
The Specctra Design System Network (DSN) and Session (SES) formats form the standard open interchange protocol between EDA board editors and external routing engines [evid-kt-005, evid-kt-006].

* **Specctra DSN (`.dsn`):** An ASCII S-expression design description exported by the CAD tool. It contains the complete geometric state: board boundaries, keepout zones, pad locations, padstack definitions, layer stackup, netlist topology, and clearance rules [evid-kt-006].
* **Specctra SES (`.ses`):** A lightweight session output file generated by the router upon completion [evid-kt-005]. It contains only the newly generated routing results: ordered wire track segments, layer transitions, and via coordinates associated with each net.

Or simply put, DSN is the problem statement handed to the router, and SES is the solution returned to the CAD tool.

### Ecosystem Status: Hand-Routing Culture vs. Freeroute
In open-source hardware and custom keyboard design, hand-routing dominates community culture. Designers prefer manual trace routing in `pcbnew` because keyboards feature repetitive matrix topologies where trace aesthetics, symmetrical 45-degree angle bends, and clean ground planes are highly valued.

Traditional batch autorouters often create convoluted trace paths, unnecessary layer-hopping vias, and sub-optimal ground copper splitting. However, open-source routers like Freeroute execute maze-routing and negotiated-congestion algorithms effectively when constrained by proper DSN rules [evid-kt-005].

Circuitron bridges this gap by incorporating an internal negotiated-congestion A* router while maintaining DSN/SES export and import capabilities (`dsn.ts`, `ses.ts`, `freeroute.ts`). This allows Keeberia to route boards deterministically inside the browser or delegate routing passes to external Freeroute instances.

---

## 3. Copper Zones, Ground Planes, and Thermal Reliefs

### Role of Ground Planes in Keyboard PCBs
Although keyboard matrix scanning operates at low microsecond frequencies, modern keyboard PCBs incorporate high-speed microcontrollers (such as RP2040 or ATmega32U4) and USB 2.0 Full-Speed or High-Speed interfaces (12 Mbps to 480 Mbps). 

A continuous Ground (GND) copper zone on bottom or inner layers is essential for several reasons:
1. **Signal Return Path:** USB differential signals (D+ and D-) require an unbroken reference plane directly underneath to control characteristic impedance and minimize loop area.
2. **EMI Mitigation:** Solid ground pours absorb radiated electromagnetic interference and prevent harmonic emissions generated by internal MCU clocks and PWM LED matrices.
3. **Ground Bounce Reduction:** Broad ground planes minimize ground inductance during simultaneous matrix scanning and RGB LED switching.

### Thermal Reliefs on Zone Pads
When component pads attach directly to a solid copper zone, the large thermal mass of the surrounding copper plane rapidly drains heat away during soldering. This makes manual soldering or reflow difficult and causes cold solder joints.

Thermal relief connections solve this by connecting the pad to the surrounding zone using narrow copper spokes [evid-kt-008]. These spokes maintain electrical conductivity while restricting thermal dissipation during assembly.

---

## 4. Electrical Rules Check (ERC) vs. Design Rules Check (DRC)

Understanding the distinction between ERC and DRC is critical for toolchain architecture:

| Feature | Electrical Rules Check (ERC) | Design Rules Check (DRC) |
| :--- | :--- | :--- |
| **Execution Domain** | Schematic Capture (`eeschema`) [evid-kt-009] | Board Layout (`pcbnew`) [evid-kt-010] |
| **Input Data** | Logical schematic graph (`.kicad_sch`) | Physical geometry (`.kicad_pcb`) |
| **Primary Focus** | Logical circuit validity | Physical manufacturability |
| **Key Errors Detected** | Unconnected input pins, shorted output pins, unannotated components, missing power flags | Copper clearances, trace width violations, annular ring defects, hole-to-hole collisions, unrouted nets |

Or simply put, ERC checks if your circuit diagram makes electrical sense, while DRC checks if your board layout can actually be manufactured without short circuits or physical overlap.

---

## 5. Fabrication Outputs and Manufacturing Packages

Fabrication output generation transforms physical board geometry into industrial manufacturing files [evid-kt-010].

### RS-274X / Gerber X2 Layer Plots
Gerber files are standard 2D vector files describing graphic shapes on physical PCB layers. Each physical layer requires a separate Gerber file because board fabricators manufacture PCBs layer by layer using photolithography masks:
* Top and Bottom Copper (`F.Cu`, `B.Cu`)
* Top and Bottom Solder Mask (`F.Mask`, `B.Mask`)
* Top and Bottom Silkscreen (`F.SilkS`, `B.SilkS`)
* Board Edge Cut Outline (`Edge.Cuts`)

### Excellon Drill Files (`.drl`)
Excellon files specify CNC drilling instructions, detailing exact X/Y hole coordinates, drill diameters, and distinction between plated through-hole (PTH) vias and non-plated through-hole (NPTH) mounting holes [evid-kt-011].

### Component Placement Files (`.pos`)
Pick-and-place position files (`.pos`) contain ASCII text records detailing reference designators, package footprints, mid-point X/Y coordinates, rotation angles, and board mounting side [evid-kt-012]. SMT assembly lines consume `.pos` files to program automated pick-and-place robots.

### Fabrication Zip Package
A complete manufacturing bundle submitted to fabricators (such as JLCPCB or PCBWay) contains:
1. Copper layer Gerbers (`F.Cu`, `B.Cu`)
2. Solder mask Gerbers (`F.Mask`, `B.Mask`)
3. Silkscreen Gerbers (`F.SilkS`, `B.SilkS`)
4. Board outline Gerber (`Edge.Cuts`)
5. Excellon drill file (`.drl`)

---

## 6. KiCad Practices in the Keyboard Ecosystem

Custom keyboard PCB design has driven significant open-source KiCad tooling and footprint development.

### Hand-Drawn vs. Scripted and Template Approaches
Historical keyboard PCB design relied on manual placement of key switch footprints on a 19.05mm grid in `pcbnew`. Modern open workflows utilize three distinct paradigms:

1. **Community Footprint Libraries:** Libraries like `marbastlib` [evid-kt-013] and `MX_V2` provide standardized footprints for MX/Choc switches, hotswap sockets, reversible MCU boards (such as Seeed XIAO or Pro Micro), and OLED displays.
2. **Community Design Guides:** References like `ruiqimao/keyboard-pcb-guide` [evid-kt-014] establish standard schematic patterns for switch matrix diodes, MCU decoupling capacitors, USB-C ESD protection, and grounding.
3. **Parametric & Scripted Generation:** Tools such as Ergogen and Keeberia's Circuitron bypass manual GUI layout entirely, programmatically generating netlists, component placements, and `.kicad_pcb` files from high-level layout configuration files.

---

## 7. Circuitron Engine Mapping

Keeberia's Circuitron engine reimplements the KiCad compilation toolchain in pure, deterministic TypeScript (`/engines/circuitron/src/`). Circuitron maps directly to KiCad's pipeline stages while making deliberate architectural simplifications tailored for custom input devices:

| KiCad Toolchain Stage | KiCad Module / File | Circuitron Module (`/engines/circuitron/src/`) | Architectural Mapping & Design Decisions |
| :--- | :--- | :--- | :--- |
| **Schematic Capture** | `eeschema`, `.kicad_sch` | *Deliberately Skipped* | Circuitron omits schematic capture. Netlists are generated deterministically directly from matrix layout parameters and physical switch coordinates. |
| **Netlist Generation** | Netlist Generator | `netlist.ts` | Builds logical net connections (rows, columns, diode nets, power, ground, LED data) directly from physical component layout. |
| **Footprint Library** | Symbol/Footprint Editors | `footprints.ts` | Provides embedded S-expression footprint generators for MX/Choc switches, diodes, microcontrollers, and connectors. |
| **Board Layout** | `pcbnew` | `layout.ts` | Computes exact 2D component coordinates, matrix rotations, and `Edge.Cuts` boundary geometry. |
| **Design Rules Setup** | Board Setup | `drc.ts` | Defines trace clearance, minimum track width, and annular ring constraints for validation. |
| **Specctra DSN Export** | File -> Export -> DSN | `dsn.ts` | Serializes current layout, pads, and unrouted nets into Specctra DSN format for autorouting. |
| **Autorouting Engine** | Freeroute / Internal Router | `route.ts`, `freeroute.ts` | Implements negotiated-congestion A* routing internally, with optional Freeroute execution. |
| **Specctra SES Import** | File -> Import -> SES | `ses.ts` | Parses Specctra SES session files and applies routed trace segments back onto board nets. |
| **Silkscreen Generation** | Silkscreen Graphics | `silkscreen.ts` | Generates component labels, pin indicators, and custom branding graphics on `F.SilkS`/`B.SilkS`. |
| **KiCad PCB Output** | File -> Save (`.kicad_pcb`) | `kicad.ts` | Serializes complete board geometry into native KiCad 7/8 S-expression `.kicad_pcb` format. |
| **Fabrication Output** | Plot Gerbers / Drill | `gerber.ts` | Generates RS-274X Gerber layer plots, Excellon drill files, and assembly placement outputs. |

---

## 8. Open Questions

1. **Dynamic Zone Pour Calculation:** Circuitron currently outputs basic zone definitions. Should Circuitron integrate a lightweight polygon clipping library (such as Clipper) in TypeScript to perform pre-calculated polygon fills in `.kicad_pcb` export, or leave zone filling to KiCad / Gerbler plotters?
2. **KiCad 8 vs KiCad 9 S-Expression Upgrades:** KiCad 8 introduced minor stroke syntax additions over KiCad 7. As KiCad 9 releases evolve, are there schema changes in netclass assignments or footprint property structures that Circuitron needs to support dynamically?
3. **Pick and Place Centroid Alignment:** Mechanical switch footprints in community libraries sometimes place origin `(0,0)` at the central post, while SMT diodes use pad centers. Should Circuitron standardize all `.pos` centroid offsets to guarantee plug-and-play automated assembly at fabs like JLCPCB?

---

## References & Evidence Index

* `[evid-kt-001]`: KiCad Schematic Editor role and symbolic representation (`docs.kicad.org`)
* `[evid-kt-002]`: Netlist transfer workflow from schematic to board editor (`docs.kicad.org`)
* `[evid-kt-003]`: KiCad PCB Editor layer capabilities up to 32 copper layers (`docs.kicad.org`)
* `[evid-kt-004]`: Netclass design rule definitions for track width, clearance, and vias (`docs.kicad.org`)
* `[evid-kt-005]`: Freerouting Specctra DSN import and SES session export workflow (`github.com/freerouting`)
* `[evid-kt-006]`: Specctra DSN exporter purpose for external autorouters (`docs.kicad.org`)
* `[evid-kt-007]`: Copper zones definition as solid or hatched net copper pours (`docs.kicad.org`)
* `[evid-kt-008]`: Thermal relief spoke width function for copper zone connections (`docs.kicad.org`)
* `[evid-kt-009]`: Electrical Rules Check (ERC) automatic connection validation (`docs.kicad.org`)
* `[evid-kt-010]`: Design Rules Check (DRC) validation prior to fab output generation (`docs.kicad.org`)
* `[evid-kt-011]`: CNC drill file generation in Excellon or Gerber X2 formats (`docs.kicad.org`)
* `[evid-kt-012]`: Component placement file output in POS format (`docs.kicad.org`)
* `[evid-kt-013]`: marbastlib footprint library for MX and Choc keyboard components (`github.com/ebastler`)
* `[evid-kt-014]`: keyboard-pcb-guide community reference for KiCad keyboard design (`github.com/ruiqimao`)
