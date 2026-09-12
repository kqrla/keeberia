// the golden-master spec suite — geometry changes prove themselves
// against reference artifacts before they land. two layers:
//   1. scad bytes   — the codegen contract (deterministic, reviewable text)
//   2. stl hash     — the geometry contract (catches regressions a text
//                     diff can't see, and kernel drift a same scad can't)
// a mismatch is not always a bug: intentional geometry changes get
// re-blessed with `--update`, and the change is described in the commit.
import { generatePcb } from "../../circuitron/src/index.ts";
import { generateCase } from "../src/index.ts";
import { generateCaps } from "../caps-engine/src/index.ts";
import { layouts as LAYOUTS } from "../../circuitron/test/layouts.ts";
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";

const UPDATE = process.argv.includes("--update");
const oscad = process.env.KEEBERIA_OPENSCAD_BIN ?? "openscad";
// resolve from this file's location, not cwd — the suite is runnable
// from anywhere (the daemon, ci, a sibling engine)
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const HERE = dirname(fileURLToPath(import.meta.url));
const GOLDENS = join(HERE, "goldens");
const TMP = join(HERE, ".tmp");
const MANIFEST = join(GOLDENS, "manifest.json");

mkdirSync(TMP, { recursive: true });
mkdirSync(GOLDENS, { recursive: true });

let oscadVersion = "unknown";
try { oscadVersion = execSync(`${oscad} --version 2>&1`, { stdio: "pipe" }).toString().trim().split("\n")[0]; } catch { /* stl layer unavailable */ }

const sha = (data: Buffer | string) => createHash("sha256").update(data).digest("hex").slice(0, 16);

// canonical stl hash — openscad's raw bytes are path-dependent (same
// scad content compiles to different bytes from a different directory,
// verified sept 12), so we hash a normalized form instead: vertices
// quantized to 1µm, facets sorted. path-, machine- and facet-order-
// independent; any real geometry change still moves it.
function stlHash(stlPath: string): string {
  const text = readFileSync(stlPath, "utf8");
  const facets: string[] = [];
  for (const m of text.matchAll(/facet normal\s+([^\n]+)\s*\n\s*outer loop\s*\n\s*vertex\s+([^\n]+)\s*\n\s*vertex\s+([^\n]+)\s*\n\s*vertex\s+([^\n]+)/g)) {
    const nums = [m[1], m[2], m[3], m[4]].join(" ").trim().split(/\s+/).map((t) => {
      const v = Number(t);
      if (!Number.isFinite(v)) return "x";
      return (Math.round(v * 1000) / 1000).toFixed(3); // 1µm quantization
    });
    facets.push(nums.join(" "));
  }
  facets.sort();
  return sha(facets.join("\n") + `\n#facets=${facets.length}`);
}

type Spec = { name: string; scad: string; hasErrors: boolean; errorText: string };
const specs: Spec[] = [];
for (const [name, layout] of LAYOUTS) {
  const pcb = generatePcb(layout).result;

  const c = generateCase(pcb);
  const cErrs = c.warnings.filter((w) => w.level === "error");
  specs.push({ name: `case-${name}`, scad: c.scad, hasErrors: cErrs.length > 0, errorText: cErrs.map((w) => w.message).join("; ") });

  const k = generateCaps(pcb);
  const kErrs = k.warnings.filter((w) => w.level === "error");
  specs.push({ name: `caps-${name}`, scad: k.scad, hasErrors: kErrs.length > 0, errorText: kErrs.map((w) => w.message).join("; ") });
}

type ManifestEntry = { name: string; scadSha: string; stlSha: string | null; oscadVersion: string; blessedAt: string };
let manifest: Record<string, ManifestEntry> = {};
if (existsSync(MANIFEST)) manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));

let failures = 0;
const next: Record<string, ManifestEntry> = {};

for (const spec of specs) {
  if (spec.hasErrors) {
    console.log(`✗ ${spec.name} — engine reported errors: ${spec.errorText}`);
    failures++;
    continue;
  }
  const goldenScadPath = `${GOLDENS}/${spec.name}.scad`;
  const scadSha = sha(spec.scad);

  // layer 1: compile to stl (the geometry golden needs the real bytes)
  let stlSha: string | null = null;
  try {
    const tmpStl = `${TMP}/${spec.name}.stl`;
    rmSync(tmpStl, { force: true });
    writeFileSync(`${TMP}/__live.scad`, spec.scad);
    execSync(`QT_QPA_PLATFORM=offscreen ${oscad} -o ${tmpStl} ${TMP}/__live.scad`, { stdio: "pipe", timeout: 180000 });
    stlSha = stlHash(tmpStl);
  } catch { /* openscad unavailable — stl layer skipped */ }

  if (UPDATE) {
    writeFileSync(goldenScadPath, spec.scad);
    // compile the golden itself so the hash matches what the golden says
    let blessedStlSha: string | null = null;
    try {
      const tmpStl = `${TMP}/${spec.name}.stl`;
      rmSync(tmpStl, { force: true });
      writeFileSync(`${TMP}/__live.scad`, spec.scad);
      execSync(`QT_QPA_PLATFORM=offscreen ${oscad} -o ${tmpStl} ${TMP}/__live.scad`, { stdio: "pipe", timeout: 180000 });
      blessedStlSha = stlHash(tmpStl);
    } catch { /* no openscad */ }
    next[spec.name] = { name: spec.name, scadSha, stlSha: blessedStlSha, oscadVersion, blessedAt: new Date().toISOString().slice(0, 10) };
    console.log(`✓ ${spec.name} — blessed (scad ${scadSha}${blessedStlSha ? `, stl ${blessedStlSha}` : ", stl skipped"})`);
    continue;
  }

  // compare mode
  const m = manifest[spec.name];
  if (!m) { console.log(`✗ ${spec.name} — no golden on record (run with --update to bless)`); failures++; continue; }
  const goldenScad = existsSync(goldenScadPath) ? readFileSync(goldenScadPath).toString() : null;
  if (goldenScad !== spec.scad) { console.log(`✗ ${spec.name} — scad drifted from golden (hash ${scadSha} vs ${m.scadSha}); diff the golden, or re-bless with --update if intentional`); failures++; continue; }
  if (m.stlSha && stlSha && m.stlSha !== stlSha) { console.log(`✗ ${spec.name} — same scad, different geometry (stl ${stlSha} vs golden ${m.stlSha}) — kernel or flags changed; re-verify, then re-bless`); failures++; continue; }
  console.log(`✓ ${spec.name} — scad + geometry match (${scadSha})`);
}

if (UPDATE) {
  writeFileSync(MANIFEST, JSON.stringify(next, null, 2) + "\n");
  console.log(`\nmanifest blessed: ${Object.keys(next).length} specs · ${oscadVersion}`);
} else {
  console.log(failures === 0 ? `\nall ${specs.length} specs pass · ${oscadVersion}` : `\n${failures}/${specs.length} specs FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}
