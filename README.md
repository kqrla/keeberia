# keeberia

design a macropad in your browser like you're in figma → get a manufacturable pcb out the other end.

- **frontend** — [layout-to-device.lovable.app](https://layout-to-device.lovable.app) (lovable)
- **backend** — this repo. deterministic, programmatic pcb generation. no ai in the copper path.
- **journal** — [journal.md](journal.md), the build log
- **scope** — [scope/roadmap.md](scope/roadmap.md) + per-version definitions in [scope/versions/](scope/versions/)

```
backend/
  engines/
    pcb/
      pcb-engine/     ← the deterministic pcb engine (ts): layout → netlist → routing → kicad 8
      research/       ← footprint research: verified geometry, provenance, scripts
  daemons/
    autolayout/       ← background job services (v1): job queue → engine run → artifacts
scope/
  versions/           ← v0.md (done), v1.md (micropad mvp), v2.md (keebs later)
  roadmap.md
```

everything in the ui is a **logical object** ("key", "knob", "oled"). the backend resolves each one into its manufacturing footprint + circuit. users never see an eda, never touch a net, never think about copper. micropads first, keebs later.
