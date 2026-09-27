# split keyboard subtypes: unibody, fully split, alice/arisu, and stagger geometry

> thesis: "split" is not one shape, it is a family of at least three structurally distinct classes (fixed unibody split, fully detached split, alice/arisu hybrid), and it is orthogonal to a second, independent axis: whether the keys are row-staggered, column-staggered, or ortholinear `[evid-splt-001, evid-splt-002]`. the size ladder (60/65/75/tkl/full/1800, see `research/keyboard-size-formfactor.md`) describes which key clusters exist. split describes how the alphanumeric block itself is cut and offset. a board can be both: a "split 65%" or a "split ortholinear 40%" are both coherent descriptions.

or simply put: circuitron and paracraft do not care whether a board is 60% or 75% when deciding split topology, they care whether the design is one pcb/plate or two, and whether the two columns of keys are offset per-row (typewriter legacy) or per-column (ergonomic). those two questions, not the % class, decide whether the engine needs a second board, an interconnect, and a different plate curve.

---

## 1. the three structural split classes

### fixed / unibody split
one rigid chassis, one pcb, one plate. the key wells are physically split or angled apart (a gap down the middle, or two keywells splayed outward) but the halves cannot be repositioned relative to each other because they are one molded/milled piece `[evid-splt-001]`. examples: kinesis advantage, logitech ergo k860, microsoft sculpt.
- **engine impact**: single pcb, single plate, single matrix. this is a plate-geometry problem for paracraft (two angled or curved keywells instead of one flat one) and does not change circuitron's board count.

### fully split (detached halves)
two entirely separate physical boards, each with its own pcb and plate, connected by a cable `[evid-splt-001]`. the cable is TRRS (simple serial link, common on cheaper/DIY boards) or USB-C (higher bandwidth, increasingly standard on commercial splits) `[evid-splt-002]`. examples cited directly: corne, lily58, dactyl `[evid-splt-002]`; also ergodox, iris, moonlander.
- **firmware pattern**: near-universally one half is "master" (handles usb-host communication and owns the active keymap) and the other is "slave," communicating scan state over the interconnect. some boards run fully independent mcus per half (two half-firmwares); some run a single logical matrix split across a wired link.
- **engine impact**: this is the one true circuitron-side fork in the whole layout taxonomy (everything else in `layout-standards.md`, `logical-layouts.md`, `mac-keyboard-variant.md` is legend/firmware-only, zero pcb impact). fully split means: two independent pcb artifacts, two plates, an interconnect spec (TRRS vs USB-C, master/slave assignment), and a bom line for the connecting cable. this is a structural decision the engine has to make explicitly, not a downstream projection.

### alice / arisu hybrid
single pcb, single plate, single chassis (not detached, not fully unibody-fixed either) `[evid-splt-002]`. the key columns are splayed apart and angled in the center (most visibly the bottom row: the b/n keys separate and angle outward, giving a distinctive "winged" bottom row), approximating the ergonomic hand-splay benefit of a split board while staying a single rigid board that fits a standard case shape. "arisu" is the community term for variants of the same idea. named for a mod that started as diy hand-wiring, now shipped commercially at multiple % sizes (60%, 65%, 75% alice layouts all exist commercially).
- **engine impact**: single pcb/single plate like unibody, but with non-standard column offsets and splayed switch positions in the center columns and bottom row. this is a matrix-layout and plate-cutout variation, not a board-count fork. it composes with the % ladder (a "65% alice" is a real, common commercial spec).

---

## 2. the orthogonal axis: stagger geometry

independent of which of the three split classes above (or no split at all) a board uses, the alphanumeric block itself is arranged with one of three stagger patterns:

- **row stagger**: the traditional layout. each row is offset horizontally from the row above/below it (carried over from mechanical typewriter linkage geometry, long outlived the mechanical reason for existing). standard on 100%/tkl/75%/65%/60% boards and on fixed/unibody splits like the kinesis advantage.
- **column stagger**: each column is offset vertically instead, so each finger's column of keys sits at a height matched to that finger's natural reach rather than a straight horizontal row. common on fully-split ergo boards (ergodox, corne, dactyl-family). this is the layout most enthusiasts mean when they say "columnar."
- **ortholinear**: no offset at all in either axis, a pure grid. planck is the canonical example, cited explicitly as the ortholinear reference alongside alice/arisu in the same commercial split-board taxonomy `[evid-splt-002]`.

a board's split class and its stagger pattern are independently chosen: a fully split board can be row-staggered (rare, but exists) or column-staggered (the common ergo case); an ortholinear board can be fully split (corne-style small boards) or a single unibody block (planck).

---

## 3. related ergonomic features (adjacent, not split-defining)

these commonly ship alongside split boards but are not what makes a board "split":
- **tenting**: angling the two halves (or the whole unibody shell) upward along the centerline so the palms face more toward each other, reducing forearm pronation. only meaningful on boards that are physically separable or have adjustable feet; requires the case/stand geometry to support an angle range.
- **thumb clusters**: a dedicated group of keys positioned under the thumb rather than the pinky-heavy bottom row of a traditional board. common on fully split ergo boards (corne's 3-key thumb cluster, ergodox's larger cluster) because the split gives room to place keys off the main grid; less common but not impossible on unibody or alice boards.

---

## 4. engine impact summary

| split class | pcb/plate count | matrix impact | typical stagger | new engine concern |
| :--- | :--- | :--- | :--- | :--- |
| **none (standard)** | 1 | standard | row | none, baseline case |
| **unibody/fixed split** | 1 | standard, angled keywells | row (mostly) | plate geometry: curved/split keywell cutout, single matrix |
| **alice/arisu** | 1 | non-standard column offsets, splayed center/bottom row | row (with splay) | plate cutout variation + bom (non-standard bottom-row keycap set), single matrix |
| **fully split (detached)** | 2 | split matrix, master/slave or dual-mcu | column (usually) | two pcb artifacts, interconnect spec (TRRS/USB-C), master/slave firmware assignment, two plates, cable bom line |

open question for later phases: does keeberia's five-flow pipeline (layout -> components -> pcb -> case -> caps) assume a single pcb/single case artifact set per design? fully split boards need the pipeline to emit two of each (or a paired artifact bundle), which is a structural question for the orchestrator, not a new research fact, flagged here for `docs/modularity.md` / the dependency-map phase.
