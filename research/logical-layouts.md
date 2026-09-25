# logical keyboard layout families: software remaps, physical exceptions, and engine impacts

> thesis: logical keyboard layouts (dvorak, colemak, workman, colemak-dh) are pure software keycode remappings over an unchanged physical ansi, iso, or jis hardware specification. physical layout geometry (pcb traces, plate cutouts, switch positions) remains 100% identical regardless of the logical character layout selected.

or simply put: a physical qwerty keyboard running an os-level dvorak mapping or a qmk-firmware colemak default layer is mechanically and electrically identical to a standard qwerty board. circuitron (pcb engine) and paracraft (case/plate engine) have zero geometry impact from logical layout selection. only non-qwerty physical exceptions (such as 3d concave maltron bowls or physical abc keyboards) alter hardware geometry.

---

## 1. the core question: logical remaps vs physical hardware

the primary distinction in keyboard layout architecture is between physical hardware format and logical scancode mapping:

* **physical hardware format (ansi / iso / jis)**: defines switch x/y positions, plate cutouts, stabilizer footprints, and pcb net traces `[evid-ll-001]`, `[evid-ll-002]`.
* **logical character layout (qwerty / dvorak / colemak / workman)**: defines character interpretation of usb hid keycodes performed by the operating system or keyboard firmware `[evid-ll-001]`, `[evid-ll-002]`, `[evid-ll-010]`.

### direct answer
dvorak, colemak, workman, and colemak-dh are pure software-level or firmware-level keycode remaps operating over unmodified physical hardware. connecting a standard ansi qwerty keyboard to an operating system set to dvorak produces a fully functional dvorak keyboard without any physical alteration to switches, plate, or pcb `[evid-ll-001]`, `[evid-ll-002]`.

---

## 2. physical non-qwerty boards: hardware geometry exceptions

while most alternative layouts are pure software remaps, a distinct class of physical non-qwerty hardware exists where physical geometry, switch placement, and pcb design differ from standard flat staggered rows:

### 3d concave contoured bowls (maltron / kinesis advantage)
* **geometry & construction**: utilizes deep 3d concave key wells angled toward individual hand structures, split thumb clusters, and non-standard switch matrix routing `[evid-ll-001]`, `[evid-ll-003]`.
* **hardware impact**: requires specialized curved plates, flexible or multi-pcb assemblies, and non-standard enclosure geometry `[evid-ll-003]`.

### assistive & educational alphabetical boards (abc layout)
* **geometry & construction**: physical key switches arranged sequentially in alphabetical order (a, b, c, d...) rather than standard qwerty staggered rows, often using enlarged keycaps `[evid-ll-004]`.
* **hardware impact**: alters key legend placement and switch matrix mapping on dedicated single-purpose hardware `[evid-ll-004]`.

### one-handed & chorded physical devices
* **geometry & construction**: physically reduced key count matrices designed for single-hand operation (e.g., maltron single-handed keyboards) `[evid-ll-003]`.
* **hardware impact**: dedicated pcb matrix, custom case enclosures, and unique thumb modifier key placements `[evid-ll-003]`.

---

## 3. design rationale of alternative logical layouts

alternative logical layouts exist to address ergonomic and efficiency limitations of qwerty:

### dvorak simplified keyboard
* **rationale**: designed by dr. august dvorak to maximize hand alternation and place high-frequency vowels and consonants on the home row, reducing finger movement `[evid-ll-005]`.

### colemak
* **rationale**: designed by shai coleman to minimize finger travel compared to qwerty while keeping common command shortcuts (z, x, c, v) in their original qwerty locations for easy adoption `[evid-ll-006]`.

### workman
* **rationale**: created by oj bucao to reduce lateral finger stretching and horizontal center-column reaching by prioritizing vertical finger movement `[evid-ll-007]`.

### colemak-dh
* **rationale**: developed by steve p as a colemak variant that moves high-frequency letters d and h off the middle center columns down to natural home-row finger curl positions `[evid-ll-008]`.

---

## 4. layout taxonomy reference table

