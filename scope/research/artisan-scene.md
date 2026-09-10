# artisan keycap and knob cover scene research

research report for keeberia cad expansion: artisan keycaps, knob covers, and custom bespoke keycap generation flows.

## 1. the artisan keycap scene today

### overview and market structure
artisan keycaps are handcrafted or micro-manufactured keycaps designed as functional art pieces for custom mechanical keyboards and macropads. placed primarily on the escape key, top row (r1/r4), or macropad accent keys, artisans serve as the visual centerpiece of a keyboard build.

primary community hubs:
- subreddits: [r/mechanicalkeyboards](https://www.reddit.com/r/MechanicalKeyboards/), [r/artisankeycaps](https://www.reddit.com/r/artisankeycaps/), [r/mechmarket](https://www.reddit.com/r/mechmarket/)
- forums: [geekhack artisan subforum](https://geekhack.org/index.php?board=160.0)
- cataloging and tracking: [keycap archivist](https://keycap-archivist.com/) logs thousands of artisan sculpts and colorways; [artisan collector](https://artisancollector.com/guides/collecting-artisans-retail/) provides collector guides and market surveys.

### famous makers and studios
- **jelly key** ([jellykey.com](https://www.jellykey.com/)): vietnamese studio world-famous for complex multi-layer resin landscapes, fantasy worlds (eden, retro TV, jolly steeds), and group buy fulfillment models.
- **dwarf factory** ([dwarf-factory.com](https://dwarf-factory.com/)): known for intricate miniature figures encased in clear resin (mcwhale, foodie, gnarly shield, terrarium series).
- **artkey universe** ([artkeyuniverse.com](https://artkeyuniverse.com/)): high-end multi-shot resin character sculpts (felix, sirius, bull v2, porcus), renowned for high detail and secondary market demand.
- **latrialum** ([instagram.com/latrialum](https://www.instagram.com/latrialum/)): famous for resin multi-shot blanks with metallic flake, thermal paste textures, and liquid-like inclusions ([keycap-archivist.com/maker/latrialum](https://keycap-archivist.com/maker/latrialum/)).
- **keyforge** ([keyforge.com](https://www.keyforge.com/)): iconic studio known for dark fantasy sculpts (orochi, shishi, mulder).
- **rubrehose** / **hello caps** / **archetype** ([keycap-archivist.com/maker/archetype](https://keycap-archivist.com/maker/archetype/)): top character/mascot sculpt creators (bbw, schrodinger, kolkrabba, pepe).
- **sandun keycaps** / **s-craft**: sandun ([reddit.com/r/mechmarket](https://www.reddit.com/r/mechmarket/)) produces anime and stylized character sculpts; s-craft is famous for officially licensed pokemon multi-shot resin caps.
- **indie/etsy trends & "capsule" / "hukkka" styles**: on platforms like etsy ([etsy.com](https://www.etsy.com/)) and independent storefronts (e.g. finalkey capsule duck [finalkeystudio.com](https://finalkeystudio.com/products/capsule-duck-artisan-keycaps)), capsule-style keycaps (miniature figures inside clear gashapon-style resin domes) and 3d-printed figure displays represent popular entry-level artisan offerings.

### price ranges
- **retail / drop price**: $30 to $100 for standard single resin or 3d-printed sculpts; $100 to $200+ for metal cnc collabs (e.g., salvun, rama works, hibi) or multi-character complex casts ([keebsforall.com](https://keebsforall.com/blogs/mechanical-keyboards-101/join-artisan-keycap-group-buys)).
- **secondary market (mechmarket)**: rare colorways or retired sculpts (e.g., gaf, early artkey, rare latrialum blanks) range from $150 to $500+, with legendary 1-of-1 caps occasionally reaching $1,000+.

### drop and commission mechanics
- **raffles**: the dominant distribution model for artisan resin casters due to limited production capacity (e.g., 10-50 caps per colorway). google form or custom web form opens for 12-24 hours. participants select desired sculpts/colorways. winners are selected via random number generator (rng) and sent a paypal/stripe invoice due within 24 hours. unpaid invoices are re-raffled.
- **instock / flash sales**: first-come, first-served (fcfs) web store drops for larger studios (dwarf factory, drop collabs) or overflow inventory.
- **group buys (gb) / made-to-order**: open ordering window (7-14 days) where any quantity ordered is manufactured and fulfilled within 2 to 6 months (jelly key model).
- **commissions**: one-off or micro-run bespoke pieces requested directly from makers via discord or instagram, charging $150-$300+ depending on sculpt complexity and mold requirements.

---

## 2. materials and processes

### resin casting
- **multi-shot pressure casting**: the gold standard for handmade artisan keycaps. liquid epoxy or polyurethane resin is poured into precision silicone molds. multiple "shots" (pours) of colored resin create intricate multi-color layers without surface paint.
- **silicone molds & master systems**: master keycap sculpts are created in polymer clay or high-resolution 3d prints. open-source mold systems like zbutt ([youtube.com](https://www.youtube.com/watch?v=xwz0iblF4Xg)) and l2k ([reddit.com/r/MechanicalKeyboards](https://www.reddit.com/r/MechanicalKeyboards/comments/9181vo/its_time_to_adapt_l2ks_the_8_mold_system_that/)) use modular master bases and silicone enclosures to yield aligned mx stem cavities.
- **degassing & pressure pots**: liquid resin and silicone are vacuum degassed to remove dissolved air, then cured inside a pressure pot at 30-50 psi ([mihi-mini.studio](https://mihi-mini.studio/how-its-made/how-to-make-resin-artisan-keycaps-part-3-making-a-keycap-mold/)). pressure collapses microscopic air bubbles until the resin cures completely clear and solid.

### clay / sculpt
- hand-sculpted masters created using polymer clay (sculpey, fimo) built on top of a 1u blank keycap stem base. once baked and polished, the master is used to cast silicone production molds.

### 3d printed keycaps
- **sla / dlp resin printing**: uses uv lcd/laser resin printers (8k-14k resolution) for surface details (25-50 micron layer height).
- **resin materials & stem durability**: standard photopolymer resins are brittle and snap at the mx stem under switch insertion force. modern makers use tough/abs-like resins or mix flex resins like siraya tech tenacious ([siraya.tech](https://siraya.tech/collections/tenacious-resin)) with standard resin (e.g. 80% fast / 20% tenacious) to provide impact resistance and stem elasticity. ceramic-filled resins (formlabs rigid 10k) provide a ceramic/stone-like feel and thermal stability.
- **post-processing & finishing**: sla prints require solvent bath washing (ipa), post-curing in a 405nm uv chamber, sanding, detail painting, and clear lacquer top-coating (acrylic/enamel) to protect against skin oils.
- **fdm printing**: filament printing (pla/petg) is unsuitable for standard mx keycap stems due to anisotropic layer line weakness, but can be used for large novelty caps or knob covers.
- **sls / binder jetting (nylon & metal)**: selective laser sintering (sls) nylon pa12 produces durable keycaps with a matte feel. metal 3d printing (binder jetting / dmls stainless steel or titanium) enables solid metal artisan caps with zero tooling costs.

### keycap printing & decoration techniques
- **dye-sublimation (dye-sub)**: heat transfer of dye into porous pbt plastic at high temperature. dye sinks beneath the surface, making legends immune to fading. cannot print light legends on dark caps.
- **double-shot injection molding**: two separate plastic injection steps (abs or pbt). legend is molded first in one color, then the keycap shell is molded around it in a second color. infinite lifespan, sharpest crispness.
- **pad printing**: wet ink transferred via a silicone pad onto the cap surface, usually coated with uv clear topcoat. budget-friendly, but wears off over prolonged typing.
- **cnc metal machining**: solid billet aluminum (6061), brass, or copper cnc machined by specialists like salvun, rama works, and hibi, then anodized, enamel-filled, or pvd coated.

---

## 3. keycap geometry and parametric openscad requirements

### common keycap profiles
- **cherry**: community standard ergonomic profile. sculpted rows, moderate height (~9.4mm max), angled tops.
- **oem**: default pre-built keyboard profile. similar shape to cherry, but taller (~11.9mm max).
- **sa**: spherical all-row profile by signature plastics. tall (~16.5mm), vintage terminal look, deep spherical dish tops.
- **dsa**: uniform profile (all rows identical height ~7.4mm), flat top orientation with spherical dish. popular for ortholinear and custom macropads.
- **mt3**: drop / matt3o profile. high profile with steep ergonomic angles and deep spherical dish that cradles fingertips.
- **kat / kam**: keyreative profile. kat is sculpted high profile; kam is uniform kat height. smooth spherical dish.
- **xda**: uniform profile (~9.3mm height), larger top surface area, subtle spherical dish.
- **choc / low profile**: designed for kailh choc switches (mbk, ldsa, chicago steno / cfx). ultra-low profile (~3.5-5mm total height).

### row structure and angles
sculpted profiles vary in height and slant across rows: r1 (function / number row, highest back tilt), r2 (qwerty row), r3 (asdfg row, neutral/home row), r4 (zxcvb / bottom row, forward tilt). row numbering conventions must be explicitly defined in parametric models.

### stem standards and compatibility
- **cherry mx stem**: standard cross (+ shape). switch male stem cross dimensions are 4.0-4.1mm x 4.0-4.1mm with ~1.17mm-1.2mm arm thickness ([deskthority.net](https://deskthority.net/viewtopic.php?t=11183)). female keycap stem cross slot requires ~4.12-4.15mm width and ~1.25mm slot width for proper interference fit without cracking the stem post. outer stem post diameter is typically 5.5mm - 6.0mm.
- **kailh choc v1 stem**: two rectangular prongs spaced 5.7mm center-to-center. each prong is 1.2mm thick x 3.0mm wide. switch pitch is 18mm x 18mm (choc spacing) vs 19.05mm x 19.05mm (mx spacing) ([pandakb.com](https://pandakb.com/guides/mx-spacing-vs-choc-spacing-what-they-are-how-to-differentiate-choose-for-diy-keyboards/)).
- **kailh choc v2 stem**: standard mx cross stem placed on a low-profile switch body, allowing hybrid cap designs.

### keycap size families and stabilizer spacing
- standard unit pitch $1u = 19.05\text{ mm}$ ($0.75\text{ inches}$).
- keycap outer envelope includes clearance (~1.0mm gap), so a 1u cap measures ~18.05mm x 18.05mm at the base.
- common sizes: 1u (18.05mm), 1.25u (~22.8mm), 1.5u (~27.5mm), 1.75u (~32.3mm), 2u (~37.1mm), 2.25u (~41.8mm), 2.75u (~51.3mm), spacebars (6.25u = 118.1mm, 7u = 132.3mm).
- stabilizer post spacing (cherry pcb-mount stabs): 2u cap stabs placed 23.8mm apart; 6.25u spacebar stabs placed 100mm apart; 7u spacebar stabs placed 114.3mm apart.

### parametric openscad keycap generator requirements
referenced open-source parametric implementations: keyv2 ([github.com/rsheldiii/Keyv2](https://github.com/rsheldiii/Keyv2)) and keycap_playground ([github.com/riskable/keycap_playground](https://github.com/riskable/keycap_playground)).

required openscad parameters:
1. `width_u`, `length_u` (unit size multiplier in u).
2. `wall_thickness` (1.5mm - 2.0mm standard; 2.2mm-2.5mm for thocky/heavy caps).
3. `total_height`, `front_height`, `back_height` (defines profile tilt angle and row sculpting).
4. `side_draft_angle` (7 to 10 degrees inward slope from base to top surface).
5. `top_dish_type` (`spherical`, `cylindrical`, `flat`, or `mesh_relief`).
6. `dish_depth`, `dish_radius` (defines fingertip cradle curvature).
7. `stem_type` (`cherry_mx`, `choc_v1`, `choc_v2`).
8. `stem_slop` / `stem_tolerance` (0.00mm to 0.15mm adjustment for 3d printer shrinkage/expansion).
9. `stem_inset` / `stem_post_height` (distance stem extends below or inside the cap base).
10. `artisan_relief_mesh` (`import("relief.stl")` or procedural heightmap displacement boolean union on top surface).

---

## 4. knob covers (rotary encoders)

### rotary encoder standards
- standard keyboard rotary encoder: **ec11** / **ec12** series (e.g. alps / bourns ec11e).
- shaft geometry: 6mm diameter shaft with a flattened d-cut (d-shaft). d-flat depth is 4.5mm (1.5mm flat cut out of 6mm circle).
- shaft length: 15mm to 20mm total height (7mm to 12mm exposed above pcb/plate).

### knob cover dimensions
- outer diameter (od): 12mm (narrow), 16mm-18mm (standard macropad size matching 1u footprint), 20mm-25mm (oversized dial).
- overall height: 10mm to 15mm.
- inner d-shaft cavity: 6.1mm diameter with 4.6mm d-flat (0.1mm tolerance for friction fit) or 6.2mm cylindrical bore for set-screw attachment ([etsy.com](https://www.etsy.com/market/artisan_rotary_encoder_knob)).
- bottom skirt clearance: 1.5mm gap above top plate/case wall to prevent rubbing during rotation and push-button actuation.

### materials and construction
- **resin cast**: clear epoxy or polyurethane resin with suspended glitter, metallic powders, or miniature embedded objects (e.g. potion bottles, cauldrons).
- **3d printed resin / fdm**: sla resin printed novelty knob tops (gears, skulls, crystals) with integrated d-shaft socket.
- **cnc metal**: anodized aluminum or solid brass with knurled sides, indicator dot/line, and brass m3 set-screw (e.g. rama works, hibi, salvun, drop).

### makers and suppliers
- keyboard artisans: rama works, hibi, salvun, keyhive, custom etsy creators.
- audio/synth suppliers: thonk, love my switches, chroma caps (dj/synth knobs adapted for ec11 6mm d-shafts).

---

## 5. bespoke artisan keycap product flows for keeberia

### commission briefs and colorway matching
structured input in keeberia editor for custom artisan requests:
- **base parameters**: profile (cherry r1, sa r1, dsa, ec11 knob), switch stem (mx / choc), unit size (1u, 1.25u, 2u).
- **color palette**: hex codes or matching set preset (e.g. gmk olivia `#f1d4cf` / `#363435`, gmk botanical `#6d835e` / `#e2e2d8`).
- **theme & art prompt**: text prompt, uploaded svg logo, or 3d heightmap depthmap image (e.g., "cyberpunk skull", "mountain landscape", "topo contour lines").

### generative cad pipeline in keeberia
- keeberia's openscad engine compiles a **deterministic base shell** guaranteed to fit the target board layout, switch clearance, and row height.
- ai / procedural generation step translates the user's prompt or svg into a **3d relief mesh** (heightmap / displacement map / stl) merged seamlessly with the top dish of the openscad base keycap shell.
- openscad outputs water-tight `.scad`, `.3mf`, and `.stl` files ready for local resin 3d printing.

### keeberia dual product model
1. **self-serve / printable custom caps**: instant in-browser 3d preview and generation of stl/3mf files for users with sla 3d printers, allowing zero-cost instant custom caps matching their macropad.
2. **marketplace & commission bridge**: connects macropad buyers with human artisan resin casters and metal cnc shops. keeberia automatically exports standardized cad spec sheets (exact switch clearance, stem depth, row angle, hex colors) so physical artisan makers can create 100% fit-tested hand-cast resin keycaps without fitment errors.
