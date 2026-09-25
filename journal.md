# keeberia ☆.ᐟ

> username: @arsoninstigator aka @anne (she/her)
>
> here's the frontend: [layout-to-device.lovable.app](https://layout-to-device.lovable.app) — design a macropad in your browser, get a manufacturable board out the other end
>
> total time spent on this till date: ~ 20 hours (a good chunk of it was pair-programming with solas, my agent)

## about

keeberia is a **browser-based macropad design platform**. you drag keys, encoders and oleds onto a grid like you're in figma — and the backend turns that into a real, manufacturable pcb with zero ai in the copper path. the secret sauce: everything in the ui is a *logical object* ("knob", "key", "oled"), and the backend resolves each one into its manufacturing footprint + circuit. you never see a kicad vibe. ever.

scope order: **micropads first, keebs later.** small boards, xiao-sized brains, 3–9 keys. get one flow perfect end to end before touching a 60%.

the engine itself is fully deterministic programmatic pcb generation — placement → netlist → fan-out → negotiated-congestion a* routing → kicad 8 export. no llm ever touches the copper. if the same layout goes in, the same board comes out, every single time.

## daily log

### ⋆ day one — research + scope (time taken: ~ 6h)

read the hackclub hackpad guide cover to cover and lurked around protoflow to see what "good" looks like in this space. protoflow is ai-native and mac-only — cool, but i don't want ai generating my copper. i want the opposite: **deterministic, programmatic, reproducible**. the layout→device lovable frontend is already shaping up, so the job was the *backend*: the pcb portion, built like software, not like an eda.

- skimmed keyboard layout format prior art (kle-ish stuff) and wrote notes on what keeberia's format should be
- decided the core concept: **logical objects → manufacturing footprints**. a "knob" in the ui means nothing to a fab house; an ec11 + support parts + nets means everything. the user should never have to care
- micropad-first scope lock: xiao mcu, 3–9 keys, optional encoder + 0.91" oled
- then footprint research, the unglamorous kind: pulled the hackclub hackpad care package footprints, kicad official libs, and the perigoso keyboard lib, and **verified pad geometry by hand** for every part i'd actually use — mx solder, mx hotswap, ec11, xiao (rp2040/samd21/esp32-c3 all use the same carrier), ssd1306 oleds (0.91" and 1.3"), sod-123 diodes, sk6812mini-e, m2 holes. cross-checked three sources where i could. wrote provenance notes for every footprint because future-me will thank present-me

### ⋆ day two — the engine (time taken: ~ 9h)

built `pcb-engine` in typescript: layout normalization → component placement → netlist synthesis → routing → kicad 8 s-expression export, with drc, silk, bom and an svg preview bolted on. this was the marathon day, solas and i trading bugs back and forth.

- netlist synthesis does direct-gpio for small pads and **auto-falls back to a diode matrix** when keys exceed the pin budget. the xiao's 11 gpios run out fast and the matrix is the right answer without asking anyone
- routing is fan-out stubs + negotiated-congestion a*: pads get escape stubs first, then nets route on a resolution grid with keepout circles, via costs, and per-net retry with inflating penalties. it reroutes around congestion instead of giving up
- the failure reel, because it wouldn't be honest without it:
  - routedNets kept coming up short and the router swore everything was fine. turns out two footprint systems had silently collided — the diode's pads came from a legacy def while everything else used the new one, so pad positions computed to **nan** and json serialized nan as `null` like nothing happened. fun discovery, 10/10
  - traces kept **escaping the board edge** by a few tenths of a mm. the router's edge test was more lenient than the drc's, so traces were technically "allowed" to hang off the board. unified them, kept everything 0.45mm inside
  - the 0.91" oled breakout is 38mm wide and just **overflowed the outline** entirely because the board shape only accounted for the key field + mcu. fixed by computing the outline as a bounding box over every part courtyard, pads included
- by end of day three test boards exported clean: **hackpad-3key** (58.3×43mm, direct gpio), **ninepad** (60.3×82mm, 12 nets), and **streamdeck** (89.8×92.5mm — matrix + diodes + encoder + oled, 23 nets, 627 segments, 9 vias, **zero drc errors**). all parse as valid kicad 8 boards

### ⋆ day three — repo, scope + deploy prep (time taken: ~ 5h)

restructured the repo properly (this one, with `/backend` engines + daemons and `/scope` versions + roadmap, like sculptura), wrote the scope docs so "micropad first, keebs later" is written down somewhere that isn't my head.

- xano deploy prep: metadata api is the transport (multidoc/xanoscript push), but every token in the vault 401'd — the metadata tokens **expire after 7 days by default**, mine were past that. need a fresh one from instance settings before the engine api goes live
- validated all three boards end to end again post-restructure. still green.
- decided protoflow stays in the loop, but as the **verifier, never the generator**: its mcp runs drc/erc + footprint cross-checks on every board we export. the ai tool tries to prove us wrong; the deterministic engine keeps doing the copper 

## current state

- [x] deterministic pcb engine: layout → netlist → routed board → kicad 8 export
- [x] verified footprints with provenance (mx solder/hotswap, ec11, xiao, oleds, sod-123, m2)
- [x] drc clean on all three test boards (pad clearance, edge, shorts, unrouted)
- [x] bom + svg preview + kicad export from the same single source of truth
- [ ] xano api live (blocked on fresh metadata token)
- [ ] case generator (openscad, flow four)
- [ ] lovable frontend wired to the real engine

## day three (sept 7): the api goes live

