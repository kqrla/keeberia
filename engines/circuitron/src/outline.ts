/**
 * outline.ts: the board silhouette is an input, not a side effect.
 *
 * default: rectangle from the parts bbox, which is what every board has always
 * used. optional: a polygon, or an ascii dxf the user uploads. either way the
 * copper path still only sees a bbox for its grid and a point-in-shape test for
 * the edge keepout, so routing stays deterministic and cheap.
 *
 * vanity and function meet here on purpose:
 *   - the silhouette is the user's to draw (a shape, not a feature)
 *   - but it is validated against functional rules before it may be used:
 *     closed loop, no self-intersections, min board size, cutouts inside the
 *     board with a fab-safe web to the edge and a min slot width.
 */
import { Pt } from "./types.ts";

export interface RectShape { kind: "rect"; width: number; height: number; cornerRadius: number }
export interface PolyShape { kind: "polygon"; points: Pt[] }
export type OutlineShape = RectShape | PolyShape;

export type OutlineSpec =
  | { kind: "auto" }
  | { kind: "rect"; width: number; height: number; cornerRadius?: number }
  | { kind: "polygon"; points: Pt[] }
  | { kind: "dxf"; text: string; scale?: number };

export interface OutlineLimits {
  minBoardMm: [number, number];
  maxBoardMm: [number, number];
  minCutoutWidthMm: number;   // fab min non-plated slot
  minWebToEdgeMm: number;     // copper/board web between cutout and silhouette
}

export interface ResolvedOutline {
  shape: OutlineShape;
  cutouts: Pt[][];
  bbox: { width: number; height: number };
  warnings: string[];
  errors: string[];
}

const EPS = 1e-6;

export function rectShape(width: number, height: number, cornerRadius: number): RectShape {
  return { kind: "rect", width, height, cornerRadius };
}

export function polygonShape(points: Pt[]): PolyShape {
  return { kind: "polygon", points };
}

