/**
 * silhouette: the board edge follows the arrangement, not its bounding box.
 *
 * the ui lets you put switches anywhere in the grid, so a pad is often not a
 * rectangle: an L, a T, a ring around a hole, a stub of two keys off the side of
 * a 3x3 block. the engine used to take the bounding box of every part and call
 * that the board, which meant a ragged arrangement silently became a rectangular
 * board with dead copper-free area where the shape's notch should be. the user
 * drew a shape and got a rectangle back.
 *
 * this module unions axis-aligned rectangles exactly (no rasterisation, no
 * staircasing): it clips on the real edges, traces the boundary with the board
 * material always on the left, and hands back one outer loop plus any interior
 * holes. a union that is itself a plain rectangle returns as a rect so the
 * existing boards keep their exact output, byte for byte.
 *
 * the loops are normalised so the material sits to the left of travel:
 * outer loops counter-clockwise, holes clockwise. holes become cutouts, so an
 * interior empty cell is a slot you can see through rather than a silent gap.
 */
import { Pt } from "./types.ts";
import { OutlineShape, polygonShape, rectShape } from "./outline.ts";

export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const EPS = 1e-6;

export function rect(x0: number, y0: number, x1: number, y1: number): Rect {
  return { x0: Math.min(x0, x1), y0: Math.min(y0, y1), x1: Math.max(x0, x1), y1: Math.max(y0, y1) };
}

export function rectFromCenter(cx: number, cy: number, w: number, h: number): Rect {
  return rect(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2);
}

/** signed area, positive when the loop travels counter-clockwise in a y-up frame */
export function signedArea(points: Pt[]): number {
  let a = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    a += (points[j].x + points[i].x) * (points[j].y - points[i].y);
  }
  return a / 2;
}

export interface Silhouette {
  /** exactly one outline loop, material on the left */
  outer: Pt[];
  /** interior holes, each a closed loop */
  holes: Pt[][];
  /** true when the outer loop is a plain rectangle */
  rectangular: boolean;
  bbox: { width: number; height: number };
}

export type SilhouetteResult = { ok: true; silhouette: Silhouette } | { ok: false; error: string };

/**
 * a part that sits outside the cell grid (the mcu under the key field) must not
 * carve a notch into the board: it extends the board instead, as a band across
 * the cell row it attaches to. returns the rect to union in, which is the part
 * grown to that row's span and pulled up to touch the row.
 */
export function spanOutsidePart(part: Rect, rows: Array<{ y0: number; y1: number; x0: number; x1: number }>): Rect {
  if (!rows.length) return part;
  const cy = (part.y0 + part.y1) / 2;
  const cx = (part.x0 + part.x1) / 2;
  // is the part's centre already on the cell field? then it is a normal part
  const insideRow = rows.some((r) => cy >= r.y0 && cy <= r.y1 && cx >= r.x0 && cx <= r.x1);
  if (insideRow) return part;
  let best = rows[0];
  let bestDist = Infinity;
  for (const r of rows) {
    const d = cy < r.y0 ? r.y0 - cy : cy > r.y1 ? cy - r.y1 : 0;
    if (d < bestDist) { bestDist = d; best = r; }
  }
  // grow across that row's span and pull in until the band meets the row
  const y0 = Math.min(part.y0, best.y0);
  const y1 = Math.max(part.y1, best.y1);
  return { x0: Math.min(part.x0, best.x0), y0, x1: Math.max(part.x1, best.x1), y1 };
}

/**
 * merge rect edges that differ by less than `tol`, always outward.
 *
 * two parts rarely agree to the micron: the ec11 keepout ends 0.29mm short of
 * the mx courtyard, so the exact union traces a 0.29mm stair along the edge. it
 * is honest geometry and completely pointless, since a 0.3mm step is milling
 * noise, not a shape the user drew. edges are clustered and pushed outward to
 * the cluster extreme, so the board can only grow, never lose coverage.
 */
