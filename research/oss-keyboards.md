# open source keyboards by type (measured, nov 7 2026)

> thesis: macropads are the shallow end. routing complexity scales about ten
> times going from a 9 key pad to a split or a 40 percent board, and the
> shapes of the answer (two layers everywhere, dozens to hundreds of vias,
> pour on most splits) tell circuitron what it must survive before it can
> claim keyboards, not just macropads.

or simply put: we measured macropads last night. this file measures what
happens when the board gets bigger.

## method

github api for discovery and trees, raw file download for the boards
themselves, no scraping. 60 hackpad submissions (one board per project) and
16 boards across split, ortho-40 and full size repositories. plates,
spacers and unrouted files were dropped before averaging, leaving 12 real
boards in the type sample. every number is parsed from the kicad_pcb text:
segments by layer, via count, footprint count, zone count.

repos in the type sample: foostan/crkbd, GEIGEIGEIST/TOTEM, GEIGEIGEIST/KLOR,
mattdibi/redox-keyboard, beekeeb/piantor, peej/lumberjack-keyboard,
moduloindustries/thinkeys, ChrisChrisLoLo/keezyboost40, strayer/taira-keyboard,
joe-scotto/scottokeebs, tzarc/keyboards.

## the numbers

| type | boards | segments med / max | vias med / max | footprints med | pour |
|---|---|---|---|---|---|
| macropad | 60 | 110 / 690 | 2 / 57 | 22 | 19/60 |
| split | 4 | 1038 / 1893 | 82 / 329 | 62 | 4/4 |
| ortho-40 | 4 | 788 / 2161 | 59 / 106 | 129 | 2/4 |
| larger (60 to 75 class) | 4 | 604 / 2262 | 126 / 497 | 74 | 3/4 |

evidence: evid-oss-008 (distributions), evid-oss-010 (pour rates),
evid-oss-007 (layer usage).

## what it means for circuitron

**two layers is the entire market, not a v1 shortcut.** sixteen boards
checked, zero segments on inner copper, including a file that declares
In1.Cu and routes nothing on it. the fab record work already scopes to two
layer. four layer support stays parked with clean conscience (evid-oss-007).

**the router has to hold about two thousand segments and a few hundred
vias.** our reference boards sit at 30 to 534 segments and 3 to 13 vias,
which is macropad class. a 40 percent board is four times the streamdeck and
a split half is roughly three times it. the via median for splits (82) is
forty times the macropad median, so "keep vias low" was a macropad rule, not
a keyboard one: at keyboard scale, layer changes are the normal tool
(evid-oss-008).

**splits are mostly one reversible board.** corne, TOTEM, KLOR and redox all
ship a single pcb; piantor ships left and right as separate files. so the
cheap split path for keeberia is a reversible single board with a mirrored
placement pass, and the expensive path (two boards, two fab orders) is the
exception rather than the rule (evid-oss-009).

**pour is the keyboard norm.** four of four split boards pour, against
nineteen of sixty macropads. our b.cu gnd pour is therefore conventional at
keyboard scale and opinionated at macropad scale, which is the right thing
to say in the docs rather than pretending it is universal (evid-oss-010).

**vendor reference is a different licensing animal.** keychron's hardware
repo is source available: personal and educational use, compatible
accessories allowed, board copying and trademark use not. it is a study
source, never a geometry source, and it does not ship editable cad anyway
(evid-oss-011).

## open questions

- does the segment scale come from keys, from the matrix, or from diode per
  key? a same-size direct-gpio board would settle it.
- how do the largest boards keep DRC clean: manual cleanup, or autoroute
  plus fixes? the kicad files alone cannot say.
- do reversible splits double the copper on both faces by construction, and
  is that why their via medians run high?
