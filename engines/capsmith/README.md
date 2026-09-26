# capsmith: artisan topper composition

> thesis: paracraft's caps-engine generates the keycap itself, profile,
> dish, stem, from parameters. capsmith does not compete with that: it
> takes paracraft's base cap as a given and composes a decorative topper
> onto it, croissant, waffle, bow, succulent, tiny espresso machine. one
> is structural generation, the other is artisan composition. different
> problem, different engine.

or simply put: capsmith is picking toppings for your keyboard. paracraft
builds the cap, capsmith glues the croissant on.

one thing to keep crisp: this is NOT a "croissant keycap", a single sculpted
cap shaped like a croissant. it is a completely normal openscad keycap with
a sourced croissant sitting on its top surface, unioned into one printable
piece. the metaphor is literally glue: the topper never changes the cap's
profile, stem, or dish, it just rides on top.

## why this is a different engine, not a caps-engine mode

paracraft's caps-engine is fully parametric: every output traces back to a
profile + stem + dish spec, no external geometry enters it. a croissant
topper is not parametric in any useful sense, nobody wants to twiddle
"flakiness" sliders, they want a croissant. the honest way to get one is
either a hand-modeled or CC0-sourced mesh, composed onto the cap, not
generated from first principles. mixing that into caps-engine would break
its "everything traces to a spec" property. capsmith keeps that mess
contained to one place.

## the composition model

1. **base**: a keycap from paracraft's caps-engine (existing profile, dish,
   stem), used as-is, capsmith does not reimplement keycap geometry.
2. **topper**: a small decorative mesh, either:
   - **CC0-sourced**: pulled from a repository whose license is explicitly
     public-domain-equivalent (thingiverse and printables both support
     filtering by license; CC0 is the only tier keeberia treats as
     use-as-is). every sourced topper gets a provenance sidecar: source
     url, author, license (must say CC0 verbatim, not just "free" or
     "personal use"), accessed date. same discipline as a research
     evidence line, this is the one place in keeberia where someone else's
     mesh ships in a product rather than only informing a parametric
     rebuild, so the license check is load-bearing, not a courtesy.
   - **hand-authored**: simple motifs (the bow, the star) may be cheap
     enough to model directly rather than source. still a topper mesh that
     sits on top, same composition rule, never a sculpted cap. worth a
     case-by-case call per motif once the library starts.
3. **union**: topper mesh placed at the cap's top surface (dish center or
   flat top depending on profile) and boolean-unioned onto the base.

## the mesh boolean question

this is real 3d mesh csg, not the 2d extrude-and-offset paracraft/case
pipeline uses. cc0 toppers arrive as arbitrary, often organic, meshes
(stl/obj), which is exactly the case openscad's cgal backend handles
slowly and sometimes fails on (non-manifold input, high triangle count).
this is the same tool question raised for browser previews (see the sept
25 discussion in this thread, and docs/modularity.md): manifold-3d is the
right boolean engine here too, it is built for robust mesh booleans at
speed, where cgal is built for exactness at the cost of speed. worth
treating both decisions as one: whichever mesh-boolean library keeberia
adopts for browser previews is probably the same one capsmith's server
side compositor should use, so the toolchain doesn't duplicate.

## open questions (nothing built yet, this is the scope doc)

- topper library sourcing: which cc0 sources are actually viable at
  volume (thingiverse's license filter is real but coverage for food/cute
  motifs specifically is unverified, printables has a similar filter,
  cults3d is mostly paid so likely excluded). needs an actual research
  pass before committing to a pipeline, not assumed.
- scale and fit rule: toppers in the reference photos regularly overhang
  onto neighboring keycaps (see the bow, the stars), so "fits within one
  1u cap footprint" is not the real constraint. the real constraint is
  adjacent-key clearance during keypress, needs a stated rule once
  studied, not guessed.
- mount point per profile: where "top surface" means precisely depends on
  the cap profile (dish depth varies by paracraft profile), capsmith needs
  to read that from the same profile spec paracraft uses, not duplicate it.
- attachment: some real artisan caps look glued/resined onto a cap that
  already exists (a purchased blank), others look printed as one piece.
  keeberia's is one-piece by construction (union), worth deciding if a
  two-piece "topper insert" mode is ever wanted for post-purchase
  customization, that's a different product, not day-one scope.

## relationship to offerings

sits under offerings/keycaps/ alongside paracraft's parametric caps. the
keycaps offering doc should eventually distinguish the two paths for
buyers: parametric (profile, legend, material) vs artisan (topper library,
one design per motif, less configurable, more "which one do you want").
