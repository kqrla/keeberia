# keyboard pcb construction as an electronic device

> thesis: a keyboard pcb functions electronically as a high-density, low-power digital scanning array that multiplexes mechanical switch contact closures into matrix scan states, requiring dedicated anti-ghosting diodes, transient power protection, mechanical keepouts, and precise mcu pin budget allocation.

or simply put: a keyboard pcb is an electronic multiplexing circuit where switches sit at row-column intersections with series diodes to prevent current back-feeding; an onboard or modular microcontroller rapidly scans row and column pins to convert physical switch closures into hid keycodes while powering ancillary peripherals like i2c oled displays and addressable rgb LEDs.

---

## 1. matrix scanning: pin economy, scan cycle, and debouncing

keyboard switch matrices solve the problem of microcontroller pin limitations through spatial multiplexing (`evid-kc-001`). if a 64-key keyboard assigned one dedicated gpio pin per switch, it would require 64 input pins on the mcu. by arranging switches in an 8x8 row-and-column matrix, the same 64 keys are serviced using only 16 gpio pins (8 rows plus 8 columns).

the firmware executes matrix scanning by setting column pins as driven outputs and row pins as sensed inputs with pull-up or pull-down resistors (`evid-kc-001`). during each scan cycle, the controller asserts logical 1 (or ground in active-low logic) on one column pin at a time while reading all row pin states simultaneously (`evid-kc-001`). when a switch is physically depressed, closing its electrical contacts, current passes from the active column trace to the corresponding row trace, pulling the row pin high and registering a keypress at that matrix coordinate (`evid-kc-001`).

because mechanical switch contacts bounce physically upon closing, matrix scanning is tightly coupled with debouncing algorithms (`evid-kc-002`). mechanical switch contacts vibrate for several milliseconds upon closure, generating false high-frequency pulse trains. firmware implementations like qmk default to a 5ms debounce delay (`evid-kc-002`) to filter out noise, balancing instantaneous keystroke response against double-strike switch chatter.

---

## 2. diodes: direction conventions, blocking mechanics, and package choices

a diode connected in series with each mechanical switch is mandatory in a key matrix to prevent reverse current flow during multi-key presses (`evid-kc-003`). without diodes, pressing three switches simultaneously creates an unintended feedback loop across adjacent row and column traces (`evid-kc-003`). the diode acts as a one-way electrical valve, blocking reverse currents and isolating each switch state.

firmware and physical pcb designs align diode polarity using standardized conventions (`evid-kc-004`). in qmk documentation, the `COL2ROW` configuration specifies that the diode anode connects to the switch contact while the cathode (indicated by the physical band mark on the diode body) faces toward the matrix row trace (`evid-kc-004`). conversely, `ROW2COL` connects the cathode facing the column trace. in qmk `info.json` metadata, this is declared via `DIODE_DIRECTION`.

physically, the registry's diode footprint is SOD-123 (`docs/footprints-research.md`), and smd sod-123 diodes are commonly placed directly adjacent to or underneath switch socket pads on the bottom pcb layer to keep switch housings and hotswap sockets clear (common practice, no live evidence line: the worker's 1N4148-SOD-123 ubiquity source was a thesis pdf that could not be retrieved at merge review, see open questions).

---

## 3. ghosting and nkro: multi-key matrix ambiguity and hid limitations

ghosting occurs in matrices lacking anti-ghosting diodes when three switches occupying three corners of a matrix rectangle are held down (`evid-kc-006`). current flows backward through the closed switches across row and column traces, energizing the fourth intersection and causing the firmware to register a false, unpressed fourth key (`evid-kc-006`). installing a diode at every switch footprint completely eliminates ghosting by blocking the reverse path.

n-key rollover (nkro) refers to the capability of a keyboard to register every simultaneously pressed key without missing inputs or generating phantom keys. while a dioded matrix mechanically guarantees full hardware rollover, usb hid protocol limits can restrict software reporting (`evid-kc-007`).

under the standard usb hid boot protocol, keyboard input reports are fixed at 8 bytes: 1 byte for modifier keys, 1 reserved byte, and 6 keycode bytes (`evid-kc-007`). consequently, standard usb hid without custom report descriptors caps simultaneous key detection at 6kro (6 keys plus modifiers). to achieve true nkro over usb, firmware generates custom report descriptors that utilize bitmap report structures, allowing arbitrary key combination states to be transmitted simultaneously over hid endpoints.

---

## 4. controller pin budget: gpio allocation for matrix and peripherals

designing a keyboard pcb requires matching total mcu gpio pin counts against the cumulative pin requirements of the matrix and attached peripheral hardware.

a complete keyboard pin budget accounts for:
1. matrix rows and columns: row_count + col_count gpio pins.
2. rotary encoders (ec11): 2 gpio pins per encoder (channel A and channel B).
3. i2c oled displays: 2 gpio pins (SDA and SCL).
4. addressable rgb lighting: 1 gpio data pin for ws2812/sk6812 chains.
5. hardware reset/boot: dedicated hardware RST pin or combined boot pin.

