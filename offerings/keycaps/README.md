# keycaps

(one of keeberia's offering families, see /offerings/README.md. content
as the flows ship.)

## three axes, not one, under "custom keycaps"

people say "custom keycaps" for at least three different things, worth
keeping straight so the offering doesn't collapse them into one confusing
sku:

- **theme**: a matching aesthetic across a whole SET. colors, legends,
  material vibe, consistent across every cap. "kuromi themed keycaps"
  means a set, this is a property of the set, not of any one cap. shape
  is unchanged, standard profile throughout. this is paracraft's
  parametric path (profile/legend/material, no external geometry).
- **shape**: the cap's own molded top surface deviates from a standard
  profile. can be per-individual-cap (one accent cap sculpted, rest of
  the set standard) or emergent across a whole set (the reference photo:
  a 3x3 macropad-sized block where each cap's top is a sculpted paw pad,
  and the nine together read as one cat paw with toe beans). still a
  single-piece cap, no glued-on separate object, the mold itself is just
  not a standard profile. orthogonal to theme: a themed set doesn't need
  to be shaped, a shaped set doesn't strictly need to read as "themed" in
  the color sense (though usually does).
- **topper (capsmith)**: a separate sourced or hand-built object glued
  (boolean-unioned) onto an otherwise completely standard cap. the cap's
  own mold never changes, croissant-on-top, not croissant-shaped. see
  engines/capsmith/README.md. always an individual-cap thing, gluing a
  croissant onto every key in a set would be absurd, capsmith toppers are
  accent pieces.

or simply put: theme is what color the set is. shape is what the cap's
own mold looks like. topper is what's glued on top of a normal mold.
three independent knobs, a design can turn any subset of them.

two paths for the engine side of this:

- **parametric**: paracraft's caps-engine. profile, dish, stem, legend,
  material. covers theme fully, and covers shape wherever the shape can
  be expressed as a profile variant (not every shape can, organic sculpts
  like paw pads may need their own path, open question, not decided).
- **artisan (capsmith)**: topper composition. covers the topper axis
  only, never touches the cap's own mold. see engines/capsmith/README.md.
