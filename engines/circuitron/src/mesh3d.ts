/**
 * mesh3d.ts: the board as a solid you can download.
 *
 * same inputs as everything else (silhouette + cutouts + thickness), zero
 * dependencies, deterministic vertex order so identical boards produce
 * identical bytes. two formats out:
 *
 *   stl  binary, millimetres, the format every slicer and machinist expects
 *   glb  glTF 2.0 binary, metres per spec, single mesh, for the web viewer
 *
 * only the board goes into these files. component bodies are display assets
 * (assets/models) and stay out of the solid so print/machining work gets the
 * board and nothing else.
 */
import { Pt } from "./types.ts";
import { OutlineShape, shapePolygon } from "./outline.ts";

export interface MeshOptions {
  thicknessMm: number;
  cutouts?: Pt[][];
  /** segments per rounded rect corner when the silhouette is the default rect */
  cornerSegments?: number;
}

export interface Mesh {
  positions: number[];   // flat xyz, mm
  normals: number[];     // flat xyz
  indices: number[];     // triangle indices
  triangleCount: number;
}

type P2 = { x: number; y: number };

/** rect shape with rounded corners becomes a polygon so every solid path is one code path */
export function solidLoop(shape: OutlineShape, cornerSegments = 12): Pt[] {
  if (shape.kind === "polygon") return shape.points.map((p) => ({ x: p.x, y: p.y }));
  const w = shape.width / 2, h = shape.height / 2, r = Math.max(0, Math.min(shape.cornerRadius, Math.min(w, h)));
  if (r <= 0.001) {
    return [{ x: -w, y: -h }, { x: w, y: -h }, { x: w, y: h }, { x: -w, y: h }];
  }
  const pts: Pt[] = [];
  const corner = (cx: number, cy: number, a0: number) => {
    for (let i = 0; i <= cornerSegments; i++) {
      const a = a0 + (Math.PI / 2) * (i / cornerSegments);
      pts.push({ x: +(cx + r * Math.cos(a)).toFixed(5), y: +(cy + r * Math.sin(a)).toFixed(5) });
    }
  };
  // y-down board coords, same order as the gerber edge loop
  corner(w - r, -h + r, -Math.PI / 2);
  corner(w - r, h - r, 0);
  corner(-(w - r), h - r, Math.PI / 2);
  corner(-(w - r), -h + r, Math.PI);
  return pts;
}

function signedArea(pts: P2[]): number {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j].x + pts[i].x) * (pts[j].y - pts[i].y);
  return a / 2;
}

function ensureWinding(pts: P2[], ccw: boolean): P2[] {
  const isCcw = signedArea(pts) < 0; // y-down: negative area means ccw in math terms
  return isCcw === ccw ? pts : pts.slice().reverse();
}

function pointInTri(p: P2, a: P2, b: P2, c: P2): boolean {
  // strictly inside: points exactly on an edge (bridges duplicate vertices) do not block an ear
  const d1 = (p.x - b.x) * (a.y - b.y) - (a.x - b.x) * (p.y - b.y);
  const d2 = (p.x - c.x) * (b.y - c.y) - (b.x - c.x) * (p.y - c.y);
  const d3 = (p.x - a.x) * (c.y - a.y) - (c.x - a.x) * (p.y - a.y);
  const eps = 1e-9;
  return d1 > eps && d2 > eps && d3 > eps; // all positive = inside for CCW triangles
}

/**
 * ear clipping that does not care which way the loop was wound.
 * board coords are y-down, so the clip runs in a y-up mirror and the triangle
 * order is flipped back on the way out.
 */
function earClipYDown(loop: P2[]): number[][] {
  const up = loop.map((p) => ({ x: p.x, y: -p.y }));
  const ccw = signedAreaUp(up) > 0;
  const order = ccw ? up.map((_, i) => i) : up.map((_, i) => up.length - 1 - i);
  const tris = earClipOrdered(up, order);
  // mirroring y reverses orientation, so flip each triangle back
  return tris.map((t) => [t[0], t[2], t[1]]);
}

function signedAreaUp(pts: P2[]): number {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j].x - pts[i].x) * (pts[j].y + pts[i].y);
  return a / 2;
}

