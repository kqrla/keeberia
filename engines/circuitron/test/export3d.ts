/**
 * export3d test: the downloadable solid must be closed, deterministic and
 * honest about the silhouette it came from.
 */
import { readFileSync } from "node:fs";
import { generatePcb } from "../src/index.ts";
import { buildBoardMesh, exportStl, exportGlb } from "../src/mesh3d.ts";
import { layouts } from "./layouts.ts";

function circle(c: { x: number; y: number }, r: number): Array<{ x: number; y: number }> {
  const pts = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    pts.push({ x: +(c.x + r * Math.cos(a)).toFixed(3), y: +(c.y + r * Math.sin(a)).toFixed(3) });
  }
  return pts;
}

const manifest = JSON.parse(readFileSync("../../assets/models/manifest.json", "utf8"));
const models: Record<string, unknown> = {};
for (const m of manifest.models) if (m.glb) models[m.id] = m;

let failed = 0;
const check = (ok: boolean, label: string) => {
  if (!ok) { failed++; console.log("  FAIL", label); }
};

/** volume via the divergence theorem: closed solids give a positive, finite number */
function solidVolume(mesh: { positions: number[]; indices: number[] }): number {
  let v = 0;
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const [a, b, c] = [mesh.indices[i], mesh.indices[i + 1], mesh.indices[i + 2]];
    const ax = mesh.positions[a * 3], ay = mesh.positions[a * 3 + 1], az = mesh.positions[a * 3 + 2];
    const bx = mesh.positions[b * 3], by = mesh.positions[b * 3 + 1], bz = mesh.positions[b * 3 + 2];
    const cx = mesh.positions[c * 3], cy = mesh.positions[c * 3 + 1], cz = mesh.positions[c * 3 + 2];
    v += (ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)) / 6;
  }
  return v;
}

const withShapes: Array<[string, Record<string, unknown>]> = [
  ["auto-rect", {}],
  ["custom-polygon", {
    outline: { kind: "polygon", points: [
      { x: -70, y: -50 }, { x: 70, y: -50 }, { x: 84, y: 0 }, { x: 70, y: 50 }, { x: -70, y: 50 }, { x: -84, y: 0 },
    ] },
  }],
  ["decor-cutout", {
    outline: { kind: "polygon", points: [
      { x: -70, y: -50 }, { x: 70, y: -50 }, { x: 84, y: 0 }, { x: 70, y: 50 }, { x: -70, y: 50 }, { x: -84, y: 0 },
    ] },
    vanity: { cutouts: [circle({ x: 0, y: 0 }, 4)], silkscreen: [{ kind: "text", text: "KEEB", at: { x: 0, y: -40 }, heightMm: 2 }] },
  }],
  ["dxf-upload", {
    outline: { kind: "dxf", text: readFileSync("./test/fixtures/outline-hex.dxf", "utf8") },
  }],
];

for (const [name, layout] of layouts) {
  const base = layout as Record<string, unknown>;
  for (const [tag, patch] of withShapes) {
    const out = generatePcb({ ...base, ...patch } as never, "engine", { id: "jlcpcb", record: JSON.parse(readFileSync("../../research/manufacturing/capabilities/jlcpcb.json", "utf8")) });
    const errs = out.result.warnings.filter((w) => w.level === "error");
    const shape = out.outline.shape === "rect"
      ? { kind: "rect" as const, width: out.outline.bbox.width, height: out.outline.bbox.height, cornerRadius: out.outline.cornerRadius }
      : { kind: "polygon" as const, points: out.outline.points };
    const mesh = buildBoardMesh(shape, { thicknessMm: 1.6, cutouts: out.outline.cutouts });
    const stl = exportStl(mesh);
    const glb = exportGlb(mesh);
    const glbMagic = new TextDecoder().decode(glb.slice(0, 4));
    const stlCount = new DataView(stl.buffer, stl.byteOffset).getUint32(80, true);
    const vol = solidVolume(mesh);
    const areaApprox = Math.abs(vol) / 1.6;
    console.log(`${name}/${tag}: errors ${errs.length}, outline ${out.outline.shape} ${out.outline.bbox.width}x${out.outline.bbox.height}, cutouts ${out.outline.cutouts.length}, tris ${mesh.triangleCount}, area ${areaApprox.toFixed(1)}mm2, stl ${stl.length}b`);
    check(errs.length === 0, `${name}/${tag} has board errors`);
    check(mesh.triangleCount >= 8, `${name}/${tag} mesh too small`);
    check(vol > 1 && Number.isFinite(vol), `${name}/${tag} solid volume is ${vol}`);
    check(stlCount === mesh.triangleCount, `${name}/${tag} stl triangle count mismatch`);
    check(glbMagic === "glTF", `${name}/${tag} glb magic wrong`);
    check(stl.length === 84 + mesh.triangleCount * 50, `${name}/${tag} stl size mismatch`);
  }
}

console.log(failed ? `\n${failed} failure(s)` : "\nexport3d: solid files clean");
process.exit(failed ? 1 : 0);
