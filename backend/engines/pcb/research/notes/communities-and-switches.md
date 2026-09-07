# communities, "famous" switch types, and the macropad obsession

research: sept 7 2026 · sources: hackclub/hackpad repo + website bundle + gallery api (20 community builds), hackclub/blueprint, community knowledge — reddit was captcha-walled from datacenter ip so reddit subscriber numbers are from prior knowledge, not re-verified today

## 1. the hack club ecosystem (validated our defaults for free)

**hackpad** (hackclub/hackpad) — a YSWS program: you design your own macropad (pcb + schematic, STEP case, firmware — QMK/KMK both allowed), they ship the parts free + a $15 JLCPCB fab grant + a 3d-printed case from printing legion. requirements pin the ecosystem:

- **mcu: seeed xiao rp2040** (faq literally asks "can i use another microcontroller?" — it's the standard)
- **switches: cherry mx footprint** (kit ships gateron milky yellow; max $0.50/switch; kailh choc v2 was v1-only)
- **hotswap: kailh mx hotswap sockets** (<$0.20/each — encouraged over solder)
- **encoder: EC11** (their docs reference the kicad footprint `RotaryEncoder_Alps_EC11E-Switch_Vertical_H20mm` — same EC11E we picked)
- **display: 0.91" 128x32 oled** (pin order GND-VCC-SCL-SDA, and they warn "make sure your pcb matches")
- **rgb: SK6812 MINI-E** ("make sure your symbol AND footprint both say SK6812MINI-E")

this is exactly our v1 default component set. anyone who builds on keeberia can fab in the same supply chain a hackpad graduate already knows.

**blueprint** (hackclub/blueprint) — the broader "get your hardware project funded" YSWS platform (rails). hackpad builds are frequently submitted through it (one gallery build says "i built this for hack club's blueprint program"). keeberia's output — gerbers + step + qmk config — happens to be exactly the blueprint submission bundle.

## 2. gallery: what people actually build (20 builds, hackpad v3 gallery api)

- **size**: 3–12 keys. the mode is ~4-9 keys in a grid, one build is 3x3, one 4x2 artsey, one 12-key
- **the delight trio**: nearly every build has an EC11 encoder + oled + rgb (sk6812/ws2812). one has two encoders, one has toggle switches
- **use cases (the obsession is shortcuts)**: media control (multiple), fusion 360 CAD shortcuts, krita shortcuts, QLab (theatre sound/lighting software!), minecraft, rhythm games, zoom (built for the builder's dad's meetings), audio routing with toggles, artsey.io layout, generic hotkeys
- **firmware**: qmk and kmk both appear
- **shape**: one diagonal-edge "ergonomic" board; cases are personal identity (splashpad, keybie, lewiepad, imperial-am...)

read: the macropad is the "hello world" of hardware communities because it's the smallest full-stack project — pcb + case + firmware, all yours, useful on monday morning. that's keeberia's exact user.

## 3. the famous switch types and who claims them

| type | who | notes |
|---|---|---|
| **cherry mx** (+ clones: gateron, kailh, outemu, ttc, hmx) | r/mechanicalkeyboards (~1.3m), geekhack, keebtalk | the standard. 19×19mm, 4mm travel, keycap ecosystem, group-buys, artisans. hackpad default. our default |
| **kailh choc v1/v2** (low profile) | r/ergomechkeyboards, r/olkb, ZMK/KMK firmware community | split keebs (corne, kyria) — portability + laptop-adjacent use. the low-profile keeberia lane later |
| **hall effect / magnetic** | wooting fans, competitive gaming (rapid trigger) | the gaming community's switch; adjustable actuation. future "gamer pad" template |
| **topre** | HHKB/realforce cult, the "thock" crowd | electrostatic capacitive, beloved, expensive. aspirational export path someday |
| **buckling spring** (model M/F) | vintage community, deskthority, modelfkeyboards reproductions | the founder keyboard. nostalgia artifact |
| **alps/skcm** | vintage collectors | unobtainium; historical interest only |
| **optical** | was razer's thing | declining, skip |

rule of thumb: **mx is the mainstream, choc is the ergo, hall effect is the gamer, topre is the connoisseur.** keeberia v1 speaks mx only; that covers the hackpad ecosystem + the giant keycap economy.

## 4. the macropad obsession — cross-community evidence

- **hack club**: hackpad is their most popular hardware YSWS; the gallery shows teens building shortcut pads for tools their parents use
- **adafruit**: the macropad RP2040 (8 keys + encoder) is one of their flagship learning products — the "can i buy the hello world instead of build it" tier
- **pimoroni keybow**, various rpi hats — the microcontroller-community version of the same itch
- **r/macropads, r/mechanicalkeyboards builds**: macropads dominate "first build" posts — bounded scope, single MCU, ~$15 fab, instant utility
- **artsey.io** — a community that exists entirely around an 8-key input system (a,b,c,d,e... for chorded typing). a layout *culture* attached to a key count

pattern: every hardware community converges on the macropad as the first "real" project because it touches every discipline (pcb, cad, firmware, design) at a scale a beginner can actually finish. keeberia's job is deleting the parts of that journey that aren't fun — the eda, the netlists, the footprint hunting — while keeping the parts that are (shape, layout, identity).

## 5. implications for keeberia

1. **v1 defaults are validated** — our set (xiao rp2040, mx + hotswap, ec11, 0.91" oled, sk6812 mini-e) is the hackpad parts list, component for component. users graduate to the same supply chain
2. **starting templates should mirror the gallery's use cases**: media pad, CAD/shortcut pad, artsey 4x2, "first pad" 3x3 — not abstract "custom layouts"
3. **encoder + oled + rgb is not optional garnish, it's the expected trio** — flow two's component picker should treat them as first-class, not advanced
4. **firmware export should offer both qmk and kmk** — both appear organically in the gallery
5. **the 12-key ceiling**: v1's micropad scope (≤12 keys) covers 20/20 observed gallery builds. keebs later is correct sequencing
6. **export bundle = blueprint submission bundle** (gerbers, step, firmware, bom) — our output format should literally be "submittable to hack club YSWS without modification." that's a distribution channel, not just a feature
