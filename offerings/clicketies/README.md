# clicketies

(one of keeberia's offering families, see /offerings/README.md. content
as the flows ship.)

thesis: not every keeberia product needs to be a keyboard. clicketies are
fidget clicky keys, keycap-styled tactile toys with no typing function at
all, no pcb, no matrix, no firmware. the reference is a keychain-sized 3x3
keycap block: it looks like a tiny macropad, but its whole job is a
satisfying click, not text entry.

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
- form factor: is the 3x3 grid the standard, or does the offering support
  1x1 (a single keychain clicker) up through larger grids?
- keychain hardware (the clip/chain in the reference photo) is a bought
  part, not a keeberia-generated one, needs a sourcing note same as any
  other bought component (switches, screws) once this gets built.
