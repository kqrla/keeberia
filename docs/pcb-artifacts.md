# pcb artifacts: what is structure and what is taste

> thesis: a pcb has two kinds of truth. one is electrical and mechanical and
> cannot be bent by preference: footprints, nets, copper, clearances, drills.
> the other is the user's: silhouette, decorative cutouts, silkscreen art,
> colors. circuitron keeps them in separate layers so taste can change freely
> and structure stays verified. or simply put: you can redraw the outline at
> midnight without re-proving the circuit at dawn.

## the split

**structure (engine owned, never styleable)**

- placements, nets, matrix or direct-gpio mode, routing, vias
- copper clearances, drill sizes, annular rings, edge clearance
- fab validation: board window, cutout widths, silk minimums
- assembly silkscreen: reference designators, pin 1 marks, key labels

**taste (user owned, always validated)**

- board silhouette: auto rectangle from the parts bbox, a polygon, or an
  uploaded dxf (`layout.outline`)
- decorative cutouts: extra closed loops, treated as non plated slots
- silkscreen art: lines, polylines, text (`layout.vanity.silkscreen`)
- mask and silk color, surface finish (order-time attributes, not geometry)

the seam between them is validation, and it runs one way: taste may never
loosen a structural rule. a cutout thinner than the fab's minimum slot, a
silkscreen text shorter than the fab's minimum height, an art line crossing a
pad, a silhouette that clips a pad: all rejected or warned before anything is
exported. the fab record is the authority (see `research/manufacturing/capabilities`).

## why the silhouette is not really vanity

the outline looks aesthetic and behaves structural. it sets where copper may
run (edge clearance), where parts may sit (pad containment), how big the
board is against the fab window, and what the 3d views extrude. that is why it
is validated like a rule and why a dxf that moves a pad off the board is a
hard error rather than a nudge.

## downloads

every design hands the user files that do not need any tool we sell:

- **step**: exact planar brep, millimetres, y already flipped to cad sense.
  every face is a plane bounded by edge loops, which is what freecad, fusion
  and solidworks re-nurb without complaint. written by hand in
  `engines/circuitron/src/step.ts`, then read back through occt in
  `test/step.ts` so we never ship a file we did not verify with a real kernel.
- **glb**: glTF 2.0 binary, metres as the spec wants, one mesh, one material.
- **stl**: binary, millimetres, the printer's native dialect.

all three come from the same triangulation, so a decorative cutout subtracts
from the download exactly as it appears in the preview. the mesh is closed and
the volume test in `test/export3d.ts` proves it: area times thickness, minus
every cutout, to within a rounding error.

## related

- [`docs/3d-preview.md`](3d-preview.md): the viewer scenes those files dress.
- [`docs/circuitron-status.md`](circuitron-status.md): engine health and gaps.
- [`assets/models/README.md`](../assets/models/README.md): prefetched component bodies.

## cutouts reach the fab twice, on purpose

an internal cutout appears in two artifacts with two meanings. in
`Edge.Cuts` it is the boundary: this is the authority, and every house reads
it as the silhouette of the opening. in `keeberia-cutouts.drl` it is a real
rout program: one G85 slot per loop edge, with a 1.00mm bit, which is what a
cam tool needs to actually schedule the cut. the two must agree, and the
gerber test asserts the slot count equals the loop edge count before either
file leaves the engine.

narrow slots under the fab's minimum non-plated width never get this far:
vanity validation rejects them at input time, so a rout program cannot ask
for a cut the house cannot make.

## the silhouette rule (nov 7 2026)

the board edge used to be the bounding box of every part. that was wrong the
moment the ui let you paint switches anywhere: a 3x3 block with two keys on the
right of the middle row is a plus shape, and it shipped as a rectangle with dead
board where the notch should be. the user drew a shape and got a rectangle back.

the rule now:

- the board is the envelope everything must fit inside (every switch courtyard
  plus 2.5mm, and every cell you painted), minus the cells you blocked
- a part never carves a notch. the xiao and a display sit on the board, they do
  not reshape it
- a blocked cell always does. on the edge it opens through the margin, in the
  middle it becomes a routed slot you can see through
- a shape that cannot be built is an error, never a silent fall back: pieces
  that do not touch, or a blocker that removes the ground under the mcu, refuse
  with a sentence you can act on

`src/silhouette.ts` traces the region exactly, on the lattice of the real edges,
with the material always on the left, so no staircasing appears. blocked cells
become cutouts and land in the excellon rout file as g85 slots.

two things measured, both recorded because they cost real time:

- unioning part courtyards instead of the envelope looked more honest and turned
  every display into a wing. on the reference streamdeck the step cost six nets
  of routing space, which the fab suite caught
- the ec11 keepout ends 0.29mm short of the mx courtyard, so an exact union
  traced a 0.29mm stair along the edge. `coalesceRects` pushes edges within
  0.6mm outward into one line: a 0.3mm step is milling noise, not a shape

one geometry change: choc boards grow 0.05mm per axis, because a 19.05mm cell is
wider than a choc courtyard plus margin, and the cell you painted now wins the
edge. mx boards are unchanged.