/** CCW-in-y-up loop, walked in the given index order, returns triangles of original indices */
function earClipOrdered(loop: P2[], order: number[]): number[][] {
  const idx = order.slice();
  const tris: number[][] = [];
  let guard = 0;
  while (idx.length > 3 && guard++ < 20000) {
    let clipped = false;
    for (let i = 0; i < idx.length; i++) {
      const ia = idx[(i + idx.length - 1) % idx.length];
      const ib = idx[i];
      const ic = idx[(i + 1) % idx.length];
      const a = loop[ia], b = loop[ib], c = loop[ic];
      const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
      if (cross <= 1e-9) continue; // reflex or collinear
      let contains = false;
      for (let k = 0; k < idx.length; k++) {
        if (k === i || k === (i + idx.length - 1) % idx.length || k === (i + 1) % idx.length) continue;
        if (pointInTri(loop[idx[k]], a, b, c)) { contains = true; break; }
      }
      if (contains) continue;
      tris.push([ia, ib, ic]);
      idx.splice(i, 1);
      clipped = true;
      break;
    }
    if (!clipped) break;
  }
  if (idx.length === 3) tris.push([idx[0], idx[1], idx[2]]);
  return tris;
}

/** merge each hole into the outer loop with a zero-width bridge, then ear clip once */
function bridge(outer: P2[], holes: P2[][]): P2[] {
  let merged = outer.slice();
  for (const hole of holes) {
    let bestOuter = 0, bestHole = 0, bestD = Infinity;
    for (let i = 0; i < merged.length; i++) {
      for (let j = 0; j < hole.length; j++) {
        const d = (merged[i].x - hole[j].x) ** 2 + (merged[i].y - hole[j].y) ** 2;
        if (d < bestD) { bestD = d; bestOuter = i; bestHole = j; }
      }
    }
    const rotated = hole.slice(bestHole).concat(hole.slice(0, bestHole));
    merged = merged.slice(0, bestOuter + 1)
      .concat(rotated, [rotated[0]], [merged[bestOuter]])
      .concat(merged.slice(bestOuter + 1));
  }
  return merged;
}

/** board solid: top and bottom faces plus walls for the silhouette and every cutout */
export function buildBoardMesh(shape: OutlineShape, opts: MeshOptions): Mesh {
  const t = opts.thicknessMm;
  const outer = ensureWinding(solidLoop(shape, opts.cornerSegments), true);
  const holes = (opts.cutouts ?? []).map((h) => ensureWinding(h.map((p) => ({ x: p.x, y: p.y })), false));

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const push = (x: number, y: number, z: number, nx: number, ny: number, nz: number) => {
    positions.push(+x.toFixed(5), +y.toFixed(5), +z.toFixed(5));
    normals.push(nx, ny, nz);
    return positions.length / 3 - 1;
  };

  // top face (z = t): ear clip the bridged loop
  const merged = bridge(outer, holes);
  const topTris = earClipYDown(merged);
  const topBase = positions.length / 3;
  for (const p of merged) push(p.x, p.y, t, 0, 0, 1);
  for (const [a, b, c] of topTris) indices.push(topBase + a, topBase + b, topBase + c);

  // bottom face (z = 0): same triangles, walked backwards so normals point down
  const botBase = positions.length / 3;
  for (const p of merged) push(p.x, p.y, 0, 0, 0, -1);
  for (const [a, b, c] of topTris) indices.push(botBase + c, botBase + b, botBase + a);

  // walls: outer loop outward, hole loops inward
  const wallLoop = (loop: P2[], inward: boolean) => {
    for (let i = 0; i < loop.length; i++) {
      const a = loop[i], b = loop[(i + 1) % loop.length];
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      let nx = dy / len, ny = -dx / len;
      if (inward) { nx = -nx; ny = -ny; }
      const base = positions.length / 3;
      push(a.x, a.y, 0, nx, ny, 0);
      push(b.x, b.y, 0, nx, ny, 0);
      push(b.x, b.y, t, nx, ny, 0);
      push(a.x, a.y, t, nx, ny, 0);
      indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  };
  wallLoop(outer, false);
  for (const h of holes) wallLoop(h, true);

  return { positions, normals, indices, triangleCount: indices.length / 3 };
}

/** binary stl, millimetres, deterministic order */
export function exportStl(mesh: Mesh, name = "keeboard"): Uint8Array {
  const buf = new ArrayBuffer(84 + mesh.triangleCount * 50);
  const view = new DataView(buf);
  const header = `keeberia board solid ${mesh.triangleCount} triangles, units mm`;
  for (let i = 0; i < 80; i++) view.setUint8(i, i < header.length ? header.charCodeAt(i) : 32);
  view.setUint32(80, mesh.triangleCount, true);
  let off = 84;
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const [a, b, c] = [mesh.indices[i], mesh.indices[i + 1], mesh.indices[i + 2]];
    const ax = mesh.positions[a * 3], ay = mesh.positions[a * 3 + 1], az = mesh.positions[a * 3 + 2];
    const bx = mesh.positions[b * 3], by = mesh.positions[b * 3 + 1], bz = mesh.positions[b * 3 + 2];
    const cx = mesh.positions[c * 3], cy = mesh.positions[c * 3 + 1], cz = mesh.positions[c * 3 + 2];
    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = cx - ax, vy = cy - ay, vz = cz - az;
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len; ny /= len; nz /= len;
    for (const v of [nx, ny, nz, ax, ay, az, bx, by, bz, cx, cy, cz]) {
      view.setFloat32(off, v, true);
      off += 4;
    }
    view.setUint16(off, 0, true);
    off += 2;
  }
  return new Uint8Array(buf);
}

