# checkman

or simply put: checkman is the paranoid twin of the generators. every other
daemon trusts the records — checkman asks "will this actually fit when a
human with a soldering iron and a 3d printer gets involved?"

the problem it exists for: virtual fit and manufactured fit are different
things. a plate opening drawn at exactly 14.0mm fits a switch perfectly in
the model — but an fdm printer shrinks inner holes by a tenth or three, and
the switch clip never seats. a 1.0mm drill with a 1.75mm pad is a legal
0.375mm annular ring in the model — but the fab's tolerance band decides
whether that's copper or a scrapped board. tight is only tight if you say
tight to whom.

so checkman runs after generation (the last step of every design job, before
artifacts are handed to a human) and re-measures the design against two
things the generators do not know about:

1. the fab's published rules — loaded from
   `research/manufacturing/capabilities/*.json`, the same evidence-backed
   capability files the corpus research produces. jlcpcb, aisler, osh park
   ship today; each new fab candidate adds a profile for free.
2. the manufacturing process profile — the machine that will physically
   make the part (fdm, sla, cnc). printer hole shrink, clearance fits,
   minimum printable wall. the design is checked for the *process it will
   actually be made with*, not for an ideal one.

every check emits a margin in mm: how much room is left after the tolerance
is spent. negative margin is a failure (it will not fit). small positive
margin is a warning (it fits, but one bad print or one fab drift away from
not fitting). the report says which thing to change — not just "bad".

what it checks (v0):

- annular rings: pad size vs drill vs the fab's min + recommended ring
- drill sizes: every pad drill against the fab's min/max drilled hole
- plate opening fit: the switch window vs process hole deviation (the
  classic "clip won't seat" failure)
- plate thickness: within the switch's datasheet band, after process z-error
- case wall thickness + pcb-to-wall margin vs the process's printable
  clearance
- cap neighbor gap vs process clearance (caps that print fused are not caps)
- knob bore vs the ec11 d-shaft, plus process shrink

two calibration flags, honestly held: the plate-opening undersize allowance
(0.1mm) and the ec11 shaft diameter (6.0mm nominal) are datasheet-typical
assumptions, calibration-flagged until the first physical test — the same
discipline the switch stack heights carried before the sept 12 print.

the checks are pure functions over the circuitron records and the profiles:
no ai, no guesses at runtime, deterministic like everything else in the
copper path. it is a library first (`runCheckman`); the worker calls it as
the final gate of a design job and stamps the report onto the job record.
later: service deployment (render.yaml) when jobs need it remotely, plus
case-engine wall/overhang geometry checks that read the scad parameters
directly.
