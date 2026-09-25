# physical keyboard layout standards: ansi, iso, jis, and engine impacts

> thesis: physical keyboard layout standards (ansi, iso, jis) dictate physical switch placement, plate cutouts, pcb keepouts, and stabilizer footprints. software language layouts (qwerty, qwertz, azerty) exist solely as keycap legend prints and scancode mappings on top of standard physical hardware.

or simply put: circuitron (pcb) and paracraft (case/plate) deal exclusively with physical geometry - switch cutouts, unit pitch, and stabilizer wire holes. an iso-layout plate and pcb are completely identical whether the user types in german qwertz, french azerty, or uk qwerty; only the keycap legends change.

---

## 1. the physical standards: ansi, iso, and jis

the physical layout of a keyboard dictates the size, shape, and spatial arrangement of key switches on the pcb and plate. three major standards govern international keyboard production:

### ansi (ansi/incits 154-1988)
* **enter key**: horizontal enter key, 2.25u wide, spanning 1 row with the backslash (`\`) key positioned directly above it `[evid-lay-001]`.
* **left shift**: full 2.25u left shift key.
* **spacebar**: standard 6.25u spacebar (or 7u in tsangan/wkl variants) `[evid-lay-013]`.
* **key counts**: 101 keys (legacy pre-1995), 104 keys (standard full-size with os keys), 87 keys (tenkeyless / tkl) `[evid-lay-004]`.

### iso (iso/iec 9995-2)
* **enter key**: vertical enter key spanning 2 rows, 1.25u wide on the bottom row and 1.5u wide on the top row `[evid-lay-002]`.
* **left shift**: split left shift, reducing the standard 2.25u shift to a 1.25u key and adding an extra 1u alpha/symbol key beside it `[evid-lay-005]`.
* **altgr key**: replaces the right alt key with the altgr meta-key to access third and fourth layer typographic symbols `[evid-lay-005]`.
* **key counts**: 102 keys (legacy full-size), 105 keys (standard full-size), 88 keys (tkl) - exactly 1 key more than ansi `[evid-lay-005]`.

### jis (jis x 6002-1980 / jis x 4024)
* **enter key**: vertical enter key identical to iso `[evid-lay-002]`.
* **bottom row & spacebar**: drastically shortened spacebar flanked by dedicated japanese input keys: muhenkan (non-conversion), henkan (conversion), and kana `[evid-lay-006]`, `[evid-lay-015]`.
* **modifiers & backspace**: single-unit (1u) backspace key and reduced-width right shift with an adjacent 1u key `[evid-lay-015]`.
* **key counts**: 109 keys (full-size) - 4 extra keys compared to iso, 5 extra compared to ansi `[evid-lay-006]`.

### big-ass enter (bae)
* **shape & footprint**: reverse l-shaped enter key that merges the space occupied by both ansi and iso enter keys `[evid-lay-003]`.
* **trade-offs**: consumes the area of the backslash key, forcing `\` to be relocated to a smaller backspace or right shift row. requires non-standard switch and stabilizer placement `[evid-lay-003]`.

---

## 2. regional variants: physical vs legend layer distinction

a critical requirement for keeberia engines is distinguishing between **physical format** and **logical layout**:

* **physical format (ansi / iso / jis)**: defines switch x/y positions, plate cutouts, stabilizer footprints, and pcb net traces `[evid-lay-007]`.
* **logical layout (qwerty / qwertz / azerty)**: defines character legends printed on keycaps and software scancodes sent to the operating system `[evid-lay-007]`.

### European iso regional family
all major european language layouts - including german qwertz (din 2137), french azerty, uk qwerty (bs 4822), nordic (swedish/finnish/danish/norwegian), spanish, and italian - share the exact same physical iso hardware specification `[evid-lay-007]`, `[evid-lay-008]`.

### engine implication
circuitron and paracraft do not generate different pcb traces or plate cad files for german vs french vs uk layouts. the layout geometry is 100% identical. language selection only affects keycap legend rendering, bom specification, and qmk firmware keymap generation `[evid-lay-007]`.

---

## 3. pcb & case impact: key size classes & stabilizers

### unit grid pitch
mechanical keyboard layouts use a unit metric where `1u` equals the standard center-to-center key pitch of **19.05 mm (0.75 inches)** `[evid-lay-009]`.

### stabilizer requirements
* **threshold**: keys **2u and wider** require mechanical stabilizers to prevent wobble and binding when pressed off-center `[evid-lay-010]`.
* **mechanism**: stabilizers consist of a rigid metal wire linking two sliding stems to ensure level vertical travel `[evid-lay-011]`.
* **footprint types**:
  * **pcb-mount (clip-in / screw-in)**: requires 4 holes per stabilizer (2 holes per side, 1.27mm / 3.0mm diameter) drilled directly into the pcb `[evid-lay-012]`.
  * **plate-mount**: requires extended cutouts in the plate around the switch opening for the stabilizer housing to snap into place.

### key size & stabilizer class reference table
this table provides direct design inputs for circuitron (pcb drill & keepout generation) and paracraft (plate cutout parameters):

| Key Size (u) | Pitch / Width (mm) | Stabilizer Required? | Stabilizer Wire Class | Typical Layout Functions |
| :--- | :--- | :--- | :--- | :--- |
| **1u** | 19.05 mm | No `[evid-lay-010]` | None | Alphanumerics, 1u Modifiers, JIS 1u Backspace `[evid-lay-015]` |
| **1.25u** | 23.8125 mm | No | None | Bottom row modifiers (ANSI/ISO), ISO split Left Shift |
| **1.5u** | 28.575 mm | No | None | Tab, ANSI Backslash (`\`), Ergo/Alice Modifiers |
| **1.75u** | 33.3375 mm | Rare / Optional | Optional 2u / None | Caps Lock, Stepped Caps Lock, Compact Right Shift (65%/75%) |
| **2u** | 38.10 mm | Yes `[evid-lay-010]` | 2u Wire `[evid-lay-013]` | ANSI/ISO Backspace, Numpad Enter/0/+, Ortholinear 2u Space |
| **2.25u** | 42.8625 mm | Yes `[evid-lay-010]` | 2u Wire `[evid-lay-013]` | ANSI Horizontal Enter `[evid-lay-001]`, ANSI Left Shift, Alice Split Space |
| **2.75u** | 52.3875 mm | Yes `[evid-lay-010]` | 2u Wire `[evid-lay-013]` | ANSI Right Shift, Alice Split Space |
| **3u** | 57.15 mm | Yes | 3u / Custom Wire | Ergonomic / Alice Split Spacebar |
| **6u** | 114.30 mm | Yes | 6u Wire | Off-center Spacebar (HHKB / Vintage) |
| **6.25u** | 119.0625 mm | Yes `[evid-lay-010]` | 6.25u Wire `[evid-lay-013]` | Standard ANSI / ISO Spacebar `[evid-lay-013]` |
| **7u** | 133.35 mm | Yes `[evid-lay-010]` | 7u Wire `[evid-lay-013]` | Tsangan / WKL / Vintage Spacebar `[evid-lay-013]` |

---

## 4. non-standard physical layouts

community-driven layouts do not adhere to formal standards organizations (ansi/iso/jis), operating instead on community conventions defined in open-source tools (qmk, kle, via) `[evid-lay-014]`:

### ortholinear
* **geometry**: keys are aligned in a straight 90-degree orthogonal grid with zero row stagger (e.g., planck 40%, preonic 50%) `[evid-lay-014]`.
* **hardware impact**: uses uniform 1u keycaps with optional 2u central spacebars. simplifies pcb routing and plate cutouts due to grid symmetry.

### columnar stagger & ergo / alice
* **geometry**: vertical columns are staggered to match individual finger lengths, or split into two angled halves (e.g., ergodox, alice) `[evid-lay-014]`.
* **hardware impact**: utilizes non-standard spacebar sizes (2.25u, 2.75u, 3u) and unique plate cutouts angled at 10-15 degrees relative to the case frame.

### 40% form factor
* **geometry**: ultra-compact keyboards (~40-48 keys) that eliminate the number row, function row, and dedicated arrow keys `[evid-lay-014]`.
* **hardware impact**: requires custom keycap size compatibility (e.g., 1u modifiers) and relies entirely on qmk/via momentary/toggle layers for numbers and symbols `[evid-lay-014]`.

---

## open questions

1. **plate cutout tolerances for stabilizers**: what exact clearance margins (in mm) must paracraft apply to plate stabilizer cutouts across different materials (3mm acrylic vs 1.5mm aluminum vs 3d-printed petg) to prevent wire binding?
2. **universal pcb pad overlap**: how should circuitron handle universal ansi/iso pcb footprints (where iso enter and ansi enter switch pads overlap) without triggering drc annular ring or clearance violations?
3. **6u spacebar wire & stem center offsets**: what are the exact stem spacing standards for 6u spacebars across different keycap profiles (gmk vs signature plastics), given that 6u spacebars historically used off-center switch stems?