| Layout Family | Layout Type | PCB & Hardware Geometry Impact | Primary Rationale / Hardware Characteristics | Evidence Pointers |
| :--- | :--- | :--- | :--- | :--- |
| **QWERTY** | OS Remap / Base Standard | None (Standard ANSI/ISO/JIS PCB & Plate) | De facto global standard, legacy typewriter scancode baseline | `[evid-ll-001]`, `[evid-ll-010]` |
| **Dvorak** | OS or Firmware Remap | None (Standard ANSI/ISO/JIS PCB & Plate) | Maximizes home row letter frequency and hand alternation | `[evid-ll-001]`, `[evid-ll-005]` |
| **Colemak** | OS or Firmware Remap | None (Standard ANSI/ISO/JIS PCB & Plate) | Low finger travel while preserving QWERTY shortcuts (ZXCV) | `[evid-ll-001]`, `[evid-ll-006]` |
| **Workman** | OS or Firmware Remap | None (Standard ANSI/ISO/JIS PCB & Plate) | Minimizes lateral finger reaching and horizontal effort | `[evid-ll-001]`, `[evid-ll-007]` |
| **Colemak-DH** | OS or Firmware Remap | None (Standard ANSI/ISO/JIS PCB & Plate) | Eliminates center column reaches for D and H via natural finger curl | `[evid-ll-008]`, `[evid-ll-012]` |
| **Maltron 3D** | Physical Hardware Exception | High (3D concave wells, custom PCB & enclosure) | Contoured hand wells and separate thumb clusters | `[evid-ll-001]`, `[evid-ll-003]` |
| **BigKeys / ABC** | Physical Hardware Exception | High (Custom key grid, oversized keycaps, dedicated PCB) | Physical alphabetical layout for accessibility and education | `[evid-ll-004]` |
| **One-Handed / Half** | Physical Hardware Exception | High (Compact single-hand PCB matrix and case) | Dedicated single-handed ergonomic layout | `[evid-ll-003]` |

---

## 5. firmware implementation: qmk, layers, and via/vial

logical layouts can be baked directly into microcontroller firmware or managed at runtime:

### firmware-baked layouts (qmk default layers)
qmk firmware allows baking logical keymaps directly into the keyboard controller using layer macros such as `DF(layer)` or persistent default layers `[evid-ll-009]`. when configured in firmware, the keyboard emits remapped usb hid keycodes directly to any connected host system without requiring os software layout changes `[evid-ll-009]`, `[evid-ll-010]`.

### double remapping caveat
a critical operational risk occurs when firmware-level remapping and os-level software remapping are active simultaneously `[evid-ll-013]`. if qmk emits dvorak-mapped keycodes and the host os is also configured to dvorak layout, keycodes undergo double translation, resulting in garbled text output `[evid-ll-013]`.

### runtime layout configuration (via & vial)
gui configurators like via and vial interact with qmk firmware over raw hid protocols to modify active keymaps and layer assignments stored in eeprom `[evid-ll-011]`, `[evid-ll-012]`. users can toggle default layers between qwerty, colemak, or dvorak at runtime without recompiling source code `[evid-ll-011]`, `[evid-ll-012]`.

---

## 6. product angle: implications for keeberia engines

for the keeberia platform architecture, logical layout selection is strictly isolated from hardware CAD generation:

* **circuitron (pcb engine)**: logical layout choice (qwerty vs dvorak vs colemak vs workman) has zero impact on switch footprints, trace routing, diode matrices, or stabilizer holes.
* **paracraft (case/plate engine)**: logical layout selection requires no changes to switch cutouts, plate thickness, or enclosure CAD files.
* **firmware & legend generation**: logical layouts dictate keycap legend printing specifications in BOM outputs and qmk keymap C header/json generation.

---

## open questions

1. **qmk keycode translation overhead**: does baking complex unicode or multi-layer language remappings into qmk firmware introduce noticeable latency in matrix scan loops on low-memory microcontrollers?
2. **via eeprom layer limits**: what is the exact maximum number of persistent default logical layers that via/vial can store in eeprom across standard atmega32u4 vs rp2040 microcontrollers before running out of persistent storage?
3. **os-level shortcut behavior under firmware remapping**: when qmk bakes a layout like dvorak into firmware, how do host operating systems handle modifier shortcuts (such as ctrl+c or cmd+v) that rely on virtual keycodes vs physical key positions?