export function shapeBBox(shape: OutlineShape) {
  if (shape.kind === "rect") return { minX: -shape.width / 2, minY: -shape.height / 2, maxX: shape.width / 2, maxY: shape.height / 2 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of shape.points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

/** polygon outline of the silhouette (rect becomes 4 points, corners ignored here) */
export function shapePolygon(shape: OutlineShape): Pt[] {
  if (shape.kind === "polygon") return shape.points;
  const { width: w, height: h } = shape;
  return [
    { x: -w / 2, y: -h / 2 }, { x: w / 2, y: -h / 2 },
    { x: w / 2, y: h / 2 }, { x: -w / 2, y: h / 2 },
  ];
}

/** even-odd point test with an optional inward margin (positive = stay inside) */
export function pointInShape(shape: OutlineShape, p: Pt, margin = 0): boolean {
  if (shape.kind === "rect") {
    return Math.abs(p.x) <= shape.width / 2 - margin && Math.abs(p.y) <= shape.height / 2 - margin;
  }
  return pointInPolygon(shape.points, p, margin);
}

export function pointInPolygon(poly: Pt[], p: Pt, margin = 0): boolean {
  if (!pointInPolygonRaw(poly, p)) return false;
  if (margin <= 0) return true;
  // margin: reject points closer than `margin` to any edge
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    if (distToSegment(p, poly[j], poly[i]) < margin) return false;
  }
  return true;
}

function pointInPolygonRaw(poly: Pt[], p: Pt): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

export function distToSegment(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 < EPS) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

// ── dxf: ascii only, the handful of entities a board silhouette actually uses ──

export interface DxfLoop { points: Pt[]; closed: boolean }

/**
 * parse the ascii dxf subset that shows up in board silhouettes:
 * LINE, LWPOLYLINE (with bulge approximations), POLYLINE/VERTEX/SEQEND,
 * CIRCLE, ARC, SPLINE is rejected loudly instead of silently ignored.
 * units are assumed to be mm (dxf $INSUNITS 4); anything else gets a warning.
 */
export function parseDxfLoops(text: string): { loops: DxfLoop[]; warnings: string[]; units: number | null } {
  const lines = text.split(/\r?\n/);
  const pairs: Array<[number, string]> = [];
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const code = Number(lines[i].trim());
    if (Number.isNaN(code)) continue;
    pairs.push([code, lines[i + 1].trim()]);
  }
  const warnings: string[] = [];
  let units: number | null = null;
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i][0] === 9 && pairs[i][1] === "$INSUNITS") {
      const next = pairs[i + 1];
      if (next) units = Number(next[1]);
    }
  }

  const loops: DxfLoop[] = [];
  let i = 0;
  const entities: Array<{ type: string; data: Array<[number, string]> }> = [];
  while (i < pairs.length) {
    const [code, value] = pairs[i];
    if (code === 0 && value !== "ENDSEC" && value !== "EOF" && value !== "SECTION" && value !== "TABLE" && value !== "BLOCK") {
      const type = value;
      const data: Array<[number, string]> = [];
      i++;
      while (i < pairs.length && pairs[i][0] !== 0) { data.push(pairs[i]); i++; }
      entities.push({ type, data });
      continue;
    }
    i++;
  }

  let pendingPolyline: Pt[] | null = null;
  let pendingClosed = false;
  for (const e of entities) {
    const get = (c: number) => e.data.filter((d) => d[0] === c).map((d) => Number(d[1]));
    const gets = (c: number) => e.data.filter((d) => d[0] === c).map((d) => d[1]);
    if (e.type === "LINE") {
      const xs = get(10), ys = get(20), xe = get(11), ye = get(21);
      if (xs.length && xe.length) loops.push({ points: [{ x: xs[0], y: ys[0] }, { x: xe[0], y: ye[0] }], closed: false });
    } else if (e.type === "LWPOLYLINE") {
      const xs = get(10), ys = get(20), flags = get(70);
      const pts: Pt[] = xs.map((x, k) => ({ x, y: ys[k] ?? 0 }));
      const closed = ((flags[0] ?? 0) & 1) === 1;
      if (pts.length >= 2) loops.push({ points: pts, closed });
    } else if (e.type === "POLYLINE") {
      const flags = get(70);
      pendingClosed = ((flags[0] ?? 0) & 1) === 1;
      pendingPolyline = [];
    } else if (e.type === "VERTEX" && pendingPolyline) {
      const xs = get(10), ys = get(20);
      if (xs.length) pendingPolyline.push({ x: xs[0], y: ys[0] ?? 0 });
    } else if (e.type === "SEQEND" && pendingPolyline) {
      if (pendingPolyline.length >= 2) loops.push({ points: pendingPolyline, closed: pendingClosed });
      pendingPolyline = null;
    } else if (e.type === "CIRCLE") {
      const cxs = get(10), cys = get(20), rs = get(40);
      if (cxs.length && rs.length) loops.push({ points: circlePolygon({ x: cxs[0], y: cys[0] }, rs[0], 32), closed: true });
    } else if (e.type === "ARC") {
      const cxs = get(10), cys = get(20), rs = get(40), a1 = get(50), a2 = get(51);
      if (cxs.length && rs.length && a1.length && a2.length) {
        loops.push({ points: arcPolygon({ x: cxs[0], y: cys[0] }, rs[0], a1[0], a2[0], 16), closed: false });
      }
    } else if (e.type === "SPLINE" || e.type === "ELLIPSE") {
      warnings.push(`dxf ${e.type} is not supported; export the silhouette as linework/polylines and re-upload`);
    }
  }
  // line/arc soup: stitch into loops so a dxf drawn as separate lines still works
  const stitched = stitchLoops(loops);
  if (units !== null && units !== 4) warnings.push(`dxf $INSUNITS=${units} (expected 4 = mm); lengths are taken as mm, scale them in the cad tool if needed`);
  return { loops: stitched, warnings, units };
}

export function circlePolygon(c: Pt, r: number, segments = 32): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push({ x: +(c.x + r * Math.cos(a)).toFixed(4), y: +(c.y + r * Math.sin(a)).toFixed(4) });
  }
  return pts;
}

function arcPolygon(c: Pt, r: number, startDeg: number, endDeg: number, segments: number): Pt[] {
  let a0 = (startDeg * Math.PI) / 180;
  let a1 = (endDeg * Math.PI) / 180;
  if (a1 <= a0) a1 += Math.PI * 2;
  const pts: Pt[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = a0 + ((a1 - a0) * i) / segments;
    pts.push({ x: +(c.x + r * Math.cos(a)).toFixed(4), y: +(c.y + r * Math.sin(a)).toFixed(4) });
  }
  return pts;
}

