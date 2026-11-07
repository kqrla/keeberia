# macropad types, and what circuitron needs for each

> thesis: a macropad is not one product. the same word covers a two key push
> to talk button, a nine key pad with a knob and a screen, a twenty key numpad
> with four knobs, and a chorded eight key brick. circuitron's job is to know
> which of those it is being asked for, and to say honestly when the mcu it
> ships cannot carry it.

or simply put: the shape of the pad decides the parts, and the parts decide
the pins.

scope note: macropads only, circuitron only. the split and full size
keyboard research from nov 7 2026 sits in `research/oss-keyboards.md` and is
parked until split work is on the table. the taxonomy in
`backend/pcb/research/notes/keeb-design-types.md` remains the broad map; this
page narrows it to the shelf circuitron is actually being asked to fill.

---

## 1. the eight archetypes, measured

the numbers below come from 60 real hackclub hackpad submissions (59 with
switch footprints), parsed straight from their kicad boards (`evid-mpad-001`
to `evid-mpad-004`, working in `research/oss-macropads.md`).

| archetype | keys | what it is | count | share |
|---|---|---|---|---|
| screen pad | 4 to 9, one knob, one display | the hackpad default: volume, scene, status | 13 | 22% |
| micro pad | 4 to 9, no screen | shortcut brick, artsey style chord pads | 11 | 19% |
| 3x4 pad | 10 to 12 | twelve key grid, usually one knob | 10 | 17% |
| rotary pod | any key count, 2 or more knobs | audio and obs pods, knob forward | 8 | 14% |
| compact pad | 13 to 20, irregular | numpad with extras, media blocks | 6 | 10% |
| numpad | 16 or 20, 4 wide | accounting and cad pads | 5 | 8% |
| knob pad | 4 to 9, one knob, no screen | volume only | 4 | 7% |
| shortcut pad | 3 or fewer | push to talk, copy paste, osu keys | 2 | 3% |

key counts run 3 to 20 with a median of 9. half of all pads carry a screen,
half carry a knob, and 8 in 59 carry two or more knobs. nothing here is rare
enough to treat as an edge case (`evid-mpad-002`, `evid-mpad-003`).

the archetype names are ours, not the community's. they exist so a design can
be talked about, and the guess lives in `engines/circuitron/src/budget.ts` as
`guessArchetype`. it decides nothing.

---

## 2. the pin cliff

every xiao variant keeberia ships carries 11 gpio. the arithmetic that eats
them:

- a display reserves the i2c pair (2)
- each knob takes two quadrature pins, plus its own ground return (2)
- keys then either take one pin each (direct) or fold into a matrix of
  rows plus columns, with one diode per key on the back

so a 3x3 pad with a knob and a screen is 2 + 2 + (3+3) = 10 pins, and it fits.
a 4x4 numpad with the same knob and screen is 2 + 2 + (4+4) = 12, and it does
not. dropping the knob makes it 10 and it fits again. that single row is the
difference between "a 4x4 is easy" and "a 4x4 with a knob needs a different
chip".

budget.ts now answers this before routing starts, in parts rather than pins,
and the engine returns it as `EngineOutput.budget`. the reference boards land
where you would expect: hackpad-3key 3 of 11 pins direct, ninepad 10 of 11
direct, streamdeck 11 of 11 as a 3x4 matrix, ninepad-choc 9 of 11.

measured against real pads, the naive budget covers 55 of 59. the four that
exceed it pair many keys with two or more knobs and a screen, which means the
community is doing something smarter than plain wiring there, most likely pin
sharing or an expander. that is worth understanding before we claim the
budget model is complete (`evid-mpad-004`).

one correction the report forced: a matrix should follow the pad's own grid.
the netlist used to pick any rows x columns that fit the pin count, so a 3x3
came out as 2x5 and a 4x5 as 3x7. budget.ts prefers the physical grid and only
falls back to a synthetic shape when the real one cannot fit.

---

## 3. circuitron's macropad gaps, in demand order

what the engine generates today: mx solder and hotswap, choc v1 solder, ec11
knob, xiao module (four variants, all the same footprint), 0.91 and 1.3 inch
i2c oleds, sod-123 diode matrix, m2 mounts, direct or matrix netlist with
i2c reserved, silkscreen, cutouts, fab driven rules, and the three solid
exports.

gaps, ranked by how many real pads want them rather than by how interesting
they are:

1. **per-key rgb, 22 of 59 (37%)**. the option flag exists, the footprint does
   not, and the netlist does not generate a data chain. it is also not just
   wiring: `evid-kc-016` puts sk6812's input high at 3.4v when the chain runs
   at 5v, above a 3.3v gpio, so the chain must either run at 3.3v or take a
   level shifter. that is a power rail decision, and it belongs in the record
   with evidence, not in a corner of the netlist. budget.ts reports it as
   unsupported rather than pretending.
2. **wireless, nrf52840 + battery + switch**. the mcu option is listed, but
   there is no jst pad, no charge circuit, no power switch footprint, and no
   zmk export. nobody can ship a battery pad today.
3. **spi displays**. our oled records are i2c only; the spi variants of the
   same modules exist and would need their own pad net.
4. **2u keys and stabilizers**. zero of the 59 pads used a stabilizer, so this
   stays out of scope for macropads even though the taxonomy flags it.
5. **analog sticks and touch pads**. 2 of 59 carry a joystick. real but rare,
   and both need an adc or i2c part we do not have records for yet.

one thing the research retired: choc hotswap. the taxonomy and the gap table
both promise it for v2, but the corpus has no choc hotswap footprint record
yet (`keeberia:Choc_v1` is deliberately solder only), so it stays blocked on
evidence rather than on code.

---

## 4. what this changes in the roadmap

the earlier gap table ordered work by keyboard ambition: splits, pico mcus,
stabilizers, trackballs. the measured world says the order should be:

1. rgb chain with a documented rail decision (biggest measured gap)
2. wireless pad path, since it turns a tethered pad into the thing people
   actually carry
3. everything else waits, because 55 of 59 pads already fit the engine we
   have, and the four that do not are odd corners, not archetypes.

or simply put: the engine is already right for most macropads. rgb is the
thing it is wrong about most often.
