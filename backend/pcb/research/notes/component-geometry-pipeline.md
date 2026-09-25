# the component geometry pipeline — one record, many projections

research + architecture: sept 8 2026 · implements the standing decision in scope/roadmap.md ("symbol/footprint sources: kicad defaults or marbastlib first; snapeda/componentsearchengine fallback; grabcad for 3d models") · verified end-to-end in code the same day (see "the proof" at the bottom)

## the thesis

a keeberia component is **one record with many projections**. the switch the user picks in flow two isn't a string that engines interpret separately — it's a `FootprintDef` in the registry, and every engine reads *its own projection* of that record:

| projection | consumer | what it means | source of truth |
|---|---|---|---|
| copper (pads, drills) | pcb engine: netlist, router, gerber | how it solders | record geometry, datasheet-proven |
| case (`CaseProjection`) | case engine: plate cutouts, windows, usb slot | what the enclosure must give it | same record, `case` field |
| silkscreen | silkscreen flow | what's printed around it | same record, `silks` field |
| bom | bom flow | the jlc part number it ships as | record id → bom map |
| 3d model | preview, case booleans later | what it looks like | grabcad / kicad-packages3d (planned) |

**changing the switch changes the cutout** because they are the same data. not "the case engine was updated to know about choc" — the choc record carries its plate opening and thickness the same way it carries its pads, and the case engine reads whatever the record says.

## the layers, and where each comes from

upstream, keeberia is a *consumer of the electronics ecosystem's own formats*. the roadmap's standing decision maps each layer to its source, in order:

1. **symbols** (`.kicad_sym` — schematic logic): kicad default libraries first, **marbastlib** second. marbastlib (ebastler/marbastlib, 603⭐) is the keyboard-native library — mx and choc footprints, hotswap sockets, stabilizers, encoders, leds, the whole mechanical-keyboard part universe maintained by the keeb community. it is the closest thing to an upstream of keeberia's part universe.
2. **footprints** (`.kicad_mod` — copper geometry): same sources, plus **snapeda/snapmagic** and **componentsearchengine** as fallback lookup for anything the first two lack. both services bundle symbol+footprint+3d step per part; no public api, so the workflow is per-part fetch (browserbase), then verify against the datasheet, then commit as a keeberia record with provenance.
3. **3d models** (`.step`/`.wrl`): **kicad-packages3D** (official, 511⭐) for standard parts, **grabcad** for community models (switches, breakout boards). grabcad has no api either — browserbase territory, and every model gets dimension-checked against the datasheet before a record references it (grabcad quality varies).
4. **case geometry** (cutouts, plate thickness): **manufacturer datasheets are the ground truth** — cherry mx (14×14 opening, 1.5mm plate), kailh pg1350 (13.8×13.8, 1.2mm) — with marbastlib's plate cutout footprints as cross-check (they ship `PLATE_MX`/`PLATE_choc` cutout modules as *footprints* — the ecosystem already treats the plate opening as geometry worth versioning, exactly this architecture's instinct).
5. **the bom** ties the record to **jlcpcb** part numbers (roadmap: footprints verified against jlc's library).

the provenance rule from the roadmap's risk section holds for all five: **every value keeps provenance** (record header comments + this notes dir), new parts get verified before they touch the netlist. that rule caught a real one today — see below.

## the mechanism, in code

- `CaseProjection` (pcb-engine `types.ts`): `plateOpening`, `plateHole`, `plateWindow`, `plateThickness`, `usbShell` — optional fields on every `FootprintDef`. a part with no case projection is legal (diodes don't demand enclosure geometry), and the case engine *warns* rather than invents.
- the case engine imports the registry and classifies by **record category, never by id lists**: keys are `category === "switch"`, encoders `"encoder"`, displays `"display"`, mcu `"mcu"`. id-list filters go stale the day a family joins — this session removed the last of them from netlist.ts, bom.ts, index.ts and the case engine.
- the switch-plate *thickness default* follows the board's switch records (mx boards default 1.5, choc boards 1.2); mixed families warn honestly instead of guessing.
- `layout.ts` is the resolution joint: `cell.switchType` + `cell.mount` pick the record, and every projection follows the placement (`library` id). choc_v1 is wired today; choc_v2 / lp_gl / mx_ks await verified records — the type already reserves them.
- **choc v1's copper, fixed**: the old CHOC_V1 record reused MX pin positions with an MX peg — footprint drift, exactly what the risk section warns about. replaced with geometry **verbatim from marbastlib's `SW_choc_v1_1u`**: pins at (-5, 3.8) and (0, 5.9), 2mm pads/1.2mm drills, two 1.7mm locating pegs at ±5.5, 3.4mm center LED hole. plate 13.8×13.8 @ 1.2mm.

## the proof (all verified sept 8, in-repo)

same ninepad, one field changed — `switchType: "choc_v1"` on every cell:

- **mx ninepad**: `plate_thickness = 1.5`, nine `cube([14, 14, …])` openings (hotswap record)
- **choc ninepad**: `plate_thickness = 1.2` (auto-defaulted from the record), nine `cube([13.8, 13.8, …])` openings — and each scad opening line names the record that drove it
- both compile to real stls (450.0 kb / 407.3 kb, openscad 2021.01 from the appimage)
- the choc board is a fully routed board: 12 nets, 147 segments, 9 vias, validates clean (balanced s-expressions, zero bad net refs)
- all three original reference boards still compile and validate unchanged

## what this unlocks next

- **flow 05 (caps/knobs)**: keycap profile geometry hangs off the switch record too — a cap projection per family (mx stems, choc stems, different cap heights). keycap_playground's parametrization is the prior art to port.
- **3d model references** on records (`model?: { source: "kicad-packages3d" | "grabcad", ref: string }`) for the webgl preview and future case boolean cuts (oled bumps, knob skirts).
- **snapmagic/grabcad ingest skill**: per-part fetch → datasheet verify → record commit, with provenance in the header comment. browserbase does the fetching; the datasheet stays the judge.
