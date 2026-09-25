# research/footprints

or simply put: the provenance attic for every footprint dimension circuitron
acts on. when a pad sits at -3.81, -2.54 with a 1.0mm drill, this folder is
where you go to ask "says who?"

the chain, end to end:

```text
fetch script (github api — standing instruction, no scraping credits spent)
  ↓
downloaded original (.kicad_mod, stored in footprints_*/ — never edited)
  ↓
inspect script (reads the original, extracts pad geometry for comparison)
  ↓
human-readable comparison against datasheets
  ↓
FootprintDef records (engines/circuitron/src/footprints.ts — the live
registry, with per-part provenance notes in docs/footprints-research.md)
```

the sources on disk:

- `footprints_care_package/` — hack club hack pad care package originals
  (mx solderable 1u, xiao generic hybrid 14p)
- `footprints_hackpad/` — the hackpad repo's footprints (mx solder + hotswap
  1u, sk6812-mini-e, ssd1306 0.91" oled, xiao rp2040/samd21 variants)
- `footprints_raw/` — kicad-official and community originals pulled for
  comparison (cherry mx pcb + plate, perigoso's kailh hotswap, ec11,
  sk6812 5050, m2 holes, diodes/sod123, xiao)

the rule that keeps this honest: the stored .kicad_mod files are the
authoritative downloaded copies — scripts may fetch and inspect them but
never modify them. when a record in footprints.ts disagrees with a stored
original, either the record is wrong or the deviation is a documented
decision; both cases get written down (docs/footprints-research.md carries
the per-part provenance).

anything not covered by a source here and not in a datasheet does not enter
the registry as fact — it enters as a calibration-flagged assumption or it
doesn't enter yet. see ../README.md for the folder-level sourcing rule.