export function coalesceRects(rects: Rect[], tol = 0.6): Rect[] {
  const cluster = (vals: number[]): Map<number, number> => {
    const sorted = [...new Set(vals.map((v) => Math.round(v * 1e6) / 1e6))].sort((a, b) => a - b);
    const out = new Map<number, number>();
    let group: number[] = [];
    const flush = () => {
      if (!group.length) return;
      // outward for this edge class is handled by the caller via min/max choice
      for (const v of group) out.set(v, 0);
      group = [];
    };
    for (const v of sorted) {
      if (group.length && v - group[group.length - 1] > tol) flush();
      group.push(v);
    }
    flush();
    return out;
  };
  const groupsOf = (vals: number[]): number[][] => {
    const sorted = [...new Set(vals.map((v) => Math.round(v * 1e6) / 1e6))].sort((a, b) => a - b);
    const groups: number[][] = [];
    for (const v of sorted) {
      const g = groups[groups.length - 1];
      if (g && v - g[g.length - 1] <= tol) g.push(v);
      else groups.push([v]);
    }
    return groups;
  };
  const xs = rects.flatMap((r) => [r.x0, r.x1]);
  const ys = rects.flatMap((r) => [r.y0, r.y1]);
  const xLow = new Map<number, number>(), xHigh = new Map<number, number>();
  const yLow = new Map<number, number>(), yHigh = new Map<number, number>();
  for (const g of groupsOf(xs)) {
    for (const v of g) { xLow.set(v, g[0]); xHigh.set(v, g[g.length - 1]); }
  }
  for (const g of groupsOf(ys)) {
    for (const v of g) { yLow.set(v, g[0]); yHigh.set(v, g[g.length - 1]); }
  }
  void cluster;
  return rects.map((r) => ({
    x0: xLow.get(Math.round(r.x0 * 1e6) / 1e6) ?? r.x0,
    x1: xHigh.get(Math.round(r.x1 * 1e6) / 1e6) ?? r.x1,
    y0: yLow.get(Math.round(r.y0 * 1e6) / 1e6) ?? r.y0,
    y1: yHigh.get(Math.round(r.y1 * 1e6) / 1e6) ?? r.y1,
  }));
}

/**
 * union a set of axis-aligned rectangles and return its boundary.
 *
 * the lattice is built from the rectangles' own coordinates, so every vertex
 * lands on a real edge and no staircase artefacts can appear. coverage is tested
 * per lattice cell against the source rectangles, then the boundary is stitched
 * from the uncovered sides.
 */
export function uniteRects(rects: Rect[]): SilhouetteResult {
  const rs = rects
    .map((r) => rect(r.x0, r.y0, r.x1, r.y1))
    .filter((r) => r.x1 - r.x0 > EPS && r.y1 - r.y0 > EPS);
  if (!rs.length) return { ok: false, error: "no board area: every cell is blocked or empty" };
  const xs = uniqSorted(rs.flatMap((r) => [r.x0, r.x1]));
  const ys = uniqSorted(rs.flatMap((r) => [r.y0, r.y1]));
  return traceRegion(xs, ys, (mx, my) => rs.some((r) => mx > r.x0 && mx < r.x1 && my > r.y0 && my < r.y1));
}

/**
 * the board region: the envelope of everything that must fit, minus the cells
 * the user blocked.
 *
 * this is the rule the ui implies. a part never carves a notch (the mcu and a
 * display are placed on the board, they do not reshape it), and an empty cell
 * always does: that is the shape the user painted. blocked cells touching the
 * edge become notches, blocked cells inside become holes. the earlier union of
 * part courtyards looked honest but made every display and mcu into a wing, and
 * on the reference streamdeck it cost six nets of routing space.
 */
export function boardRegion(envelope: Rect, blocked: Rect[]): SilhouetteResult {
  const e = rect(envelope.x0, envelope.y0, envelope.x1, envelope.y1);
  if (e.x1 - e.x0 <= EPS || e.y1 - e.y0 <= EPS) return { ok: false, error: "board area collapses to a line" };
  const holes = blocked
    .map((r) => intersectRect(r, e))
    .filter((r): r is Rect => !!r && r.x1 - r.x0 > EPS && r.y1 - r.y0 > EPS);
  if (!holes.length) return traceRegion([e.x0, e.x1], [e.y0, e.y1], () => true);
  const xs = uniqSorted([e.x0, e.x1, ...holes.flatMap((r) => [r.x0, r.x1])]);
  const ys = uniqSorted([e.y0, e.y1, ...holes.flatMap((r) => [r.y0, r.y1])]);
  return traceRegion(xs, ys, (mx, my) => !holes.some((r) => mx > r.x0 && mx < r.x1 && my > r.y0 && my < r.y1));
}

