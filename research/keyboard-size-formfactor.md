# keyboard size and form-factor vernacular: community classes, area clusters, and engine impacts

> thesis: keyboard size percentages (100%, 96%, 1800, 80%/tkl, 75%, 65%, 60%, 40%) represent informal community vernacular for chassis footprints and cluster inclusions rather than formal engineering standards. each size step systematically drops or compresses physical key clusters, directly determining switch matrix bounds in circuitron and plate enclosure geometry in paracraft.

or simply put: non-engineers pick a keyboard size based on desk space and numpad/arrow preference. circuitron translates that choice into electrical matrix pinouts and keycap kitting rules, while paracraft uses it to bound the plate and case cutout geometry.

---

## 1. the size ladder & form-factor definitions

unlike physical layout standards (ansi, iso, jis) governed by official standards bodies, keyboard size classes evolved through custom keyboard community consensus on forums (geekhack, deskthority, reddit) and vendor product nomenclature `[evid-sz-010]`. the naming ladder uses standard full-size (100%) as its baseline:

### 100% (full-size)
* **composition**: includes all four standard regions: alphanumeric block, function row, navigation cluster, and numeric keypad `[evid-sz-001]`.
* **key count**: 104 keys in US ANSI format, 105 keys in European ISO format `[evid-sz-001]`.
* **footprint**: maximum width (~44 cm / ~23u wide), requiring significant desk space and wide mouse travel distance.

### 96% (compact full-size)
* **composition**: retains full numeric keypad and alphanumeric functionality but eliminates empty spacing gaps between clusters `[evid-sz-003]`.
* **key count**: typically 96 to 98 keys `[evid-sz-003]`.
* **layout changes**: arrow keys and numpad are squeezed flush against the alphanumeric block. modifier keys on the right bottom row shrink from 1.25u to 1u, and right shift shrinks from 2.75u to 1.75u `[evid-sz-013]`.

### 1800 / 98% (1800-compact)
* **lineage**: derived from the classic Cherry G80-1800 industrial keyboard footprint `[evid-sz-004]`.
* **composition**: includes a full numeric keypad and dedicated arrow keys, but isolates the arrow cluster and numpad with small physical gaps or frame blockers `[evid-sz-004]`.
* **key count**: usually 98 keys `[evid-sz-003]`, `[evid-sz-004]`.
* **trade-offs**: slightly wider than 96% due to spacing blockers, but easier for blind-touch navigation.

### 80% / tkl (tenkeyless)
* **composition**: retains the alphanumeric block, function row, navigation cluster, and dedicated arrow keys while completely removing the numeric keypad `[evid-sz-002]`.
* **key count**: 87 keys in ANSI format, 88 keys in ISO format `[evid-sz-002]`.
* **footprint**: reduces chassis width by approximately 8 cm (~6u width reduction), bringing mouse placement closer to the home row.

### 75% (compressed tkl)
* **composition**: retains the function row and dedicated arrow keys, but removes all cluster spacing gaps and stacks navigation keys in a single vertical column `[evid-sz-005]`.
* **key count**: 80 to 84 keys `[evid-sz-005]`.
* **layout changes**: the function row touches the number row directly. right shift is reduced to 1.75u to make room for up/left/down/right arrow keys `[evid-sz-013]`.

### 65% (compact with arrows)
* **composition**: drops the dedicated top function row (F1-F12) and primary navigation cluster, but retains physical arrow keys and a 1u-wide column of select nav keys (Del, PgUp, PgDn) on the right edge `[evid-sz-006]`.
* **key count**: 67 to 68 keys `[evid-sz-006]`.
* **layout changes**: F-keys are accessed via Fn layer combinations (Fn + 1 = F1).