- fresh xano metadata token in hand, the v1 skeleton landed: `design_jobs` table, `keeberia` api group, `POST /generate` + `GET /job`. posted a real hackpad-3key layout through the public endpoint and got job #1 back, queued. the loop exists now.
- learned xanoscript the way you learn any language: by having it reject you. `error_type = "invalidinput"` isn't a valid error type. and the precondition `($job == null)` fires *even when the record exists* — object comparison in preconditions is just broken, so missing jobs return a null body instead of a 404. shipped it with a note in the deploy readme. pragmatism over pedantry.
- repo went public: github.com/kqrla/keeberia. README rewritten in memorium's voice — thesis first, coined a word for the core belief: **traceparency**. nothing in the copper path is generated, guessed, or probabilistic, so every trace has a reason.

## day three, later: community research — the parts list was already written

- pulled hackpad's kit + 20 gallery builds straight out of their site bundle + gallery api (their site is a spa, so i just read the javascript — the api endpoint was sitting right there: /api/gallery). reddit captcha-walled both curl and browserbase, but honestly we didn't need it.
- the finding: our v1 default components ARE the hackpad parts list, item for item — xiao rp2040, mx + kailh hotswap, ec11, 0.91" oled, sk6812 mini-e. every gallery build is 3-12 keys with the encoder+oled+rgb trio. use cases are all shortcuts: fusion 360, krita, qlab, media, minecraft, artsey.
- the strategic read: keeberia's export bundle should literally be a hack club blueprint submission (gerbers + step + firmware + bom). that's a distribution channel wearing a feature costume.
- research lives in research/notes/communities-and-switches.md.

## day three, even later: the daemon is real — job #1 is a board now

- xanoscript kept rejecting us, so we mapped its actual grammar by brute force, one probe at a time. findings: there is no `db.update` — the edit primitive is `db.edit` (field_name + field_value, no preconditions); filtering is `db.query` with `where = $db.table.field == "x"` and `sort = {table.field: "asc"}`, and `return = { type: "single" }` hands you the first match directly; conditionals only parse inside a `conditional { if (\`...\`) }` wrapper; empty strings fail required-input validation, so optional inputs are nullable and the daemon sends `null`. all of it is written down in backend/xano/README.md so we never learn it twice.
- the v1 skeleton grew into the real loop: `POST /claim` (oldest queued job → running, attempts+1) and `POST /complete` (worker reports artifacts/status/error) went up next to generate + job. four endpoints, one loop.
- the daemon is portable by standing decision: the queue is a single interface (`claim`, `complete`) with a xano-rest transport behind it. moving to plain http/sqs, or to amd hardware for dense boards, touches config, never the ladder. `render.yaml` blueprint included — deploy-ready on render.com.
- first end-to-end run: job #1 (hackpad-3key) went queued → claimed → done with real artifacts persisted — kicad_pcb, bom csv, qmk info, svg preview, stats. 5/5 nets routed, 3 vias, 120mm of trace, zero errors. the loop from the readme exists now, not just in the readme.
- stack locked (roadmap updated): webgl rendering, openscad + sliders for cases (makerlab vibes), freerouting as the deterministic autorouting partner (dsn in, ses out — java, so it lives on render/amd, not xano), kicad as the format, jlcpcb as the parts ecosystem. freerouting fits traceparency perfectly: deterministic, inspectable, no ai in the copper.

## day three, latest: the product spec is in the repo now

- anne dropped the canonical description of what keeberia is and what its parts are (plus the full five-flow editor architecture and the lovable ux prompt for components + pcb, from the may planning sessions). it's filed where it belongs instead of living in a chat log: `scope/product.md` is the working spec, `AGENTS.md` is the build contract (one project model, five views, portability as a product requirement, validation in words not error codes), and the raw exports live in `scope/reference/` for provenance — the wandery material that rode along in one export was left out deliberately.
- nothing in it changes the course: it confirms what's built (the loop, kicad as the interchange, deterministic routing) and names what's next in ui terms — layout as spatial planning, components as identity assignment, pcb as fabrication, case as parametric openscad, keys + knobs as the feel layer. the readme now links all of it.

## day four: the case compiler — job #2 is a device now

the cad engine is real: `backend/engines/cad/case-engine/` compiles a routed board into a readable, dependency-free openscad file — tray with standoffs on the mounting holes, usb-c slot in the wall where the xiao actually points, switch plate with key/encoder/oled openings. named slider params up top (pcb_width, wall_thickness, corner_radius…), everything derived from component metadata, not from any reference keyboard. hackpad and blueprint were studied as examples — anne made the point clearly: examples to learn from, not guidelines. keeberia doesn't inherit anyone's component restrictions. that stance is in the roadmap standing decisions now.

two real fixes came out of building it: the xiao was sitting with its usb-c facing the key field — no case could ever cut a port, so the mcu is rotated 180° to face the board edge (pcb engine re-routed all fixtures clean after). and the engine's own validation caught 4mm standoffs being too short for the xiao + usb shell stack — default is 5mm now.

verification was honest: openscad installed headless in the sandbox and all three reference boards compile to real stls, not just plausible text. then job #2 (ninepad) went queued → done through xano with case_scad + case_params in the artifacts — the loop now produces a device (board + case), not just a board.

also: component library decisions locked in the roadmap — kicad defaults or marbastlib for symbols/footprints, snapeda/componentsearchengine as fallback lookup, grabcad for 3d models. keyboard-focussed, never a full pcb editor.

next: gerber + excellon export (jlc-orderable output), then the freerouting bridge, then frontend wiring.

## day four, later: jlc-orderable output — gerbers + drills

the gerber exporter landed: `src/gerber.ts` emits rs-274x (mm, 3.5 fixed, y-flipped to fab view) for both copper layers, masks, paste, silk, edge cuts, plus an excellon drill file. silk legends are drawn with a tiny built-in stroke font (a-z, 0-9, basics) since gerbers have no text primitive. structural validation — header/format/terminator, every d-code defined before use, integer coordinates, drill tool table consistency — passes on all three reference boards, and the numbers cross-check: 39 drill hits on ninepad = 35 thru pads + 4 vias, exactly.