function intersectRect(a: Rect, b: Rect): Rect | null {
  const r = rect(Math.max(a.x0, b.x0), Math.max(a.y0, b.y0), Math.min(a.x1, b.x1), Math.min(a.y1, b.y1));
  return r.x1 - r.x0 > EPS && r.y1 - r.y0 > EPS ? r : null;
}

/** trace the boundary of a covered lattice region with the material on the left */
function traceRegion(xsIn: number[], ysIn: number[], covered: (mx: number, my: number) => boolean): SilhouetteResult {
  const xs = xsIn;
  const ys = ysIn;
  const nx = xs.length - 1;
  const ny = ys.length - 1;
  if (nx < 1 || ny < 1) return { ok: false, error: "board area collapses to a line" };

  // coverage per lattice cell, tested at the cell midpoint (every edge is on the
  // lattice, so the midpoint is a faithful sample)
  const cover: boolean[][] = [];
  for (let j = 0; j < ny; j++) {
    const my = (ys[j] + ys[j + 1]) / 2;
    cover.push([]);
    for (let i = 0; i < nx; i++) {
      const mx = (xs[i] + xs[i + 1]) / 2;
      cover[j].push(covered(mx, my));
    }
  }

  // directed boundary edges, material on the left of travel
  type Edge = { sx: number; sy: number; tx: number; ty: number; used: boolean };
  const edges: Edge[] = [];
  const push = (sx: number, sy: number, tx: number, ty: number) =>
    edges.push({ sx, sy, tx, ty, used: false });

  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      if (!cover[j][i]) continue;
      const x0 = xs[i], x1 = xs[i + 1], y0 = ys[j], y1 = ys[j + 1];
      if (!cover[j - 1]?.[i]) push(x0, y0, x1, y0); // bottom side, material above
      if (!cover[j + 1]?.[i]) push(x1, y1, x0, y1); // top side, material below
      if (!cover[j]?.[i - 1]) push(x0, y1, x0, y0); // left side, material right
      if (!cover[j]?.[i + 1]) push(x1, y0, x1, y1); // right side, material left
    }
  }
  if (!edges.length) return { ok: false, error: "board area has no boundary" };

  const byStart = new Map<string, number[]>();
  edges.forEach((e, idx) => {
    const k = vkey(e.sx, e.sy);
    const list = byStart.get(k);
    if (list) list.push(idx); else byStart.set(k, [idx]);
  });

  const loops: Pt[][] = [];
  for (let startIdx = 0; startIdx < edges.length; startIdx++) {
    if (edges[startIdx].used) continue;
    const loop: Pt[] = [];
    let idx = startIdx;
    let guard = 0;
    while (idx >= 0 && !edges[idx].used) {
      if (guard++ > edges.length + 4) return { ok: false, error: "boundary trace failed to close" };
      const e = edges[idx];
      e.used = true;
      loop.push({ x: e.sx, y: e.sy });
      idx = nextEdge(edges, byStart, e);
    }
    const clean = simplify(collinear(loop));
    if (clean.length >= 4) loops.push(clean);
  }
  if (!loops.length) return { ok: false, error: "could not trace a board outline" };

  // the loop holding the most area is the outer edge; extra same-winding loops
  // would mean the board is in disconnected pieces
  const areas = loops.map((l) => Math.abs(signedArea(l)));
  const outerIdx = areas.indexOf(Math.max(...areas));
  const outer = loops[outerIdx];
  const others = loops.filter((_, i) => i !== outerIdx);
  const outerSign = Math.sign(signedArea(outer));
  const disconnected = others.filter((l) => Math.sign(signedArea(l)) === outerSign);
  if (disconnected.length) {
    return {
      ok: false,
      error: `board silhouette is in ${disconnected.length + 1} disconnected pieces; join them with spacer cells or drop the stray ones`,
    };
  }

  const bb = bounds(outer);
  const rectangular = isRectangle(outer) && others.length === 0;
  return {
    ok: true,
    silhouette: {
      outer,
      holes: others,
      rectangular,
      bbox: { width: round3(bb.maxX - bb.minX), height: round3(bb.maxY - bb.minY) },
    },
  };
}

