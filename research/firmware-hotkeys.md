# firmware hotkeys + layers: keymap UX and firmware keycode representation

or simply put: a visual keyboard builder must give users an intuitive, drag-and-drop model for "what keys do" while compiling deterministically into firmware-specific keymap primitives across qmk, kmk, rmk, and zmk.

---

## core thesis

a keymap builder ui cannot treat keys as simple single-character mappings. modern mechanical keyboard usage relies on multi-layer stacks, dual-role tap-hold keys, chorded combos, and dynamic runtime remapping. to deliver a seamless builder experience without exposing target firmware complexity, keeberia must establish a unified canonical keymap model that serializes down to qmk C json, kmk python, rmk toml, or zmk devicetree.

---

## 1. layer systems across firmwares

or simply put: layers act as virtual keyboards stacked on top of each other, evaluated top-down until a non-transparent keycode is reached.

- **qmk layers**: evaluated top-down from highest active layer to layer 0 [evid-fw-001]. qmk uses 16-bit keycode bitmasks where 4 bits identify the function and 4 bits specify the target layer, restricting dual-role layer functions like `LT(layer, kc)` and `LM(layer, mod)` strictly to layers 0–15 [evid-fw-002]. additionally, dynamic keymapping (via/remap) defaults to a fixed layer count (typically `DYNAMIC_KEYMAP_LAYER_COUNT = 4`) due to eeprom storage limits [evid-fw-003].
- **zmk layers**: defined as devicetree keymap nodes. behaviors include `&mo` (momentary), `&lt` (layer-tap), `&to` (to layer), and `&tog` (toggle layer) [evid-fw-004]. zmk supports conditional layers (enabling layer C when layers A and B are active) and layer combos without bitmask layer limits.
- **kmk layers**: managed via the `kmk.modules.layers.Layers` module in python [evid-fw-005]. keycodes include `KC.MO`, `KC.LM`, `KC.LT`, `KC.TG`, `KC.TO`, and `KC.TT`. because kmk runs on circuitpython, layer counts are bound only by RAM rather than 16-bit keycode bitmask limits.
- **rmk layers**: defined declaratively in `keyboard.toml` under `[[keymap.layers]]` arrays [evid-fw-006]. rmk compiles keymaps into rust structures and supports dynamic runtime layer updates via vial and rynk protocols [evid-fw-015].

---

## 2. keycode space & dual-role action taxonomy

or simply put: "what a key does" spans basic characters, media keys, mouse movement, tap-hold dual roles, and chorded combinations.

- **basic & modifier keycodes**: standard hid usages (letters, numbers, punctuation, functional keys) plus modifier masks (ctrl, alt, shift, gui).
- **tap-hold & mod-tap**: dual-role keys send a tap keycode when tapped quickly and activate a modifier or layer when held. qmk defaults `TAPPING_TERM` to 200ms [evid-fw-007] with mod-taps like `LALT_T(kc)` and `LCTL_T(kc)` [evid-fw-009]. zmk configures hold-tap behaviors with `tapping-term-ms` (200ms default) and flavor strategies like `hold-preferred` vs `tap-preferred` [evid-fw-008].
- **combos & chording**: pressing two or more physical keys simultaneously triggers an alternate action. zmk uses devicetree combo nodes with a configurable `timeout-ms` [evid-fw-010]. qmk provides a `COMBO` engine requiring C macro definitions.
- **one-shot modifiers & layers**: sticky keys that apply to the next single keypress without requiring the modifier/layer key to be held down (`OSM` in qmk, `&sk` / `&sl` in zmk).
- **unicode input modes**: operating-system-dependent unicode entry (e.g. `UC_WIN`, `UC_MAC`, `UC_LNX` in qmk), requiring os detection or explicit mode switching.

---

## 3. visual builder UI mapping vs raw keymap code

or simply put: the UI should expose 90% of user needs visually (layers as tabs, modifiers as toggles, tap vs hold cards) while reserving raw keymap overrides for custom code.

### what a visual builder exposes cleanly:
1. **layer tabs & virtual boards**: visual keyboard layout per layer with transparency (`KC_TRNS` / `&trans`) highlighting.
2. **action palette & keycode picker**: drag-and-drop or click-to-assign basic keys, media keys, and lighting/rgb controls.
3. **tap-hold action inspector**: dual-role inspector UI letting users assign "tap action" and "hold action" (mod or layer) with a slider for tapping term (e.g., 150ms–300ms).
4. **combo builder**: multi-key selector tool allowing users to pick 2–3 key positions and assign a target action and timeout window.

### what stays in raw code / custom behaviors:
1. **complex tap-dance routines**: multi-tap sequences (tap once = A, tap twice = B, hold = C) require custom C / python functions.
2. **custom C/rust event handlers**: `process_record_user` in qmk or custom rust modules in rmk for stateful macros or oled animations.

### prior art & configurator ecosystem:
- **qmk configurator**: web UI export/import via structured `keymap.json` [evid-fw-011].
- **via / remap / vial**: dynamic runtime keymap editing over webhid/raw hid without reflashing firmware [evid-fw-012, evid-fw-015].
- **zmk keymap editor / zmk studio**: webusb-based RPC interface for live keymap updates on zmk devices.

---

## 4. firmware x wireless transport typology

or simply put: choice of firmware dictates hardware target compatibility and transport capability (wired vs BLE).

| firmware | primary transport | hardware platform | live web remapping protocol |
|---|---|---|---|
| **qmk** | USB wired standard [evid-fw-011] | AVR, ARM (STM32, RP2040) | VIA / Vial over Raw HID [evid-fw-012] |
| **kmk** | USB wired / BLE | RP2040, nRF52 (CircuitPython) | None (direct USB file editing) |
| **rmk** | USB wired / BLE native [evid-fw-006] | RP2040, nRF52, ESP32-C3 (Rust Embassy) | Vial / Rynk over USB & BLE [evid-fw-015] |
| **zmk** | BLE-first wireless [evid-fw-013] | nRF52, RP2040 (Zephyr RTOS) | ZMK Studio RPC over WebUSB/BLE |

- **zmk wireless discipline**: zmk is built BLE-first, enforcing bluetooth 4.2+ secure connections with ecdh key exchange [evid-fw-014] and managing up to 5 host profiles via the `&bt` behavior [evid-fw-013].
- **qmk/kmk/rmk transport**: qmk remains the gold standard for wired USB macropads/keyboards. rmk offers modern async rust performance with native USB and BLE dual-transport support [evid-fw-006, evid-fw-015].

---

## 5. open questions

1. **vial vs rynk protocol for rmk**: how mature is rmk's native rynk web protocol compared to vial for webhid browser remapping on rp2040 macropads?
2. **zmk studio webusb compatibility across browsers**: does zmk studio's webusb rpc protocol work reliably across all chromium browsers without requiring custom driver installation on windows?
3. **dynamic layer count flexibility**: when generating qmk firmware for keeberia users, should we compile with `DYNAMIC_KEYMAP_LAYER_COUNT = 8` by default to give users more layers in via/remap, or keep it at 4 to conserve eeprom space on small microcontrollers?
