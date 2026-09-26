# clicketies

(one of keeberia's offering families, see /offerings/README.md. content
as the flows ship.)

thesis: not every keeberia product needs to be a keyboard. clicketies are
fidget clicky keys, keycap-styled tactile toys with no typing function at
all, no pcb, no matrix, no firmware. they ship as keychains: confirmed
across a range from a single keycap on a clip (one switch, one cap) up
through a 3x3 grid block (looks like a tiny macropad, but its whole job
is a satisfying click, not text entry).

or simply put: it borrows the keycap and switch aesthetic, not the
keyboard function.

## why this is its own offering, not a macropad variant

a macropad's value is doing something (running a macro, a shortcut). a
clickety's value is the click itself, texture, and shape. the correct
engine ownership follows from that: no netlist, no matrix scan, no
firmware flow, none of circuitron's job applies. what does carry over is
the cap and switch geometry (paracraft's caps-engine, switch footprints
from the shared component registry) and possibly a bare mechanical
clicker mechanism standing in for a real switch where actuation force /
feel matters more than an electrical signal existing at all.

## open questions (nothing built, this is the scope doc)

- does a clickety need a real mechanical switch (mx-style, gives a real
  click + tactile bump) or a simpler non-electrical clicker mechanism
  (cheaper, no pcb/soldering at all, closer to a fidget-cube click
  mechanism)? changes whether this needs circuitron at all.
- form factor: both 1x1 (single keycap on a clip) and 3x3 grid are
  confirmed real, question is where the size range stops (larger than
  3x3 starts fighting the "keychain" framing) and whether 1x1 and grid
  need different engine paths (a single switch + cap needs no matrix at
  all even if grids end up wanting one for wiring simplicity).
- keychain hardware (the clip/chain in the reference photo) is a bought
  part, not a keeberia-generated one, needs a sourcing note same as any
  other bought component (switches, screws) once this gets built.
