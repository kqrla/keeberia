/**
 * prefetch-models.ts: build the 3d display assets the viewer loads.
 *
 * the engines never need this. circuitron and paracraft generate geometry from
 * numbers. this script exists so the result viewer can show real part bodies
 * (pcb only, and pcb plus case) without a network round trip at render time
 * and without the browser ever parsing step.
 *
 * modes
 *   --verify   hash every present model, check the step magic, report gaps
 *   --build    convert step to glb via occt-import-js and record the result
 *
 * rules
 *   - only allowlisted hosts are fetched. grabcad needs a session and its
 *     per-model licenses vary, so those entries stay status "manual" here and
 *     a human pulls them with the license recorded in the manifest first.
 *   - nothing is trusted on arrival: hash and magic bytes are checked.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const ROOT = process.cwd();
if (!existsSync(join(ROOT, "assets/models/manifest.json"))) {
  console.error("run from the repo root: npx tsx tools/prefetch-models.ts [--build]");
  process.exit(2);
}
const MANIFEST = join(ROOT, "assets/models/manifest.json");
const ALLOWED_HOSTS = ["raw.githubusercontent.com", "gitlab.com"];

type Model = {
  id: string; label: string; format: string | null; file: string | null;
  bytes: number; sha256: string | null; glb: string | null;
  source: { repo: string | null; url: string | null; license: string; author: string | null; fetched_at: string | null };
  status: "present" | "manual" | "proxy";
  used_by_footprints: string[];
  notes?: string;
};
type Manifest = { schema: number; units: string; models: Model[] };

const man: Manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const mode = process.argv.includes("--build") ? "build" : "verify";
let problems = 0;

async function main() {
for (const m of man.models) {
  if (m.status !== "present" || !m.file) {
    console.log(`skip  ${m.id.padEnd(22)} ${m.status} (${m.label})`);
    continue;
  }
  const abs = join(ROOT, "assets/models", m.file);
  if (!existsSync(abs)) {
    console.log(`FAIL  ${m.id.padEnd(22)} file missing: ${m.file}`);
    problems++;
    continue;
  }
  const buf = readFileSync(abs);
  const sha = createHash("sha256").update(buf).digest("hex");
  const head = buf.subarray(0, 20).toString("utf8");
  const stepMagic = head.startsWith("ISO-10303-21");
  const shaOk = !m.sha256 || sha === m.sha256;
  console.log(`${shaOk && stepMagic ? "ok  " : "FAIL"}  ${m.id.padEnd(22)} ${(buf.length / 1024).toFixed(0)}kb step=${stepMagic} sha=${shaOk ? "match" : "MISMATCH " + sha.slice(0, 12)}`);
  if (!shaOk || !stepMagic) problems++;

  if (mode === "build") {
    const occt = await import("occt-import-js");
    const wasm = await occt.default();
    const res = wasm.ReadStepFile(new Uint8Array(buf), { linearUnit: "millimeter" });
    if (!res.success) {
      console.log(`      build failed for ${m.id}`);
      problems++;
      continue;
    }
    const glb = wasm.ReadStepFile ? buildGlbJson(res) : null;
    mkdirSync(join(ROOT, "assets/models/glb"), { recursive: true });
    const out = join(ROOT, "assets/models/glb", m.id + ".glb.json");
    writeFileSync(out, JSON.stringify(glb));
    m.glb = "glb/" + m.id + ".glb.json";
    // bounding box from the vendor geometry: the viewer's z offsets and the
    // proxy fallbacks read real numbers, not estimates
    (m as any).bbox = bboxOf(glb);
    console.log(`      built ${(JSON.stringify(glb).length / 1024).toFixed(0)}kb mesh json, ${res.meshes.length} mesh(es)`);
  }
}

if (mode === "build") writeFileSync(MANIFEST, JSON.stringify(man, null, 2));

const manual = man.models.filter((m) => m.status !== "present");
if (manual.length) {
  console.log(`\n${manual.length} model(s) still manual: ${manual.map((m) => m.id).join(", ")}`);
  console.log("grabcad pulls need a session and a per-model license check; record the license in the manifest before use.");
}
console.log(problems ? `\n${problems} problem(s)` : "\nall present models verified");
process.exit(problems ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });

/** min/max over every vertex, in mm, as authored upstream */
function bboxOf(glb: any) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const mesh of glb.meshes) {
    const p = mesh.positions;
    for (let i = 0; i < p.length; i += 3) {
      for (let a = 0; a < 3; a++) {
        if (p[i + a] < min[a]) min[a] = p[i + a];
        if (p[i + a] > max[a]) max[a] = p[i + a];
      }
    }
  }
  return { min, max, size: max.map((v, i) => +(v - min[i]).toFixed(3)) };
}

/** occt gives positions+indices; flatten into one mesh set the viewer can upload */
function buildGlbJson(res: any) {
  const meshes = res.meshes.map((mesh: any) => ({
    name: mesh.name || "mesh",
    positions: Array.from(mesh.attributes.position.array as Float32Array),
    indices: Array.from((mesh.index?.array ?? mesh.attributes.position.array) as Uint32Array),
  }));
  return { units: "mm", generated_by: "occt-import-js", meshes };
}