### 60% (pure alphanumeric block)
* **composition**: eliminates function row, navigation cluster, and dedicated arrow keys, consisting strictly of the alphanumeric block `[evid-sz-007]`.
* **key count**: 61 keys in ANSI format, 62 keys in ISO format `[evid-sz-007]`.
* **layer dependency**: requires QMK/VIA Fn layer hotkeys for arrow navigation, F-keys, and editing operations `[evid-sz-014]`. uses completely standard keycap sizes (2.25u left shift, 2.75u right shift, 6.25u spacebar) `[evid-sz-007]`.

### 40% (ultra-compact / ortholinear)
* **composition**: removes the number row (1-0), function row, navigation cluster, and arrow keys `[evid-sz-008]`.
* **key count**: 40 to 48 keys `[evid-sz-008]`.
* **geometry & layers**: often configured in orthogonal grids (ortholinear) or staggered compact layouts. relies heavily on multiple Fn layers (e.g. Raise/Lower layers) and momentary tap-hold modifier logic `[evid-sz-008]`.

---

## 2. area clusters & reference image color-coding

as visualized in the scope reference diagram (`scope/reference/images/size-formfactor-compact-tkl-full.png`), keyboards are constructed from discrete, modular sub-regions `[evid-sz-009]`:

1. **alphanumeric block**: contains letter keys (A-Z), digit/symbol row (1-0), punctuation, and core perimeter modifiers (Tab, Caps Lock, Shift, Control, Alt/Option, Command/OS, Enter, Backspace) `[evid-sz-001]`, `[evid-sz-009]`.
2. **function row**: top horizontal row containing Esc and F1 through F12 keys `[evid-sz-001]`, `[evid-sz-005]`.
3. **navigation cluster**: 2x3 or 3x2 block above the arrow cluster containing Insert, Home, Page Up, Delete, End, and Page Down `[evid-sz-001]`, `[evid-sz-002]`.
4. **arrow cluster**: inverted-T or inline directional cluster (Up, Down, Left, Right) `[evid-sz-002]`, `[evid-sz-006]`.
5. **numeric keypad (numpad)**: 17-key right-hand grid with 0-9 digits, decimal point, basic arithmetic operators (`+`, `-`, `*`, `/`), Num Lock, and dedicated Numpad Enter `[evid-sz-001]`, `[evid-sz-003]`.

---

## 3. size-class reference table

| Size Class | Key Range | Kept Clusters / Features | Dropped / Compressed Clusters | Evidence Pointers |
| :--- | :--- | :--- | :--- | :--- |
| **100% (Full-Size)** | 104 (ANSI) / 105 (ISO) | Alpha block, F-row, nav cluster, arrow cluster, numpad | None (full standard layout) | `[evid-sz-001]` |
| **96% (Compact Full)** | 96 - 98 | Alpha block, F-row, compressed arrows, numpad | Cluster spacing gaps eliminated; right shift reduced to 1.75u | `[evid-sz-003]`, `[evid-sz-013]` |
| **1800 / 98%** | 98 | Alpha block, F-row, isolated arrows, numpad | Full nav cluster dropped; replaced with spacing blockers | `[evid-sz-004]` |
| **80% (TKL)** | 87 (ANSI) / 88 (ISO) | Alpha block, F-row, nav cluster, arrow cluster | Numeric keypad completely removed | `[evid-sz-002]` |
| **75%** | 80 - 84 | Alpha block, compressed F-row, dedicated arrows, vertical nav column | Cluster spacing gaps removed; F-row touches number row | `[evid-sz-005]` |
| **65%** | 67 - 68 | Alpha block, dedicated arrow cluster, single nav column | Dedicated F-row dropped; numpad dropped | `[evid-sz-006]` |
| **60%** | 61 (ANSI) / 62 (ISO) | Alphanumeric block strictly | F-row dropped; nav cluster dropped; arrow cluster dropped | `[evid-sz-007]`, `[evid-sz-014]` |
| **40%** | 40 - 48 | Alphanumeric core keys | Number row dropped; F-row dropped; nav & arrow clusters dropped | `[evid-sz-008]` |

