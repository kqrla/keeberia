# taxonomy of macropad and custom keyboard design types in the community

research: sept 8 2026 · sources: r/MechanicalKeyboards, r/ErgoMechKeyboards, geekhack.org, keebtalk.com, splitkb.com, zsa.io, nullbits.co, omkbd.com, yushakobo/keyball, geigeigeist/totem, diimdeep/awesome-split-keyboards

---

## 1. design-type taxonomy (~18 distinct board types)

the custom keyboard and macropad ecosystem spans from 3-key shortcut triggers up to 80% tenkeyless boards. below are the 18 distinct design types actively built, modded, and shared across mechanical keyboard communities.

### 1. 3–9 key micro-macropads / shortcut pads
- **rough key count / footprint**: 3 to 9 keys, ~45×40mm to 65×65mm.
- **standout features**: single rotary encoder (EC11), 0.91" SSD1306 OLED (128x32 I2C), direct GPIO routing without diodes, Seeed Xiao RP2040 MCU.
- **why people build it**: "hello world" of hardware. media playback, mute toggle, CAD shortcuts (Fusion 360), Krita brush control, Artsey 8-key chorded typing, zoom meeting controls.
- **prior art / URLs**: [hackclub hackpad](https://github.com/hackclub/hackpad), [artsey.io](https://artsey.io), [adafruit macropad rp2040](https://www.adafruit.com/product/5128).

### 2. 4×4 / 4×5 numpads & calculator pads
- **rough key count / footprint**: 16 to 20 keys, ~80×80mm to 80×100mm.
- **standout features**: 2u enter/plus keys with stabilizers, rotary encoder in top corner, 0.96" or 1.3" OLED display, simple 4x4 or 4x5 diode matrix.
- **why people build it**: accounting, data entry, Blender N-panel control, stream decks, dedicated numpad for 60%/65% main keyboard users.
- **prior art / URLs**: [nullbits tidbit](https://nullbits.co/tidbit/), [geekhack púca numpad](https://geekhack.org/index.php?topic=112895.0), [murphpad](https://mechwild.com/product/murphpad/).

### 3. rotary & oled streamer / audio / cad pods ("podium pads")
- **rough key count / footprint**: 4 to 12 keys, 2 to 4 rotary encoders, 1 to 2 OLED/TFT screens, ~100×80mm.
- **standout features**: multi-knob audio mixer controls (volume, discord, spotify, OBS scene master), status screen showing CPU/GPU load or track info.
- **why people build it**: twitch/youtube streamers, audio engineers, video editors (Premiere/Resolve scrubbing), CAD designers.
- **prior art / URLs**: [geekhack octopad+](https://geekhack.org/index.php?topic=111334.0), [nullbits nibble](https://nullbits.co/nibble/), [geekhack dual knob oled macro](https://geekhack.org/index.php?topic=124019.0).

### 4. 30% ultra-compact monoblock
- **rough key count / footprint**: 20 to 30 keys, ~180×60mm.
- **standout features**: extreme layer reliance (combos, tap-dance, heavy hold/tap modifiers), no spacebar (1u space or 2u center), ultra-narrow single-board footprint.
- **why people build it**: minimalism flex, pocket-sized portability, chorded/sub-40% typist challenges.
- **prior art / URLs**: [gherkin 30-key](https://github.com/40habitats/gherkin), [butter 20-key](https://github.com/jackhumbert/butter), [alpha 28](https://github.com/pyne/alpha-keyboard).

### 5. 40% ortholinear monoblock
- **rough key count / footprint**: 47 to 48 keys (4×12 grid), ~230×80mm.
- **standout features**: strict grid alignment, single 2u spacebar or dual 1u space keys, no key stagger, small diode matrix (4x12).
- **why people build it**: finger travel reduction, logical grid symmetry, programmable layers, high typing speed with low wrist motion.
- **prior art / URLs**: [planck 40%](https://drop.com/buy/planck-mechanical-keyboard), [preonic 5x12](https://drop.com/buy/preonic-mechanical-keyboard), [contra 40%](https://ai03.com).

### 6. 40% staggered / columnar monoblock & minivan
- **rough key count / footprint**: 38 to 44 keys, ~240×90mm.
- **standout features**: traditional row stagger or gentle column stagger on a single PCB, split spacebar, compact 40% height (no number row).
- **why people build it**: traditional typing habit preserved without moving wrists to reach number/function rows.
- **prior art / URLs**: [minivan 44-key](https://trashgeneration.com/minivan), [reviung41](https://github.com/gtips/reviung), [prime_e](https://primekb.com).

### 7. 34–36 key ultra-minimalist split ergo (column-stagger, low profile)
- **rough key count / footprint**: 34 to 36 keys split into two halves (3x5 grid per side + 2 or 3 thumb keys), ~110×80mm per half.
- **standout features**: low-profile Kailh Choc v1 switches, wireless nice!nano / Xiao nRF52840 MCU, ZMK firmware, aggressive column stagger, 18×17mm choc spacing.
- **why people build it**: peak ergonomic health (RSI prevention), no finger extension past 1 unit, ultra-lightweight travel, zero cable clutter.
- **prior art / URLs**: [ferris sweep v2](https://github.com/davidphilipbarr/Sweep), [geigeigeist totem](https://github.com/GEIGEIGEIST/TOTEM), [awesome split keyboards](https://github.com/diimdeep/awesome-split-keyboards).

### 8. 40–42 key mainstream compact split ergo
- **rough key count / footprint**: 42 keys total (3×6 grid per side + 3 thumb keys), ~140×90mm per half.
- **standout features**: per-half 0.91" OLED display, per-key RGB, TRRS or USB-C interconnect cable, optional rotary encoder on thumb cluster, support for MX or Choc switches.
- **why people build it**: the "gold standard" gateway into split ergonomics. retains outer column for tab/backspace/enter while eliminating number row.
- **prior art / URLs**: [corne / crkbd v3/v4](https://github.com/foostan/crkbd), [choctopus44](https://github.com/sadekbaroudi/choctopus44), [elephant42](https://github.com/darakoscott/elephant42).

### 9. 54–60 key full-featured split ergo (with number row)
- **rough key count / footprint**: 54 to 60 keys total (4×6 grid per side + 4 or 5 thumb keys), ~160×110mm per half.
- **standout features**: dedicated number row, dual rotary encoders, dual OLED displays, RGB underglow, extensive thumb cluster keys.
- **why people build it**: split ergonomics for programmers and accountants who need immediate access to numbers and symbol keys without heavy layer switching.
- **prior art / URLs**: [lily58](https://github.com/kata0510/Lily58), [sofle v2 / rgb](https://github.com/josefadamcik/SofleKeyboard), [splitkb aurora series](https://docs.splitkb.com/product-guides/aurora-series), [zsa voyager](https://www.zsa.io/voyager).

### 10. integrated trackball split ergo
- **rough key count / footprint**: 34 to 60 keys + 34mm or 25mm trackball integrated into right or left thumb/index zone, ~150×120mm per half.
- **standout features**: PMW3360 or PMW3388 optical trackball sensor module (SPI), ceramic/steel bearing cup, mouse button layer mapping.
- **why people build it**: complete removal of desk mouse. hands never leave the typing position; ideal for ultra-ergonomic workstation setups.
- **prior art / URLs**: [yowkees keyball39/44](https://github.com/Yowkees/keyball), [bastardkb charybdis](https://github.com/Bastardkb/Charybdis).

### 11. 3d curved / concave dactyl manuform split ergos
- **rough key count / footprint**: 36 to 64 keys mounted on a 3D-curved bowl structure, ~180×160×80mm per half.
- **standout features**: hand-wired or flexible PCB strips, extreme 3D curved thumb cluster, deep sculpt fitting human hand curvature.
- **why people build it**: ultimate severe-RSI relief and custom hand fitting.
- **prior art / URLs**: [dactyl manuform](https://github.com/abstracthat/dactyl-manuform), [glove80](https://www.moergo.com/), [bastardkb skeletyl](https://github.com/Bastardkb/Skeletyl).

### 12. alice / arisu ergonomic monoblock
- **rough key count / footprint**: 64 to 68 keys, angled split layout on a single monoblock PCB (~320×110mm).
- **standout features**: 12-degree to 15-degree angled typing halves, split spacebars, rotary encoder, arrow keys (on Arisu variant).
- **why people build it**: ergonomic wrist angle alignment without the complexity/cables of two separate split halves. popular in desk aesthetic builds.
- **prior art / URLs**: [switch couture alice](https://switchcouture.com), [owlab spring](https://qwertykeys.com).

### 13. 60% hhkb / wkl / standard monoblock
- **rough key count / footprint**: 60 to 62 keys, ~290×100mm.
- **standout features**: blocked bottom corners (HHKB style) or missing Windows keys (WKL / Winkeyless), standard 60% tray mount or gasket mount.
- **why people build it**: timeless aesthetic, symmetrical layout, standard keycap set compatibility, heavy enthusiast cult following.
- **prior art / URLs**: [hhkb layout](https://happyhackingkb.com), [bakeneko60](https://cannonkeys.com), [gh60](https://geekhack.org).

### 14. 65% compact monoblock with blocker & arrow cluster
- **rough key count / footprint**: 67 to 68 keys, ~315×105mm.
- **standout features**: dedicated arrow keys, vertical navigation column (Delete, PageUp, PageDown), 1u blocker separating spacebar and arrows.
- **why people build it**: the most popular mainstream custom layout. compact desktop footprint with zero arrow key compromise.
- **prior art / URLs**: [keychron q2](https://www.keychron.com), [mode envoy](https://modedesigns.com), [kbd67 lite](https://kbdfans.com).

### 15. 75% compact / exploded monoblock with rotary encoder
- **rough key count / footprint**: 80 to 83 keys, ~325×135mm.
- **standout features**: full dedicated function row (F1-F12), exploded arrow cluster, rotary encoder knob in top-right corner, 0.96" or OLED display.
- **why people build it**: all-in-one productivity and gaming layout without full numpad bulk.
- **prior art / URLs**: [gmmk pro](https://www.gloriousgaming.com), [keychron q1](https://www.keychron.com), [satisfaction75](https://cannonkeys.com).

### 16. tkl (tenkeyless / 80%) monoblock
- **rough key count / footprint**: 87 keys, ~360×140mm.
- **standout features**: full navigation cluster (3x3 block), isolated arrow cluster, full function row.
- **why people build it**: traditional desktop office / gaming layout with classic proportions and maximum keycap compatibility.
- **prior art / URLs**: [custom tkl prior art on geekhack](https://geekhack.org/index.php?board=132.0), [frog tkl](https://geonworks.com).

### 17. hall-effect / magnetic rapid trigger gaming pads & keyboards
- **rough key count / footprint**: 3 to 64 keys, variable footprints.
- **standout features**: magnetic Hall-effect switches (Gateron KS-20, Lekker), continuous analog position sensing, dynamic actuation and Rapid Trigger (instant reset on key lift).
- **why people build it**: competitive rhythm games (OSU!), FPS movement (counter-strafing in CS2 / Valorant).
- **prior art / URLs**: [wooting 60he](https://wooting.io), [sayobot o2ma osu pad](https://sayodevice.com).

### 18. wireless ultra-portable choc / flat-pack split
- **rough key count / footprint**: 36 to 42 keys, ~110×80×12mm per half.
- **standout features**: ultra-thin profile (<12mm total height), magnetic tenting pucks, integrated LiPo batteries, ZMK Bluetooth LE firmware, low-profile Choc hotswap.
- **why people build it**: digital nomad setups, coffee shop typing, fitting into a laptop sleeve.
- **prior art / URLs**: [zsa voyager](https://www.zsa.io/voyager), [corne-ish zen](https://lowprokb.ca), [splitkb aurora sweep](https://docs.splitkb.com/product-guides/aurora-series).

---

## 2. components and add-ons that define a build

a custom keyboard build is defined as much by its interactive add-ons and material choices as by its key count.

### interactive components & sensors

| component | common specs / footprints | interface | purpose & community usage |
|---|---|---|---|
| **rotary encoders** | Alps / EC11 (EC11E, EC11K - 15mm/20mm D-shaft or knurled), Bourns PEC11R, EVQWGD001 thumb rollers | 2 quadrature pins + 1 switch pin (GPIO) | volume control, zoom, brush size, OBS scene switching, timeline scrubbing |
| **oleds & displays** | SSD1306 0.91" (128×32), SSD1306 0.96" (128×64), SH1106 1.3" (128×64), ST7789 1.3" Color TFT, GDEW0154Z04 E-ink | I2C (4-pin) or SPI (7-pin) | layer indicator, WPM counter, bongo cat animations, battery status, active modifier state |
| **trackballs & optical sensors** | PMW3360 / PMW3388 optical sensor modules, Pimoroni I2C RGB mini trackball, 34mm / 25mm ceramic bearing cups | SPI (sensor) or I2C (Pimoroni) | on-board mouse cursor movement directly on thumb/index key areas (Keyball, Charybdis) |
| **touch sliders & trackpads** | Cirque GlidePoint 1030 (35mm/40mm circular trackpad), MPR121 capacitive touch controller | I2C / SPI | smooth gesture scrolling, volume sliders, touch-to-mute zones |
| **wireless mcus & battery** | Nordic nRF52840 (nice!nano v2, Seeed Xiao nRF52840, SuperMini NRF52840) + JST PH 2.0 LiPo connector + slider switch | BLE / ZMK firmware | cable-free desktop & split keyboard interconnect over Bluetooth LE |
| **hall-effect / magnetic switches** | Gateron KS-20, Outemu Magnetic, Lekker switches + AH3572 / DRV5055 linear Hall sensors | Analog ADC pins / multiplexer | continuous key depth sensing, dynamic actuation points, Rapid Trigger for gaming |

### plate materials

- **FR4**: standard PCB substrate material (1.6mm or 1.2mm). flexible, inexpensive, deep acoustic pitch ("clack/thock"), produced directly by PCB fabs.
- **Aluminum**: 1.5mm standard. stiff, crisp, bright acoustic tone, high structural rigidity.
- **Brass**: 1.5mm heavy. extremely dense and stiff, high-pitched metallic acoustics, luxurious weight.
- **POM (Acetal/Delrin)**: 1.5mm flexible. soft bottom-out feel, deep muted thocky sound profile.
- **Polycarbonate (PC)**: 1.5mm bouncy. translucent aesthetic, soft finger impact, deep acoustic resonance.
- **Acrylic**: 3.0mm laser-cut. low cost, crisp sound, translucent RGB diffusion.
- **Carbon Fiber**: 1.5mm rigid. ultra-lightweight, sharp acoustic return, distinct weave aesthetic.

### case materials & structural architectures

- **3D Print (PLA, PETG, ABS, SLA Resin)**: fast prototyping, open-source STL/STEP generation, customizable geometries, accessible to home printers (Bambu A1 mini / Ender 3).
- **Acrylic Sandwich (Stacked Acrylic)**: 3mm to 5mm laser-cut sheets stacked with standoffs. popular for DIY kits due to low manufacturing cost and full RGB diffusion.
- **FR4 Sandwich**: PCB top plate + PCB bottom plate connected with M2 brass standoffs. ultra-budget kit staple (e.g. Plaid, Nibble, BDN9).
- **CNC Aluminum**: solid anodized or e-coated aluminum block. premium weight, acoustic density, high manufacturing cost.

---

## 3. keeberia v0-v1 engine capabilities vs roadmap gaps

keeberia's v0-v1 engine is deterministic and production-proven for small macropads. below is the mapping between what v0-v1 can reach right now vs the feature additions required to support the full taxonomy.

### what keeberia v0-v1 reaches today
- **supported build types**:
  - 3–9 key micro-macropads (Hackpad, 3×3 shortcut pads, Artsey chord pads).
  - 1-knob + 1-OLED media controllers (volume/mute/scrub pods).
- **engine defaults**:
  - MCU: Seeed Xiao RP2040 (or Xiao series carrier footprint).
  - Routing: Direct GPIO allocation for small counts + automatic diode matrix fallback (SOD-123 diodes on back lane).
  - Add-ons: EC11 rotary encoder, 0.91" / 1.3" SSD1306 OLED (I2C reserved).
  - Case: OpenSCAD programmatic 3D-printed sandwich case (STL/STEP export).

### gap analysis & requirements for future design types

| design type / feature | missing technical capability in v0-v1 | required engine enhancement | roadmap version |
|---|---|---|---|
| **numpads (16-20 keys) & 40% monoblocks** | Xiao pin limit (~11 GPIOs) cannot route >12 keys without shift registers or row/col matrix stretch | RP2040 Pico (26 GPIOs) MCU footprint option or matrix expander | v2 |
| **stabilizers & multi-unit keys (2u, 2.25u, 6.25u)** | engine grid assumes uniform 1u courtyards (19×19mm); no stabilizer PCB cutouts | 2u+ key span handling in layout normalizer + PCB mounting holes (Cherry PCB-mount stabs) | v2 |
| **split keyboards (sweep, corne, lily58)** | single PCB engine run; no dual-half netlist or interconnect routing | twin-board coordinated engine generation + TRRS / Type-C interconnect pin mapping | v2 |
| **low-profile choc switches** | MX solder and MX hotswap footprints only | Kailh Choc v1/v2 footprints + 18×18mm and 17×18mm grid spacing | v2 |
| **wireless (nice!nano / zmk)** | no battery JST footprint, charge IC circuit, or ZMK config generator | nRF52840 MCU footprint + power switch + JST pad placement + ZMK firmware exporter | v2 / v3 |
| **plate export (dxf / svg / step)** | case engine outputs STL/STEP sandwich case only | standalone DXF/SVG plate contour exporter for laser cutting (FR4, POM, Alu, Brass) | v1.5 / v2 |
| **trackball integration** | no SPI sensor footprint or 3D bearing cup generation | PMW3360 SPI sensor breakout footprint + OpenSCAD 3D trackball cup module | v3 |
| **per-key rgb** | SK6812MINI-E footprint verified in v0, but trace daisy-chaining not enabled in netlist | RGB data-in / data-out chain synthesis in netlist generator + power trace width budgeting | v2 |

---

## 4. shortlist of 5-8 recommended keeberia preset templates

to give users instant delight when opening keeberia, the editor should ship with 8 community-favorite preset templates representing the most popular build categories.

### 1. keeberia 3×3 media pad (the v1 default)
- **type**: 9-key macropad + 1× EC11 knob + 1× 0.91" OLED display.
- **mcu**: Seeed Xiao RP2040 (direct GPIO / mini matrix).
- **why**: exact match for Hackpad ecosystem and v1 engine capability. instant 30-second export for media keys, volume control, and status display.

### 2. bdn9 / 3×3 rotary shortcut pad
- **type**: 3×3 macro grid customizable with up to 2× EC11 encoders + 0.91" OLED.
- **mcu**: Seeed Xiao RP2040.
- **why**: iconic community staple layout ([keebio bdn9](https://keeb.io/products/bdn9-3x3-macropad-rotary-encoder-support)). high demand for customizable shortcut pods.

### 3. tidbit 19-key numpad + encoder + oled
- **type**: 4×5 numpad grid with 2u enter key, top-right rotary knob, and 0.96"/1.3" OLED.
- **mcu**: Seeed Xiao RP2040 + diode matrix (or RP2040 Pico for v2).
- **why**: the ultimate productivity accessory for laptop workers and 60% keyboard owners ([nullbits tidbit](https://nullbits.co/tidbit/)).

### 4. ferris sweep v2 (34-key ultra-minimal split ergo)
- **type**: 34 keys (3×5 grid + 2 thumb keys per side), Choc low profile, column stagger.
- **mcu**: wireless nRF52840 / nice!nano footprint.
- **why**: the most popular minimalist split keyboard in the ergo community ([davidphilipbarr sweep](https://github.com/davidphilipbarr/Sweep)). flagship template for keeberia v2 split engine.

### 5. corne / crkbd (42-key mainstream split ergo)
- **type**: 42 keys (3×6 grid + 3 thumb keys per side), dual 0.91" OLEDs, TRRS/wireless interconnect.
- **mcu**: Seeed Xiao or nice!nano.
- **why**: the world's most built open-source split keyboard ([foostan crkbd](https://github.com/foostan/crkbd)). essential template for community adoption.

### 6. planck 40% ortholinear monoblock
- **type**: 48 keys (4×12 grid) or 47 keys with centered 2u spacebar.
- **mcu**: RP2040 Pico class MCU.
- **why**: the gateway ortholinear keyboard ([planck ortholinear](https://drop.com/buy/planck-mechanical-keyboard)). compact, elegant, and simple grid geometry for keeberia's autolayout engine.

### 7. sofle v2 / lily58 (58-key split ergo with number row)
- **type**: 58 keys (4×6 grid + 5 thumb keys per side), dual rotary encoders, dual OLEDs, number row.
- **mcu**: Seeed Xiao / RP2040 Pico.
- **why**: top choice for developers who want split ergonomics without sacrificing the number row ([josefadamcik sofle](https://github.com/josefadamcik/SofleKeyboard)).

### 8. arisu 65% ergo monoblock
- **type**: 65-key angled split monoblock with dedicated arrow cluster and top-right rotary encoder.
- **mcu**: RP2040 Pico.
- **why**: bridge between traditional monoblock keyboards and ergonomic split typing. huge aesthetic favorite on r/MechanicalKeyboards.