/** outline shape for a silhouette: a plain rect keeps its corner radius, a stepped edge is a polygon */
export function silhouetteShape(s: Silhouette, cornerRadius = 2.5): OutlineShape {
  if (s.rectangular) {
    return rectShape(s.bbox.width, s.bbox.height, cornerRadius);
  }
  return polygonShape(s.outer);
}

/** translate a silhouette so its bounding box is centred on the origin */
export function recenterSilhouette(s: Silhouette): Silhouette {
  const bb = bounds(s.outer);
  const dx = -(bb.minX + bb.maxX) / 2;
  const dy = -(bb.minY + bb.maxY) / 2;
  const shift = (pts: Pt[]) => pts.map((p) => ({ x: round6(p.x + dx), y: round6(p.y + dy) }));
  return {
    ...s,
    outer: shift(s.outer),
    holes: s.holes.map(shift),
    bbox: { width: round3(bb.maxX - bb.minX), height: round3(bb.maxY - bb.minY) },
  };
}

/**
 * corners of the silhouette that can hold a mounting hole: convex corners (the
 * board material fills 90 degrees there), each verified to keep the hole's whole
 * circle inside the outline. a stepped board has no bounding-box corners to
 * trust, so the holes move onto real corners instead of hanging off the edge.
 */
export function mountableCorners(s: Silhouette, holeRadius: number, web: number, limit = 4): Pt[] {
  const shape: OutlineShape = s.rectangular ? rectShape(s.bbox.width, s.bbox.height, 0) : polygonShape(s.outer);
  const bb = bounds(s.outer);
  const cx = (bb.minX + bb.maxX) / 2;
  const cy = (bb.minY + bb.maxY) / 2;
  const dir = Math.sign(signedArea(s.outer));

  const convex: Pt[] = [];
  for (let i = 0; i < s.outer.length; i++) {
    const prev = s.outer[(i - 1 + s.outer.length) % s.outer.length];
    const here = s.outer[i];
    const next = s.outer[(i + 1) % s.outer.length];
    const ax = here.x - prev.x, ay = here.y - prev.y;
    const bx = next.x - here.x, by = next.y - here.y;
    const cross = ax * by - ay * bx;
    // convex means the turn fights the winding: the loop is traced with the
    // material on its left, so a material corner turns the other way
    if (cross * dir >= 0 || Math.abs(cross) < EPS) continue;
    const inset = holeRadius + web + 0.05; // a hair of slack so the web test is not a coin flip
    const u1 = unit(ax, ay);
    const u2 = unit(bx, by);
    // step into the material along both edges: the hole centre, not the corner
    convex.push({
      x: round6(here.x + (u2.x - u1.x) * inset),
      y: round6(here.y + (u2.y - u1.y) * inset),
    });
  }

  const inside = (p: Pt) => {
    // sample the hole's circle, not just its centre
    for (let a = 0; a < 360; a += 45) {
      const r = (a * Math.PI) / 180;
      const q = { x: p.x + Math.cos(r) * holeRadius, y: p.y + Math.sin(r) * holeRadius };
      if (!pointIn(s, shape, q, web)) return false;
    }
    return pointIn(s, shape, p, web);
  };

  const candidates = convex.length ? convex : s.outer.slice();
  // spread them: farthest from the centroid first, then keep away from chosen ones
  const ranked = candidates
    .filter((p) => inside(p))
    .sort((a, b) => dist2(b, cx, cy) - dist2(a, cx, cy));
  const picked: Pt[] = [];
  for (const p of ranked) {
    if (picked.length >= limit) break;
    if (picked.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 12)) continue;
    picked.push(p);
  }
  return picked;
}

