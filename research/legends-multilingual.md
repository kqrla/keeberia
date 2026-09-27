# keycap legends and non-latin script dataset for parametric caps engine

## executive thesis
keycap legend manufacturing trade-offs directly constrain physical geometry and parametric engine choices, or simply put: doubleshot injection moulding provides permanent legends but imposes strict tooling constraints per glyph [evid-leg-001, evid-leg-002], whereas dye-sublimation (and reverse dye-sub) offers flexible high-resolution custom scripts at the cost of substrate plastic restrictions [evid-leg-003, evid-leg-004]. for non-latin scripts and multilingual keycap kits, modern international layouts rely either on standardized primary mappings (e.g. dubeolsik [evid-leg-009] or jcuken [evid-leg-012]) or sub-legends added alongside primary latin glyphs [evid-leg-010, evid-leg-011, evid-leg-013]. a parametric legend dataset must model multi-position bounding boxes, script text direction (rtl vs ltr), and manufacturing constraints.

## 1. legend manufacturing processes
### double-shot injection moulding
doubleshot moulding is a two-step injection process where the legend glyph is first moulded as a plastic insert and then fused into the second outer keycap body [evid-leg-001].
- **durability**: infinite legend life; the legend cannot wear off because it extends through the cap surface thickness [evid-leg-001].
- **geometry constraints**: requires enclosed geometry support and draft angles; cannot produce un-bridged floating islands without stencil breaks or nested inner shots.
- **cost & scalability**: extremely high initial tooling cost because every unique glyph on every key row profile requires an explicit physical mould [evid-leg-002].

### dye-sublimation and reverse dye-sublimation
dye-sublimation uses heat and pressure to infuse dye directly into pbt plastic resin rather than depositing surface paint [evid-leg-003, evid-leg-013].
- **substrate constraint**: requires pbt resin (or pom/blend) because abs melts under dye-sub temperatures.
- **color dynamics**: standard dye-sub can only dye darker pigments onto lighter base plastic [evid-leg-003].
- **reverse dye-sub**: dyes the entire keycap exterior dark while preserving the un-dyed light plastic for the legend, enabling white-on-black or light-on-dark pbt sets [evid-leg-004].
- **tooling cost**: low setup cost per custom legend, ideal for short-run non-latin sets and complex glyphs.

### pad printing & laser marking
- **pad printing**: uses silicone pads dipped in ink to transfer legends onto any keycap material or color [evid-leg-005]. dominates global commercial mass production [evid-leg-014], but exhibits low wear durability [evid-leg-005].
- **laser marking**: uses laser beams to char, foam, or ablate keycap surface material [evid-leg-006]. effective for fine straight lines, but struggles with uniform solid area fills [evid-leg-006].

## 2. non-latin scripts on keycaps
- **cyrillic**: standard jcuken layout [evid-leg-012]. usually offered as dual-legend sets (latin qwerty primary + cyrillic sub-legend) or cyrillic-only mono sets.
- **korean (hangul)**: standard dubeolsik (2-set) layout [evid-leg-009], segregating consonants on the left key cluster and vowels on the right key cluster [evid-leg-009].
- **japanese (cjk)**: modern japanese computer input predominantly uses romaji (wāpuro) phonetic input via standard qwerty keys [evid-leg-010]. jis kana sub-legends (jis x 6002) are widely featured as decorative or functional sub-legends.
- **chinese (cjk)**: traditional chinese sets feature zhuyin (bopomofo) phonetic sub-legends or cangjie shape-based radical decomposition sub-legends [evid-leg-011].
- **arabic & hebrew**: rtl scripts. arabic uses standardized sa/iso layouts with arabic glyphs in lower-right or front-printed positions. hebrew uses standard si 1452 layouts.

## 3. multilingual & international layout kits
- **iso-eu layout mapping**: european physical layouts add an extra key (105-key vs 104-key) and substitute right alt with altgr [evid-leg-007] to access third-level character sub-legends.
- **group buy kitting**: custom group buys separate base kits (ansi-us) from modular international add-on kits (e.g. norde / nordeuk) containing region-specific qwertz (de), azerty (fr), and nordic keycaps [evid-leg-008].
- **front-printed & sub-legend positioning**: non-latin or regional sublegends sit on top-left, top-right, bottom-right, or front-facing cap side walls [evid-leg-013].

## 4. parametric legend dataset schema sketch
or simply put, a parametric caps engine needs structured metadata to place, scale, and render legends across manufacturing processes and script directions.

