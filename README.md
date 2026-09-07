# keeberia

keeberia tackles the decades-old wall between the people who think in tools and the people who think in circuits by dissolving the eda entirely: a macropad designed in a browser canvas that feels like figma comes out the other end as a manufacturable, fab-ready pcb.

or simply put, we basically think the reason only engineers make circuit boards isn't that circuit boards are hard — it's that the software is. so instead of building yet another eda with friendlier paint on top, keeberia removes the eda from the picture completely. users draw logical objects. the backend does the electrical engineering. copper becomes a compilation artifact, not a craft.

## the idea behind traceparency

we started from a simple position: **the copper path is not creative work.** placing a switch, fanning it out to an mcu, routing the matrix, pulling silk — this is deterministic transformation of intent, closer to a compiler than a collaborator. every ai-authored pcb tool on the market right now treats routing as a generation problem, which means every board ships with artifacts nobody can explain.

keeberia instead compiles. a layout is source code; the pcb is the binary; the engine is the compiler. the same layout always compiles to the same board, today and in two years — which is the only way a hobbyist can trust what comes out, and the only way a second tool (protoflow) can meaningfully verify it. we call this **traceparency**: nothing in the copper path is generated, guessed, or probabilistic, so every trace on the board has a reason you can point to in the pipeline.

## what's the goal

a world where designing a macropad for yourself is exactly as approachable as designing a canva poster: you pick a shape, drop keys and knobs and a screen where you want them, hit generate, and download gerbers a fab will accept. micropads first (they're the tractable, useful, delightful end of the problem) — full keebs later. never, at any point, does the user learn what a net is.

## pillars

- **logical objects** — the ui speaks in keys, knobs, and oleds. each one resolves internally into its manufacturing footprint + circuit, but that resolution never leaks into the interface
- **determinism** — no ai in the copper path. same input, same board, forever. ai sits one layer out, at verification, never generation
- **traceparency** — an inspectable pipeline: placement → netlist → fan-out → negotiated-congestion routing → kicad 8 export, every stage explicable
- **zero-eda** — the vocabulary of ecad (nets, footprints, drc) is backend vocabulary. the frontend's vocabulary is shapes and labels
- **the loop** — the website is the product; the repo serves it. every backend milestone ends with something the site can show

## the loop

```
keeberia website (layout-to-device.lovable.app)
   │  user designs a micropad — notion/canva vibes, zero eda concepts
   ▼
xano api — validate + queue the job (POST /generate → design_jobs)
   ▼
autolayout daemon — runs pcb-engine, retry ladder, persists artifacts
   ▼
protoflow — verification only: exported boards get run through its
            drc/erc + footprint cross-checks (via its mcp). protoflow
            can veto a board; it can never draw one
   ▼
back to the website — preview, bom, case, firmware config
```

## repo

```
backend/
  engines/pcb/
    pcb-engine/    ← the compiler: layout → netlist → routing → kicad 8 (ts)
    research/      ← footprint geometry research: verified, with provenance
  daemons/
    autolayout/    ← job worker: queue → engine run → artifacts persisted
scope/
  versions/        ← v0.md (done) · v1.md (micropad mvp) · v2.md (keebs later)
  roadmap.md       ← the five flows mapped to versions + standing decisions
```

- **frontend** — [layout-to-device.lovable.app](https://layout-to-device.lovable.app)
- **journal** — [journal.md](journal.md), the build log (failures included)
- **scope** — [scope/roadmap.md](scope/roadmap.md) + per-version definitions of done
- **vision** — [scope/vision.md](scope/vision.md), the manifesto (the authoritative product spec)

## inspired by

keeberia is a sibling of *sculptura* — same belief that tools should dissolve into the work, same build-in-public journal, same lowercase energy. it also owes a debt to the hack club care package and every keyboard person who ever posted a board file so the next person didn't have to start from zero.
