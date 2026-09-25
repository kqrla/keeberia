# keyboard typology: split keyboards vs unibody, wireless vs wired

> thesis: custom input devices bifurcate along two independent hardware and firmware axes - topology (split vs unibody) and power/transport (wireless BLE vs wired USB-C). circuitron and keeberia must treat these not as cosmetic variants, but as distinct pcb schematics, matrix scanning engines, and firmware compilation targets.

or simply put: a unibody keyboard is a single pcb matrix connected directly via USB, whereas a split keyboard requires two independent pcb matrix scans communicating over a physical cable or BLE link; adding wireless introduces LiPo charging ICs, battery isolation switches, and CC pull-down resistors, while shifting the firmware standard from QMK/RMK to ZMK.

---

## 1. split keyboards: pcb architecture & hardware differences

split keyboards physically divide the key matrix across two independent PCBs, fundamentally altering netlist routing, component footprints, and firmware generation compared to unibody boards.

### 1.1 dual matrices & inter-half communication
unibody keyboards scan a single row-and-column matrix connected to one MCU. split keyboards deploy two separate controllers (one per half), each scanning its local key matrix (`evid-typ-001`). data is exchanged between halves using either single-wire asynchronous serial or 2-wire I2C (`evid-typ-001`).
- **serial interconnect**: requires 3 conductors - VCC, GND, and 1 GPIO data pin (`SOFT_SERIAL_PIN`). works over standard TRS (Tip-Ring-Sleeve) cables.
- **I2C interconnect**: requires 4 conductors - VCC, GND, SDA, and SCL, along with two 4.7kΩ pull-up resistors on the data/clock lines (`evid-typ-002`). because I2C requires 4 distinct lines, TRS cables are insufficient and TRRS (Tip-Ring-Ring-Sleeve) cables are strictly required (`evid-typ-002`).

### 1.2 connector footprints & physical hazards
- **PJ-320A footprint**: the standard 3.5mm through-hole audio jack footprint for custom split PCBs (Corne, Lily58, Sofle, Sweep) is the PJ-320A (`evid-typ-005`).
- **hot-plugging hazard**: because TRRS cables carry live VCC across exposed barrel rings, plugging or unplugging a TRRS cable while powered can cause temporary contact bridge shorts between VCC and data or GND, causing permanent controller damage (`evid-typ-003`).

### 1.3 handedness identification & eeprom
firmware running on a split controller must determine whether it is executing on the left or right half before mapping key matrix coordinates (`evid-typ-004`). methods include:
1. **EEPROM flag (`EE_HANDS`)**: writing a handedness byte to persistent EEPROM storage during initial bootloader flashing (`evid-typ-004`).
2. **GPIO hand pin (`SPLIT_HAND_PIN`)**: pulling a specific GPIO pin HIGH or LOW on PCB trace routing.
3. **matrix pin grid**: detecting an unused diode intersection on the key matrix.

### 1.4 design system implications for circuitron
to support split keyboards in keeberia's automated PCB engine (circuitron):
- **dual netlist generation**: emit two distinct PCB layouts (left half and right half or a reversible PCB pair) with independent MCU footprints and matrix nets.
- **interconnect routing**: automatically place PJ-320A jacks or interconnect pads with appropriate VCC/GND/data traces and I2C pull-up resistor footprints.
- **handedness rules**: inject configuration flags (`EE_HANDS` or `SPLIT_HAND_PIN`) into generated firmware artifacts.

---

## 2. wireless vs wired: pcb power circuitry & connectors

adding wireless BLE functionality converts a passive USB-powered slave board into an active battery management system.

### 2.1 BLE-capable microcontrollers
wireless custom keyboards standardized on Nordic's nRF52840 32-bit ARM Cortex-M4 SoC (`evid-typ-006`). popular modular form factors include:
- **Pro Micro drop-in replacements**: SuperMini NRF52840, nice!nano v2, and nRFMicro (`evid-typ-006`).
- **compact surface-mount modules**: Seeed Studio XIAO nRF52840 / XIAO BLE.

### 2.2 battery selection & capacity norms
- **capacity norms**: ultra-compact split peripherals place small LiPo batteries (e.g. 301230 size, 3.7V 100mAh–110mAh) directly beneath socketed controllers (`evid-typ-006`, `evid-typ-007`). unibody cases or larger split bases accommodate 250mAh to 500mAh LiPo packs.
- **battery life**: a 100mAh battery powers a BLE split peripheral for ~2 weeks under typical typing loads (`evid-typ-007`).

