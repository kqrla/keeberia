# v3 indic + right-to-left

> thesis: v3 is two engine lifts. the indic cluster (bengali, hindi) inherits inscript, a government-decreed standard layout across indian scripts. the rtl cluster (hebrew, arabic, urdu) is rendering work: bidirectional text on one key face is evidenced, and arabic-script contextual letter shaping is now a corpus fact, not an open question.

## evidenced facts

- inscript is the decreed standard keyboard layout for indian scripts on standard 104/105-key boards, so bengali and hindi share one mapping standard `[evid-llog-023]`
- bidirectional text = text containing both ltr and rtl parts, the exact dual-script keycap situation `[evid-leg-016]`
- arabic script is cursive, written right-to-left, with most letters having contextual forms (initial, medial, final, isolated) `[evid-leg-017]`, so legend emission needs text shaping, not glyph lookup
- hebrew sublegends are established dual-legend territory `[evid-leg-013]`

## open questions

- which shaping engine or library emits contextual arabic forms into legend geometry (the manufacturing side is covered, the shaping tool is not chosen): engine decision, not a research line.
- urdu (v3.9): its mapping is arabic-script with its own letter set, no layout line yet. gather at pass time.
- devanagari conjuncts on legends (ligature density per key): no corpus line, check before the hindi pass ships.
