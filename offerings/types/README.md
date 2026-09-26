# types

(one of keeberia's offering families, see /offerings/README.md. content as
the flows ship.)

## planned: the switch guide + simulator

thesis: the point of this page is the person who cannot tell a tactile from
a linear by looking, let alone by name. a non-enthusiast does not open a
switch picker thinking "i want kailh box jade", they think "i want the deep
clicky one" or "something quiet but not mushy". so the simulator's entry
point is plain-language descriptors (deep, clacky, thocky, quiet, crisp,
smooth), not switch nomenclature, and the nomenclature arrives as the
answer, not the question: pick a sound/feel, get told what that family is
called and which specific switches in the registry match.

or simply put: they shop by vibe, we translate to a switch.

## prior art exists (anne's links, sept 26 2026, verified live)

the standalone switch-sim/sound-database niche is CROWDED. this is good
news for the premise and clarifies the differentiation:

- **thockhub.com**: the most complete one found. browser simulator, 300
  switches, claims real recorded audio (48khz, explicitly "not a synth"),
  force curves, pitch (hz) + volume (db) per switch, four families
  (linear / tactile / clicky / silent), plus a 3d keyboard studio,
  compare, shop, community. notably its sound packs are credited as
  "real recordings from mechvibes" (the open-source mechanical sound
  project), and its shop is india-focused, which reads as one builder's
  regional project.
- **keebsound.com**: 300+ sound tests, and the interesting bit: switch
  "profiles" named in exactly the descriptor vocabulary (thocky /
  clacky / balanced), sorted by loudness and pitch, plus an ear trainer
  (blind sound test). affiliate-funded.
- **keyboardsimulators.com**: 126 switches, every one carrying a
  plain-language descriptor ("muted creamy thock", "high-pitched
  two-part click with a faint upstroke rattle", "the thock, whispered"),
  force curves, head-to-head pages, 21 silent variants, typing
  simulator + tester + builder.
- **typersguild.com/mechanical-key-sounds**: ~11 switches bolted onto
  a typing-practice site, type a book with your chosen sound.
- **thocklab.com**: antibot-walled, unverified, browserbase pass if its
  contents ever matter.

### what this means for keeberia

1. the descriptor-first premise is VALIDATED, not novel: keebsound
   already sorts by thocky/clacky/balanced and keyboardsimulators
   describes every switch in vibe words. keeberia should adopt the
   community vocabulary (thocky, clacky, creamy, muted) rather than
   invent one.
2. the ear trainer / blind test is a proven ux pattern worth stealing as
   an idea (pick by ear, confirm by name).
3. the differentiation is NOT the simulator. five sites already do
   standalone sound browsing, some with 300 switches. keeberia's version
   is the only one where the chosen switch lands in a live design: pick
   the deep clicky one -> it is in your registry -> bom, pcb footprint,
   case cutout and keycap stem all update. browse-to-build, not
   browse-to-browse. the simulator is a lens inside keeberia, the same
   way the five flows are lenses, not a destination product.
4. the honest limit stands and gets sharper: thockhub proves recorded
   audio in a browser works as a product, but keeberia cannot ship
   those recordings (mechvibes pack licensing is a separate question
   worth an evidence line, it is an open-source project, but keeberia's
   registry still needs measured pitch/volume data with provenance, not
   borrowed audio).

## evidence plan (nothing built, queued for a research worker)

- **golem.hu/sound/** (same author as the keyboard lexicon, dovenyi):
  a hand-curated, tagged database of ~89 pages of typing test entries,
  each pairing a switch with the build it was recorded on (e.g. "kailh
  box jade + tofu65 aluminium, deep sounding clicks"). this is exactly
  the switch x case x plate x keycap pairing data a descriptor-first
  sound model needs: sound is not a switch property alone, and this is a
  crowdsourced map of how people describe the combinations. sculptura
  treatment: verbatim descriptors + provenance, appended as evidence
  lines, feeding the descriptor -> switch-family mapping.
- the same site links a switch force-curve database, which is the "feel"
  half of the page. same pass.
- honest limitation, decided up front: these are video embeds, not a
  sample library. nothing on golem.hu is audio keeberia can ship in a
  browser simulator. the site informs the model (what makes a jade sound
  deep on aluminium, which words people actually use); the in-product
  sound is a later separate decision (web audio synthesis vs licensed
  samples) and is not assumed here.
