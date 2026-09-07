# Research Report: Programmatic PCB Generator Backend & Prior Art

**Target Artifact:** `/app/conversations/6a9e9dfaee750a68cb5ab509/research/format-prior-art.md`  
**Date:** September 2026  
**Scope:** KiCad `.kicad_pcb` S-expression file format (KiCad 7/8), prior art in programmatic keyboard PCB generation, deterministic auto-routing algorithms, and QMK firmware `info.json` specification.

---

## Part A — KiCad `.kicad_pcb` File Format (KiCad 7/8)

### 1. Minimal Valid Structure & Required Sections

A KiCad `.kicad_pcb` file uses a Lisp-like S-expression (symbolic expression) grammar. All coordinates and distances are specified in millimeters (`mm`), and angles are specified in degrees counter-clockwise (or clockwise depending on context, standard is float degrees).

The minimal required structure for KiCad 7/8 board files consists of:
1. **Header Node:** `(kicad_pcb (version YYYYMMDD) (generator "name") (generator_version "X.Y"))`
2. **General Section:** `(general (thickness 1.6))`
3. **Paper Section:** `(paper "A4")`
4. **Layers Section:** `(layers ...)` enumerating copper and technical/user layers.
5. **Setup Section:** `(setup ...)` containing DRC and stackup defaults (optional, but standard).
6. **Net Definitions:** `(net 0 "")`, `(net 1 "VCC")`, `(net 2 "GND")`, etc.
7. **Footprints:** Embedded footprints `(footprint ...)` with pads, silkscreen graphics, and 3D models.
8. **Tracks and Vias:** `(segment ...)` and `(via ...)`.
9. **Board Outline Graphics:** `(gr_line ...)` or `(gr_arc ...)` on the `Edge.Cuts` layer.
10. **Silkscreen / Graphic Text:** `(gr_text ...)` on `F.SilkS` or `B.SilkS`.

---

### 2. Complete Small Valid `.kicad_pcb` Example (KiCad 7/8 Compatible)

Below is a complete, syntactically valid `.kicad_pcb` file (version `20240108`, KiCad 8.0 / 7.0 compatible) containing:
- Full 44-layer definition table
- A 50mm × 50mm board outline on `Edge.Cuts`
- One THT axial resistor footprint (`R1`) placed at `(125, 125)`
- One track segment on `F.Cu`
- One via connecting `F.Cu` to `B.Cu`
- Silkscreen text on `F.SilkS`

