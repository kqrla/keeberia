# firmware landscape research report — qmk vs kmk (and zmk) for keeberia

## 1. executive summary

keeberia is a browser-based visual builder for macropads and keyboards targeting seeed xiao rp2040 microcontrollers (3-9 keys, rotary encoders, ssd1306 oled displays). users design hardware and layout visually in the browser and expect a seamless one-click firmware experience where they never write or compile code manually.

this report evaluates the two main candidate firmwares — qmk and kmk — along with a brief assessment of zmk for future wireless designs. it examines configuration architectures, backend build requirements, live browser remapping capabilities (via/vial), hardware peripheral quality (encoders, oleds), and user onboarding friction.

source links and documentation references are cited inline throughout this report.

---

## 2. qmk firmware deep dive

### 2.1 configuration architecture and data-driven specifications
qmk uses C as its runtime implementation, but modern qmk keyboard definitions rely on data-driven json specifications via `info.json`.

- reference: qmk info.json reference (https://raw.githubusercontent.com/qmk/qmk_firmware/master/docs/reference_info_json.md)
- reference: data driven configuration (https://raw.githubusercontent.com/qmk/qmk_firmware/master/docs/data_driven_config.md)

in a fully data-driven qmk setup, the keyboard metadata, matrix pin mapping, microcontroller definitions, encoder pins, display enabled flags, and layout geometries are specified inside a single `info.json` file.

example `info.json` snippet for a xiao rp2040 macropad with 4 keys and 1 encoder:

```json
{
    "keyboard_name": "keeberia pad",
    "manufacturer": "keeberia",
    "maintainer": "keeberia",
    "development_board": "promicro",
    "processor": "RP2040",
    "bootloader": "rp2040",
    "features": {
        "bootmagic": true,
        "encoder": true,
        "oled": true,
        "via": true
    },
    "matrix_pins": {
        "cols": ["GP26", "GP27"],
        "rows": ["GP28", "GP29"]
    },
    "diode_direction": "COL2ROW",
    "encoder": {
        "rotary": [
            { "pin_a": "GP0", "pin_b": "GP1", "resolution": 4 }
        ]
    },
    "layouts": {
        "LAYOUT_default": {
            "layout": [
                {"matrix": [0, 0], "x": 0, "y": 0},
                {"matrix": [0, 1], "x": 1, "y": 0},
                {"matrix": [1, 0], "x": 0, "y": 1},
                {"matrix": [1, 1], "x": 1, "y": 1}
            ]
        }
    }
}
```

key qmk artifacts required for a custom build:
1. `info.json` — hardware layout, pinouts, MCU configuration, feature flags.
2. `rules.mk` — build system toggles (`MCU = RP2040`, `BOOTLOADER = rp2040`, `VIAL_ENABLE = yes`, `OLED_ENABLE = yes`).
3. `config.h` — hardware defines (e.g. `VIAL_KEYBOARD_UID`, `I2C1_SDA_PIN GP6`, `I2C1_SCL_PIN GP7`).
4. `keymap.c` (or `keymap.json`) — static initial keymap definitions, layers, and encoder actions.

### 2.2 seeed xiao rp2040 hardware requirements
qmk natively supports the raspberry pi rp2040 mcu running on top of chibios rtOS.

- reference: qmk rp2040 platform documentation (https://raw.githubusercontent.com/qmk/qmk_firmware/master/docs/platformdev_rp2040.md)

on the seeed xiao rp2040, gpio pins match standard `GPx` nomenclature (e.g., `GP26`, `GP27`, `GP28`, `GP29`, `GP6`, `GP7`, `GP0`, `GP1`, `GP2`, `GP3`, `GP4`). qmk supports double-tap reset for bootloader entry (`RP2040_BOOTLOADER_DOUBLE_TAP_RESET`) and uses wear-leveling flash emulation for eeprom storage.

### 2.3 build toolchain requirements
compiling qmk firmware requires a complete c build environment:
- cross-compiler toolchain: `arm-none-eabi-gcc`, `arm-none-eabi-newlib`, `binutils`.
- qmk build interface: `qmk` cli (python package) or direct `make` execution.
- repository dependencies: git submodules including chibios (`lib/chibios`), chibios-contrib (`lib/chibios-contrib`), and pico-sdk (`lib/pico-sdk`).

compilation produces a binary file format (`.uf2` for rp2040), which the user copies to the rp2040 bootloader drive (`RPI-RP2`).

### 2.4 strategies for prebuilt binary generation (zero user toolchain)
since keeberia users never edit code or install command-line tools, keeberia must build or generate `.uf2` binaries automatically:

1. **containerized serverless build worker (recommended for backend)**:
   - running `qmkfm/qmk_cli` or a lightweight docker image inside an isolated backend container worker.
   - backend receives netlist and keymap JSON from keeberia editor, injects files into a custom keyboard directory inside `qmk_firmware`, runs `qmk compile -kb keeberia/pad -km default`, and returns the compiled `.uf2` binary in 3-8 seconds.

2. **github actions container workflow**:
   - reference: qmk build workflow (https://raw.githubusercontent.com/qmk/qmk_firmware/master/docs/newbs_building_firmware_workflow.md)
   - users fork or trigger a automated github actions workflow that builds the firmware using official qmk docker containers and outputs downloadable `.uf2` releases.
   - downside: async execution delay (30-90 seconds) and requires user github auth.

3. **qmk api / compile service**:
   - reference: qmk api repository (https://github.com/qmk/qmk_api)
   - qmk operates an online compilation backend (`compile.qmk.fm`). however, dynamic custom hardware layout compile jobs with custom C/Vial extensions are better hosted on keeberia's own infrastructure.

### 2.5 latency, performance, and hardware peripheral quality
- **latency & scan rate**: qmk runs compiled native ARM C code directly on bare metal or ChibiOS hardware threads. matrix scanning exceeds 1000 hz (1ms scan interval) with deterministic sub-millisecond debouncing (`sym_defer_g`, `asym_eager_defer_pk`).
- **rotary encoders**:
  - reference: qmk encoder feature documentation (https://raw.githubusercontent.com/qmk/qmk_firmware/master/docs/features/encoders.md)
  - hardware quadrature decoding routines handle high-speed encoder rotation without dropping pulses or detent ticks. encoder actions are mapped cleanly across all keymap layers (`encoder_update_user` or `vial` encoder mapping).
- **oled displays**:
  - reference: qmk oled driver documentation (https://raw.githubusercontent.com/qmk/qmk_firmware/master/docs/features/oled_driver.md)
  - qmk features a dedicated hardware-accelerated i2c/spi oled driver (ssd1306 / sh1106) and quantum painter graphics engine. display updates run on low-priority cycles, ensuring zero latency impact on key matrix scanning.

---

## 3. kmk firmware deep dive

### 3.1 python-based circuitpython architecture
kmk is a keyboard firmware framework written entirely in python that runs on top of the adafruit circuitpython runtime environment.

- reference: kmk firmware repository (https://github.com/KMKfw/kmk_firmware)
- reference: kmk getting started guide (https://raw.githubusercontent.com/KMKfw/kmk_firmware/master/docs/en/Getting_Started.md)
- reference: kmk config and keymap guide (https://raw.githubusercontent.com/KMKfw/kmk_firmware/master/docs/en/config_and_keymap.md)

how keymaps are defined:
keymaps and hardware setups are defined using imperative object-oriented python code stored in `code.py` or `main.py` at the root of the device's USB mass storage volume (`CIRCUITPY`).

example `code.py` generated for a xiao rp2040 macropad in kmk:

```python
import board
from kmk.kmk_keyboard import KMKKeyboard
from kmk.keys import KC
from kmk.scanners import DiodeOrientation
from kmk.modules.layers import Layers
from kmk.modules.encoder import EncoderHandler

keyboard = KMKKeyboard()
layers = Layers()
encoder_handler = EncoderHandler()
keyboard.modules = [layers, encoder_handler]

# xiao rp2040 pin configuration
keyboard.col_pins = (board.GP26, board.GP27)
keyboard.row_pins = (board.GP28, board.GP29)
keyboard.diode_orientation = DiodeOrientation.COL2ROW

# encoder configuration (pin_a, pin_b, switch_pin)
encoder_handler.pins = ((board.GP0, board.GP1, board.GP2),)

keyboard.keymap = [
    [KC.A, KC.B, KC.C, KC.D], # layer 0
    [KC.1, KC.2, KC.3, KC.4], # layer 1
]

encoder_handler.map = [
    ((KC.VOLD, KC.VOLU, KC.MUTE),), # layer 0 encoder actions
    ((KC.PGDN, KC.PGUP, KC.NO),),   # layer 1 encoder actions
]

if __name__ == '__main__':
    keyboard.go()
```

### 3.2 on-device requirements and installation flow
for a seeed xiao rp2040 running kmk:
1. **circuitpython runtime UF2**: flash `adafruit-circuitpython-seeeduino_xiao_rp2040-*.uf2` onto the board once. the device reboots and enumerates as a USB mass storage drive named `CIRCUITPY`.
2. **kmk library bundle**: copy the `kmk/` folder and `boot.py` to the root of `CIRCUITPY`.
3. **keymap execution**: write the generated `code.py` file to `CIRCUITPY`. saving the file triggers circuitpython's auto-reload mechanism, rebooting the firmware in under 1 second.

### 3.3 pros of kmk
- **zero build step or compiler dependency**: keeberia's backend generates `code.py` via simple string templates in python or typescript. no docker containers, arm-gcc, or qmk build toolchains needed.
- **instant user modification**: users can open `CIRCUITPY/code.py` in any text editor, make changes, and hit save to apply updates instantly.
- **webusb file writing**: modern web browsers supporting WebUSB / Web Serial / WebFS can write `code.py` directly to the `CIRCUITPY` drive without requiring the user to open a file explorer.

### 3.4 cons and trade-offs of kmk
- **scan rate & latency jitter**:
  - python bytecode interpreted on top of circuitpython vm runs substantially slower than compiled C binaries. typical matrix scan frequencies range from 100 hz to 250 hz (4-10ms latency) compared to QMK's >1000 hz (<1ms).
- **oled display CPU overhead & stutter**:
  - reference: kmk display extension documentation (https://raw.githubusercontent.com/KMKfw/kmk_firmware/master/docs/en/Display.md)
  - driving an ssd1306 oled display via circuitpython's `displayio` or kmk's `Display` extension requires significant ram and cpu cycles. rendering text or animated bitmap frames on the display can bind the python main loop, causing noticeable key press latency spikes or skipped rotary encoder pulses.
- **encoder tick drops under load**:
  - reference: kmk encoder module documentation (https://raw.githubusercontent.com/KMKfw/kmk_firmware/master/docs/en/encoder.md)
  - unless using hardware interrupts via `rotaryio` (which has pin-binding constraints), software encoder polling in kmk can drop detent ticks if the scan loop is busy servicing display updates or complex matrix scanning.
- **memory footprint**: circuitpython ram on microcontrollers is constrained. importing multiple large modules (`Display`, `RGB`, `Encoder`, `MediaKeys`, `Layers`) can lead to out-of-memory errors on smaller chips.

---

## 4. zmk firmware brief

- reference: zmk firmware introduction (https://raw.githubusercontent.com/zmkfirmware/zmk/main/docs/docs/intro.mdx)
- reference: zmk hardware integration guide (https://raw.githubusercontent.com/zmkfirmware/zmk/main/docs/docs/hardware.mdx)

zmk is an open-source keyboard firmware built on top of the zephyr real-time operating system (RTOS), specifically architected for wireless split and unibody keyboards powered by nordic nrf52840 microcontrollers (e.g. nice!nano, seeed xiao ble nrf52840).

key characteristics:
- **hardware description**: hardware matrix, pins, displays, and sensors are declared using zephyr devicetree syntax (`.overlay` / `.dts` files).
- **configuration**: system features are configured via `Kconfig` files (`.conf`).
- **keymaps**: written in C-preprocessor devicetree syntax (`.keymap` files).
- **toolchain**: requires zephyr SDK, CMake, Ninja, and Python `west` meta-tool. user setups rely almost exclusively on containerized github actions builds (`zmk-config`).
- **wireless & power efficiency**: event-driven architecture designed for multi-month battery life on Bluetooth Low Energy (BLE).
- **zmk studio**: zmk's emerging live remapping protocol operating over WebUSB / BLE HID.

relevance to keeberia: zmk is the clear industry standard for wireless nrf52840 boards, but for wired seeed xiao rp2040 macropads, qmk/kmk remain the primary choices.

---

## 5. via, vial, and live browser remapping ecosystem

one of keeberia's core requirements is enabling users to remap keys, layers, macros, and encoder functions live in a browser GUI without putting the device back into bootloader mode or reflashing firmware.

| feature | via (qmk) | vial (qmk) | peg / serialace (kmk) |
| :--- | :--- | :--- | :--- |
| **underlying firmware** | qmk | qmk (fork/extension) | kmk |
| **browser protocol** | WebHID (raw HID interface) | WebHID (raw HID interface) | WebHID / WebSerial |
| **layout definition storage** | central github repository or local JSON file upload | **stored directly on microcontroller flash** | local file on `CIRCUITPY` or browser memory |
| **instant zero-config connect** | no (requires PR merge in via repo or manual draft load) | **yes (instant auto-discovery from on-device `vial.json`)** | no (requires bespoke web application) |
| **security unlock combo** | optional | yes (matrix unlock combo to prevent untrusted site takeover) | none / file system access |
| **encoder & display remapping** | basic | **full (encoders, macros, combos, tap-dance)** | limited |
| **web gui implementation** | caniusevia.com | vial.today / get.vial.today | custom/experimental |

- reference: vial porting guide (https://get.vial.today/docs/porting-to-vial.html)
- reference: vial-qmk repository (https://github.com/vial-kb/vial-qmk)

### why vial is the gold standard for keeberia
vial solves the biggest friction point in custom hardware generation: layout discovery.
with standard VIA, a newly designed custom macropad cannot be remapped on `usevia.app` unless the user uploads a custom layout JSON file or the board author merges a definition into the central VIA repository.

vial compiles a compressed copy of the layout definition (`vial.json`) directly into the keyboard's QMK firmware binary on flash memory. when the user opens `vial.today` (or keeberia's embedded remapping canvas), the browser queries the device via WebHID, retrieves `vial.json` from the microcontroller, and instantly renders the interactive remapping UI with **zero configuration, zero PRs, and zero file uploads required**.

---

## 6. recommendation matrix for keeberia

evaluating qmk vs kmk for keeberia's seeed xiao rp2040 macropads (3-9 keys, rotary encoder, ssd1306 oled display):

| criterion | qmk (with vial) | kmk (circuitpython) |
| :--- | :--- | :--- |
| **backend generation complexity** | requires generating `info.json`, `rules.mk`, `config.h`, `vial.json`, `keymap.c` and running containerized build | **extremely simple** (generates plain `code.py` text file using template literals) |
| **build infrastructure cost** | requires serverless docker build worker (~3-8s execution per export) | **zero server compute** (100% client-side text generation) |
| **initial setup friction for user** | user drags single compiled `.uf2` binary to `RPI-RP2` bootloader drive | user flashes CircuitPython UF2 once, then copies `kmk/` bundle + `code.py` to `CIRCUITPY` |
| **live browser remapping** | **native & seamless** (via vial.today or embedded WebHID; `vial.json` stored in firmware flash) | experimental / non-standard (requires updating `code.py` file or custom serial link) |
| **encoder performance** | **flawless** (hardware quadrature decoding in C, zero missed ticks) | acceptable for low speeds; potential dropped ticks under heavy scan loops |
| **oled performance** | **flawless** (hardware i2c driver + C framebuffers, zero latency impact) | CPU-heavy; display rendering can cause matrix scan stutters |
| **scan latency & determinism** | **sub-millisecond (<1ms)**, 100% deterministic C execution | 4-10ms (100-250 hz scan rate) with interpreter overhead |
| **hack club ysws / community fit** | accepted natively in all macropad competitions | accepted natively in all macropad competitions |

---

## 7. strategic decision & phased recommendation

### phased roadmap decision

1. **v1 primary recommendation: qmk with vial support**
   - **why**: keeberia's promise is professional, high-performance hardware engineering artifacts. macropads with encoders and oled displays demand low-latency scanning, crisp display updating, and zero-tick-loss encoder decoding. vial provides the ultimate "magic" user experience: user flashes the keeberia-generated `.uf2` once, and instantly remaps keys and encoders live in the browser via WebHID without ever reflashing.
   - **backend implementation**: keeberia backend hosts a lightweight docker worker running `vial-qmk`. when the user clicks "generate firmware", backend builds `keeb_design.uf2` in <5 seconds and delivers it to the user.

2. **v1 parallel option: kmk export package**
   - **why**: for users who want complete local hackability without compiling C code, keeberia can also export a ready-to-use KMK zip package containing `code.py`, `boot.py`, and the `kmk/` folder. this fulfills keeberia's portability requirement (never locking the user in) and aligns with community submission standards like Hack Club YSWS Hackpad.

3. **v2 future extension: zmk for wireless boards**
   - when keeberia introduces battery-powered wireless boards using Seeed XIAO BLE or nice!nano (nRF52840), zmk will be introduced as the third firmware target.

### summary of generated backend artifacts for keeberia export bundle
when a user completes a design in keeberia, the firmware section of the export bundle should include:
- `firmware/qmk/`
  - `info.json`
  - `rules.mk`
  - `config.h`
  - `keymaps/vial/vial.json`
  - `keymaps/vial/keymap.c`
  - `keeberia_pad.uf2` (precompiled binary ready to flash)
- `firmware/kmk/`
  - `code.py`
  - `boot.py`
  - `README.md` (instructions for circuitpython drag-and-drop)
