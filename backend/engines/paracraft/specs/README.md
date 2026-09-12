# the paracraft spec suite

> thesis: geometry changes prove themselves. every reference board's case and caps exist here as golden artifacts, and any change to the engines must either match them or consciously re-bless them.

a golden is two layers:

- **scad bytes** — the codegen contract. deterministic text, reviewable in a diff. drift here means the engine's output changed at all
- **stl hash** — the geometry contract. identical scad but a different stl means the kernel or compile flags moved under us (openscad version drift is real; the manifest records which version blessed each golden)

## running

- `npx tsx specs/run.ts` — compare mode, exits 1 on any mismatch
- `npx tsx specs/run.ts --update` — bless mode, rewrites goldens + manifest

a mismatch is not always a bug — intentional geometry changes (the choc wall-height derivation, sept 12) re-bless with `--update`, and the change is described in the blessing commit's message. what this catches is the *unintentional* kind: a record tweak that silently moved a plate, a refactor that changed emit order, a kernel upgrade that tessellates differently.

spec naming: `case-<board>` / `caps-<board>` for every board in circuitron's reference layouts.

## the stl layer, honestly

openscad's raw stl bytes are **path-dependent** — the same scad content compiles to byte-different stls from different directories (found sept 12, the hard way: the suite's own path fix invalidated its first blessing). so the geometry golden is not a byte hash: it's a **canonical hash** — vertices quantized to 1µm, facets sorted, then hashed. path- and machine-independent, immune to facet-order noise, and still catches any real geometry change above a micron. the scad-byte layer remains exact.