one honest catch along the way: a hand-tweaked streamdeck variant i posted as a test job legitimately failed routing ("routing did not converge — layout may be too dense") and the retry ladder couldn't save it — the fixture streamdeck then went queued → done first attempt with all 17 artifacts, including every gerber + the drill file. the failure mode is real and it speaks human.

known gap, documented in the roadmap: the B.Cu ground pour still lives only in the kicad export; gerbers carry routed copper only until the zone engine lands.

## day four (sept 8): the firmware three-way, settled into research

- adaption labs turned out to be a dataset-adaptation platform (adaptive data + autoscientist), not a research api — noted for later (generated layout datasets), but for this one it was firecrawl's job. lesson reconfirmed: github scrapes via firecrawl return page chrome; raw.githubusercontent.com is free and correct.
- rmk teardown via its llms.txt (best docs setup of the three, honestly): keyboard.toml covers matrix, encoder with per-detent resolution, our exact ssd1306 — and vial ships enabled by default. but zero ws2812 support anywhere in the docs index, which kills it as the sole default for now.
- report written: kmk as v1 default (zero build infra, full delight trio, plain python in the zip), qmk as the via-remap polish path, rmk on the watchlist. decision pending anne's.

## day four, later: generative openscad research (the cad universe)

- the assignment: makerlab-configurator pattern, but no rodin/multimodal — openscad as compilation target only. our case compiler already emits vanilla dependency-free parametric scad, so the research confirmed the direction rather than redirecting it.
- highest-leverage finding: openscad's customizer syntax (/* [Tab] */ + [0:0.5:6] sliders + dropdowns, verified against the wikibooks manual) is exactly what makerworld configurators consume. an afternoon of *comments* makes every keeberia case a makerlab-configurable object.
- second finding: openscad-wasm (official, 424 stars) means the .scad can be compiled in the browser — same file the daemon verifies, rendered live in the frontend. the preview is never a fake mockup because it's literally the same file.
- prior art filed: gleorepo's 2019 layout-syntax case generator (the keeberia pattern, minus the project model), daprice/keyboard_parts (switch cutouts as a scad library), riskable/keycap_playground (547 stars, parametric keycap profiles — flow 05's geometry basis), BOSL2 (excellent, deliberately not a dependency), CADAM (the llm text-to-cad road we're not taking).
- note: no tensormux key in env yet — glm thinking credits on standby until anne saves it. openscad docs were static enough that browserbase stayed parked; firecrawl handled the smithery skill.

## day four, evening: the customizer pass (case engine)

- the annotation scheme was designed by glm (tensormux, first real job): two community tabs — [Case] and [Mounting] — sliders with print-safe floors (wall ≥ 1.6, standoff ≥ 4.5 so the usb shell never breaches the floor), board-derived params under [Hidden]. it also argued against exposing usb_slot_z and the derived screw_hole/standoff_radius, which is right: those are the generator's job.
- one glm correction applied: its string dropdowns ("1.5mm") would break the arithmetic — dropdowns assign strings, and plate_thickness is used in boolean ops. kept numeric sliders with mx/choc hints in the description instead. the llm thinks around the pipeline; the geometry stays deterministic.
- implementation: ~30 lines of emit changes in the case engine, nothing else. every keeberia case is now a configurator object — paste the .scad into the openscad customizer or a makerlab configurator and the sliders appear.
- verification: apt is broken in this sandbox, so openscad 2021.01 runs from the extracted appimage. all three reference cases recompile to real stls (394–452 kb), and a -D override (corner_radius = 15, wall = 5) changes the mesh — the sliders drive geometry, annotations included.

## day four, night: the component geometry pipeline (anne's architecture ask)

- anne's point: the engine should *understand* how changing the switch changes the cutout, and where all this geometry comes from — the roadmap line (marbastlib first, snappeda fallback, grabcad 3d) was the seed.
- the architecture: one record, many projections. CaseProjection (plateOpening, plateHole, plateWindow, plateThickness, usbShell) now lives on every FootprintDef, and the case engine consumes the registry instead of hardcoded constants. classification is category-driven everywhere — the id-list filters went stale the moment they were written (choc keys had zero nets until netlist.ts stopped enumerating switch ids).
- footprint drift caught in the act: the old CHOC_V1 record reused mx pin geometry with an mx peg. replaced verbatim from marbastlib's SW_choc_v1_1u (pins (-5,3.8)+(0,5.9), pegs ±5.5, LED hole 3.4). the roadmap's provenance rule earned its keep.
- the proof: same ninepad, switchType flipped — mx case = 14×14 openings @ 1.5mm plate, choc case = 13.8×13.8 @ 1.2, both auto-derived. choc board routes (147 segments) and validates clean. all reference boards unchanged.
- also fixed a v0 fixture bug by the way: streamdeck had 14 keys stacked on 12 grid positions.
- doc: backend/engines/pcb/research/notes/component-geometry-pipeline.md — the projections table, the sourcing chain per layer, and what it unlocks (flow 05 cap projections hang off switch records the same way).

## day five, early hours: flow 05 research — caps and the viz that sells them

- anne pointed two things at the caps flow: the mint three.js skills pack (installed — three.js IS webgl, so it applies directly to the front-end viewer) and nur-modkeys as prior art, explicitly study-not-copy.
- nur-modkeys distilled: the profile data model (h/taper/dish/tilt-per-row) and the cap-building technique (tapered rounded-rect extrusion, dish by radial falloff). keycap_playground re-confirmed as the parametrization source — but it has NO license on record, so values-as-data with provenance, code never ported.
- flow 05 spec'd in research: caps as the LAST projection of the component records (switch family → stem, cell row → tilt, profile → the rest), caps-engine mirroring the case engine, knob covers off the encoder record. doc: backend/engines/cad/research/notes/flow-05-caps-and-viz.md

## day five, small hours: the caps engine — flow 05 builds its first artifacts

- keycap_playground license resolved: MIT confirmed by the owner on the discord (anne relayed) — recorded in the research note as owner-confirmed, not in-repo.
- makerlab checked properly via browserbase (anne challenged whether i'd skipped it for auth reasons — fair): index is public, multiboard configurator 404s, but the pattern is confirmed: slider-driven parametric + live preview, and a keycap legend generator already lives there — flow 05's publish target, someday.
- caps engine built: backend/engines/cad/caps-engine — generateCaps() mirrors the case engine, profile dropdown + wall/knob sliders, pcb-derived positions under [Hidden]. profile data with per-profile provenance (dsa measured from keycap_playground module defaults; cherry/oem/sa/xda viz-grade unit-converted from nur-modkeys, flagged for calibration).
- all four reference boards render caps to stl: 3 / 8+1 knob / 10+1 / 9 choc (with honest "mx cross for now" warnings until the choc stem lands).
- nur-modkeys has no license either — same rule as before: data as physical facts, code never ported.

## day five, small hours continued: the real makerlab format, from anne's own example

- anne passed the parametric model maker url for stamp creator.scad; ui is auth-gated but the signed scad url fetches directly. the makerlab customizer format verified from a real model: hint-comments as field labels, value:Label dropdowns, section headers, and — the big one — **bosl2 is available in their runtime**.
- caps engine customizer upgraded to that format (labeled profile dropdown, per-field hint comments) and re-verified: all four boards still compile.
- case engine's older annotation style flagged for the same pass.

## day five, late: future options parked + the openscad tradeoffs on record

- roadmap gained its parking lot: after macropads are perfect — keyboard sets (one-piece non-split first, then expansion), per-cap + artisanal customization (still openscad), splits, wired/wireless, iso/ansi/jis presets, non-latin legends, and the fabrication-tolerance principle: pixel-perfect footprints don't fit real prints; tolerances, inserts and fit gaps are part of the artifact, not an afterthought.
- backend/engines/cad/stack/tradeoffs.md — the openscad vs cadquery call, written down so it never gets re-argued from scratch: mesh-first csg (cgal/manifold) over b-rep (occt) because a standalone binary beats sandboxing python; the honest cost is step files, and the revisit trigger is cnc demand.

## day five, night: the readme found anne's voice

- the old readme was memorium-serious; anne wrote the new one herself — first person, casual, bullet points, the whole «wait. why am i doing this manually again» origin story. landed verbatim (headers + code fences only), her words untouched.
- one honest fix while landing it: her "under the hood" draft still said cadquery/step — swapped to openscad + stl/3mf with a link to the tradeoffs doc, since that call is now on record. everything else is hers.
## day five: names, research, and a graph

the engines have names now: **circuitron** (pcb + schematic) and **paracraft** (scad — cases today, keycaps + knob covers tomorrow). directories renamed, every import + doc updated, all tests green after the move — paracraft still compiles real stls with a headless openscad (reinstalled via the extracted appimage; the apt index is flaky in this sandbox).

the firecrawl research came back and it's good:

- **keeb design types** (~18 community board types, from 3-key artsey pads to 40% orthos and split ergos) with a preset shortlist for keeberia → `backend/engines/circuitron/research/notes/keeb-design-types.md`
- **switches + sound**: the community sound lexicon (thock/clack/creamy/marbly...), what physically drives it (foam + plate ≈ 45% of the sound), and a metadata schema for the in-browser sound picker → `scope/research/switches-and-sound.md`
- **artisan scene**: commission/raffle mechanics, resin vs 3d-print, and the dual model for bespoke keycaps — self-serve printable caps + a commission bridge to human casters with fit-tested spec sheets → `scope/research/artisan-scene.md`
- **firmware: qmk (with vial) as the v1 primary** — sub-ms scans, flawless encoders + oleds, live browser remapping after one flash; kmk as the parallel "hackable, zero build infra" export; zmk when wireless boards arrive → `scope/research/firmware-qmk-vs-kmk.md`

and the data layer has a direction: **falkordb**. the project model is a dependency graph — "what depends on what" is the product — so the backend gets a graph db instead of a generic relational store. standing decision in the roadmap + AGENTS.md.

## day five, later: the firmware call + version history

anne made the firmware call: **performance plus live remap first** — qmk + vial is the v1 primary, kmk stays as the parallel hackable export, rmk watches from the sidelines (no ws2812 yet). and **version history** is now a product feature: project model snapshots with restore + diff, stored as graph snapshots in falkordb when that layer lands.

the call didn't sit in a doc for long. circuitron now ships `src/firmware.ts`: a deterministic qmk bundle generator — info.json (data-driven, rp2040 matrix pins, xiao→gpio map), keymap.c with a label→keycode table, rules.mk (vial, encoder map, oled), vial.json (stable uid from the board name, live webhid remapping), and a readme. structural validation passes on all four reference boards, and the pin allocator held up under scrutiny: the streamdeck matrix skips GP6/GP7 because the oled's i2c lives there. honesty note, recorded in the module: the bundle is structurally validated, not compiled — the .uf2 compile happens in the containerized qmk worker when the render.com infra lands.

job #5 (ninepad) went queued → done with 22 artifacts, firmware included. the export bundle is now: kicad pcb, gerbers + drills, openscad case, bom, qmk info, and the firmware directory. a person could actually order and flash this thing.

## sept 11: prior art round three + the caps engine finds its paracraft home

- anne's other machine shipped a lot: names live (circuitron = pcb+schematic, paracraft = scad), qmk+vial locked with a deterministic bundle generator wired into the daemon, and four big community research docs. pulled clean.
- caps-engine moved: backend/engines/paracraft/caps-engine (the case engine's move made it homeless; imports retargeted to circuitron — the old pcb-engine path was already stale after anne's restructure). all four reference boards re-render to stl from the new home.
- prior art round three filed (research/notes/prior-art-round-3-kle-and-scad-keyboards.md): kle (1517⭐, the community interchange — keeberia's flow 01 import/export target), scad-keyboard-cases (kle→openscad case gen, gpl study-only, validates the flow 01→04 path), keyboard_lib (print + mill), and anne's attached genKeyboard ecosystem (island records, layered prints, assembled-explode view — filed verbatim in research/reference/genkeyboard/). convergence: everyone models keys as relative-unit rectangles + rotation + legends; nobody else propagates.
- makerlab configurator still auth-gated; browserbase session parked on the login page for anne to open the live link and sign in.

## sept 11, deep dive: the scad keyboard universe → paracraft's upgrade plan

- three libraries cloned and studied properly. keyboard_lib is MIT (alex ives) — code liftable with attribution, and its spec-test architecture (per-feature spec files + reference stl/svgs) is the answer to "how do we train the scad engine": golden-master testing, deterministic, no ai.
- lenbok (gpl, patterns only): the kle json walk spec (next-key dict accumulation, rotation about rx/ry pivot) — reimplementable in TS as flow 01 import/export; chamfers/tent_support/reset holes as case-module patterns.
- genKeyboard: the exploded view as a single call, legends as txt+svg data, base-type enum.
- paracraft upgrade plan ranked: 1) spec suite with reference stls, 2) kle.ts, 3) case engine v1.1 (chamfers, reset hole, plate-vs-case hole audit), 4) exploded view module, 5) legends on caps, 6) cross-check height_for_style (mx 5.334, choc 2.2) vs our records.