for a concrete example, a 4x4 macropad equipped with one ec11 encoder, an i2c oled display, and per-key sk6812 rgb lighting requires:
- matrix: 4 rows + 4 cols = 8 gpio pins.
- ec11 encoder: 2 gpio pins.
- i2c oled: 2 gpio pins (shared with i2c bus).
- rgb data: 1 gpio pin.
- total required gpio: 13 gpio pins.

comparing microcontroller hardware options:
- bare rp2040 mcu: provides 30 multifunction gpio pins on its qfn56 package (`evid-kc-008`), easily accommodating large matrices, multiple encoders, and displays.
- seeed studio xiao rp2040 module: exposes 11 user gpio pins on its castellated edge header (`evid-kc-009`). an 11-pin budget accommodates a 4x4 matrix (8 pins) plus rgb data (1 pin) and i2c oled (2 pins), or a 3x3 matrix (6 pins) plus encoder (2 pins), i2c (2 pins), and rgb (1 pin).
- legacy atmega32u4 pro micro: exposes 18 to 20 usable io pins, sufficient for 60% keyboards (e.g., 5x14 matrix using 19 pins).

---

## 5. usb and power wiring: esd protection, decoupling, and regulation

usb data and power rails on a keyboard pcb require transient protection and noise filtering to ensure reliable operation and host computer protection.

electrostatic discharge (esd) protection on usb data lines (D+ and D-) is implemented using rail-to-rail transient voltage suppression arrays such as the STMicroelectronics USBLC6-2SC6 in a SOT23-6 package (`evid-kc-010`). placed immediately adjacent to the usb-c connector, the USBLC6-2SC6 clamps high-voltage esd spikes to ground before they reach sensitive mcu silicon.

power decoupling requires ceramic capacitors placed as physically close as possible to mcu power supply pins (`evid-kc-011`). for bare mcu designs like the atmega32u4 or rp2040, 0.1uF (100nF) ceramic capacitors are required on each VCC/VDD pin to bypass high-frequency switching noise, alongside a 4.7uF or 10uF bulk capacitor on VUSB/UVCC rails (`evid-kc-011`). overcurrent protection is provided by a 500mA resettable ptc fuse on the 5V VBUS power trace.

modular controller boards like the seeed xiao rp2040 carry onboard low-dropout (ldo) voltage regulators, esd components, and decoupling capacitors. using castellated modules greatly simplifies pcb layout by providing clean, regulated 3.3V power rails directly to the host board without requiring discrete power management circuitry.

hardware flashing and recovery exposed on the pcb require tactile push buttons connected between reset/bootsel pins and ground. for rp2040 boards, grounding BOOTSEL during power-up mounts the chip as a mass-storage uf2 drive for firmware flashing.

---

## 6. mounting and mechanics: switch legs, stabilizers, and pcb thickness

mechanical switch footprints on a keyboard pcb must accommodate both mechanical alignment legs and electrical contact pins (`evid-kc-012`).

switches are produced in 3-pin (plate-mount) and 5-pin (pcb-mount) configurations:
- 5-pin (pcb-mount): features 1 central plastic post, 2 metal switch contact pins, and 2 extra plastic alignment legs on the sides (`evid-kc-012`). the pcb footprint requires two 1.7mm side holes to receive these alignment legs (`docs/footprints-research.md`, registry-recorded 1.7mm guide pegs).
- 3-pin (plate-mount): lacks the 2 extra plastic side legs and relies on a top mounting plate for switch alignment.
universal pcb footprints incorporate the 1.7mm side holes (`docs/footprints-research.md`), accepting both 3-pin and 5-pin switches without requiring leg trimming (`evid-kc-012`).

for keys 2u and larger, mechanical switch operation requires stabilizers (cherry mx style clip-in or screw-in). screw-in pcb-mount stabilizers require dedicated mounting holes (a large center hole for the stabilizer slider housing and smaller clearance holes for mounting screws/clips). the pcb layout must maintain strict component keepout zones around stabilizer wire paths on both top and bottom copper/silkscreen layers.

the universal standard for custom keyboard pcb thickness is 1.6mm (0.063 inches) (fab-side default: `evid-osh-005`; design-side note in `backend/pcb/research/notes/keeb-design-types.md`). mechanical switch snap clips, hotswap sockets (kailh/gateron), and pcb-mount stabilizer clips are engineered specifically to snap securely onto 1.6mm thick fiberglass substrate. altering pcb thickness (e.g., to 1.2mm or 1.0mm) requires plastic snap shims or custom stabilizer gaskets to prevent loose switch fits. as noted in prior keeberia research (`backend/pcb/research/notes/keeb-design-types.md`), stack-height chains in circuitron assume standard 1.6mm pcb substrate thickness paired with 1.5mm switch plates.

---

## 7. bare mcu vs castellated modules: integration vs modularity

