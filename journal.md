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

## current state

- [x] deterministic pcb engine: layout → netlist → routed board → kicad 8 export
- [x] verified footprints with provenance (mx solder/hotswap, ec11, xiao, oleds, sod-123, m2)
- [x] drc clean on all three test boards (pad clearance, edge, shorts, unrouted)
- [x] bom + svg preview + kicad export from the same single source of truth
- [ ] xano api live (blocked on fresh metadata token)
- [ ] case generator (openscad, flow four)
- [ ] lovable frontend wired to the real engine
