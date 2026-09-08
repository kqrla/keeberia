# firmware

> scope note (anne, sept 8 2026, updated): the comparison is now three-way: **qmk / kmk / rmk**. decision pending.

## the constraint that matters

keeberia users never edit firmware code. whatever we generate has to flash onto the board (xiao rp2040 brains for now, 3–9 keys, encoders, oleds) with minimal ceremony. the backend generates the config deterministically, same as the copper and the cad.

## the candidates

- **qmk** — the industry standard. c/c++, mature encoder + oled + via support, but needs a build toolchain (arm gcc + qmk cli). config is structured json (keyboard.json/info.json), which is very generatable. via/remap gives users live browser remapping after the first flash.
- **kmk** — python on circuitpython. no build step: drop generated files onto the usb drive. user-editable as plain python. lighter and friendlier, but slower, younger, and thinner on oled/encoder polish.
- **rmk** — rust keyboard firmware. compiled but memory-safe and modern, with a declarative `keyboard.toml` config that is *extremely* generatable — matrix, encoder, oled/ble setup as structured config, no c to touch. chases qmk on ecosystem maturity (via/remap support is thinner) but beats kmk on polish and qmk on ergonomics. cargo build = one toolchain, same as qmk's problem.
- **zmk** — noted for later: the wireless path (nice!nano-class controllers). not part of this decision yet.

## the open question

generate-and-compile qmk (deterministic, via support, needs build infra), generate-and-copy kmk (no infra, instantly editable, less polish), or generate-config rmk (declarative toml, one cargo build, most modern of the three). all three configs are generated from the same project model — the comparison only decides the default. the research report has the full comparison: [research/firmware-qmk-vs-kmk.md](research/firmware-qmk-vs-kmk.md) (to be extended with rmk).

## what lands either way

the firmware export is an artifact of the project model — matrix pins, keymap, encoder/oled config derived from the same layout that drives the pcb. "firmware configuration" already sits in the portability list in [product.md](product.md).