## sept 11, later: the genKeyboard files read properly + the lift policy on record

- individual-file lessons beyond round 3: corner-hull fillet recipe (no minkowski), clearance as a named plate param (cl=0.75 — anne's tolerance principle, parametrized), bounds-based column composition, print-bed sectioning for full keebs.
- lift policy filed in the deep-dive note: keyboard_lib (mit) = values+architecture preferred, code only with THIRD_PARTY_NOTICES.md attribution; lenbok (gpl) = zero code ever; genKeyboard = study-only until anne says where it's from; kle = interop.
- ranked lift list: height cross-check → spec suite → clearance sliders → fillet recipe → bounds composition → bed sectioning.


## sept 11 — the freerouting bridge: dsn out, copper back

anne's standing call since day one: **freerouting is the autorouter** — open source, deterministic, no ai in the copper. today the bridge landed and told the truth about four bugs on its way through.

the shape of it: `circuitron/src/dsn.ts` exports the board exactly as the engine sees it (per-placement images with mirror+rotation baked into board-frame pin coordinates — zero convention drift), `src/ses.ts` parses freerouting's session back into the engine's own segment/via model, and `src/freeroute.ts` runs the jar headless between the two. `generatePcb(layout, "freerouting")` is now a first-class router; the worker's retry ladder escalates from the in-process a* to freerouting when a board is too dense (`FREEROUTING_BIN` wires the host; the rung skips cleanly when unset).

the bugs it caught, honestly:

1. **specctra has no oval shape.** kicad encodes ovals as stroked paths (stroke width = short axis, endpoints = ±(long-short)/2). freerouting silently refused our `(shape (oval ...))` padstacks — padstacks unregistered, nets with those pins collapsed. fixed to kicad's exact encoding.
2. **the scale law, measured not guessed.** `(resolution um 10)` + kicad's writer conventions: coordinates are µm-valued, rule values are plain µm, and freerouting's ses comes back at ×10 the input units. everything was verified against known anchors (a switch at −33.775mm, 0.25mm traces, a 0.6mm via) instead of spec archaeology — the first run "routed" a 10× scaled board with 2.5mm traces and looked successful while being wrong.
3. **the rounded-corner boundary was a self-intersecting polygon.** the corner arcs didn't chain — the path jumped from y=+17 to y=−19, and freerouting routed the board it *could* see, leaving hackpad's gnd net "unroutable" with zero wires. the minimal-probe + bisect hunt (pegs? nets? holes? none of them) ended at the boundary. rewritten so each arc's last point sits on the next arc's edge line — one simple polygon, and the routing boundary sits 0.3mm inside the true board edge so imported traces land with the house margin.
4. **the house drc was dishonest about capsule pads.** it modeled every pad as a max-dimension circle; freerouting routes correctly tight past oval encoder pads (0.4mm real clearance) and tripped the crude circle check (0.18mm phantom). the drc is now shape-aware: capsule axis + halfwidth edge distance for ovals, true radius for circles. both routers are held to the same honest bar.

the bar itself, enforced by `test/freeroute.ts` on all four reference boards: every net with ≥2 pads receives wires, every pad actually touches its net's copper (point-to-segment connectivity), all segments inside the outline, and the house drc passes on the imported routes. result line: hackpad 4/4, ninepad 11/11, streamdeck 23/23, ninepad-choc 10/10 — all at 0 drc errors. freerouting's own internal "violations" counter flags input board state its optimizer can't fix; our drc is the manufacture gate, and that distinction is now written down where the tests can't lose it.

rebase note for the record: the two workstreams restructured the repo in parallel — anne's side kept `backend/engines/` and built the caps engine forward (now `backend/engines/cad/caps-engine` + paracraft research), mine had moved circuitron top-level. anne's layout wins; the bridge content was re-applied onto her tree, all suites green there.

## sept 12: the height cross-check found a real bug — cases were mx-coincidental

- pulled anne's freerouting bridge (dsn out, copper back, judged by the house drc) — the copper path now has its deterministic partner.
- the cross-check: keyboard_lib's plateTopToPcb (mx 5.334, choc 2.2) lifted into circuitron records with provenance; our 14×14 mx plate opening independently confirmed by their hole=14.
- the find: case walls were a free aesthetic slider and the pcb-to-plate alignment only worked by coincidence (walls 10 ≈ standoff 5 + mx 5.334). choc cases were wrong — 10mm walls put the plate ~2.8mm above where a choc stack wants it.
- fix: wall heights derive from the switch stack now (mx → 10.334, choc → 7.2), slider-overridable with an honest warning. gerbers, qmk, cases, caps all re-verified across every reference board.

## sept 12, later: the spec suite is live — and it caught its own bug before we shipped it

- backend/engines/paracraft/specs/: the golden-master suite, keyboard_lib's architecture in our own form. 8 specs (case + caps × 4 reference boards), two layers: scad bytes (codegen contract, exact) + canonical stl hash (geometry contract).
- the discovery along the way: openscad's raw stl bytes are **path-dependent** — identical scad content compiles to byte-different stls from different directories (found because the suite's own cwd fix invalidated its first blessing; proven with a controlled two-path test). so the geometry golden is a canonical hash: vertices quantized to 1µm, facets sorted, then hashed — path- and machine-independent, still catches any real change above a micron. the portability proof: two byte-different stls from the same scad canonicalize to the same hash.
- the harness: `npx tsx specs/run.ts` (compare, exits 1 on mismatch, ci-ready) / `--update` (bless, change described in the commit). cwd-independent, runnable from the daemon. goldens + manifest (with openscad version provenance) in specs/goldens/.
- from now on, every paracraft/circuitron geometry change lands with a spec-suite run. unintended drift fails the suite; intentional changes re-bless with a note.