custom keyboard pcb design divides into two controller integration paradigms: castellated modules vs bare mcu direct-on-board assembly.

castellated surface-mount modules (such as seeed studio xiao rp2040/samd21, pro micro, or rp2040 stamp) are the dominant choice for hobbyist and macropad designs (community analysis; the carrier-board castellated form itself is vendor-documented in `evid-kc-015`).
advantages of modular controllers include:
1. onboard power management and onboard flash memory, so the parent pcb carries no bare-mcu support circuitry (`evid-kc-015`).
2. zero surface-mount reflow soldering required for the user or builder (consequence of the module form, `evid-kc-015`).
3. onboard ldo regulator, crystal, and usb-c connector (vendor-advertised integration, not separately evidenced).
4. low unit cost ($3 to $6) and easy field replacement if mcu pins are damaged.

bare mcu implementations (placing an rp2040 qfn56 chip directly on the keyboard pcb) offer sleek, fully integrated unibody pcbs without daughterboard bulk. however, direct-on-board rp2040 designs require placing several supporting external components (`evid-kc-014`):
1. external qspi flash memory chip (e.g., W25Q128 16MB flash) (`evid-kc-014`).
2. 12MHz crystal oscillator with matching load capacitors (`evid-kc-014`).
3. 5.1k ohm pull-down resistors on USB-C CC1 and CC2 pins for UFP detection (usb type-c specification detail, no live evidence line yet, see open questions).
4. 3.3V ldo voltage regulator and USBLC6-2SC6 esd protection array (`evid-kc-010`; modules integrate the regulator, `evid-kc-015`).

both approaches leverage pre-flashed bootloaders (such as rp2040 uf2 bootloaders) (`evid-kc-014`), allowing drag-and-drop firmware updates over USB without specialized external programmer hardware.

---

## 8. rgb underglow and per-key lighting: sk6812/ws2812 daisy chains and logic level shifting

keyboard lighting (per-key backlighting and peripheral underglow) relies on addressable rgb LEDs such as the sk6812 or ws2812b (`evid-kc-016`). keeberia's circuitron engine already maintains sk6812mini-e footprint definitions in its component registry.

addressable LEDs are wired in a single-wire daisy-chain configuration: the mcu gpio data pin connects to the data input (DIN) of the first LED, and each LED's data output (DOUT) connects directly to the DIN of the subsequent LED. this architecture allows driving dozens of rgb LEDs using a single gpio pin.

power and logic level threshold matching is a critical pcb design consideration (`evid-kc-016`). sk6812 and ws2812 LEDs are powered by the 5V VBUS power rail. according to the sk6812 datasheet, the input high threshold (VIH) at VDD = 5.0V is 3.4V (datasheet-stated absolute value, not the commonly quoted 0.7*VDD shorthand) (`evid-kc-016`).

microcontrollers operating at 3.3V logic (such as the rp2040 or samd21) output a maximum data high voltage of 3.3V, which falls slightly below the 3.4V VIH threshold (`evid-kc-016`). while short LED chains often operate reliably due to noise margins, robust pcb designs incorporate a level shifter IC (such as a 74AHCT125 or 74LVC1T45) or a power diode drop on the first LED VDD line to step 3.3V logic signals up to 5V logic.

---

## 9. open questions

merge review (sept 26, coordinator) dropped or repaired the following worker lines, recorded here so the gaps stay visible:
- dropped `evid-kc-005` (1N4148 SOD-123 ubiquity, sourced to a czech diploma thesis whose pdf was not retrievable). the package choice stands on the registry + common practice.
- dropped `evid-kc-013` (claimed cherry mx establishes 1.6mm pcb thickness, but the excerpt was an unrelated gateron comparison page). the 1.6mm standard now cites the fab-side default (`evid-osh-005`) and the leg holes cite the footprint registry.
- the 5.1k ohm usb-c CC pull-down detail (bare-mcu builds) has no live evidence line yet; usb type-c spec sourcing is a future micro-task.
- `evid-kc-009` and `evid-kc-015` were re-sourced at merge review from the official seeed wiki (the worker's seeed studio blog-feed URL was dead).
- `evid-kc-016` was re-sourced to the adafruit-hosted sk6812 datasheet; the real VIH is 3.4V at 5.0V, not the 3.5V commonly quoted from the 0.7*VDD shorthand.

1. level shifter necessity for short sk6812 mini-e chains: under what specific LED count or trace length threshold does a 3.3V gpio signal driving sk6812 mini-e LEDs fail without a dedicated 74AHCT125 level shifter?
2. hotswap socket mechanical retention vs solder durability: what are the fab tear-out force limits for kailh/gateron switch hotswap pads when mounted on 1.6mm vs 1.2mm pcbs without plate support?
3. usb-c high-speed ESD routing rules for circuitron: what exact trace length limits and differential impedance rules should circuitron apply when placing USBLC6-2SC6 ESD arrays near usb-c receptacles?
