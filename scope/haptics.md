# haptics + sound

> scope note (anne, sept 8 2026): later, keeberia gets in-browser live sound testing for each switch type.

## the idea

most people buying or building a keyboard don't care about actuation force graphs or stem materials. they know one thing: **the sound they want**. "thocky." "creamy." "clicky." "silent." the community already speaks in sound descriptors — keeberia should let users pick a switch by hearing it, in the browser, without knowing anything about switches.

## what it means for the product

- pick a switch (or a sound category) in the components flow → hear it in the browser, live
- sound testing for every switch type in the library, not just the popular ones
- the sound preview pairs with the physical build: switch + plate + case material + foam all change the result, so the preview reflects the actual configured device as closely as it can
- for non-geeks: browse by sound category ("deep", "crisp", "clicky", "silent"), not by spec sheet. pick what sounds right, keeberia handles the rest

## what keeberia needs per switch (library metadata)

- sound clip (normalized recording, standard mounting so clips are comparable)
- sound category tags (thock / clack / pop / creamy / clicky / silent)
- feel family (linear / tactile / clicky), actuation force, travel — present but secondary
- how plate/case/foam choices shift the descriptor (metadata, or measured combos later)

## research

- switch taxonomy + sound lexicon + sound-first picker design: [research/switches-and-sound.md](research/switches-and-sound.md)

## when

later — v2+ (phase map row 6). the component library grows first (it needs the metadata above), and the audio work is independent of the copper/cad path.
