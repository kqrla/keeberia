# cross-process defect index for keeberia manufacturing

defect modes define the boundaries of parametric cad generation: every tolerance allowance, chamfer, clearance gap, and wall thickness floor in keeberia's engines exists to defend against specific physical failure modes during printing.

---

## 1. warping and corner lifting

- **what it is**: non-uniform thermal cooling causes differential stress contraction across the part. as upper layers cool and shrink, they exert upward pulling forces on lower layers, causing outer corners to lift off the build plate.
- **which process**: primary threat in fdm (especially high-shrinkage polymers like abs, asa, and petg); minor threat in sla due to post-cure shrinkage stress.
- **which keeberia geometry it threatens**: bottom case floor flat surface (`baseThickness`), corner margins (`cornerRadius`), and interior pcb fit cavity (`caseMargin`).
- **design-side mitigation**:
  - enforce a minimum base thickness of 2.4 mm (`baseThickness = 2.4`).
  - add outer corner radii (`cornerRadius ≥ 4.0` mm) rather than sharp 90° corners to distribute thermal stress.
  - specify 0.5 mm bottom perimeter chamfers.
  - for abs/asa cases, require brim additions (3.0 mm brim) or heated enclosure printing.

---

## 2. shrinkage and dimensional drift

- **what it is**: volumetric volume reduction occurring when molten plastic solidifies (fdm) or when liquid resin polymerizes and post-cures (sla).
- **which process**: fdm (0.2%–0.8% linear shrinkage depending on material) and sla (0.2%–0.5% linear post-cure shrinkage).
- **which keeberia geometry it threatens**: switch plate cutout dimensions (mx 14.0 mm, choc 13.8 mm), mounting standoff center-to-center pitch, keycap stem socket fits.
- **design-side mitigation**:
  - encode material-specific scaling factors in slicer/cad pipelines (pla: 1.002, petg: 1.003, abs/asa: 1.006).
  - apply dimensional tolerance offsets on tight fits (+0.05 mm on switch cutouts, +0.2 mm on screw hole diameters).

---

## 3. elephant foot (first-layer expansion)

- **what it is**: excessive downward nozzle pressure on the first layer squeezes molten plastic outward beyond the nominal perimeter line, creating a flared ridge around the bottom edge.
- **which process**: fdm process defect.
- **which keeberia geometry it threatens**: lower screw hole entrance diameter (`screwSize`), bottom snap-fit tabs, outer bottom case boundary.
- **design-side mitigation**:
  - apply 0.5 mm x 45° bottom edge chamfers around the outer case perimeter and bottom mounting hole openings.
  - rely on slicer elephant foot compensation (0.15 mm in bambu studio; 0.20 mm in prusaslicer).

---

## 4. interlayer adhesion failure (z-cleavage)

- **what it is**: weak thermal or chemical bonding between adjacent z-layers leads to delamination along layer boundaries under tensile or shear stress.
- **which process**: fdm (z-axis tensile strength is 30%–55% lower than xy flat strength) and sla (peel force delamination).
- **which keeberia geometry it threatens**: vertical side walls (`wallThickness`), snap-fit retention tabs, standoff post bases (`standoffHeight`).
- **design-side mitigation**:
  - set wall thickness floor to minimum 1.6 mm (3.0 mm default).
  - add generous fillet radii (minimum 1.0 mm) at the base where standoff posts meet the case floor.
  - orient snap tabs horizontally or print cases at an angle to avoid layer lines parallel to bending forces.

---

## 5. overhang sag and bridging droop

- **what it is**: extruded plastic printed over open air or steep angles (>45° from vertical) sags under gravity before cooling and solidifying.
- **which process**: fdm process defect.
- **which keeberia geometry it threatens**: top edge of the usb-c port cutout (`usbClearance`), internal horizontal ledge overhangs for switch plates.
- **design-side mitigation**:
  - specify 0.6 mm radial clearance on usb slots (`usbClearance = 0.6`).
  - apply teardrop geometry or 45° chamfers to the upper edge of horizontal holes/cutouts to eliminate flat 90° bridging spans.

---

## 6. resin brittleness and post-cure stress cracking

- **what it is**: high cross-linking density in standard photopolymer resins causes low impact resistance and brittle cracking under mechanical insertion forces.
- **which process**: sla / dlp process defect.
- **which keeberia geometry it threatens**: keycap stem sockets (mx cross and choc leg sockets), thin snap tabs, thin plate clips.
- **design-side mitigation**:
  - specify tough / abs-like resin formulation for functional keycaps and snap features.
  - add 0.3 mm lead-in chamfers on keycap stem socket openings.
  - maintain keycap stem outer wall thickness at ≥1.2 mm.

---

## 7. suction-cup vacuum forces and peel delamination

- **what it is**: closed hollow geometry oriented facing the resin vat creates an airtight cup. as the z-axis lifts, vacuum suction forces stress the part and flexible vat film, causing mechanical tearing or print detachment.
- **which process**: sla / dlp process defect.
- **which keeberia geometry it threatens**: hollowed case bottom cavity, deep internal wall pockets.
- **design-side mitigation**:
  - introduce internal air/drain relief holes (≥1.5 mm diameter) in enclosed pockets.
  - tilt case parts 15°–30° relative to the build platform during slicer orientation.

---

## 8. stringing and internal void oozing

- **what it is**: molten plastic drooling from the nozzle during non-printing travel moves across open cavities.
- **which process**: fdm process defect (most prevalent in petg and tpu).
- **which keeberia geometry it threatens**: usb slot opening, internal switch plate cutout matrix.
- **design-side mitigation**:
  - provide clear radial clearance around ports (`usbClearance = 0.6` mm).
  - avoid unnecessarily narrow internal air slots where travel moves occur.
