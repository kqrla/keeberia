/**
 * step test: our own faceted_brep must be readable by a real cad kernel.
 * occt-import-js (wasm) reads the file back and checks the bounding box
 * against the board. skipped when that dev dependency is absent.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { generatePcb } from "../src/index.ts";
import { exportStep } from "../src/step.ts";
import { layouts } from "./layouts.ts";

const cases: Array<[string, Record<string, unknown>]> = [
  ["auto-rect", {}],
  ["custom-polygon", { outline: { kind: "polygon", points: [
    { x: -70, y: -50 }, { x: 70, y: -50 }, { x: 84, y: 0 }, { x: 70, y: 50 }, { x: -70, y: 50 }, { x: -84, y: 0 },
  ] } }],
  ["decor-cutout", {
    outline: { kind: "polygon", points: [
      { x: -70, y: -50 }, { x: 70, y: -50 }, { x: 84, y: 0 }, { x: 70, y: 50 }, { x: -70, y: 50 }, { x: -84, y: 0 },
    ] },
    vanity: { cutouts: [[{ x: -3, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 6 }, { x: -3, y: 6 }]] },
  }],
];

async function main() {
  mkdirSync("out/step", { recursive: true });
  let oc: { ReadStepFile: (b: Uint8Array, p: unknown) => { success: boolean; meshes: Array<{ attributes: { position: { array: number[] } } }> } } | null = null;
  try {
    const mod = await import("occt-import-js");
    oc = await (mod as { default: () => Promise<typeof oc> }).default();
  } catch {
    console.log("occt-import-js not installed: structural checks only (round trip SKIPPED)");
  }

  let failed = 0;
  const [[layoutName]] = layouts;
  for (const [tag, patch] of cases) {
    const base = layouts.find(([n]) => n === layoutName)![1] as Record<string, unknown>;
    const out = generatePcb({ ...base, ...patch } as never);
    const step = exportStep(
      out.outline.shape === "rect"
        ? { kind: "rect", width: out.outline.bbox.width, height: out.outline.bbox.height, cornerRadius: out.outline.cornerRadius }
        : { kind: "polygon", points: out.outline.points },
      { thicknessMm: 1.6, cutouts: out.outline.cutouts, name: `hackpad-${tag}` },
    );
    const structural =
      step.startsWith("ISO-10303-21;") &&
      step.includes("MANIFOLD_SOLID_BREP") &&
      step.includes("CLOSED_SHELL") &&
      step.trimEnd().endsWith("END-ISO-10303-21;") &&
      /#\d+=/g.test(step);
    writeFileSync(`out/step/${tag}.step`, step);
    let round = "skipped";
    if (oc) {
      const res = oc.ReadStepFile(new Uint8Array(Buffer.from(step)), null);
      const p = res.meshes[0]?.attributes.position.array ?? [];
      // true extent: min to max, not twice the largest absolute coordinate
      const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < p.length; i += 3) for (let a = 0; a < 3; a++) { min[a] = Math.min(min[a], p[i + a]); max[a] = Math.max(max[a], p[i + a]); }
      const w = max[0] - min[0], h = max[1] - min[1], th = max[2] - min[2];
      const within = Math.abs(w - out.outline.bbox.width) < 1.0 && Math.abs(h - out.outline.bbox.height) < 1.0 && Math.abs(th - 1.6) < 0.2;
      round = res.success && res.meshes.length > 0 && within ? "ok" : `bad (w${w.toFixed(1)} h${h.toFixed(1)} t${th.toFixed(2)})`;
    }
    console.log(`${tag}: ${step.length}b, structural ${structural ? "ok" : "FAIL"}, occt ${round}`);
    if (!structural) failed++;
    if (round !== "skipped" && round !== "ok") failed++;
  }
  console.log(failed ? `\n${failed} failure(s)` : "\nstep: planar brep written and read back by a real kernel");
  process.exit(failed ? 1 : 0);
}

main();