## sept 25: the research corpus — sculptura's discipline, keeberia's domain

- the supabase migration decision landed (xano retired); migration files pending anne's keeberia project keys (current sandbox URL doesn't resolve).
- the bigger move: a keeberia research corpus modeled on kqrla/sculptura-research (anne's jewellery equivalent, 606 files, built by an openclaw agent). same disciplines: candidate files with finding/caveats/sources/how-it-enters-the-engine, evidence.jsonl (verbatim excerpts, accessed dates), contradictions.jsonl, ontology.json, and manufacturer capabilities as engine-consumable data.
- scaffolded at /research/ and filled the first candidate for real: **jlcpcb**, evidence-backed via firecrawl fetch of their capabilities page (14 evidence lines, every number quoted verbatim). capabilities/jlcpcb.json = the fab profile circuitron's drc will import: min trace/space 0.10/0.10 (we default 0.25, 3x headroom), min drill 0.15 (our floor is 1.2), silkscreen text floor exactly 1.0mm — our silks sit at the floor, flagged for first-article verification.
- ontology v0.1 seeded from the engines' own records. next candidates queued: pcbway, osh park, aisler, seeed; then defect-modes research; then switch/vendor sourcing.
- also: anne offered more resources (openai free-tier models, featherless, gemini, brightdata) — useful for corpus-fill legwork, not for the supabase migration (deterministic, no inference). keys not in sandbox yet.

## sept 25, later: xano → supabase — the port is written, waiting on one paste

- anne's keeberia supabase project is live (fdubhzivtytjgyaoqwkg.supabase.co); keys verified (sb_publishable_ + sb_secret_). the dead jqmclqjs project remains in the sandbox's SUPABASE_URL env — anne should update it in security settings; tests pass it explicitly for now.
- backend/supabase/migrations/0001_design_jobs.sql: the whole xano design as postgres — design_jobs table, rls (anon may enqueue + watch, only the daemon mutates), claim_job (atomic: for update skip locked — stronger than xano's query-then-edit), complete_job, requeue_stale (jobs whose daemon died return to the queue).
- worker.ts: supabaseQueue transport implements the same Queue interface; KEEBERIA_QUEUE selects (default supabase, xano legacy). the entry is guarded so tests import the transport without waking the daemon.
- test/supabase.ts: 7-step end-to-end proof (anon enqueue → rls blocks anon mutation → atomic claim → no double-claim → complete → anon reads result → cleanup). currently and correctly reports "table missing" — the one remaining step is anne pasting the migration into the dashboard sql editor (sandbox has no direct 5432/6543 access; that's by design anyway).
- pooler/db ports verified blocked from the sandbox — the dashboard paste is the honest apply path.

## sept 25, latest: scope/potential-partners.md — the funding map, verified

- anne's list, checked against reality: bambu/makerworld let's make it fund (grants to $300k, real batches announced), elegoo/nexprint $1m creator fund (+ running challenges; they already host parametric web generators — best cultural fit), jlcpcb family (open-hardware sponsorship + easyeda spark $85k + oshwlab stars), pcbway cool projects (the archetype-fitting, lowest-friction first pitch), nlnet (real, next deadline nov 3, full-open licensing required — keeberia's license decision is the blocker), creality/snapmaker/formlabs/prusa (no formal programs verified — direct outreach). "protomakers" not found as a grant org — flagged back to anne for the right name.
- the pitch, one line: every keeberia design ships printable case + caps derived from real switch stacks, and gerbers etched to documented fab rules. pitch order written down, non-negotiables in the doc (sponsorship never bends the evidence lines; no exclusive fab deals).

## sept 25, evening: protomakers resolved → prototypefund.de, first tavily pass

- anne's "protomakers" = the german prototype fund. verified with the first tavily research pass (new credits): bmbf-funded via open knowledge foundation, up to €47,500/project, 6 months, ~25 projects/round, open source required, applications every fall (one source: nov 30 2026). the catch is residency — funded members must be eu-resident, the applicant gbr must sit in germany. keeberia as a us project doesn't fit unless a german-resident partner exists. doc updated with the honest version.
- also: tavily + firecrawl + browserbase second keys landed; brightdata key pasted raw in chat (needs the secrets form); the gemini key came through garbled — asked anne to resend.

## sept 25, late: materials track of the research corpus lands

- the case-fab materials track is in: research/manufacturing/processes/{fdm,sla,defect-modes}.md — fdm as the default
  case process (pla/petg/abs/asa with prusament TDS numbers: hdt 55C pla vs 68C petg, z-axis interlayer 21 mpa,
  shrinkage per material), sla for cases + keycaps (stem fits are the tightest tolerance in the product), and a
  cross-process defect index mapped to the exact case-engine parameters each defect threatens. 18 evidence lines
  merged into evidence.jsonl (all schema-checked, verbatim excerpts, manufacturer docs preferred); two honest
  "rule-of-thumb, unsourced" flags kept out of the evidence file per corpus discipline.
- the two fab-candidate workers (osh park, aisler/seeed) stalled without writing — relaunched.

## sept 25, later: the repo takes its final shape

- the restructure anne drew up is done: engines/{paracraft,circuitron} at root (they are the
  product), backend/{cad,pcb,supabase/src,xano,firmware}, daemons/autolayout promoted, and
  the new layers seeded — explain/ (+ technobabble/) for narrative, project/positioning/
  for the manufacturers/venture/open-source postures, offerings/ for the product families
  (incl. types/ with the planned switch guide + press-and-hear simulator). journal.md and
  AGENTS.md stay at root on purpose (working log + contract, not narrative). keeberia-front
  stays its own repo — lovable syncs it, a vendored copy would rot; docs/frontend.md says so.
- the move was verified, not assumed: circuitron suite green (11/11 nets), paracraft + caps
  renders clean, and the golden spec suite 8/8 — after wiring the openscad appimage back in.
- one honest catch during verification: caps-streamdeck blessed with a new canonical stl
  hash (same scad bytes, same binary version, deterministic across runs — kernel
  tessellation drift, verified structurally sane before re-blessing). also discovered the
  goldens had never been committed; they are now (08ebb5b).
- restructure commit: 848e900. the fab candidates (osh park, aisler, seeed) are on disk
  from the relaunched workers, merged next.

## sept 25, evening: the fab corpus is whole

- osh park, aisler, and seeed are in as researched candidates, each with capabilities json + evidence lines.
  the corpus now holds 74 evidence lines across jlcpcb, the three new fabs, and the case-fab materials track.
- the merge was not rubber-stamped. the aisler worker's evidence lines cited discourse topic urls that do
  not resolve (truncated/hallucinated ids) — the numbers were right, the citations were not. every line was
  rebuilt from the real aisler knowledge-base topics (3732 ENIG, 3735 HASL, portfolio 101, shipping 672),
  fetched via the discourse json api, excerpts verbatim against the live pages. osh park and seeed lines
  spot-checked live (docs.oshpark.com and the fusion wiki render their spec tables server-side; the seeed
  xiao blog excerpt verified via firecrawl). the aisler.md source list fixed (the coupon thread became
  shipping-methods/672).
- what this buys the engine: a second verified eu fab (aisler: 125µm enig traces, 0.25mm min via, free
  untracked eu shipping) and the osh park premium-us option (6mil traces, 10mil min drill, published
  hole tolerances) — three cost/service tiers around jlcpcb now.

## sept 25, night: checkman, and the commits change hands

- new daemon: daemons/checkman — the manufacturing-fit gate. every other daemon trusts the
  records; checkman re-measures the design against what will actually make it: the fab's
  published rules (loaded from the research corpus capabilities json — jlcpcb, aisler, osh park
  already work) and the process profile (fdm / sla presets). every check emits a margin in mm.
- the smoke run over all four reference boards × three fabs × two processes says something
  real: on fdm, switch plates fail (the 14mm mx opening shrinks to ~13.75 — clips will not
  seat) and the 6.2mm knob bore shrinks past the ec11 shaft; on sla everything passes. so the
  case-for-fdm question is settled by the tool, not by vibes. two assumptions are
  calibration-flagged in the code (plate undersize allowance 0.1mm, ec11 shaft 6.0mm).
- keeberia-front copy extracted into explain/ + positioning (verified verbatim against the
  front source before commit).
- .gitignore now ignores itself, because anne said so. project/market/ seeded: the
  market-definition layer for custom keyboards/macropads — starts as questions, becomes
  evidence like the fab corpus did.
- all previous commits rewritten to author kqrla <192480930+kqrla@users.noreply.github.com>
  (history rewritten + force-pushed; commit hashes cited in older journal entries refer to the
  pre-rewrite objects).

## sept 25, late: the queue is live (one grant away), and the corpus gets its constitution

- anne ran 0001 in the supabase dashboard: design_jobs + claim_job/complete_job/requeue_stale
  are live on the real project (verified via the rest api — all three rpcs in the schema cache).
- e2e surfaced a real migration bug: newer supabase projects ship without the old blanket
  default privileges on public, so 0001's policies existed but no role could touch the table
  (42501 for anon and service_role alike). 0002_grants.sql written: anon gets select/insert
  (rls-gated enqueue/watch), service_role gets claim/complete/requeue, the daemon rpcs closed
  to anon. one more paste and the 7-step e2e runs clean.
- research/instruction.md: the keeberia research constitution, adapted from sculptura's —
  keeberia-native and two-sided. the core of it: circuitron and paracraft are decoupled
  engines and the corpus must serve each independently (paracraft could outlive keeberia
  the same way it outlived sculptura's jewellery). evidence chain ends in checkman; the
  schema extends the live corpus (scope/modality now required on new lines); the sept 25
  aisler citation incident is codified as merge discipline; checkman's calibration flags
  (plate undersize, ec11 shaft) are named as open research targets.

## sept 25, night ii: the queue breathes, and backend/pcb gets its documentation

- anne ran 0002_grants.sql. the full e2e against the live project passes end to end:
  anon insert + select (rls-gated), claim_job claims (skip locked, attempts+1), second
  claim finds nothing, complete_job marks done + anon sees the artifacts, requeue_stale
  round-trips a claimed job back to queued with attempts preserved, and anon calling
  claim_job is correctly refused. the supabase queue is live. the xano design is retired.
- backend/pcb was a folder of substance with zero documentation — raw footprint sources,
  fetch/inspect scripts, the pipeline notes — and nothing explaining any of it. now:
  backend/pcb/README.md (what the folder is, what deliberately is NOT in it, the sourcing
  rule), backend/pcb/research/README.md (the fetch → inspect → record provenance chain,
  the stored originals as the authoritative copies).
- docs/footprints-research.md: the registry header has referenced this file since sept 8
  but it never existed. built it from the provenance actually recorded in footprints.ts
  plus the originals on disk — nothing else. found one honest gap while doing it: the
  1.3" oled has no downloaded original; its pattern is derived, flagged as such. every
  calibration flag (stack heights, ec11 shaft, usb shell typicality) is named per part.

## sept 25, night iii: the shell comes home

- anne: lovable is out of the loop entirely — no more changes to keeberia-front. that
  removes the only reason the shell wasn't in this repo (drift with the synced repo).
  ported keeberia-front verbatim into /frontend (last synced state, 9e483e5, "added
  BTS engine pages"): react/vite/tailwind/shadcn, bun. keeberia-front stays frozen as
  the provenance snapshot of the lovable era; /frontend is the living source now.
- docs/frontend.md updated — it had literally ended with "if the frontend ever stops
  being lovable-hosted, revisit this decision." revisited, decided, ported.
- frontend/README.md: the shell's own doc — what it is, its client-of-the-engines
  contract, ported-not-yet-wired status. next frontend step: wire to the supabase
  queue + artifact download flow.
- .gitignore untracked from the repo (local copy keeps ignoring itself + node_modules).

## sept 25, night iv: the shell, deplatformed

- anne: don't pull in every single file — strip the platform bits properly. done:
  the port carried lovable's fingerprints and they're all gone now.
- removed: .lovable/ (platform project config + plan doc), wrangler.jsonc +
  @cloudflare/vite-plugin (old hosting deploy plumbing), bun.lock (stale after dep
  changes, regenerates on install), src/lib/lovable-error-reporting.ts (orphaned —
  zero imports, hooked a platform error bus).
- rewritten: vite.config.ts — the whole config was @lovable.dev/vite-tanstack-config,
  a wrapper bundling tanstackStart + react + tailwind + tsconfig paths + platform
  dev plugins. now a plain five-plugin vite config, plugins verified against
  package.json. the server-entry redirect (src/server.ts SSR wrapper) is preserved.
- patched: package.json (two platform deps out), bunfig.toml (platform exclude out,
  supply-chain guard stays), three bts routes (old-host og:url + canonical links
  dropped — they pointed at the retired deployment), frontend/README.md +
  docs/frontend.md (provenance now cites the kqrla/keeberia-front repo, not the
  platform that hosted it).
- verified: grep -ri lovable frontend/ → clean. zero dangling imports.

## sept 25, night v: the corpus grows four slices, em dashes retired

- four workers delivered: typology (15 lines: trrs 4-conductor rule for i2c splits,
  nrf52840 + tp4054 ble charging stack, zmk = ble-first firmware), layout standards
  (15 lines: 19.05mm pitch, 2u+ stabilizers, 2u/6.25u/7u wire classes, eu languages
  share iso hardware and differ only in legends), legends + non-latin scripts (15 lines:
  doubleshot needs a mold per script, dye-sub is the practical route for niche scripts,
  rtl scripts need mirrored anchors), firmware hotkeys (15 lines: qmk 16-bit keycode
  caps lt/lm at layers 0-15, zmk/kmk/rmk decouple layers, tap-hold 200ms default).
  all in incoming-*.jsonl, awaiting merge review. companion docs: keyboard-typology.md,
  layout-standards.md, legends-multilingual.md, firmware-hotkeys.md.
- anne clarified from a bengali keyboard image: multilingual dual-legend (two scripts
  on one key, primary + secondary) is a different problem from the scripts slice.
  phase 8b created for it; worker dispatched on print conventions + the os
  input-method vs firmware-unicode wiring question.
- anne's standing rule: no em dashes in the repo, including commit titles. applied
  going forward; the ten em-dash commit titles on main were rewritten (title-only
  history rewrite, bodies and file contents untouched).

## sept 25, night vi: anne's reference drop, dual-legend answer lands

- anne dropped 8 images: ansi/iso diagrams, two cluster-color maps, a resin skull
  artisan cap photo, and three dual-legend keyboards (bengali, serbian cyrillic,
  hebrew). saved to scope/reference/images/ with an index tying each to the
  research it grounds - the skull caps confirm scope/research/artisan-scene.md's
  multi-shot resin section already describes the real thing; the three dual-legend
  photos are the exact visual case the 8b worker was sourcing blind.
- phase 8b worker delivered (14 lines, research/dual-legend-multilingual.md): the
  wiring answer anne actually asked for - a dual-legend key sends ONE fixed usb hid
  scancode no matter how many scripts are printed on it; the os's active software
  layout (windows language bar, macos input source, linux xkb/ibus) decides which
  character comes out. the dual print is a physical label for a user who toggles os
  layouts, not two live signals off one switch. firmware-side alternative exists
  (qmk unicode_map / unicodemap_enable can type unicode without an os layout
  installed at all, still via os-specific macro sequences, not raw hid) but zmk has
  no core support, community-only. indian is13194:1991 inscript is the actual named
  standard behind the bengali example - not vendor convention like i'd assumed.
  proposed schema distinct from 8a's multi-zone one: dual_script_pair,
  secondary_font_size_ratio (~0.65), secondary_anchor_point, rtl_alignment_flip.
