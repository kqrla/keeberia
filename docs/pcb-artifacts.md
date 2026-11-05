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