```lisp
(kicad_pcb
  (version 20240108)
  (generator "programmatic_pcb_generator")
  (generator_version "1.0")
  (general
    (thickness 1.6)
  )
  (paper "A4")
  (layers
    (0 "F.Cu" signal)
    (1 "In1.Cu" signal)
    (2 "In2.Cu" signal)
    (31 "B.Cu" signal)
    (32 "B.Adhes" user "B.Adhesive")
    (33 "F.Adhes" user "F.Adhesive")
    (34 "B.Paste" user)
    (35 "F.Paste" user)
    (36 "B.SilkS" user "B.Silkscreen")
    (37 "F.SilkS" user "F.Silkscreen")
    (38 "B.Mask" user "B.Soldermask")
    (39 "F.Mask" user "F.Soldermask")
    (40 "User.Drawings" user "User.Drawings")
    (41 "User.Comments" user "User.Comments")
    (42 "User.Eco1" user)
    (43 "User.Eco2" user)
    (44 "Edge.Cuts" user)
    (45 "Margin" user)
    (46 "B.CrtYd" user "B.Courtyard")
    (47 "F.CrtYd" user "F.Courtyard")
    (48 "B.Fab" user)
    (49 "F.Fab" user)
    (50 "User.1" user)
  )
  (setup
    (pad_to_mask_clearance 0)
  )
  (net 0 "")
  (net 1 "VCC")
  (net 2 "GND")

  (gr_text "REV 1.0"
    (at 125 105 0)
    (layer "F.SilkS")
    (uuid "11111111-2222-3333-4444-555555555555")
    (effects
      (font
        (size 1.5 1.5)
        (thickness 0.3)
      )
    )
  )

  (gr_line
    (start 100 100)
    (end 150 100)
    (stroke (width 0.1) (type solid))
    (layer "Edge.Cuts")
    (uuid "a0000001-0000-0000-0000-000000000001")
  )
  (gr_line
    (start 150 100)
    (end 150 150)
    (stroke (width 0.1) (type solid))
    (layer "Edge.Cuts")
    (uuid "a0000001-0000-0000-0000-000000000002")
  )
  (gr_line
    (start 150 150)
    (end 100 150)
    (stroke (width 0.1) (type solid))
    (layer "Edge.Cuts")
    (uuid "a0000001-0000-0000-0000-000000000003")
  )
  (gr_line
    (start 100 150)
    (end 100 100)
    (stroke (width 0.1) (type solid))
    (layer "Edge.Cuts")
    (uuid "a0000001-0000-0000-0000-000000000004")
  )

  (footprint "Resistor_THT:R_Axial_DIN0207_L6.3mm_D2.5mm_P7.62mm_Horizontal"
    (layer "F.Cu")
    (uuid "b0000002-0000-0000-0000-000000000001")
    (at 125 120 0)
    (property "Reference" "R1"
      (at 0 -2.5 0)
      (layer "F.SilkS")
      (uuid "b0000002-0000-0000-0000-000000000002")
      (effects (font (size 1 1) (thickness 0.15)))
    )
    (property "Value" "10k"
      (at 0 2.5 0)
      (layer "F.Fab")
      (uuid "b0000002-0000-0000-0000-000000000003")
      (effects (font (size 1 1) (thickness 0.15)))
    )
    (pad "1" thru_hole circle
      (at -3.81 0)
      (size 1.6 1.6)
      (drill 0.8)
      (layers "*.Cu" "*.Mask")
      (net 1 "VCC")
      (uuid "b0000002-0000-0000-0000-000000000004")
    )
    (pad "2" thru_hole circle
      (at 3.81 0)
      (size 1.6 1.6)
      (drill 0.8)
      (layers "*.Cu" "*.Mask")
      (net 2 "GND")
      (uuid "b0000002-0000-0000-0000-000000000005")
    )
  )

  (segment
    (start 121.19 120)
    (end 115 120)
    (width 0.25)
    (layer "F.Cu")
    (net 1)
    (uuid "c0000003-0000-0000-0000-000000000001")
  )

  (via
    (at 115 120)
    (size 0.8)
    (drill 0.4)
    (layers "F.Cu" "B.Cu")
    (net 1)
    (uuid "c0000003-0000-0000-0000-000000000002")
  )
)
```

---

### 3. Exact Syntax Details & KiCad 7 vs KiCad 8 Differences

#### Version Strings
- **KiCad 7:** Format version `20221018` (e.g. KiCad 7.0 file format).
- **KiCad 8:** Format version `20240108` (e.g. KiCad 8.0 file format).
- Both KiCad 7 and KiCad 8 use S-expressions. KiCad 8 accepts `20221018` (auto-upgrades upon saving) but expects `20240108` for native 8.0 files.

