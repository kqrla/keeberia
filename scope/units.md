# units: metric canonical, imperial at the edges

> thesis: keeberia's engine keeps one canonical internal representation, millimeters, and converts only at the display and fab-intake edges. imperial is a united-states buyer-facing and fab-inbound consideration, never an internal representation, so no imperial number is ever stored twice or converted twice.

or simply put: metric is the truth inside, imperial is a courtesy outside.

## the three unit systems in play

1. **metric (mm)**: the engine's canonical unit. all geometry, corpus measurements, capabilities json, and artifacts stay in mm. cherry's datasheet grid (19.05 mm) is the anchor the whole physical model hangs on `[evid-ss-sw-003, evid-ss-sw-004]`.
2. **u (keyboard units)**: the community's own display unit, neither metric nor imperial. 1u = 19.05 mm exactly, which is 0.75 inch exactly, so the keeb unit is actually imperial-derived arithmetic on a metric-anchored fact. the engine stores mm and speaks u wherever the community does (key pitch, cap widths, plate cutouts).
3. **imperial (inches, mils, thou, oz, awg)**: appears in three real places, all edges:
   - **us buyer display**: case and board dimensions shown in inches for us-locale users (a courtesy toggle, default metric).
   - **us datasheet intake**: trace/clearance/copper specs in mils and oz (1 oz copper ~ 35 um ~ 1.4 mil); capabilities json stores each fab rule in the fab's native unit with an explicit unit field, converts once at load, never rewrites the source.
   - **us hardware conventions**: screw and standoff callouts (m2/m2.5 metric in the keeb world vs 4-40 unc in vintage us cases), awg for wire.

## rules

- one canonical value at rest (mm). converted values are display-only and derived, never persisted.
- every capabilities/fab rule carries an explicit unit field; conversion happens once at intake, with the source number kept verbatim for provenance.
- u is treated as a display vocabulary over mm, not a competing representation: `u = mm / 19.05`.
- tolerance and resolution claims are never rounded through conversion: a 0.1 mm tolerance is not a 4 mil tolerance (they differ at the third decimal), so checkman compares in the native unit of the fab rule.
- the us locale display toggle affects rendering only: it can never feed a number back into the engine.

## open questions

- imperial-side facts now evidenced: 1 oz copper = 35 um = 0.0014 in `[evid-typ-013]`, the mil (0.0254 mm) as the us fab unit for trace/spacing/hole sizes `[evid-typ-014]`, and real boards mixing mils and metric on one artifact `[evid-typ-015]`, which is why per-rule unit fields are mandatory. still ungathered: 4-40 standoff prevalence in vintage boards.
- does the us locale default to imperial display or stay metric with a toggle? product decision, defer to the v0.1 english pass (research/languages/v0.1-english.md).