/** join open chains end-to-end (2mm tolerance) so LINE soup becomes loops */
function stitchLoops(input: DxfLoop[]): DxfLoop[] {
  const open = input.filter((l) => !l.closed);
  const done: DxfLoop[] = input.filter((l) => l.closed);
  const used = new Set<DxfLoop>();
  const near = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y) < 2;
  for (const seed of open) {
    if (used.has(seed)) continue;
    let chain = seed.points.slice();
    used.add(seed);
    let grew = true;
    while (grew) {
      grew = false;
      for (const cand of open) {
        if (used.has(cand)) continue;
        const head = chain[0], tail = chain[chain.length - 1];
        if (near(tail, cand.points[0])) chain = chain.concat(cand.points.slice(1));
        else if (near(tail, cand.points[cand.points.length - 1])) chain = chain.concat(cand.points.slice(0, -1).reverse());
        else if (near(head, cand.points[cand.points.length - 1])) chain = cand.points.slice(0, -1).concat(chain);
        else if (near(head, cand.points[0])) chain = cand.points.slice(1).reverse().concat(chain);
        else continue;
        used.add(cand);
        grew = true;
      }
    }
    done.push({ points: chain, closed: chain.length > 3 && near(chain[0], chain[chain.length - 1]) });
  }
  return done;
}

// ── validation + resolution ──

export function polygonArea(points: Pt[]): number {
  let a = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    a += (points[j].x + points[i].x) * (points[j].y - points[i].y);
  }
  return Math.abs(a / 2);
}

/** true when any two non-adjacent edges of the loop cross (ersatz self-intersection) */
export function selfIntersects(points: Pt[]): boolean {
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const a1 = points[i], a2 = points[(i + 1) % n];
    for (let j = i + 2; j < n; j++) {
      if ((j + 1) % n === i) continue;
      const b1 = points[j], b2 = points[(j + 1) % n];
      if (segmentsCross(a1, a2, b1, b2)) return true;
    }
  }
  return false;
}

