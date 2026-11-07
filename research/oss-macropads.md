# oss macropads: what 60 real submissions say about routing

> thesis: the community already ships thousands of macropads, and their
> boards answer the questions circuitron has to answer before it can claim
> the niche: how many layers, how many vias, which mcu, hotswap or solder,
> pour or no pour. the answers are consistent enough to design against:
> two layers, a handful of vias, one mcu, mostly soldered switches, pour
> optional. measured from the merged hackpad program corpus rather than from
> opinion `[evid-oss-001, evid-oss-003]`.

or simply put: we do not have to guess what a macropad board looks like. 349
projects already published one, and the shape of the answer is stable.

## the program that produced the corpus

hack club's hackpad program ships macropads to teenagers who design them:
submit a pcb with schematic, case files as step, and firmware, and the program
supplies the component kit and funds the jlcpcb order with a 15 dollar grant
`[evid-oss-001, evid-oss-002]`. the submission rules are the reason this
corpus is comparable at all: every project had to clear a fab check at the
same house, so the files are real orderable designs, not sketches.

the repository holds 31,012 tracked files with 382 kicad boards across 349
projects `[evid-oss-003]`. we sampled 60 boards, one per project, and counted
the geometry directly instead of reading prose about it.

## what the numbers are

| measurement | result |
| --- | --- |
| copper layers | 2 layers on 59 of 60, four layers on none `[evid-oss-004]` |
| layer balance | both faces routed on 59 of 60, 58 percent front, 42 percent back `[evid-oss-004]` |
| trace segments | median 110, p25 74, p75 171, max 690 `[evid-oss-005]` |
| vias | median 2, p75 10, max 57 `[evid-oss-005]` |
| footprints | median 22 `[evid-oss-005]` |
| mcu | seeed xiao on 60 of 60 `[evid-oss-006]` |
| switch mounting | hotswap footprints on 5 of 60 `[evid-oss-006]` |
| matrices | diode footprints on 28 of 60 `[evid-oss-006]` |
| ground pour | zone present on 19 of 60 `[evid-oss-006]` |
| board size | median 92 by 77 mm where extents parsed (n=18) |

## what it means for circuitron

**two layers is the right scope, not a limitation.** no sampled design needed
four layers `[evid-oss-004]`, and the fab records agree: the two layer class is
what the cheap tier sells. four layer support stays a later rung, not a gap to
close now.

**our via count is inside the norm but not exemplary.** keeberia's reference
boards run 3 to 13 vias against a community median of 2 `[evid-oss-005]`. that
is legal and cheap, but the norm says a board that needs ten layer changes is
doing something harder than it has to. worth a router pass later: fewer layer
changes when a detour costs about the same.

**the pour is our opinion, not the market's.** circuitron pours gnd on the
back face; only 19 of 60 submissions pour anything `[evid-oss-006]`. the pour
is good practice for our own noise story, so keep it, but treat it as a
keeberia choice rather than a convention we inherited.

**the netlist's two modes match reality.** 28 of 60 boards carry diodes and the
rest are direct gpio `[evid-oss-006]`, which is exactly the branch our netlist
already implements. no change needed, and now it has evidence behind it.

**xiao is the de facto macropad mcu** `[evid-oss-006]`, which validates the
footprint set rather than the abstract choice of "an mcu". the program
supplying the kit is what made that happen, and it says something about how a
generator wins adoption: ship the opinionated part.

**soldered switches dominate** (5 of 60 hotswap) `[evid-oss-006]`, so solder is
the sane default and hotswap is the upgrade, which is how the engine is
ordered already.

## method and its limits

the sample is one per project, taken by sorted path stride, from the current
tree. counts came from parsing kicad_pcb text for segment, via, footprint and
zone records. board extents only parsed for 18 boards because submissions
disagree on how edge cuts are drawn, so the size row is indicative only.

what this is not: a copy of anyone's design. we took statistics and program
facts `[evid-oss-001, evid-oss-003]`, no geometry and no code, which keeps the
study-dont-copy rule intact while still learning what the market actually
builds.

## open questions for later passes

- how many of these boards were routed by hand versus by an autorouter, and
  whether the via-sparse pattern correlates with hand routing
- what the failure rate is at fab time for this corpus, which would be the
  best available proxy for "what breaks when a generator designs it"
- whether the 47 percent diode-matrix share shifts as key counts grow past
  twelve, since most submissions are small pads
