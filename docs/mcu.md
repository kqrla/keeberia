# the mcu is a record, not a constant

> thesis: circuitron grew up around one module. the xiao was named in the netlist pin list, the budget arithmetic, the bom's gpio labels and the qmk info.json, so "add a different board" meant four edits in four files, and a missed one shipped a lie: a 32u4 design carrying rp2040 gpio numbers on its silkscreen and in its firmware.

or simply put: a board was a constant in the engine, and every constant eventually lies about geometry.

---

## the contract

`src/mcu.ts` holds one record per carrier and everything downstream reads it. nothing downstream names a board.

| field | why it exists |
|---|---|
| `id` | the only public name. `layout.options.mcu` |
| `footprint` | the carrier in `footprints.ts` (the xiao is 21x17.5, the pro micro 17.75x33.8) |
| `gpios` | pads the netlist may spend, in the order it spends them |
| `i2c` | the pair a display takes |
| `power` | logic pad, its voltage, ground, vbus, battery pads when the module has them |
| `chip`, `bootloader` | the bom and the qmk info.json |
| `firmware` | `qmk-board` (named board string), `qmk-handwired` (folder declares its own mcu), `zmk` |
| `gpioNumbers` | pad to chip gpio, where the vendor numbers them (rp2040 `D6` is `GP0`) |
| `wireless` | radio the module brings, and whether the engine wires its support parts |

## what is in the catalogue now

| id | chip | gpio | logic | firmware | note |
|---|---|---|---|---|---|
| `xiao_rp2040` | RP2040 | 11 | 3.3V | qmk `seeed_xiao_rp2040` | the default, cheap, uf2 flashing |
| `xiao_nrf52840` | nRF52840 | 11 | 3.3V | zmk | same carrier as the rp2040, so a swap, adds ble and battery pads |
| `pro_micro` | ATmega32U4 | 18 | 5V | qmk handwired | bigger pad or 5V led chain, twice the footprint |

adding a fourth board is a record plus, when the carrier is new, a footprint. the tests generate the same nine-key pad on all three, so the netlist, budget, bom, firmware and router are proven per board rather than per default.

## what the engine now does differently per board

- **pins**: the netlist spends the record's pads. xiao keys land on `D0..D10`, pro micro keys land on its own 18 (with `A0..A3` alongside `D14..D16`), and the "out of pins" error names the board that ran out and the boards that have more.
- **power**: the xiao feeds parts from `3V3`, the pro micro from `VCC` at 5V. the netlist writes the record's pad, so a 5V carrier cannot silently declare a 3.3V rail.
- **i2c**: `D4/D5` on the xiao, `D2/D3` on 32u4.
- **bom and firmware**: `processor` and `bootloader` come from the record. a named board keeps its qmk board string, a handwired board declares `mcu` instead, and a zmk board ships `README-firmware.md` plus its matrix pins rather than a qmk folder that cannot build for an nrf52.
- **shape and case**: the carrier's own footprint drives placement, board envelope, mounting and the case's usb slot, so a pro micro board is ~8mm taller than the same pad on a xiao.

## honest gaps, both recorded as failures rather than features

- **wireless is a swap, not a product yet.** `xiao_nrf52840` reports `ble` and refuses to fake a keymap, but the battery connector, charging, power switch and zmk bundle are not generated. that is the pad's real blocker, not a pin count.
- **no level shifter decision is implied by a 5V board.** the rgb chain question (sk6812 wants 3.4V at 5V supply, above a 3.3V gpio) stays open, and a 5V carrier makes it a different question, not a solved one.

## provenance

- pad names and counts: vendor pinouts for the seeed xiao carrier family and the atmel 32u4 pro micro class board. facts, not code.
- carrier outline and pad geometry: `footprints.ts` (xiao already existed; pro micro added here as 2x12 castellated at 2.54 pitch, rows 15.24 apart, 33.8x17.75).
- firmware toolchain follows the chip: qmk for rp2040 and 32u4, zmk for nrf52840. no other project's generator or board folder was copied.
