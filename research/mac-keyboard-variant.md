# mac keyboard variants: physical vs logical layout standard

> thesis: mac keyboards share the exact physical switch footprint, plate cutouts, unit pitch, and stabilizer geometry of standard ansi (or iso) physical layouts. the distinction between mac and pc layout variants exists strictly at the logical layer through keycap legend printing, scancode interpretation, and firmware modifier remapping.

or simply put: circuitron (pcb) and paracraft (case/plate) do not generate custom switch matrices or plate cutout variations for mac support. an ansi-layout pcb and plate support macos natively; only keycap legend prints (command instead of win, option instead of alt) and qmk firmware keymap mappings change.

---

## 1. the core distinction: physical hardware vs logical layout

a fundamental architectural rule in keyboard layout design is separating physical hardware geometry from logical software scancode mapping:

* **physical geometry**: switch x/y grid coordinates, unit pitch (19.05 mm), plate stabilizer cutouts, and pcb matrix traces `[evid-mac-004]`.
* **logical mapping**: character legends printed on keycaps and usb hid scancodes sent to the operating system `[evid-mac-001]`, `[evid-mac-003]`.

### physical footprint equivalence
standalone mac desktop keyboards (such as the apple magic keyboard) and mac-compatible custom mechanical keyboards adhere to standard ansi or iso physical layouts `[evid-mac-004]`. on standard mechanical keyboards, mac layouts utilize identical 1.25u or 1.5u modifier keycaps, standard 6.25u spacebars, and standard ansi enter and shift footprints.

### logical scancode interpretation
at the usb hid protocol level, mac modifier keys send standard usb hid keyboard usage codes `[evid-mac-003]`:
* **command (cmd / ⌘)**: sends usb hid usage `0xe3` (keyboard left gui / super) `[evid-mac-003]`. macos maps this scancode to primary system shortcuts like copy, paste, and save `[evid-mac-001]`, `[evid-mac-002]`.
* **option (opt / ⌥)**: sends usb hid usage `0xe2` (keyboard left alt) `[evid-mac-003]`. macos uses this for special character insertion and secondary menu functions `[evid-mac-001]`, `[evid-mac-002]`.
* **control (ctrl / ⌃)**: sends usb hid usage `0xe0` (keyboard left control) `[evid-mac-003]`.

when a standard pc ansi keyboard is connected to a mac, the physical keys function directly by swapping alt for option and the windows key for command `[evid-mac-001]`.

---

## 2. arrow cluster geometry: half-height vs full-height

### apple laptop and magic keyboard implementation
apple standalone wireless keyboards and built-in macbook keyboards feature an inverted-t arrow cluster with half-height left and right (or up and down) arrow keycaps `[evid-mac-004]`. this half-height geometry is a low-profile chiclet keycap and scissor-switch design choice engineered for thin laptop enclosures and low-profile desktop accessories `[evid-mac-004]`.

### mechanical keyboard implementation
on custom mechanical keyboards configured for macos (such as 65% or 75% compact boards), the inverted-t arrow cluster uses standard 1u full-height keycaps and uniform mechanical switch cutouts `[evid-mac-005]`. circuitron and paracraft do not need to create half-height switch cutouts or custom plate geometry for mac arrow clusters; standard 1u mechanical switch pitch is retained `[evid-mac-005]`.

---

## 3. modifier row order, fn key shortcuts, and menu key absence

### bottom row modifier layout
the standard mac bottom-row modifier sequence on the left side of the spacebar is:
1. **control (ctrl)** (1.25u)
2. **option (alt)** (1.25u)
3. **command (gui)** (1.25u)

this contrasts with the standard pc bottom-row modifier sequence:
1. **control** (1.25u)
2. **windows (gui)** (1.25u)
3. **alt** (1.25u)

on mac keyboards, the command key sits directly adjacent to the spacebar to facilitate thumb-driven shortcut execution `[evid-mac-005]`.

### fn key navigation layer
because compact mac keyboards (78-key ansi / 79-key iso) omit dedicated navigation blocks (home, end, page up, page down, insert, delete) `[evid-mac-004]`, macos provides standard fn key combinations `[evid-mac-006]`, `[evid-mac-007]`:
* **fn + up arrow**: page up `[evid-mac-006]`
* **fn + down arrow**: page down `[evid-mac-006]`
* **fn + left arrow**: home `[evid-mac-006]`
* **fn + right arrow**: end `[evid-mac-006]`
* **fn + delete**: forward delete `[evid-mac-007]`

### absence of physical context menu key
modern mac keyboards omit the physical context menu (application) key present on standard pc 104-key layouts `[evid-mac-008]`. contextual menus in macos are invoked via control-click, two-finger trackpad tap, or custom key combinations rather than a dedicated hardware key `[evid-mac-008]`.

---

## 4. firmware integration: qmk and keeberia engine impacts

### qmk runtime modifier swapping
qmk firmware provides dedicated magic keycodes to swap modifier roles dynamically on the same physical pcb without altering hardware connections or switch matrices `[evid-mac-009]`, `[evid-mac-010]`:
* `MAGIC_SWAP_ALT_GUI` (`AG_SWAP`): swaps left alt and left gui (option and command) in firmware `[evid-mac-009]`.
* `CG_TOGG`: toggles control and gui keycode assignments `[evid-mac-010]`.

qmk also supports os-detect features and momentary or toggle keymap layers (such as a default mac layer and a windows layer) on identical pcb hardware `[evid-mac-009]`.

### keeberia engine implications
* **circuitron (pcb engine)**: zero distinct pcb variants or switch matrix routing rules are required for mac mode. the same physical pcb footprint serves both mac and windows configurations.
* **paracraft (plate / case engine)**: no custom plate cutouts are needed for mac key layouts. plate geometry remains determined solely by standard ansi, iso, or jis physical standard parameters.
* **keymap and BOM engine**: keeberia handles mac support by selecting mac keycap legend sets (containing option and command legends) and generating qmk keymap configurations with appropriate gui/alt positioning.

---

## 5. historical design notes: power button and touch bar

### function row power key and touch id
apple desktop and laptop keyboards historically integrated system power controls into the function key row `[evid-mac-012]`. on legacy designs, an eject key or power key occupied the top-right position, whereas modern apple keyboards integrate a touch id fingerprint sensor or power key in that position `[evid-mac-012]`.

### touch bar generation (2016 to 2021)
from 2016 through 2021, select macbook pro models replaced the physical function key row with the touch bar, an oled multi-touch display strip `[evid-mac-011]`. apple subsequently retired the touch bar in 2021, returning to full-height physical function keys across its laptop line `[evid-mac-011]`.

---

## open questions

1. **mac legend proportion standards**: should keeberia's keycap BOM engine recommend 1.25u / 1.25u / 1.25u modifier keycap sets or 1.5u command keycap options when users select mac-specific keycap sets on custom 60% and 75% layouts?
2. **qmk media key mapping differences**: how should keeberia standardise qmk function row mappings between macos native brightness/media keycodes and standard windows f1-f12 keys across universal firmware builds?