function pointIn(s: Silhouette, shape: OutlineShape, p: Pt, margin: number): boolean {
  // the holes are already cut from the material, so a hole's own edge must also
  // be respected when asking whether a point has clearance
  if (!pointInPolyRaw(s.outer, p, margin)) return false;
  for (const h of s.holes) if (pointInPolyRaw(h, p, -margin)) return false;
  return true;
}

function pointInPolyRaw(poly: Pt[], p: Pt, margin: number): boolean {
  // local copy of the ray test so this module stays independent of outline's
  // silhouette bookkeeping; margin grows (or shrinks) the polygon
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    const hit = a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x;
    if (hit) inside = !inside;
  }
  if (margin === 0) return inside;
  // distance to the boundary decides the margin band
  let d = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    d = Math.min(d, segDist(p, poly[j], poly[i]));
  }
  return margin > 0 ? inside && d >= margin : inside || d < -margin;
}

function segDist(p: Pt, a: Pt, b: Pt): number {
  const vx = b.x - a.x, vy = b.y - a.y;
  const wx = p.x - a.x, wy = p.y - a.y;
  const len = vx * vx + vy * vy;
  const t = len < EPS ? 0 : Math.max(0, Math.min(1, (wx * vx + wy * vy) / len));
  return Math.hypot(p.x - (a.x + t * vx), p.y - (a.y + t * vy));
}

function nextEdge(edges: any[], byStart: Map<string, number[]>, e: any): number {
  const cands = (byStart.get(vkey(e.tx, e.ty)) ?? []).filter((i) => !edges[i].used);
  if (!cands.length) return -1;
  const dx = e.tx - e.sx, dy = e.ty - e.sy;
  // keep the material on the left: at an ambiguous vertex take the sharpest
  // right turn, which hugs the covered cells instead of cutting the corner
  let best = cands[0];
  let bestCross = Infinity;
  for (const i of cands) {
    const c = edges[i];
    const nx2 = c.tx - c.sx, ny2 = c.ty - c.sy;
    const cross = dx * ny2 - dy * nx2;
    if (cross < bestCross) { bestCross = cross; best = i; }
  }
  return best;
}

function collinear(loop: Pt[]): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < loop.length; i++) {
    const prev = out[out.length - 1] ?? loop[(i - 1 + loop.length) % loop.length];
    const here = loop[i];
    const next = loop[(i + 1) % loop.length];
    const sameX = Math.abs(prev.x - here.x) < EPS && Math.abs(here.x - next.x) < EPS;
    const sameY = Math.abs(prev.y - here.y) < EPS && Math.abs(here.y - next.y) < EPS;
    if (sameX || sameY) continue;
    out.push(here);
  }
  return out.length >= 3 ? out : loop;
}

function simplify(loop: Pt[]): Pt[] {
  const out: Pt[] = [];
  for (const p of loop) {
    const last = out[out.length - 1];
    if (last && Math.abs(last.x - p.x) < EPS && Math.abs(last.y - p.y) < EPS) continue;
    out.push(p);
  }
  if (out.length > 1) {
    const first = out[0], last = out[out.length - 1];
    if (Math.abs(first.x - last.x) < EPS && Math.abs(first.y - last.y) < EPS) out.pop();
  }
  return out;
}

function isRectangle(loop: Pt[]): boolean {
  if (loop.length !== 4) return false;
  const xs = uniqSorted(loop.map((p) => p.x));
  const ys = uniqSorted(loop.map((p) => p.y));
  return xs.length === 2 && ys.length === 2;
}

function bounds(pts: Pt[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
}

function uniqSorted(vals: number[]): number[] {
  const sorted = [...vals].sort((a, b) => a - b);
  const out: number[] = [];
  for (const v of sorted) {
    const r = round6(v);
    if (!out.length || Math.abs(out[out.length - 1] - r) > EPS) out.push(r);
  }
  return out;
}

function vkey(x: number, y: number): string {
  return `${round6(x)}|${round6(y)}`;
}

function unit(dx: number, dy: number): { x: number; y: number } {
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

function dist2(p: Pt, cx: number, cy: number): number {
  return (p.x - cx) ** 2 + (p.y - cy) ** 2;
}

function round6(v: number): number {
  return Math.round(v * 1e6) / 1e6;
}

function round3(v: number): number {
  return Math.round(v * 1000) / 1000;
}
