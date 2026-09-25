# sla/dlp resin printing for keeberia cases and keycaps

sla/dlp is the keycap and high-precision case process because photopolymerization provides isotropic high-resolution surface finishes, fine layer resolution (25–50 µm), and tight dimensional control required for keycap stems and smooth parametric enclosure walls.

## resin material categories for keyboard applications

sla photopolymer resins vary significantly in impact strength, flexural modulus, and heat deflection temperature depending on cross-linking density and post-curing protocol.

### standard resins (clear, grey, black)
- **hardness & strength**: shore d 80d hardness (formlabs clear/grey v5 tds); high tensile strength (~50–65 mpa).
- **heat deflection temperature (hdt)**: ~73 °c at 0.45 mpa (astm d648; formlabs clear v2 tds).
- **characteristics**: exceptional surface detail and sharp corner resolution. however, standard resins exhibit brittle fracture under impact or repeated snap-fit bending.
- **keeberia application**: suitable for display windows, knob covers, and low-impact case shells, but prone to stem cracking when used for keycaps.

### tough / abs-like resins (tough 1500, tough 2000)
- **hardness & strength**: shore d 76d (tough 1500) to 81d (tough 2000); tensile strength 40–46 mpa (formlabs tough tds).
- **heat deflection temperature (hdt)**: 45 °c at 1.8 mpa for tough 1500; 63 °c at 0.45 mpa for tough 2000.
- **characteristics**: engineered to simulate abs/polypropylene behavior with higher elongation at break and energy absorption.
- **keeberia application**: prime material for keycaps (especially keycap stems) and snap-fit case tabs. flexural resilience prevents MX and Choc stem sockets from splitting during switch press-fitting.

### rigid & high-temp resins
- **hardness & strength**: shore d 88d–89d (rigid 10k v1 tds); flexural modulus >4 gpa.
- **heat deflection temperature (hdt)**: >100 °c to 200+ °c.
- **characteristics**: extremely high modulus with zero flex.
- **keeberia application**: ideal for thin mounting plates and structural inner frames where zero flex under keypress is desired.

---

## accuracy, z-axis dynamics, and post-cure shrinkage

### xy vs z dimensional accuracy
- **xy dimensional accuracy**: guided by mask lcd pixel resolution or galvo laser spot size. formlabs sla documentation specifies ±0.15% accuracy for features 1–30 mm, with a minimum lower limit of ±0.02 mm.
- **z-axis resolution**: controllable layer heights from 25 µm (0.025 mm) to 100 µm (0.10 mm). however, z-height accuracy is influenced by z-stage leadscrew backlash, platform tilt, and peeling forces.
- **stem tolerance demand**: keycap stems are the tightest tolerance feature in the entire keyboard assembly (mx stem cross width 4.0 mm, arm thickness 1.32 ± 0.02 mm; choc stem legs 1.2 mm x 3.0 mm). socket geometries require +0.03 mm to +0.05 mm dimensional clearance allowance in the stl generator.

### post-cure shrinkage
- **photopolymer cross-linking**: initial liquid resin curing causes volumetric shrinkage during printing (~1–2%).
- **uv post-cure chamber**: thermal post-curing (e.g. 60–80 °c for tough resins) achieves full mechanical strength but induces an additional linear shrinkage of 0.2% to 0.5%.
- **asymmetric shrinkage**: non-uniform part geometry (such as keycaps with thick top dishing and thin skirt walls) undergoes uneven shrinkage, causing slight wall cupping if uncompensated.

---

## defect modes and keeberia geometry threats

| defect mode | root cause | threatened keeberia geometry | design-side mitigation |
| :--- | :--- | :--- | :--- |
| **keycap stem splitting / brittleness** | over-curing standard resin or low elongation under insertion shear | keycap stem cross sockets (mx & choc fits) | use tough/abs-like resin; add 0.3 mm chamfer at stem socket entry; set stem wall thickness ≥1.2 mm |
| **suction-cup vacuum failure** | enclosed hollow case volumes creating sealed suction against vat film during z-lift | bottom case cavity floor, deep interior walls | introduce internal air/drain relief holes (≥1.5 mm diameter) in hollow cavities or tilt part 15°–30° during slicing |
| **peel delamination / layer separation** | excessive peeling forces during z-lift pulling thin layers apart | thin case walls (<1.2 mm), tall standoff posts | orient cases angled 20°–45° off build platform; reinforce standoff bases with fillets |
| **warp / cupping on keycap top dishing** | differential curing contraction between thick dish top and thin skirts | dsa keycap dishing top and side skirts | enforce uniform wall thickness across keycap shell (1.2–1.5 mm); optimize UV post-cure duration |
