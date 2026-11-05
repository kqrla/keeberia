/**
 * scene3d test: the viewer scene must cover every placement, stay
 * deterministic, and only claim a model that is actually on disk.
 */
import { generatePcb } from "../src/index.ts";
import { buildScene3d, SceneModel } from "../src/scene3d.ts";
import { layouts } from "./layouts.ts";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const ROOT = process.cwd().endsWith("circuitron") ? "../.." : ".";
const man = JSON.parse(readFileSync(`${ROOT}/assets/models/manifest.json`, "utf8"));
const models: Record<string, SceneModel> = {};
for (const m of man.models) {
  if (m.status === "present" && m.glb && m.bbox) {
    models[m.id] = { id: m.id, glb: m.glb, bbox: m.bbox, license: m.source.license, source: m.source.url };
  }
}
let failed = 0;

for (const [name, layout] of layouts) {
  const { result } = generatePcb(layout);
  const ctx = { outline: result.outline } as any;
  // build a scene from the same ctx the engine used
  const scene = buildScene3d((result as any).__ctx ?? ctx, result, { models, case: {} });
  const refs = new Set(scene.components.map((c) => c.ref));
  const dupes = scene.components.length - refs.size;
  const placed = result.placements.length;
  const unbound = scene.components.filter((c) => c.proxy).map((c) => `${c.ref}(${c.lib})`);
  const badFiles = scene.components
    .filter((c) => c.model)
    .map((c) => c.model!.glb)
    .filter((g) => !existsSync(`${ROOT}/assets/models/${g}`));
  const hash = createHash("sha256").update(JSON.stringify(scene)).digest("hex").slice(0, 12);
  const again = createHash("sha256").update(JSON.stringify(buildScene3d((result as any).__ctx ?? ctx, result, { models, case: {} }))).digest("hex").slice(0, 12);
  const ok = dupes === 0 && scene.components.length === placed && badFiles.length === 0 && hash === again;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name.padEnd(14)} parts ${scene.components.length}/${placed} dupes ${dupes} scene ${hash} deterministic ${hash === again}`);
  if (unbound.length) console.log(`     proxies: ${unbound.join(", ")}`);
  if (badFiles.length) console.log(`     missing glb: ${badFiles.join(", ")}`);
  if (scene.case) console.log(`     case: plate ${scene.case.plateThicknessMm}mm at z ${scene.case.plateZ.base}..${scene.case.plateZ.top}, shell ${scene.case.shell.w}x${scene.case.shell.h}x${scene.case.shell.heightMm}`);
}
process.exit(failed ? 1 : 0);