### 2.3 charging circuits & power management
- **linear charge ICs**: BLE controllers integrate single-cell linear LiPo charge management ICs like the TP4054 or MCP73831 operating at 100mA charge current (`evid-typ-008`). power is fed from USB 5V (RAW/VBUS) to charge the battery connected across B+/B- (RAW/GND) (`evid-typ-008`).
- **power isolation switches**: PCBs require a physical SPDT slide switch (e.g. MSK-12C02) in series with BAT+ to completely cut battery power during transport (`evid-typ-008`).
- **JST PH 2.0 connectors**: battery connections predominantly use 2-pin JST PH 2.0 connectors or raw solder pads (`evid-typ-009`). **critical risk**: polarity standards vary across third-party battery manufacturers; connecting a reverse-polarity JST cable destroys the charger IC and MCU (`evid-typ-009`).

### 2.4 wired-only connector requirements
- **5.1kΩ CC pull-down resistors**: every female USB-C receptacle on a keyboard PCB must place two 5.1kΩ pull-down resistors (one on CC1, one on CC2) to GND (`evid-typ-010`). without these resistors, USB Type-C to Type-C host cables (such as modern MacBooks) will fail to deliver 5V power (`evid-typ-010`).
- **connector form factors**: wired boards use either through-hole 12-pin/16-pin USB-C sockets for hand-soldering durability or mid-mount connectors (e.g., HRO TYPE-C-31-M-12) recessed into PCB cutouts for ultra-slim case profiles (`evid-typ-011`).

---

## 3. firmware split: zmk vs qmk/kmk/rmk division

firmware selection is dictated by transport requirements and MCU platform architecture.

| Feature / Metric | ZMK Firmware | QMK Firmware | RMK Firmware | KMK Firmware |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Domain** | Wireless BLE & Split (`evid-typ-012`) | Wired USB (`evid-typ-001`) | Modern Wired / BLE | Zero-build Python |
| **Underlying OS/Stack** | Zephyr RTOS (`evid-typ-012`) | Bare-metal C | Rust / Embassy | CircuitPython |
| **Primary MCU Support** | nRF52840, nRF52833 | AVR (ATmega32U4), RP2040, STM32 | RP2040, nRF52840, STM32 | RP2040, SAMD21 |
| **Split Model** | Central / Peripheral (`evid-typ-012`) | Primary / Secondary (`evid-typ-001`) | Central / Peripheral | Split Module |
| **BLE Split Latency** | 3.75ms avg / 7.5ms max (`evid-typ-013`) | N/A (Wired focused) | Low-latency BLE | Moderate |
| **Wired Split Transport** | Full-duplex UART (2-wire) (`evid-typ-014`) | Serial (1-wire) / I2C (2-wire) (`evid-typ-001`) | Serial / Rynk | Serial |

### 3.1 ZMK as the wireless standard
ZMK uses a Central/Peripheral role architecture (`evid-typ-012`). The central half (usually the left side) connects to the host computer over USB or BLE HID and maintains all keymap layer states (`evid-typ-012`). Peripheral halves scan their key matrix and transmit row/column position events to the central over BLE or wired UART (`evid-typ-012`).
- **BLE latency**: wireless split communication adds 3.75ms average (7.5ms max) latency (`evid-typ-013`).
- **wired transport**: ZMK currently requires full-duplex 2-wire UART for wired split (`evid-typ-014`).

### 3.2 QMK and MCU constraints
QMK remains the standard for wired AVR, ARM (STM32, RP2040) keyboards (`evid-typ-001`). However, QMK requires both sides of a split board to use the exact same MCU architecture family because AVR and ARM drivers are incompatible (`evid-typ-015`).

---

## 4. open questions

1. **half-duplex single-wire UART in ZMK**: when will ZMK's single-wire half-duplex UART driver stabilize to allow wired ZMK split operation on legacy single-pin split hardware like the Corne or Sweep without requiring full-duplex 2-wire modifications (`evid-typ-014`)?
2. **reversible split PCB routing**: how should circuitron represent reversible split PCBs (single PCB design where flipped left/right footprints share TRRS and MCU pads) vs dedicated left/right PCB designs in the project model?
3. **soft off vs mechanical power switch**: for sealed wireless cases where a physical SPDT slide switch cannot be accessed, what are the precise quiescent current draw differences between ZMK soft-off mode (~10µA) and a physical battery disconnection switch?
4. **JST PH 2.0 reverse-polarity protection**: should circuitron mandate a low-drop PMOS reverse-polarity protection circuit or Schottky diode on custom PCB schematics featuring JST PH 2.0 headers to eliminate the risk of reversed third-party LiPo leads (`evid-typ-009`)?
