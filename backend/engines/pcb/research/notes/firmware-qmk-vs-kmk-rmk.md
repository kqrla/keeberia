# firmware: qmk vs kmk vs rmk (the one-click flow)

research: sept 8 2026 · method: rmk docs scraped from rmk.rs (their llms.txt is excellent) + rmk-rs/rmk repo; qmk/kmk facts from prior working knowledge, flagged where stale-ness is possible · written for the scope/firmware.md decision

## the constraint that matters

keeberia users never edit firmware code. whatever we generate has to drive a xiao rp2040 with 3–12 keys, an ec11 encoder, a 0.91" ssd1306 oled, and sk6812 rgb (the delight trio), with minimal ceremony — and it generates deterministically from the project model, same as the copper and the cad. the config is an artifact. the question is only which firmware we compile it *for*.

## the three candidates

### qmk — the industry standard

- config: `keyboard.json` (successor to info.json) — rows/cols/encoders/rgb_matrix/rgblight all declarative json, very generatable. keymap as `keymap.json`. **but**: oled rendering is C glue code, not pure config.
- build: arm gcc + qmk cli locally, or github actions container. keeberia's one-click needs our build infra either way.
- the killer feature: **via/vial** — live browser remapping after the first flash. mature encoder support, full rgb matrix + underglow, oled polish.
- maturity: the standard. every hackpad/QMK community answer applies to us for free.

### kmk — python on circuitpython

- config: `kb.py` + `main.py` — python, but *simple* python (pin arrays, layer lists). generatable, and instantly readable/editable by users who want to poke.
- build: **none.** drop the generated files onto the usb drive. the only zero-infra option — no toolchain, no container, no actions.
- features: encoder module ✓, oled via displayio/adafruit libs ✓, neopixel/sk6812 via pixelbuf ✓ — the whole trio, but thinner polish (oled + encoder integrations are more diy than qmk's).
- latency/perf: python on an rp2040 is fine for a 3–12 key pad, not for a full board later.

### rmk — rust, the modern challenger

verified against rmk.rs docs + rmk-rs/rmk (1.7k stars, 4k+ commits, active daily, v0.9.x):

- config: **`keyboard.toml`, one file, everything declarative** — `[matrix]` (row_pins/col_pins, col2row default + row2col flag), `[[input_device.encoder]]` (pin_a/pin_b, pullups, resolution per detent), `[display]` (`driver = "ssd1306"`, fixed size set — our exact oled), keymap layers in-toml. the most keeberia-shaped config of the three: our project model maps onto it almost 1:1.
- build: cargo local, or **cloud compilation via github actions with zero local setup** (rmkit + the official template is built for exactly this). uf2 flashing on rp2040; optional rmk-boot gives usb-dfu so you never press BOOTSEL again.
- live remap: **vial enabled by default**, plus an experimental native web protocol (rynk), even over ble.
- perf: ~2ms wired latency, async matrix, low power. the "compilation not generation" ethos, in firmware form.
- **the gap: no ws2812/sk6812 support yet.** `[light]` is lock-led output pins only, zero rgb mentions in the whole docs index. for the delight trio, rmk currently ships 2/3.

## the matrix

| | qmk | kmk | rmk |
|---|---|---|---|
| declarative config | json ✓ | python (simple) | toml ✓✓ |
| build for one-click | needed (gh actions) | **none** | needed (gh actions, template exists) |
| encoder (ec11) | ✓ mature | ✓ | ✓ in-toml, resolution-aware |
| oled (ssd1306 0.91") | ✓ but C glue code | ✓ via displayio | ✓ in-toml (`driver = "ssd1306"`) |
| **rgb (sk6812)** | ✓ full | ✓ | **✗ not yet** |
| live browser remap | via/vial ✓ | no (edit files) | vial default ✓ |
| rp2040 | ✓ | ✓ | ✓ (dfu_rp, uf2) |
| wireless later (v2 keebs) | partial | partial | ✓ ble first-class |
| user-editable output | json | **plain python** | toml |

## the analysis

- if the delight trio is non-negotiable in v1 (it is — the hackpad gallery shows encoder+oled+rgb on nearly every build), **rmk can't be the only default** until ws2812 lands. watch their releases; the day it does, rmk is arguably the best keeberia fit in every other dimension.
- **kmk is the only zero-build-infra path**, covers the full trio, and its output (two small python files) is the friendliest thing to put in a zip. downside: no live remap, and polish/later-latency questions for bigger boards.
- **qmk is the everything-mature option**: via remap is a genuine "the board arrives and just works in your browser" feature, but it costs us build infra from day one, and oled rendering in generated C glue breaks the "config only, no code" ideal.

## recommendation (pending anne's call)

**kmk as the v1 default** (zero infra, full trio, instantly-editable files in the zip), **qmk via a github actions container as the v1.5 "polish" option** (via remap is worth real infra), **rmk on the watchlist** — its declarative keyboard.toml is the closest thing to "the project model, serialized," and if ws2812 support ships, it likely takes the default slot. all three generators read the same project model, so switching defaults is a config change, not a rewrite.
