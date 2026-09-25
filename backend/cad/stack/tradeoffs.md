# the openscad tradeoffs

> thesis: we chose openscad because it fits our fabrication use case — a standalone executable with a small standalone language, generating printable geometry deterministically. the honest cost: no step files. the honest verdict: worth it.

openscad sits on cgal and manifold — mesh-first csg kernels. it takes primitives and booleans and emits watertight meshes (stl, 3mf, off). that's exactly what fabrication on a 3d printer wants, exactly what the makerlab customizer bridge speaks, and exactly what openscad-wasm can run in the browser for the live preview. the language is small, declarative, and safe to generate code into — the cad universe runs as deterministic codegen, same traceparency argument as the copper path: the engine writes openscad the way it writes gerbers, and the same input always gives the same output.

cadquery (or any occt/opencascade b-rep stack) would give us step files — the exchange format of professional cad and a hard requirement for cnc machining services and mechanical interop. but b-rep means python at runtime, and sandboxing python is a whole different beast: dependency management, cold starts, a security surface we'd have to own. openscad is a single standalone binary — verified working headless in our sandbox as an appimage, portable to render/amd workers, wasm-able for the browser. or simply put: cadquery's output is richer, but its runtime is a liability; openscad's runtime is a feature.

what we lose, concretely:

- **no step export** — ever, from openscad itself. meshes only. any future cnc-machined case (metal, machined acetal) needs a step conversion step downstream (stl→step converters exist but mesh→b-rep is lossy and ugly; freecad headless is the other bridge, and it drags the same python beast with it)
- **mesh-first means no parametric feature tree** — downstream cad tools can't edit our geometry as features; they get a mesh to work around
- **curve fidelity is visual, not exact** — sphere dishes and fillets are tessellated ($fn is a slider, not a promise)

when to revisit: the moment a keeberia user needs a cnc-machined case, step becomes a real requirement and the tradeoff gets re-argued (options then: a step-emitting cad service bolted onto the same records, accepting mesh-to-step conversion loss, or a freecad headless export lane). until then: printing is the fabrication lane, stl/3mf is its language, and openscad is the right engine for it.

## the kernels, for the record

- **cgal** — the legacy openscad kernel: exact arithmetic, slow, bulletproof for tricky booleans
- **manifold** — the modern one: much faster, numerically robust for the operations our cases and caps actually do (hulls, differences, unions)

we don't pick a kernel in code — openscad does (manifold by default in current builds) — but the record stays because "why does this render so fast" and "why did this boolean fail" both answer from here.
