---
title: vendor 3d models, step, provenance
---

# step models: vendor geometry for the viewer and checkman

> thesis: paracraft and the caps engine generate all their own geometry
> parametrically, so nothing in the pipeline needs these files to build. the
> step models here are reference: real vendor part bodies for the three.js
> result viewer and for checkman's fit margins against actual component
> volumes instead of datasheet numbers alone.

or simply put: the engines build shapes from numbers. these are what the
real parts look like when you want to show one, or check that a knob really
clears an encoder body and not just its datasheet footprint.

## the upstream gap that forced this hunt

the official kicad keyboard switch footprints (kicad-footprints
button_switch_keyboard.pretty, e.g. sw_cherry_mx_1.00u_pcb) reference 3d
models at ${kisys3dmod}/button_switch_keyboard.3dshapes/*.wrl, but that
directory does not exist in the official kicad-packages3d repo (checked via
the gitlab api, both the built repo and the source generator repo: only
button_switch_smd/tht are shipped). the community consensus source is
foostan/kbd (the corne keyboard library, mit), which is where the step files
below come from.

## files and provenance

all from foostan/kbd (github.com/foostan/kbd, mit license,
kicad-packages3d/kbd.3dshapes), fetched sept 25 2026 from master:

- cherry_mx_switch.step: cherry mx switch body (named "cherrymx switch.step"
  upstream)
- kailh_mx_hotswap_socket.step: kailh mx hotswap socket ("kailh-cherrymx-socket")
- kailh_choc_v1.step: kailh choc v1 low profile switch
- kailh_choc_socket.step: choc hotswap socket
- ec12_rotary_encoder.step: ec12 series rotary encoder ("rotarryencoder
  ec12-sw" upstream, ec11/ec12 share shaft + body dims per the artisan-scene
  research; checkman should still prefer the ec11 datasheet for the bore)
- sk6812mini_e.step: ys-sk6812mini-e per-key rgb, exact registry part
- d_sod123.step: sod-123 diode body
- trrs_pj320a.step: pj320a trrs jack, the 4-conductor split-connector part
  phase 6 established as the i2c split requirement
- m2_6_5mm_screw.step: m2 6.5mm screw, the case standoff fastener

one exception, seeed xiao:

- xiao_ble_tht.step: seeed xiao ble (nrf52840, tht pin version) from
  geigeigeist/totem (github.com/geigeigeist/totem, cern-ohl-p v2), a widely
  used open split keeb whose board mounts xiao modules. seeed's own wiki step
  files sit behind a session-gated download; this copy has clear provenance.

## rules of use

- study-don't-copy applies: these are reference geometry (data), not code.
  checkman may load them for fit checks; the viewer may render them; the
  generators must not fork their geometry into parametric definitions.
- licensing is fine for this use: mit (foostan) and cern-ohl-p v2 (totem) both
  permit redistribution with attribution. keep this file as the attribution.
- if an upstream part ever disagrees with a datasheet in the component
  records, the datasheet wins and the model gets a calibration flag, same
  rule as the footprint registry.

## still missing (honest gaps)

- no official or community step found for the xiao rp2040/samd21 (the wired
  usb variants keeberia's registry actually uses); the nrf52840 model shares
  the castellated module body dims, close enough for viewer + wall clearance
  but flagged here rather than silently assumed.
- oled modules exist in foostan/kbd ("oled module with pins.step") but were
  not pulled in this pass; the displays are thin, low-risk for fit, and the
  footprint originals already cover the pcb side.
