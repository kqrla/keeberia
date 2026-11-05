/**
 * step.ts: the board as a STEP file, written by hand, zero dependencies.
 *
 * representation: an exact planar brep. every face is a PLANE bounded by an
 * EDGE_LOOP of straight EDGE_CURVEs, which is what cad kernels write natively
 * and read back without complaint. a faceted_brep (poly_loop faces) is smaller
 * but occt refused it here, and a file a kernel will not read is not a file.
 *
 * the solid is a prism: the validated silhouette, every cutout, thickness.
 * millimetres. board coords are y-down, cad wants y-up, so y flips on the way
 * out and the model sits as you would machine it: x right, y away, z up.
 */
import { Pt } from "./types.ts";
import { OutlineShape } from "./outline.ts";
import { solidLoop } from "./mesh3d.ts";

interface StepOptions {
  thicknessMm: number;
  cutouts?: Pt[][];
  cornerSegments?: number;
  name?: string;
  timestamp?: string;
}

interface V3 { x: number; y: number; z: number }

export function exportStep(shape: OutlineShape, opts: StepOptions): string {
  const t = opts.thicknessMm;
  const name = (opts.name ?? "keeboard").replace(/[^A-Za-z0-9_-]/g, "_");
  const ts = opts.timestamp ?? "2026-11-05T00:00:00";

  const f = (n: number) => (Math.abs(n) < 1e-9 ? "0." : n.toFixed(5).replace(/0+$/, "").replace(/\.$/, "."));
  const toCad = (p: Pt): Pt => ({ x: p.x, y: -p.y });
  const ccw = (pts: Pt[]): Pt[] => {
    let a = 0;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j].x * pts[i].y - pts[i].x * pts[j].y);
    return a < 0 ? pts : [...pts].reverse();
  };
  const outer = ccw(solidLoop(shape, opts.cornerSegments).map(toCad));
  const holes = (opts.cutouts ?? []).map((h) => ccw(h.map(toCad)));

  const lines: string[] = [];
  let id = 0;
  const next = () => ++id;
  const emit = (text: string) => { lines.push(`#${next()}=${text};`); return id; };

  // ── primitives, deduped ──
  const ptId = new Map<string, number>();
  const point = (p: V3): number => {
    const k = `${f(p.x)},${f(p.y)},${f(p.z)}`;
    const hit = ptId.get(k);
    if (hit) return hit;
    return (ptId.set(k, emit(`CARTESIAN_POINT('',(${f(p.x)},${f(p.y)},${f(p.z)}))`)), id);
  };
  const dirId = (d: V3): number => {
    const n = Math.hypot(d.x, d.y, d.z) || 1;
    return emit(`DIRECTION('',(${f(d.x / n)},${f(d.y / n)},${f(d.z / n)}))`);
  };
  const axisPlacement = (origin: V3, normal: V3, refDir: V3): number => {
    const n = Math.hypot(normal.x, normal.y, normal.z) || 1;
    const u = { x: normal.x / n, y: normal.y / n, z: normal.z / n };
    // ref direction has to sit in the plane; project it and refall back to x
    const dot = refDir.x * u.x + refDir.y * u.y + refDir.z * u.z;
    let r = { x: refDir.x - dot * u.x, y: refDir.y - dot * u.y, z: refDir.z - dot * u.z };
    if (Math.hypot(r.x, r.y, r.z) < 1e-9) r = { x: 1, y: 0, z: 0 };
    return emit(`AXIS2_PLACEMENT_3D('',#${point(origin)},#${dirId(u)},#${dirId(r)})`);
  };
  const vtxId = new Map<string, number>();
  const vertex = (p: V3): number => {
    const k = `${f(p.x)},${f(p.y)},${f(p.z)}`;
    const hit = vtxId.get(k);
    if (hit) return hit;
    return (vtxId.set(k, emit(`VERTEX_POINT('',#${point(p)})`)), id);
  };
  const vecId = (d: V3, mag: number): number => emit(`VECTOR('',#${dirId(d)},${f(mag)})`);
  const edgeId = new Map<string, { id: number; from: string }>();
  const edge = (a: V3, b: V3): { id: number; forward: boolean } => {
    const ka = `${f(a.x)},${f(a.y)},${f(a.z)}`, kb = `${f(b.x)},${f(b.y)},${f(b.z)}`;
    const key = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
    const hit = edgeId.get(key);
    if (hit) return { id: hit.id, forward: hit.from === ka };
    const line = emit(`LINE('',#${point(a)},#${vecId({ x: b.x - a.x, y: b.y - a.y, z: b.z - a.z }, Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) || 1)})`);
    const e = emit(`EDGE_CURVE('',#${vertex(a)},#${vertex(b)},#${line},.T.)`);
    edgeId.set(key, { id: e, from: ka });
    return { id: e, forward: true };
  };
  const loop = (pts: V3[]): number => {
    const oriented: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const { id: e, forward } = edge(a, b);
      oriented.push(emit(`ORIENTED_EDGE('',*,*,#${e},${forward ? ".T." : ".F."})`));
    }
    return emit(`EDGE_LOOP('',(${oriented.map((o) => `#${o}`).join(",")}))`);
  };
  const normalOf = (pts: V3[]): V3 => {
    // newell, so a non planar-ish loop still gets a sensible axis
    let n = { x: 0, y: 0, z: 0 };
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      n = { x: n.x + (a.y - b.y) * (a.z + b.z), y: n.y + (a.z - b.z) * (a.x + b.x), z: n.z + (a.x - b.x) * (a.y + b.y) };
    }
    return n;
  };
  const face = (pts: V3[], inner: V3[][] = []): number => {
    const n = normalOf(pts);
    const ref = { x: pts[1].x - pts[0].x, y: pts[1].y - pts[0].y, z: pts[1].z - pts[0].z };
    const plane = emit(`PLANE('',#${axisPlacement(pts[0], n, ref)})`);
    const bounds: number[] = [];
    bounds.push(emit(`FACE_OUTER_BOUND('',#${loop(pts)},.T.)`));
    // holes wind opposite the outer loop, as a bound with its own sense
    for (const h of inner) bounds.push(emit(`FACE_BOUND('',#${loop(h)},.T.)`));
    return emit(`ADVANCED_FACE('',(${bounds.map((b) => `#${b}`).join(",")}),#${plane},.T.)`);
  };

  // ── the prism ──
  const faces: number[] = [];
  const top = (lp: Pt[]) => lp.map((p) => ({ x: p.x, y: p.y, z: t }));
  const bot = (lp: Pt[]) => lp.map((p) => ({ x: p.x, y: p.y, z: 0 }));
  const holesCw = holes.map((h) => [...h].reverse());
  faces.push(face(top(outer), holesCw.map((h) => top(h))));
  faces.push(face(bot([...outer].reverse()), holes.map((h) => bot(h))));
  const wall = (lp: Pt[], flip: boolean) => {
    const b = bot(lp);
    for (let i = 0; i < lp.length; i++) {
      const j = (i + 1) % lp.length;
      const quad = [
        { x: b[i].x, y: b[i].y, z: 0 }, { x: b[j].x, y: b[j].y, z: 0 },
        { x: b[j].x, y: b[j].y, z: t }, { x: b[i].x, y: b[i].y, z: t },
      ];
      faces.push(face(flip ? quad.reverse() : quad));
    }
  };
  wall(outer, false);
  // hole walls face the void, so the quad runs the other way round
  for (const h of holesCw) {
    const b = bot(h);
    for (let i = 0; i < h.length; i++) {
      const j = (i + 1) % h.length;
      faces.push(face([
        { x: b[j].x, y: b[j].y, z: 0 }, { x: b[i].x, y: b[i].y, z: 0 },
        { x: b[i].x, y: b[i].y, z: t }, { x: b[j].x, y: b[j].y, z: t },
      ]));
    }
  }

  emit(`CLOSED_SHELL('',(${faces.map((x) => `#${x}`).join(",")}))`);
  const shell = id;
  emit(`MANIFOLD_SOLID_BREP('${name}',#${shell})`);
  const solid = id;

  // ── units, context, product tree ──
  // the product definition shape points at a plain shape representation that
  // carries the placement; the brep hangs off it through a representation
  // relationship. readers that build a product tree (occt, freecad) find the
  // solid that way, and never when it sits alone.
  emit(`(LENGTH_UNIT()NAMED_UNIT(*)SI_UNIT(.MILLI.,.METRE.))`);
  const lengthUnit = id;
  emit(`(NAMED_UNIT(*)PLANE_ANGLE_UNIT()SI_UNIT($,.RADIAN.))`);
  const angleUnit = id;
  emit(`(NAMED_UNIT(*)SI_UNIT($,.STERADIAN.)SOLID_ANGLE_UNIT())`);
  const solidAngle = id;
  emit(`UNCERTAINTY_MEASURE_WITH_UNIT(LENGTH_MEASURE(0.01),#${lengthUnit},'DISTANCE_ACCURACY_VALUE','Maximum model space distance between geometric entities at asserted connectivities')`);
  const uncertainty = id;
  emit(`(GEOMETRIC_REPRESENTATION_CONTEXT(3)GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT((#${uncertainty}))GLOBAL_UNIT_ASSIGNED_CONTEXT((#${lengthUnit},#${angleUnit},#${solidAngle}))REPRESENTATION_CONTEXT('','3D'))`);
  const ctx = id;
  emit(`CARTESIAN_POINT('Origin',(0.,0.,0.))`);
  const originPt = id;
  emit(`DIRECTION('',(0.,0.,1.))`);
  const zDir = id;
  emit(`DIRECTION('',(1.,0.,0.))`);
  const xDir = id;
  emit(`AXIS2_PLACEMENT_3D('placement',#${originPt},#${zDir},#${xDir})`);
  const placement = id;
  emit(`ADVANCED_BREP_SHAPE_REPRESENTATION('',(#${solid}),#${ctx})`);
  const absr = id;
  emit(`SHAPE_REPRESENTATION('',(#${placement}),#${ctx})`);
  const sr = id;
  emit(`SHAPE_REPRESENTATION_RELATIONSHIP('SRR','None',#${sr},#${absr})`);
  emit(`APPLICATION_CONTEXT('Core Data for Automotive Mechanical Design Process')`);
  const app = id;
  emit(`APPLICATION_PROTOCOL_DEFINITION('international standard','automotive_design',2009,#${app})`);
  emit(`PRODUCT_CONTEXT('part definition',#${app},'mechanical')`);
  const pctx = id;
  emit(`PRODUCT('${name}','${name}',$,(#${pctx}))`);
  const product = id;
  emit(`PRODUCT_DEFINITION_FORMATION('',$,#${product})`);
  const pdf = id;
  emit(`PRODUCT_DEFINITION_CONTEXT('part definition',#${app},'design')`);
  const pdc = id;
  emit(`PRODUCT_DEFINITION('design','',#${pdf},#${pdc})`);
  const pd = id;
  emit(`PRODUCT_DEFINITION_SHAPE('',$,#${pd})`);
  const pds = id;
  emit(`SHAPE_DEFINITION_REPRESENTATION(#${pds},#${sr})`);
  emit(`PRODUCT_RELATED_PRODUCT_CATEGORY('${name}','${name}',(#${product}))`);

  return [
    "ISO-10303-21;",
    "HEADER;",
    "FILE_DESCRIPTION(('keeberia board solid'),'2;1');",
    `FILE_NAME('${name}.step','${ts}',(''),(''),'keeberia circuitron','circuitron','');`,
    "FILE_SCHEMA(('AUTOMOTIVE_DESIGN { 1 0 10303 214 3 1 1 }'));",
    "ENDSEC;",
    "DATA;",
    ...lines,
    "ENDSEC;",
    "END-ISO-10303-21;",
    "",
  ].join("\n");
}
