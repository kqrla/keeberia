# footprints-research.md

or simply put: this is the per-part provenance for the footprint registry
(engines/circuitron/src/footprints.ts). every entry below states only what the
registry source records or what sits in backend/pcb/research/footprints/ as a
downloaded original. gaps are marked as gaps.

the registry header names its three source families: kicad official library
pad geometry, the hack club hack pad care package, and component datasheets.
the downloaded originals backing them live in
backend/pcb/research/footprints/ (see its README for the fetch chain).

## provenance, per part

### cherry mx, soldered (`MX_SOLDER`)

- electrical pins: cherry mx datasheet asymmetric placement (per the
  registry comment); cross-checked against kicad official
  `SW_Cherry_MX_1.00u_PCB` and the care package `MX-Solderable-1U.kicad_mod`
  (both stored: `footprints_raw/mx_pcb.kicad_mod`,
  `footprints_care_package/`).
- 4mm center peg + 1.7mm guide pegs at ±5.08: registry-recorded
  datasheet values (plastic peg geometry, copper-less NPTH).
- case block: plate opening 14×14 / plate thickness 1.5 from the cherry mx
  datasheet; `plateTopToPcb: 5.334` from keyboard_lib (MIT, alex ives,
  gitlab) `height_for_style` — **calibration-flagged until the print test**.

### kailh mx hotswap (`MX_HOTSWAP`)

- socket pads offset outside the 14mm window with 3.05mm latch relief
  (registry comment). comparison sources pulled:
  `footprints_raw/SW_Hotswap_Kailh_MX_1.00u_perigoso.kicad_mod` and
  `footprints_hackpad/MX-Hotswap-1U.kicad_mod`.

### kailh choc v1 / pg1350 (`CHOC_V1`)

- geometry verbatim from marbastlib `SW_choc_v1_1u.kicad_mod`
  (ebastler/marbastlib, pulled sept 8 2026, recorded in the registry comment):
  pins at (-5, 3.8) and (0, 5.9), 2mm pads / 1.2mm drills, 1.7mm locating
  pegs at ±5.5, 3.4mm center LED hole, 13.8×13.8 plate cutout in a 1.2mm
  plate (kailh datasheet, cross-checked against community usage per the
  comment).
- case block: choc stack `plateTopToPcb: 2.2` from keyboard_lib (MIT,
  alex ives) `height_for_style` — **calibration-flagged until the print test**.

### ec11 rotary encoder (`EC11`)

- pad pattern (A/C/B at 2.54 pitch, push-switch D/E row, 3.05×2.2 mounting
  slots at ±5.6) matches the stored original
  `footprints_raw/ec11_switch.kicad_mod`; kicad name
  `keeberia:RotaryEncoder_Alps_EC11-Switched_Vertical` follows kicad-official naming.
- case block: `plateHole: 10.0` for a d-shaft 6/7mm + knob hub clearance
  (registry comment). the knob-bore side (6.0mm shaft nominal in checkman)
  is **calibration-flagged** — verify against the ec11 datasheet before
  production (also flagged in the caps engine default bore).

### seeed xiao carrier (`XIAO`)

- 21×17.5mm module, 14 castellated pads at 2mm pitch, 7 per edge at y ±6,
  copper extending past the module edge for side soldering (registry doc
  comment). originals pulled: `footprints_hackpad/XIAO-*` variants and
  `footprints_care_package/XIAO-Generic-Hybrid-14P-2.54-21X17.8MM.kicad_mod`.
- case block: usb shell 9.4×3.26 / module thickness 1.0 recorded as
  "typical usb-c midmount receptacle" in the registry — a typicality, not a
  datasheet citation. treat as calibration-pending if the usb cutout ever
  fails fit.

### ssd1306 oleds (`OLED_128X32_091`, `OLED_128X64_13`)

- 0.91" 128×32 on a 38×12mm breakout, 4-pin header (GND VCC SCL SDA) at
  2.54 pitch (registry comment). originals:
  `footprints_hackpad/SSD1306-0.91-OLED.kicad_mod` +
  `SSD1306-Anson.kicad_mod`.
- 1.3" 128×64 on a 36×33mm breakout, 4-pin header at the bottom edge,
  pads at ±3.81 / ±1.27, y +14.5 (registry comment; the 2.54-pitch header
  group). no downloaded original is on disk for the 1.3" variant yet —
  the pattern is derived from the 0.91" sources + the breakout's published
  pad layout. **gap: pull a 1.3" original before treating its silks/window
  as verified.**
- case block: plate window 26×8 over the 0.91" display (registry-recorded;
  window size is keeberia's own projection, not a datasheet value — the
  datasheet governs the display, the window governs the cutout).

### diode sod-123 (`DIODE`), m2 mounting holes (`MOUNT_M2`)

- originals stored: `footprints_raw/d_sod123.kicad_mod`,
  `footprints_raw/m2_hole*.kicad_mod` (kicad-official geometry pulled for
  comparison).

## the rule

if a value in the registry is not covered above and not in a datasheet, it is
either a keeberia projection (the window sizes, keepout radii — design
decisions, labeled as such) or a gap. gaps get closed by pulling an original
into research/footprints/ and recording it here — never by guessing a number
into the registry.