#### Layer Table Enumeration
In KiCad's S-expression schema, layers are mapped by integer ID, canonical string name, and type (`signal`, `user`, or custom display string):
- **0:** `"F.Cu"` (`signal`)
- **1..30:** `"In1.Cu"` .. `"In30.Cu"` (`signal` or `power`)
- **31:** `"B.Cu"` (`signal`)
- **32..33:** `"B.Adhes"`, `"F.Adhes"` (`user`)
- **34..35:** `"B.Paste"`, `"F.Paste"` (`user`)
- **36..37:** `"B.SilkS"`, `"F.SilkS"` (`user`)
- **38..39:** `"B.Mask"`, `"F.Mask"` (`user`)
- **40..43:** `"User.Drawings"`, `"User.Comments"`, `"User.Eco1"`, `"User.Eco2"` (`user`)
- **44:** `"Edge.Cuts"` (`user`)
- **45:** `"Margin"` (`user`)
- **46..47:** `"B.CrtYd"`, `"F.CrtYd"` (`user`)
- **48..49:** `"B.Fab"`, `"F.Fab"` (`user`)
- **50+:** `"User.1"` .. `"User.9"` (`user`)

#### Stroke Syntax
Starting in KiCad 7, graphic lines, arcs, circles, and polygons specify line width and stroke style using a nested `stroke` token:
```lisp
(stroke (width 0.15) (type solid)) ; Types: solid, dash, dot, dash_dot
```
*(In older KiCad 5/6 formats, width was specified directly as `(width 0.15)` without the `stroke` wrapper).*

#### Pad Syntax & Wildcards
- **Through-Hole (THT):**
  ```lisp
  (pad "1" thru_hole circle (at 0 0) (size 1.6 1.6) (drill 0.8) (layers "*.Cu" "*.Mask") (net 1 "VCC"))
  ```
  The wildcard `"*.Cu"` means the pad exists on all copper layers (Top, Bottom, and Inner layers). `"*.Mask"` applies soldermask relief on both Top and Bottom masks.
- **Surface Mount (SMD):**
  ```lisp
  (pad "1" smd rect (at 0 0) (size 1.2 1.5) (layers "F.Cu" "F.Paste" "F.Mask") (net 2 "GND"))
  ```
  SMD pads explicitly enumerate the target copper layer and corresponding paste/mask layers.

#### Thermal & Zone Syntax
Copper fill zones define filled copper pours attached to a net:
```lisp
(zone
  (net 2)
  (net_name "GND")
  (layer "B.Cu")
  (uuid "d0000004-0000-0000-0000-000000000001")
  (hatch full 0.5)
  (connect_pads (clearance 0.5))
  (min_thickness 0.25)
  (fill (thermal_gap 0.5) (thermal_bridge_width 0.5))
  (polygon
    (pts
      (xy 100 100)
      (xy 150 100)
      (xy 150 150)
      (xy 100 150)
    )
  )
)
```

---

### 4. `kicad-cli` Export Commands & Drill Generation

KiCad 7 and 8 provide a headless CLI executable (`kicad-cli`) for build pipelines and CI/CD automation.

#### Export Gerbers
```bash
kicad-cli pcb export gerbers \
  --output ./gerbers/ \
  --layers "F.Cu,B.Cu,F.SilkS,B.SilkS,F.Mask,B.Mask,Edge.Cuts" \
  --use-drill-file-origin \
  --subtract-soldermask \
  --exclude-value \
  example.kicad_pcb
```

#### Export Excellon Drills
```bash
kicad-cli pcb export drill \
  --output ./gerbers/ \
  --format excellon \
  --drill-origin absolute \
  --excellon-separate-th \
  --units mm \
  example.kicad_pcb
```

---

### 5. JS/TS Libraries for KiCad S-Expressions

When building a deterministic TypeScript backend, parsing and serializing KiCad S-expressions can be handled by several open-source JS/TS libraries:

