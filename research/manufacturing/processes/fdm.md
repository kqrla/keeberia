# fdm printing for keeberia cases

fdm is the default case process because it is fast, highly accessible on standard desktop 3d printers (such as prusa mk3/mk4 and bambu lab a1/p1/x1 series), requires no chemical post-processing or wash/cure stations, and produces structurally durable thermoplastic enclosures suitable for daily desk use.

## thermoplastic material properties for keyboard enclosures

keyboard cases enclose internal electronics (mcus, power management circuits, battery charging ICs, dense rgb led matrices) and must withstand structural loads from keypresses, self-tapping screws, and snap-fit assembly.

### pla (polylactic acid)
- **tensile yield strength**: 54 ± 1 mpa for filament, 49–55 mpa printed (prusament pla tds).
- **heat deflection temperature (hdt)**: 55 °c at 0.45 mpa (iso 75, prusament pla tds).
- **interlayer adhesion strength**: 21 ± 2 mpa (prusament pla tds); retains ~55% of flat tensile strength in z-axis (cnc kitchen test data).
- **shrinkage & warping**: low shrinkage (~0.2–0.3%); minimal warping risk on open build plates.
- **keeberia case suitability**: excellent rigidity and dimensional stability for desktop cases. however, its low hdt (55 °c) makes it sensitive to thermal buildup near enclosed mcus (such as xiao rp2040) or dense rgb backlighting if case ventilation is insufficient.

### petg (polyethylene terephthalate glycol)
- **tensile yield strength**: 46 ± 1 mpa for filament, 35–39 mpa printed (prusament petg tds).
- **heat deflection temperature (hdt)**: 68 °c at 0.45 mpa (iso 75, prusament petg tds).
- **interlayer adhesion strength**: good ductility, but lower z-axis strength relative to flat strength (~46% of flat, cnc kitchen test data).
- **shrinkage & warping**: moderate shrinkage (~0.2–0.5%); low-to-moderate warping.
- **keeberia case suitability**: higher heat resistance (68 °c hdt) prevents thermal softening near mcus. more flexible than pla, making it better for flex clips and snap tabs, though stringing across switch cutouts and usb slots requires tuning.

### abs (acrylonitrile butadiene styrene) / asa (acrylonitrile styrene acrylate)
- **tensile yield strength / flexural strength**: asa tensile yield strength 40 ± 1 mpa (prusament asa tds); abs flexural strength 62 mpa (bambu lab wiki).
- **heat deflection temperature (hdt)**: 93 °c at 0.45 mpa for asa (iso 75, prusament asa tds); abs ~95–100 °c.
- **interlayer adhesion strength**: 11 ± 1 mpa for asa (prusament asa tds); z-axis strength drops to ~29% of flat strength without enclosure (cnc kitchen test data).
- **shrinkage & warping**: high volumetric and linear thermal shrinkage (~0.5–0.8%). high warping tendency due to high thermal contraction during ambient cooling.
- **keeberia case suitability**: excellent heat resistance (93 °c hdt) and impact strength, but prone to corner lifting and wall warping on large keyboard frames unless printed in a heated enclosure (bed at 100–110 °c).

---

## achievable feature tolerances for keeberia geometry

fdm extrusion dynamics (nozzle width, layer squish, perimeter polygonization) constrain the exactness of printed features.

### linear xy accuracy and hole sizing
- **xy tolerance range**: typical desktop fdm achieves ±0.10 mm to ±0.20 mm (iso 2768-m class; rule-of-thumb, unsourced).
- **internal hole shrinkage**: circular cutouts (screw holes, switch plate pegs, standoff bores) consistently print smaller than cad models by ~0.10 mm to 0.20 mm due to perimeter tension and line segmentation.
- **keeberia compensation**: case-engine adds +0.2 mm drill allowance for m2 self-tapping screws (`screw_size = 2.2` mm for an m2 thread, resulting in a 2.4 mm printed hole).

### wall thickness floors and margins
- **minimum wall thickness**: 1.6 mm minimum structural floor; below 1.6 mm, vertical walls lose flexural stiffness and become floppy.
- **default wall thickness**: 3.0 mm (`wallThickness = 3` in case-engine) provides optimal rigidity and impact dampening.
- **pcb-to-wall margin**: 1.6 mm (`caseMargin = 1.6` in case-engine) accommodates xy dimensional tolerance (±0.2 mm) and minor edge burrs on pcb cutouts.

### first-layer expansion (elephant foot)
- **bulge magnitude**: downward nozzle squish flattens the initial layer outward by 0.15 mm to 0.25 mm.
- **slicer mitigation**: prusaslicer defaults to 0.20 mm elephant foot compensation; bambu studio defaults to 0.15 mm elephant foot compensation.
- **design-side mitigation**: adding a 0.5 mm x 45° chamfer to the bottom perimeter edge of the case prevents first-layer flare from exceeding the nominal footprint.

### shrinkage compensation
- **scaling adjustment**: slicers apply an x/y scaling multiplier (`shrinkage compensation`) to compensate for thermal cooling contraction (pla: 100.2%, petg: 100.3%, abs/asa: 100.6%).

---

## defect modes and case-engine parameter threats

| defect mode | root cause | threatened case-engine parameter / geometry | design-side mitigation |
| :--- | :--- | :--- | :--- |
| **warping / corner lift** | thermal contraction of upper layers pulling bottom corners upward | `baseThickness`, `caseMargin`, overall case flat floor | add bottom chamfers/fillets, maintain minimum 2.4 mm base thickness, specify enclosed print setup for abs/asa |
| **layer adhesion failure (z-cleavage)** | insufficient thermal bonding between z-layers under tensile load | `wallThickness`, standoff posts, snap-fit tabs | set minimum wall thickness to 1.6 mm (3.0 mm default), orient snap tabs horizontally or reinforce with fillets |
| **stringing and oozing** | nozzle travel across open voids dropping molten plastic wisps | `usbClearance`, switch plate openings (`plateOpenings`) | specify 0.6 mm radial clearance on usb openings (`usbClearance = 0.6`); avoid narrow internal air gaps |
| **elephant foot squish** | initial layer nozzle pressure squishing warm plastic outward | lower screw hole entry diameter, outer bottom footprint | add 0.5 mm bottom edge chamfer; ensure 0.15–0.20 mm slicer elephant foot compensation is active |