function orient(a: Pt, b: Pt, c: Pt): number {
  return Math.sign((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
}

function segmentsCross(a1: Pt, a2: Pt, b1: Pt, b2: Pt): boolean {
  const o1 = orient(a1, a2, b1), o2 = orient(a1, a2, b2);
  const o3 = orient(b1, b2, a1), o4 = orient(b1, b2, a2);
  return o1 !== o2 && o3 !== o4;
}

/** local width of a loop across each of its vertices (min chord to the opposite edge) */
export function minFeatureWidth(points: Pt[]): number {
  let min = Infinity;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    let best = Infinity;
    for (let j = 0, k = points.length - 1; j < points.length; k = j++) {
      if (j === i || k === i) continue;
      best = Math.min(best, distToSegment(p, points[k], points[j]));
    }
    if (best < min) min = best;
  }
  return min;
}

/**
 * turn a user silhouette spec into a validated shape plus cutouts.
 * recentering keeps the pipeline's board coords (origin at the shape center),
 * exactly like the rect path, so routing and exports do not notice the source.
 */
export function resolveOutline(spec: OutlineSpec | undefined, limits: OutlineLimits, fallback: RectShape): ResolvedOutline {
  const warnings: string[] = [];
  const errors: string[] = [];
  if (!spec || spec.kind === "auto") return { shape: fallback, cutouts: [], bbox: { width: fallback.width, height: fallback.height }, warnings, errors };

  if (spec.kind === "rect") {
    const shape = rectShape(spec.width, spec.height, spec.cornerRadius ?? 2.5);
    return finish(shape, [], limits, warnings, errors);
  }

  let outer: Pt[] | null = null;
  let inner: Pt[][] = [];
  if (spec.kind === "polygon") {
    outer = dedupe(spec.points);
    if (spec.points.length > 0 && !closedLoop(spec.points)) outer = dedupe(spec.points);
  } else {
    const parsed = parseDxfLoops(spec.text);
    warnings.push(...parsed.warnings);
    const scale = spec.scale ?? 1;
    const scaled = parsed.loops.map((l) => ({ points: l.points.map((p) => ({ x: p.x * scale, y: p.y * scale })), closed: l.closed }));
    const closed = scaled.filter((l) => l.closed && l.points.length >= 3);
    if (!closed.length) {
      errors.push("no closed loop found in the dxf; the board edge must be a closed polyline (lines are stitched when their ends meet within 2mm)");
      return finish(fallback, [], limits, warnings, errors);
    }
    closed.sort((a, b) => polygonArea(b.points) - polygonArea(a.points));
    outer = dedupe(closed[0].points);
    inner = closed.slice(1).map((l) => dedupe(l.points));
    if (closed.length > 1) warnings.push(`${closed.length} closed loops found; the largest became the board edge and the other ${closed.length - 1} became cutouts`);
  }

  if (!outer) return finish(fallback, [], limits, warnings, errors);
  outer = recenter(outer);
  inner = inner.map(recenter);
  const shape = polygonShape(outer);
  return finish(shape, inner, limits, warnings, errors, true);
}

/** validate an already-built silhouette (from the cell+part union) against fab limits */
export function validateSilhouette(shape: OutlineShape, cutouts: Pt[][], limits: OutlineLimits): ResolvedOutline {
  return finish(shape, cutouts, limits, [], [], true);
}

function finish(shape: OutlineShape, cutouts: Pt[][], limits: OutlineLimits, warnings: string[], errors: string[], validateShape = false): ResolvedOutline {
  const bb = shapeBBox(shape);
  const width = +(bb.maxX - bb.minX).toFixed(3);
  const height = +(bb.maxY - bb.minY).toFixed(3);
  if (width < limits.minBoardMm[0] || height < limits.minBoardMm[1]) {
    errors.push(`board silhouette ${width}x${height}mm is under the fab minimum ${limits.minBoardMm[0]}x${limits.minBoardMm[1]}mm`);
  }
  if (width > limits.maxBoardMm[0] || height > limits.maxBoardMm[1]) {
    errors.push(`board silhouette ${width}x${height}mm exceeds the fab maximum ${limits.maxBoardMm[0]}x${limits.maxBoardMm[1]}mm`);
  }
  if (validateShape && shape.kind === "polygon") {
    const pts = shape.points;
    if (pts.length < 3) errors.push("board outline needs at least 3 points");
    if (polygonArea(pts) < 1) errors.push("board outline encloses no usable area");
    if (selfIntersects(pts)) errors.push("board outline crosses itself; fix the silhouette in cad and re-upload");
    const minWidth = minFeatureWidth(pts);
    if (minWidth < 2) errors.push(`board outline pinches to ${minWidth.toFixed(2)}mm; the fab needs a wider neck`);
    else if (minWidth < 4) warnings.push(`board outline pinches to ${minWidth.toFixed(2)}mm; tight but routable, double check the fab's milling bit`);
  }
  for (const c of cutouts) {
    if (c.length < 3) { errors.push("a cutout needs at least 3 points"); continue; }
    if (selfIntersects(c)) { errors.push("a cutout crosses itself"); continue; }
    const w = minFeatureWidth(c);
    if (w < limits.minCutoutWidthMm) errors.push(`cutout is ${w.toFixed(2)}mm across, under the fab's ${limits.minCutoutWidthMm}mm slot minimum`);
    if (!c.every((p) => pointInShape(shape, p, limits.minWebToEdgeMm))) errors.push(`cutout sits closer than ${limits.minWebToEdgeMm}mm to the board edge`);
  }
  return { shape, cutouts, bbox: { width, height }, warnings, errors };
}

function closedLoop(points: Pt[]): boolean {
  return points.length > 3 && Math.hypot(points[0].x - points[points.length - 1].x, points[0].y - points[points.length - 1].y) < 1e-3;
}

/** drop a duplicated closing point and consecutive duplicates */
function dedupe(points: Pt[]): Pt[] {
  const out: Pt[] = [];
  for (const p of points) {
    const last = out[out.length - 1];
    if (!last || Math.hypot(last.x - p.x, last.y - p.y) > 1e-4) out.push({ x: p.x, y: p.y });
  }
  if (out.length > 1) {
    const first = out[0], last = out[out.length - 1];
    if (Math.hypot(first.x - last.x, first.y - last.y) < 1e-4) out.pop();
  }
  return out;
}

function recenter(points: Pt[]): Pt[] {
  const bb = shapeBBox(polygonShape(points));
  const cx = (bb.minX + bb.maxX) / 2, cy = (bb.minY + bb.maxY) / 2;
  return points.map((p) => ({ x: +(p.x - cx).toFixed(4), y: +(p.y - cy).toFixed(4) }));
}
