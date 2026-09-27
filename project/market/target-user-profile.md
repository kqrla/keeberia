# target user profile

> thesis: keeberia sells to four distinct profiles who all share one property: they want a custom input device without becoming an electrical engineer to get it. each profile buys differently, expects different proof, and needs a different first screen.

or simply put: the streamer, the keeb nerd, the ergo convert, and the desk-tidy maker walk in through different doors but check out at the same counter. the market folder keeps them here as profiles with open numbers, so the evidence pass has named targets instead of vibes.

## 1. the macropad / stream-deck user

- **who**: streamers, video editors, audio engineers, cad users. power-tool people, not keyboard people.
- **buys today**: finished pads. elgato stream deck class, 3x3 luaPAD-class macro pads. pays for software polish and out-of-box behavior.
- **what keeberia removes**: the jump from "i want a pad with these six keys and a knob laid out my way" to a device that exists. no finished-pad vendor sells arbitrary layouts.
- **skeptical about**: whether a self-fabricated design actually works. needs the path to be visibly turnkey (or, pass two, ordered assembled).
- **numbers to evidence**: price band for finished pads, replacement-cycle volume, where they shop and hang out.

## 2. the custom keyboard enthusiast

- **who**: r/mechanicalkeyboards, keebfolks, discord scene. knows what a group buy is, owns a keyswitch tester.
- **buys today**: group-buy boards, kits, and parts. commonly lands in the low hundreds of dollars per board (to verify with sources, never quote unsourced).
- **what keeberia removes**: nothing they cannot do, but everything they currently do slowly. they can already design in klcad-adjacent toolchains and hand-route; keeberia collapses weeks of spreadsheet and cad work into one sitting.
- **skeptical about**: quality of generated gerbers, control over details (handedness, mounting style, flex cuts), and whether the tool respects their taste. hardest audience to wow, best audience to prove correctness with.
- **numbers to evidence**: spend per board (group-buy price bands, sourced), community size, how many actually finish a hand-designed pcb versus buy kits.

## 3. the ergonomic / split keyboard user

- **who**: the community that already generates its own pcbs by hand: zmk/qmk forks, corne-class boards, fork-and-hack ergogen users.
- **buys today**: open-source board files plus fab orders plus hand assembly. the highest-pain, highest-skill group.
- **what keeberia removes**: the largest pain in the whole market. split topology, inter-half links, firmware defaults: they currently fight all of it manually. this is where keeberia's split/wireless research (typology and firmware fronts) pays off first.
- **skeptical about**: whether generated firmware matches their zmk/qmk expectations, and whether the tool handles two-pcb artifact sets (the flagged open question in the split research).
- **numbers to evidence**: size of the split/ergo subcommunity, completion rate of diy builds, willingness to pay for generation vs free ergogen.

## 4. the desk maker (one custom device, once)

- **who**: not keyboard hobbyists at all. people who want one made-to-order macro panel, fidget clicker, or themed keypad for their desk, gift, or brand.
- **buys today**: etsy/tindie/makerworld storefronts, or nothing (the product they want does not exist).
- **what keeberia removes**: the entire knowledge gap. this profile does not know what a gerber is and should never have to.
- **skeptical about**: trust. will the file they download actually print and work. pass one asks them to "figure out fabrication themselves", so this profile converts best once pass two (order through us) or a curated fab flow exists. probably the actual mass market, least defined.
- **numbers to evidence**: everything. this profile currently exists in keeberia's positioning (niche intersection: desk aesthetics, personalization, tiny cute objects, fidget/stim culture) but has no sourced demand numbers yet.

## 5. the fidget / clickety buyer (newest, least evidenced)

- **who**: tactile-toy buyers of clicketies-class products: no typing function, no pcb, pure satisfying click. impulse-purchase energy, keychain price band.
- **buys today**: fidget and desk-toy markets (sourced numbers: none yet).
- **note**: the only profile where circuitron plausibly does not apply at all. treated as its own profile rather than folded into profile 4, because the purchase motivation (feel, aesthetics, collectibility) differs from utility panels.
- **numbers to evidence**: fidget-market price bands and channels (etsy/makerworld), whether the mx-switch vs simple-clicker question changes the price band.

## cross-profile facts held as true (repo-internal, not market evidence)

- the shared wedge: no existing tool takes a non-engineer from "i want a pad with these six keys and a knob" to manufacturable gerbers + case + caps in one sitting.
- profiles 1 and 4 need pass two (or a curated fab path) to convert well; profiles 2 and 3 are pass-one capable and are also the correctness proof audience.
- channels to map later: etsy / tindie / makerworld storefronts, group-buy platforms, print-and-assemble fulfillment (who can actually build a keeberia design today), and direct.

each profile's price band, volume, and hangouts stay open questions until the evidence pass (see [README.md](README.md)). see also:

- [target-locale.md](target-locale.md) (where these people are)
- [`../positioning/niche.md`](../positioning/niche.md) (the intersection thesis)