1. **`kicadts` (by tscircuit / seveibar):**
   - Strongly-typed TypeScript library specifically built to construct, mutate, and serialize KiCad S-expression documents.
   - GitHub: [https://github.com/tscircuit/kicadts](https://github.com/tscircuit/kicadts)
   - npm: `npm install kicadts`
2. **`@tscircuit/kicad-converter`:**
   - Converts KiCad `.kicad_pcb` and `.kicad_mod` files into JSON and tscircuit Circuit JSON objects.
   - npm: `npm install @tscircuit/kicad-converter`
3. **`kicad-utils` (by cho45):**
   - TypeScript parser and plotter for KiCad schematics and PCBs.
   - GitHub: [https://github.com/cho45/kicad-utils](https://github.com/cho45/kicad-utils)
4. **`@typecad/kicad2typecad`:**
   - Converts KiCad PCB design data into typeCAD TypeScript formats.
   - npm: `npm install @typecad/kicad2typecad`
5. **Generic S-Expression Parsers:**
   - `@lilusoft/s-expression`: Fast S-expression string tokenizer and AST generator.
   - `sexp` (by xieyuheng): Light S-expression parser in JS ([https://github.com/xieyuheng/sexp](https://github.com/xieyuheng/sexp)).

---

## Part B — Prior Art in Programmatic Keyboard PCB Generation

### 1. Ergogen (Architecture & Pipeline)

**Repository & Specs:**
- GitHub: [https://github.com/mrzealot/ergogen](https://github.com/mrzealot/ergogen) (v3/v4), [https://github.com/ceoloide/ergogen](https://github.com/ceoloide/ergogen)
- Documentation: [https://ergogen.xyz](https://ergogen.xyz) / [https://flatfootfox.com/ergogen-introduction/](https://flatfootfox.com/ergogen-introduction/)

```
+------------------+     +------------------+     +------------------+     +-------------------+
|  YAML Config     | --> | Points Engine    | --> | Outlines Engine  | --> | PCB Assembly      |
|  (units, matrix) |     | 2D Affine Transforms|   | 2D CSG (Maker.js)|     | (Footprints + Nets|
+------------------+     +------------------+     +------------------+     +-------------------+
                                                                                     |
                                                                                     v
                                                                           unrouted .kicad_pcb
```

#### Pipeline Stages
1. **`units`:** Defines geometric constants (`cx: 19mm`, `cy: 19mm`, `padding: 1.5mm`).
2. **`points`:** Generates 2D coordinates $(x, y, r)$ for all keys using columnar staggering, rotation angles, spreads, and row/column offsets.
3. **`outlines`:** Performs 2D constructive solid geometry (CSG) operations (unions, intersections, differences, filleting) to construct plate cutouts, PCB perimeter borders, and mounting holes.
4. **`pcbs`:** Binds points to footprint templates (MX switches, hotswap sockets, diodes, microcontrollers like Seeed XIAO or Pro Micro, OLEDs, reset buttons).
5. **`cases`:** Generates 3D OpenJSCAD extrusions for plates and cases.

#### Output Structure
Ergogen outputs **unrouted `.kicad_pcb` files**. It utilizes JavaScript template scripts (`footprints/*.js`) that interpolate point positions and net names into KiCad S-expression strings.

---

### 2. Open-Source Keyboard Generators & Trace Routing Strategy

Projects such as Ergogen, `kb-pcb`, and `keeb-ppd` handle trace routing as follows:

1. **Unrouted PCB Generation (Standard Practice):**
   The generator produces footprints, nets, pads, and board outlines, but leaves copper traces unrouted.
2. **Delegation to Manual Routing or Autorouters:**
   - **Manual:** Designers open the generated `.kicad_pcb` file in KiCad and manually route traces following guidelines like *ai03's Keyboard PCB Design Guide*.
   - **Autorouting via Freerouting:** Designers export a Specctra DSN (`.dsn`) file from KiCad, pass it through Freerouting, and re-import the Specctra Session (`.ses`) file back into KiCad.
3. **Pre-routed Footprint Macros:**
   Some generators include hardcoded relative trace segments inside custom footprint definitions (e.g. pre-connecting a hotswap socket pad directly to an adjacent SMT diode pad within the footprint's local coordinate space).

---

### 3. Key Community Standards & Formats

#### Swillkb Plate & Case Builder
- Website: [http://builder.swillkb.com](http://builder.swillkb.com)
- Source: [https://github.com/swill/keyboard_case_builder](https://github.com/swill/keyboard_case_builder)
- **Function:** Reads Keyboard Layout Editor (KLE) raw JSON data and generates 2D CAD files (DXF, SVG, EPS) for laser-cut switch plates (14mm MX cutouts, Alps cutouts, Cherry plate-mount stabilizer cutouts) and sandwich cases.

#### ai03 Keyboard PCB Design Guide
- Wiki: [https://wiki.ai03.com/books/pcb-design](https://wiki.ai03.com/books/pcb-design)
- Repository: [https://github.com/ai03-2725/ai03-keyboard-pcb-guide](https://github.com/ai03-2725/ai03-keyboard-pcb-guide)
- **Key Rules for Keyboard PCBs:**
  - 2-layer PCB stackup: Top layer (`F.Cu`) reserved for horizontal/vertical signal routing; Bottom layer (`B.Cu`) filled with a continuous `GND` copper plane.
  - ESD protection IC (e.g., PRTR5V0U2X) placed immediately adjacent to the USB-C port.
  - Decoupling capacitors (0.1µF) placed close to MCU power pins.
  - Matrix diodes placed in series with switches to eliminate ghosting.

#### Figma / KLE to PCB Conversion Tools
- **`kicad-kbplacer`:** KiCad plugin that parses KLE JSON or Ergogen points to automatically position switch and diode footprints on the board ([https://github.com/adamws/kicad-kbplacer](https://github.com/adamws/kicad-kbplacer)).
- **`kle2netlist` / `kle2kicad`:** CLI tools that convert KLE JSON layouts into netlists and initial KiCad PCB files.

#### Keyboard Layout Editor (KLE) Raw Data JSON Format
- Website: [https://keyboard-layout-editor.com](https://keyboard-layout-editor.com)
- Format Wiki: [https://github.com/ijprest/keyboard-layout-editor/wiki/Serialized-Data-Format](https://github.com/ijprest/keyboard-layout-editor/wiki/Serialized-Data-Format)

KLE serializes layout data as a JSON array of arrays:
- **First Element (Optional):** Metadata object `{ "name": "My Layout", "author": "Alice" }`.
- **Subsequent Elements:** Arrays representing key rows.
- **Row Elements:** Either string legends or property modifier objects.

```json
[
  { "name": "3x3 Macropad" },
  [ { "w": 1, "h": 1, "c": "#cccccc" }, "Key 1", "Key 2", "Key 3" ],
  [ "Key 4", "Key 5", "Key 6" ],
  [ { "x": 0.5, "r": 15, "rx": 2, "ry": 2 }, "Key 7", "Key 8", "Key 9" ]
]
```

**Key Modifier Object Properties:**
- `x`, `y`: Relative X/Y offsets in key units $u$ ($1u = 19.05\text{ mm}$).
- `w`, `h`: Key width and height in $u$ (default `1.0`).
- `r`: Rotation angle in degrees.
- `rx`, `ry`: Rotation origin coordinates.
- `c`, `t`: Keycap background and text hex colors (`"#ffffff"`).
- `p`: Keycap profile (e.g., `"DSA"`, `"OEM R3"`).

---

### 4. Deterministic Auto-Router Algorithms for 2-Layer Keyboard PCBs

For a programmatic TypeScript PCB generator, deterministic routing algorithms can be categorized into three primary approaches:

```
+-----------------------------------------------------------------------------------+
|                        Deterministic Routing Algorithms                           |
+-----------------------------------+-----------------------------------------------+
| Algorithm Class                   | Characteristics                               |
+-----------------------------------+-----------------------------------------------+
| 1. Grid-based Lee / A*            | - Breadth-First / Heuristic search on grid    |
|                                   | - Guarantees shortest path if grid is fine    |
|                                   | - Layer bias: Top=Horizontal, Bottom=Vertical |
+-----------------------------------+-----------------------------------------------+
| 2. Channel & Line-Expansion       | - Mikami-Tabuchi / Hightower ray expansion    |
| (Gridless)                        | - Fast, memory-efficient for sparse layouts   |
|                                   | - Routes tracks in inter-switch channels      |
+-----------------------------------+-----------------------------------------------+
| 3. Topological Freerouting Engine | - Specctra DSN export -> Topological Graph    |
| (Push-and-Shove + Ripup)          | - Elastic queue push-and-shove + ripup reroute|
|                                   | - Exports Specctra SES session back to KiCad  |
+-----------------------------------+-----------------------------------------------+
```

#### A. Grid-based Lee / A* Maze Routing
- **Lee's Algorithm (1961):** Breadth-first grid exploration that guarantees finding an optimal path if one exists.
- **A* Maze Router:** Uses Manhattan distance $h(n) = |x_1 - x_2| + |y_1 - y_2|$ plus via cost penalty $P_{\text{via}}$ to guide pathfinding.
- **Keyboard Optimization:** Use orthogonal layer assignment:
  - `F.Cu`: Horizontal trace segments
  - `B.Cu`: Vertical trace segments
  - Vias placed at layer transitions.

#### B. Channel Routing & Line-Expansion
- **Line-Expansion (Mikami-Tabuchi / Hightower):** Casts orthogonal rays from source and target pins. When rays intersect, a trace is established.
- **Channel Routing:** Keyboard matrices naturally form rectangular channels between switch rows and columns. Traces are assigned to channels, preventing trace crossover on single layers.

#### C. Freerouting Algorithm (Specctra DSN/SES Integration)
- Source: [https://github.com/freerouting/freerouting](https://github.com/freerouting/freerouting)
- **Workflow:**
  1. KiCad exports a Specctra DSN (`.dsn`) text file containing component locations, pad coordinates, board outlines, keepouts, and netlists.
  2. Freerouting builds a topological spatial clearance graph using convex polygon triangulation.
  3. **Multi-Pass Routing:**
     - **Initial Pass:** A* pathfinding along topological graph edges.
     - **Push-and-Shove:** Dynamically pushes existing traces and vias sideways to make room for new connections without violating DRC clearances.
     - **Ripup-and-Reroute:** Unroutes conflicting traces when push-and-shove fails, routes the higher-priority connection, and re-enqueues ripped traces.
     - **Optimization:** Reduces via count and smooths trace corners to 45° chamfers.
  4. Exports a Specctra Session (`.ses`) file, which KiCad imports to generate final PCB segments and vias.

---

## Part C — QMK Firmware `info.json` Format for Custom Macropad

QMK firmware uses `info.json` as a data-driven keyboard specification. It replaces legacy C header files (`config.h`, `keyboard.h`) by explicitly defining controller MCU pins, matrix diode orientation, and physical key positions.

### 1. Minimal Schema Specification

- **`keyboard_name`:** String name of the device.
- **`manufacturer`:** String manufacturer or designer.
- **`processor`:** MCU target (e.g. `"atmega32u4"`, `"RP2040"`).
- **`bootloader`:** Bootloader type (e.g. `"caterina"`, `"halfkay"`, `"rp2040"`).
- **`matrix_pins`:**
  - `cols`: Array of GPIO pin identifiers for matrix columns.
  - `rows`: Array of GPIO pin identifiers for matrix rows.
- **`diode_direction`:** String `"COL2ROW"` or `"ROW2COL"`.
- **`layouts`:** Object containing named physical layouts (typically `"LAYOUT"`).
  - `layout`: Array of key objects specifying:
    - `matrix`: `[row_idx, col_idx]`
    - `x`, `y`: Physical coordinates in unit keys $u$.
    - `w`, `h`: Optional key width/height (default `1`).

---

### 2. Complete Valid 3x3 Macropad `info.json` Example

Below is a complete, syntactically valid QMK `info.json` file for a 9-key (3x3) macropad driven by an ATmega32U4 controller:

```json
{
  "keyboard_name": "3x3 Macropad",
  "manufacturer": "Custom Build",
  "url": "https://github.com/example/macropad3x3",
  "maintainer": "anon",
  "processor": "atmega32u4",
  "bootloader": "caterina",
  "diode_direction": "COL2ROW",
  "matrix_pins": {
    "cols": ["F4", "F5", "F6"],
    "rows": ["B1", "B2", "B3"]
  },
  "layouts": {
    "LAYOUT": {
      "layout": [
        { "matrix": [0, 0], "x": 0, "y": 0 },
        { "matrix": [0, 1], "x": 1, "y": 0 },
        { "matrix": [0, 2], "x": 2, "y": 0 },

        { "matrix": [1, 0], "x": 0, "y": 1 },
        { "matrix": [1, 1], "x": 1, "y": 1 },
        { "matrix": [1, 2], "x": 2, "y": 1 },

        { "matrix": [2, 0], "x": 0, "y": 2 },
        { "matrix": [2, 1], "x": 1, "y": 2 },
        { "matrix": [2, 2], "x": 2, "y": 2 }
      ]
    }
  }
}
```

---

## References & Source URLs

1. **KiCad File Formats Documentation:**
   - [https://dev-docs.kicad.org/en/file-formats/sexpr-pcb/index.html](https://dev-docs.kicad.org/en/file-formats/sexpr-pcb/index.html)
   - [https://docs.kicad.org/8.0/en/pcbnew/pcbnew.html](https://docs.kicad.org/8.0/en/pcbnew/pcbnew.html)
2. **KiCad CLI Command Line Reference:**
   - [https://docs.kicad.org/8.0/en/cli/cli.html](https://docs.kicad.org/8.0/en/cli/cli.html)
3. **Ergogen Keyboard Generator:**
   - [https://github.com/mrzealot/ergogen](https://github.com/mrzealot/ergogen)
   - [https://github.com/ceoloide/ergogen](https://github.com/ceoloide/ergogen)
   - [https://ergogen.xyz](https://ergogen.xyz)
4. **ai03 Keyboard PCB Design Guide:**
   - [https://wiki.ai03.com/books/pcb-design](https://wiki.ai03.com/books/pcb-design)
   - [https://github.com/ai03-2725/ai03-keyboard-pcb-guide](https://github.com/ai03-2725/ai03-keyboard-pcb-guide)
5. **Swillkb Plate & Case Builder:**
   - [http://builder.swillkb.com](http://builder.swillkb.com)
   - [https://github.com/swill/keyboard_case_builder](https://github.com/swill/keyboard_case_builder)
6. **Keyboard Layout Editor (KLE) Format:**
   - [https://keyboard-layout-editor.com](https://keyboard-layout-editor.com)
   - [https://github.com/ijprest/keyboard-layout-editor/wiki/Serialized-Data-Format](https://github.com/ijprest/keyboard-layout-editor/wiki/Serialized-Data-Format)
7. **Freerouting Autorouter:**
   - [https://github.com/freerouting/freerouting](https://github.com/freerouting/freerouting)
8. **QMK `info.json` Reference:**
   - [https://docs.qmk.fm/reference_info_json](https://docs.qmk.fm/reference_info_json)
   - [https://github.com/qmk/qmk_firmware/blob/master/docs/reference_info_json.md](https://github.com/qmk/qmk_firmware/blob/master/docs/reference_info_json.md)
9. **TypeScript / JavaScript KiCad Libraries:**
   - [https://github.com/tscircuit/kicadts](https://github.com/tscircuit/kicadts)
   - [https://www.npmjs.com/package/@tscircuit/kicad-converter](https://www.npmjs.com/package/@tscircuit/kicad-converter)
   - [https://github.com/cho45/kicad-utils](https://github.com/cho45/kicad-utils)