/** glb (glTF 2.0 binary). glTF counts in metres, so vertices are scaled 1/1000 */
export function exportGlb(mesh: Mesh, name = "keeboard"): Uint8Array {
  const S = 0.001;
  const pos = new Float32Array(mesh.positions.length);
  for (let i = 0; i < mesh.positions.length; i++) pos[i] = mesh.positions[i] * S;
  const nrm = new Float32Array(mesh.normals);
  const idx = new Uint32Array(mesh.indices);

  const pad4 = (n: number) => (n + 3) & ~3;
  const binParts: ArrayBuffer[] = [pos.buffer, nrm.buffer, idx.buffer];
  const offsets: number[] = [];
  let binLen = 0;
  for (const part of binParts) {
    offsets.push(binLen);
    binLen += part.byteLength;
    binLen = pad4(binLen);
  }
  const bin = new Uint8Array(binLen);
  binParts.forEach((part, i) => bin.set(new Uint8Array(part), offsets[i]));

  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i += 3) {
    for (let a = 0; a < 3; a++) {
      if (pos[i + a] < min[a]) min[a] = pos[i + a];
      if (pos[i + a] > max[a]) max[a] = pos[i + a];
    }
  }
  const gltf = {
    asset: { version: "2.0", generator: "keeberia circuitron" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name }],
    materials: [{ name: "fr4", pbrMetallicRoughness: { baseColorFactor: [0.05, 0.32, 0.1, 1], metallicFactor: 0.05, roughnessFactor: 0.75 } }],
    meshes: [{
      name,
      primitives: [{
        attributes: { POSITION: 0, NORMAL: 1 },
        indices: 2,
        material: 0,
      }],
    }],
    buffers: [{ byteLength: binLen }],
    bufferViews: [
      { buffer: 0, byteOffset: offsets[0], byteLength: pos.byteLength, target: 34962 },
      { buffer: 0, byteOffset: offsets[1], byteLength: nrm.byteLength, target: 34962 },
      { buffer: 0, byteOffset: offsets[2], byteLength: idx.byteLength, target: 34963 },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: pos.length / 3, type: "VEC3", min, max },
      { bufferView: 1, componentType: 5126, count: nrm.length / 3, type: "VEC3" },
      { bufferView: 2, componentType: 5125, count: idx.length, type: "SCALAR" },
    ],
  };
  const jsonBytes = new TextEncoder().encode(JSON.stringify(gltf));
  const jsonPadded = new Uint8Array(pad4(jsonBytes.length));
  jsonPadded.set(jsonBytes);
  for (let i = jsonBytes.length; i < jsonPadded.length; i++) jsonPadded[i] = 0x20;

  const total = 12 + 8 + jsonPadded.length + 8 + binLen;
  const out = new Uint8Array(total);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, 0x46546c67, true);   // "glTF"
  dv.setUint32(4, 2, true);
  dv.setUint32(8, total, true);
  dv.setUint32(12, jsonPadded.length, true);
  dv.setUint32(16, 0x4e4f534a, true);  // "JSON"
  out.set(jsonPadded, 20);
  dv.setUint32(20 + jsonPadded.length, binLen, true);
  dv.setUint32(24 + jsonPadded.length, 0x004e4942, true);  // "BIN"
  out.set(bin, 28 + jsonPadded.length);
  return out;
}
