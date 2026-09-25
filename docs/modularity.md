# modularity: the projection graph, or how a design change costs only what it touches

> thesis: a keeberia design is not one blob that regenerates wholesale. it is a projection graph: each artifact (pcb, gerbers, case, caps, keymap, legends, bom, preview) is a pure function of a small, named set of input records. because both engines are deterministic, invalidation is trivial: hash the canonical inputs, reuse the artifact when the hash matches. switching an orthogonal choice regenerates only what sits downstream of it.

or simply put: switching a board from qwerty to dvorak, or pc to mac legends, should never re-run the pcb router, never re-compile the case stl, and never re-export gerbers. today the autolayout worker regenerates all of it on every job. this doc is the plan to stop doing that.

---

## 1. why the engines make this easy

the two properties keeberia already committed to are exactly the two properties a projection cache needs:

- **purity**: circuitron and paracraft take records in, artifacts out. no hidden state. (the decoupled-engines rule: they do not know about each other, so the glue layer owns the graph.)
- **determinism**: same inputs, same bytes. the golden-master harness already proves this: stl canonical hashing (quantized vertices, sorted facets) is byte-stable across environments, and gerber/qmk exports are structurally validated on every reference board.

a pure deterministic function is memoizable without any invalidation cleverness. the cache key is the content of what goes in, nothing else. no timestamps, no job ids, no design-version counters.

## 2. the axis by artifact matrix

which design choices invalidate which artifacts. grounded in the closed layout matrix (phases 7, 7b, 7c, 7d):

| axis | pcb | gerbers | case | plate | caps | keymap | legends | bom | preview |
|---|---|---|---|---|---|---|---|---|---|
| physical layout geometry | x | x | x | x | x | x | x | x | x |
| switch type (mx/choc) | x | x | x | x | x | | | x | x |
| components (encoder, oled) | x | x | x | | | | | x | x |
| size class / physical standard | x | x | x | x | x | x | x | x | x |
| logical layout family (dvorak etc) | | | | | | x | | | |
| mac variant | | | | | | x | x | | |
| regional legends (de/fr/nordic) | | | | | | | x | x | |
| dual-legend spec (8b) | | | | | | | x | x | |
| fab choice (jlcpcb/osh park/aisler) | | x | | | | | | x | |
| print process (fdm/sla) | | | | | | | | | |
| case params (walls, tenting) | | | x | | | | | | |

reading it: the whole left block (everything physical) goes stale together, because geometry is upstream of all of it. the whole right block (logical faces) touches only keymap, legends, and bom spec strings. fab choice touches only the export/verification layer. print process touches nothing generative at all: it is a checkman input, not a generator input.

one design, many logical faces, stated mechanically: logical axes never cross into the physical columns. that is the payoff of phase 7's physical-vs-logical split.

## 3. cache keys

- every input record already has a canonical json form. key = sha256 of (artifact-type, sorted canonical inputs). sorted keys so record field order can never change the hash.
- an artifact store, not a job store: `artifacts(input_hash)` returns bytes. in supabase this is one table, content-addressed, on the same project as the queue (0001 already gave us the pattern). large stls go to storage, the table keeps the uri.
- a design version is then just a set of input hashes, and the jobs table can carry them. a design "re-render" asks the graph which hashes are missing, and only those become work items.

## 4. the worker becomes a scheduler

today: one job, linear pass, everything regenerates (daemons/autolayout/worker.ts calls generatePcb, generateCase, exportGerbers, buildQmkBundle, renderSvg in sequence).

target shape, in steps:

- **v1 (group-level skip)**: keep the linear pass, but stamp each artifact group with its input hash and skip generation when the store already has that hash. the axis matrix above defines each group's exact input set. cheap, no worker surgery, already kills the common case (user toggles legends or keymap after a physical design is done).
- **v2 (per-artifact claims)**: jobs become per-artifact-group claims; the queue (claim_job with skip locked already handles concurrent claims fine) dispatches only missing groups. this is where switchability gets fully lazy: nothing runs unless its inputs changed.
- **checkman rides along, free**: its margin report is a pure function of (artifacts, fab profile, process profile), so it caches the same way and re-runs only when a fab or process profile changes or a physical artifact it consumed changed.

## 5. the via/vial short-circuit

before building v2 for the logical axes, note the cheaper path: via/vial keymaps are a runtime remap in the host app, not a compile-time one. a board shipped with vial support switches qwerty to dvorak, or pc modifiers to mac, with zero regeneration because nothing is generated: the layer data changes on the device. firmware regeneration then only serves boards distributed without vial. phase 8b's dual-legend work is unaffected either way: legends are caps-side, not firmware-side.

## 6. reactivity: from invalidation to bidirectional edges (anne, sept 25 night)

> thesis: everything above is still one-way. the matrix says which artifacts
> go stale when a record changes, but the flows are synchronized lenses on
> one live state object, not serial pipeline stages. the difference between
> keeberia and the ergogen lineage is exactly here: reactive,
> single-source-of-truth orchestration vs siloed static generation. if the
> typing angle changes in the case flow, the pcb flow should already know
> its standoffs moved.

today: circuitron takes a layout and produces a pcb; paracraft takes that
pcb and produces scad. the case never pushes back on the pcb. the graph
above fixes the cost of that (only what changed regenerates) but not the
direction.

the wiring rules, so reactivity does not break decoupling:

- engines never talk to each other (the standing decision). they talk to
  the state. an edge is a declared read or a declared write on a record
  field, owned by the orchestrator, not by the engines.
- so the research question for each engine is: what does it read, what
  does it write, and what does it currently derive statically that should
  instead be a live relationship. that inventory is the dependency map,
  and it lives as a deep-dive page (phase 14,
  research/deep-dive/technical-depth/, dependency-map.md) because it needs
  evidence from how the engines actually behave, not assumption.
- the shared strip is where the first real bidirectional edges live:
  mounting holes (case standoffs want them where walls are; pcb flow must
  place them), plate openings, stack heights, the ec11 bore. physical
  stack facts beat convenience when edges disagree, same rule as the
  corpus: datasheet beats model, measured beats datasheet.
- conflict resolution must be explicit before v3: if routing congestion
  wants a hole where the case wall wants a standoff, some priority writes
  the record and the other side reacts. no silent two-way writes.

## 7. open questions

- artifact store retention: stls and gerber zips are big. keep latest-n per design, garbage-collect by input-hash lru?
- do we want the artifact store keyed additionally by engine version, so an engine change invalidates the world in one move? (leaning yes: engine semver is already a product feature via the version history.)
- where the preview svg sits: it consumes layout + components, so it belongs to the physical block, but it renders legends for the on-screen look. it likely needs two inputs (geometry hash + legend spec hash) and should be the first test of a multi-input cache entry.