---

## 4. naming provenance & vendor terminology variations

### absence of formal standards
unlike ISO/IEC 9995-2 or ANSI/INCITS 154-1988, no formal standards organization regulates keyboard size percentage naming `[evid-sz-010]`. percentage labels are informal metrics created by custom keyboard vendors and community forums `[evid-sz-010]`.

### math accuracy vs marketing shorthand
percentage values do not represent exact mathematical ratios relative to 104 keys `[evid-sz-010]`:
* an 87-key TKL is mathematically 83.6% of a 104-key board, but is universally called **80%** or **TKL** `[evid-sz-002]`, `[evid-sz-010]`.
* a 61-key board is mathematically 58.6% of a 104-key board, but is rounded to **60%** `[evid-sz-007]`, `[evid-sz-010]`.
* a 67-key board is mathematically 64.4% of a 104-key board, labeled as **65%** or **68%** depending on vendor `[evid-sz-011]`.

### common naming inconsistencies across vendors
* **65% vs 68%**: vendors like Magicforce label 68-key boards as "68%", while Keychron and Drop classify 67-68 key boards as "65%" `[evid-sz-011]`.
* **96% vs 98% vs 1800-compact**: keyboards with 96 to 98 keys with numpads are labeled interchangeably as "96%", "98%", "1800 compact", or "1800 mini" `[evid-sz-003]`, `[evid-sz-004]`, `[evid-sz-011]`.
* **70% / 70-key**: rare intermediate class (e.g., FRL-75 or 70% split) occasionally used by boutique vendors.

---

## 5. keeberia product & engine relevance

in keeberia, a user begins device creation by choosing a size class. this high-level selection drives concrete operations across keeberia's engine pipeline:

### 1. circuitron (pcb matrix & netlist engine)
* **matrix switch count**: size class dictates total switch footprints and matrix scanning pin counts `[evid-sz-012]`. a 100% board requires 104 switch positions, while a 60% board requires only 61 positions `[evid-sz-001]`, `[evid-sz-007]`.
* **electrical matrix bounds**: determines the row-and-column matrix layout (e.g. 5x15 matrix for 60% vs 6x19 matrix for 100%) `[evid-sz-012]`.
* **keycap kitting BOM validation**: compressed size classes (96%, 75%, 65%) require non-standard modifier key sizes (1.75u right shift, 1u alt/fn/ctrl) `[evid-sz-013]`. circuitron flags keycap set incompatibilities if the user selects a standard 104-key keycap set for a 75% or 96% PCB `[evid-sz-013]`.

### 2. paracraft (case CAD & plate cutout engine)
* **plate footprint & outer boundary**: size class defines bounding dimensions for the plate, top case frame, and bottom housing `[evid-sz-012]`.
* **switch cutout coordinates**: generates precise X/Y cutout positions for switches and stabilizers based on cluster offsets `[evid-sz-012]`.

### 3. firmware & layer generator
* **Fn layer auto-generation**: for boards smaller than TKL (60%, 65%, 40%), the firmware builder automatically injects default Fn layer hotmaps for missing physical keys (e.g. mapping Fn + 1-12 to F1-F12 and Fn + WASD/IJKL to arrow navigation) `[evid-sz-014]`.

---

## open questions

1. **vendor terminology normalization in builder ui**: how should keeberia's UI present ambiguous size labels (e.g., presenting "96% / 1800 Compact" as a unified category while exposing key-count sub-variants 96 vs 98 in advanced options)?
2. **matrix pin count optimization**: for 96% and 100% layouts, should circuitron default to duplexed switch matrices (e.g. 9x11) to conserve MCU I/O pins, or maintain standard row/column geometry matching physical clusters?
3. **split spacebar rules on compact boards**: how should keycap BOM verification handle split spacebar options (e.g., 2.25u + 1.25u + 2.75u) on 60% and 65% layouts where standard spacebar wire lengths differ?