### proposed schema fields & notes
- `glyph_id`: string (unique identifier, e.g. "glyph-cyr-0410")
- `script_family`: enum (`latin`, `cyrillic`, `greek`, `arabic`, `devanagari`, `hangul`, `hiragana`, `katakana`, `zhuyin`, `cangjie`, `hebrew`)
- `character_code`: string (unicode code point, e.g. "U+0410")
- `text_direction`: enum (`ltr`, `rtl`) - notes that rtl contexts orient coordinates from the upper-right corner.
- `placement_zone`: enum (`top_left`, `top_right`, `center`, `bottom_left`, `bottom_right`, `front_center`, `side_print`) - models primary vs sub-legend positioning [evid-leg-013].
- `font_family`: string (font name or path)
- `font_weight`: number (e.g. 400, 700)
- `nominal_font_size_pt`: number (font size in points/mm)
- `stroke_width_mm`: number (line weight for parametric rendering or laser beam diameter constraints) - [evid-leg-006].
- `min_feature_size_mm`: number (minimum draft / slot size required for double-shot moulding) - [evid-leg-001, evid-leg-002].
- `allowed_processes`: array of enum (`doubleshot`, `dyesub`, `reverse_dyesub`, `pad_print`, `laser_etch`, `uv_print`) - process compatibility rules [evid-leg-003, evid-leg-004].
- `bounding_box`: object `{ "width_mm": number, "height_mm": number, "margin_top_mm": number, "margin_right_mm": number, "margin_bottom_mm": number, "margin_left_mm": number }` - constraints for keycap top surface margins.

## open questions
1. what exact minimum draft angle and wall thickness thresholds do modern cherry/oem/kat doubleshot tooling suppliers require for enclosed non-latin glyph loops (e.g. detailed devanagari ligatures)?
2. how do 5-sided reverse dye-sublimation process color tolerances handle precise color matching on dark keycap corners compared to traditional injection molded abs colors?
3. what are the exact standardized sub-legend font sizes (in pt or mm) used by gmk vs signature plastics vs keykobo for cyrillic and hangul sub-legends?

## 5. language support ladder (targeting, anne sept 27)

> thesis: the language ladder is the script-capability roadmap for the multilingual front, ordered by what the legend pipeline and layout defaults can prove next. it is a different axis from the market ladder in project/market/target-locale.md (which orders demand and delivery): a locale opens only when its language version ships and its demand evidence clears.

### v0: latin script

- v0.1: english
- v0.2: german
- v0.3: romance languages
- v0.4: nordic languages / scandinavia
- v0.5: slavic polish, latin-script balkan languages

latin script is first because the corpus already covers its physical variants (iso, qwertz, azerty, nordic iso) and its legends need no script engine work.

the v0 split also records the honest nuance that latin script does not mean one keyboard: physical standards split per region (us-ansi, iso-european, iso variants with an extra key next to left shift), logical layouts split per language (qwerty, qwertz, azerty), and even english differs (us-ansi horizontal 2.25u return vs uk-iso vertical enter with the extra key). language version + physical standard + logical layout are three independent choices per buyer, see research/layout-standards.md.

### v1: cyrillic-script family

v1 subtypes are the different languages written in cyrillic, not one russian line:

- v1.1: russian (jcuken, already evidenced `[evid-leg-012]`, so this is caps-engine capability, not research-from-zero)
- v1.2: ukrainian and belarusian (jcuken-family with extra letters: ґ є і ї)
- v1.3: bulgarian and macedonian (own phonetic-bulgarian layout lineage)
- v1.4: serbian cyrillic (serbia ships both faces of its keyboards, the latin face is already v0.5 territory)
- v1.5: kazakh, kyrgyz, mongolian and other cyrillic-extension languages

tajik note: tajik is written in cyrillic but it is a persian-language family member, not slavic. on the script axis it needs NO exception: it is the same dual-legend pipeline plus six extra glyph forms (ғ ӣ қ ӯ ҳ ҷ), which is less new work than ukrainian adds to russian. the honest reason to hold it is demand (tiny custom-keeb market, middling purchasing power), which is the market ladder's call, not the language ladder's. so: script-wise in at v1, market-wise parked.

### v2

- v2.0: chinese script (mandarin first, cantonese later)
- v2.5: korean script
- v2.8: japanese script

note the ordering is deliberate and differs from the market ladder (japan, korea, taiwan, china on demand): the language front sequences by script engine lift (hanzi glyph scale first, hangul dubeolsik `[evid-leg-009]` next, kana/kanji last), and the two ladders interlock per locale.

### v3

- v3.1: bengali
- v3.3: hindi
- v3.5: hebrew
- v3.8: modern standard arabic
- v3.9: urdu

the indic cluster (bengali, hindi, inscript-class mappings) comes first in v3, then the right-to-left cluster: hebrew, arabic, urdu. urdu last is notable: it is arabic-script but calls for its own mapping, and the rtl rendering conventions are now evidenced `[evid-leg-016]`. the cursive joining behavior of arabic-script legends (glyphs change shape by position) is an open engine question: no corpus line yet, flag for the v3 research pass.

### how the ladders interlock

- market v0 cohort (germany, uk, us+ca, nl+be, france, ireland, nordics, ch+at, au+nz) maps to language v0.1 through v0.4.
- market v1 latin expansion (poland, czechia, spain/portugal/italy, latin balkans) maps to language v0.5 and v0.3.
- market v1.5 cyrillic gate = language v1.1.
- market v2 CJK = language v2.x per script; hebrew-side israel = language v3.5 (so it slips to the v3 window on the language axis even though the locale ladder gates it at market-v2).
- language v3.1 bengali and v3.3 hindi open indic locales not yet on the market ladder: add them to market research when their turn approaches.
