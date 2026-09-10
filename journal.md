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
