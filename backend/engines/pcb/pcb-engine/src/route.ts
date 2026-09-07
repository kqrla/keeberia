/**
 * Deterministic two-layer grid router (A*) with fan-out/escape routing.
 *
 * Phase 1 — fan-out: every pad of every routed net reserves a short stub from
 * the pad to the nearest open-field cell (BFS), most-constrained pads first.
 * This prevents trace-starvation around tight component clusters (MCU pads,
 * diodes behind switches).
 *
 * Phase 2 — routing: nets route as MST (Prim) edges between stub ends; each
 * edge is an A* search through the open field. GND is left to the B.Cu pour
 * zone (every GND pad is B-side or through-hole and reaches the pour).
 *
 * All orderings are deterministic; identical input yields identical copper.
 */
import { Net, RouteWarning, Segment, Via } from "./types.ts";
import { BoardCtx, padAbsPos } from "./layout.ts";
import { FOOTPRINTS } from "./footprints.ts";

const RES = 0.5;            // grid resolution mm
const VIA_COST = 16;         // layer-change penalty
const DIAG = 1.414;
const EDGE_CLEAR = 0.6;      // copper-to-edge clearance
const TRACE_W = 0.25;
const TRACE_W_POWER = 0.45;
const VIA_SIZE = 0.7;
const VIA_DRILL = 0.35;
const PAD_CLEAR = 0.35;     // halo clearance around foreign pads
const PAD_CORE = 0.18;       // hard clearance around pad copper

interface Grid {
  x0: number; y0: number;
  nx: number; ny: number;
  core: [Uint8Array, Uint8Array];
  halo: [Uint8Array, Uint8Array];
}
interface PathStep { gx: number; gy: number; layer: 0 | 1 }
interface PadCell { gx: number; gy: number; layers: number[]; r: number }
interface Stub { path: PathStep[]; gx: number; gy: number; layer: 0 | 1; pad: PadCell }

export interface RouteResult {
  segments: Segment[];
  vias: Via[];
  warnings: RouteWarning[];
  routedNets: number;
  failedNets: number;
  traceMm: number;
}

// binary min-heap over [priority, node]
class Heap {
  private a: Array<[number, number]> = [];
  push(p: number, n: number) {
    const a = this.a;
    a.push([p, n]);
    let i = a.length - 1;
    while (i > 0) {
      const par = (i - 1) >> 1;
      if (a[par][0] <= a[i][0]) break;
      [a[par], a[i]] = [a[i], a[par]];
      i = par;
    }
  }
  pop(): [number, number] | undefined {
    const a = this.a;
    if (!a.length) return undefined;
    const top = a[0];
    const last = a.pop()!;
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = 2 * i + 2;
        let m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
  get size() { return this.a.length; }
}

export function routeAll(ctx: BoardCtx, nets: Net[]): RouteResult {
  const { outline } = ctx;
  const x0 = -outline.width / 2 - EDGE_CLEAR - RES * 2;
  const y0 = -outline.height / 2 - EDGE_CLEAR - RES * 2;
  const nx = Math.ceil((outline.width + 2 * (EDGE_CLEAR + RES * 2)) / RES);
  const ny = Math.ceil((outline.height + 2 * (EDGE_CLEAR + RES * 2)) / RES);
  const grid: Grid = { x0, y0, nx, ny, core: [new Uint8Array(nx * ny), new Uint8Array(nx * ny)], halo: [new Uint8Array(nx * ny), new Uint8Array(nx * ny)] };
  const layerCells = nx * ny;
  const key = (gx: number, gy: number, l: number) => (l * ny + gy) * nx + gx;

  const cxOf = (x: number) => Math.max(0, Math.min(nx - 1, Math.round((x - x0) / RES)));
  const cyOf = (y: number) => Math.max(0, Math.min(ny - 1, Math.round((y - y0) / RES)));

  const blockCircle = (x: number, y: number, r: number, layer: 0 | 1) => {
    const rc = r - PAD_CLEAR + PAD_CORE;
    for (let gy = cyOf(y - r); gy <= cyOf(y + r); gy++)
      for (let gx = cxOf(x - r); gx <= cxOf(x + r); gx++) {
        const wx = x0 + gx * RES, wy = y0 + gy * RES;
        const d2 = (wx - x) ** 2 + (wy - y) ** 2;
        if (d2 <= r * r) grid.halo[layer][gy * nx + gx] = 1;
        if (d2 <= rc * rc) grid.core[layer][gy * nx + gx] = 1;
      }
  };
  const blockRect = (lx: number, ty: number, rx: number, by: number, layer: 0 | 1) => {
    for (let gy = cyOf(ty); gy <= cyOf(by); gy++)
      for (let gx = cxOf(lx); gx <= cxOf(rx); gx++) {
        grid.core[layer][gy * nx + gx] = 1;
        grid.halo[layer][gy * nx + gx] = 1;
      }
  };

  // outside the board edge is blocked (keep 0.45mm inside: trace half-width
  // + clearance + slack, so endpoints never approach the edge)
  for (let gy = 0; gy < ny; gy++)
    for (let gx = 0; gx < nx; gx++) {
      const wx = Math.abs(x0 + gx * RES), wy = Math.abs(y0 + gy * RES);
      if (wx > outline.width / 2 - 0.45 || wy > outline.height / 2 - 0.45) {
        grid.core[0][gy * nx + gx] = 1;
        grid.core[1][gy * nx + gx] = 1;
        grid.halo[0][gy * nx + gx] = 1;
        grid.halo[1][gy * nx + gx] = 1;
      }
    }

  // pads, part bodies, holes
  for (const pl of ctx.placements) {
    const fp = FOOTPRINTS[pl.library];
    if (!fp) continue;
    const side = pl.side === "F" ? 0 : 1;
    for (const pad of fp.pads) {
      const p = padAbsPos(pl, pad.pad);
      const isTh = pad.type === "thru_hole";
      const r = Math.max(pad.size.w, pad.size.h) / 2 + PAD_CLEAR;
      blockCircle(p.x, p.y, r, isTh ? 0 : side);
      blockCircle(p.x, p.y, r, isTh ? 1 : side);
    }
    if (fp.category === "mcu" || fp.category === "display") {
      const hw = fp.size.w / 2 - 0.5, hh = fp.size.h / 2 - 0.5;
      blockRect(pl.pos.x - hw, pl.pos.y - hh, pl.pos.x + hw, pl.pos.y + hh, side);
    }
    if (fp.category === "hole") {
      blockCircle(pl.pos.x, pl.pos.y, fp.keepoutRadius, 0);
      blockCircle(pl.pos.x, pl.pos.y, fp.keepoutRadius, 1);
    }
  }

  const padCellsOf = (net: Net): PadCell[] =>
    net.pads.map((p) => {
      const pl = ctx.placements.find((q) => q.ref === p.ref)!;
      const fp = FOOTPRINTS[pl.library];
      const pad = fp.pads.find((q) => q.pad === p.pad)!;
      return {
        gx: cxOf(p.pos.x), gy: cyOf(p.pos.y),
        layers: pad.type === "thru_hole" ? [0, 1] : [p.side === "F" ? 0 : 1],
        r: Math.max(pad.size.w, pad.size.h) / 2 + PAD_CLEAR,
      };
    });

  const openField = (gx: number, gy: number, l: number) =>
    gx >= 0 && gx < nx && gy >= 0 && gy < ny && !grid.core[l][gy * nx + gx] && !grid.halo[l][gy * nx + gx];

  const segments: Segment[] = [];
  const vias: Via[] = [];
  const warnings: RouteWarning[] = [];
  let routedNets = 0, failedNets = 0, traceMm = 0;

  // ── phase 1: fan-out stubs ─────────────────────────────────────────────
  function fanOut(cell: PadCell): Stub | null {
    const ownHalo = new Set<number>();
    const cr = Math.ceil(cell.r / RES);
    for (let dy = -cr; dy <= cr; dy++)
      for (let dx = -cr; dx <= cr; dx++) {
        if (dx * dx + dy * dy > ((cell.r + 1e-9) / RES) ** 2) continue;
        const gx = cell.gx + dx, gy = cell.gy + dy;
        if (gx < 0 || gx >= nx || gy < 0 || gy >= ny) continue;
        for (const l of cell.layers) ownHalo.add(key(gx, gy, l));
      }
    const startKs = cell.layers.map((l) => key(cell.gx, cell.gy, l));
    const prev = new Map<number, number>();
    const visited = new Set<number>(startKs);
    let queue: number[] = [...startKs];
    let found = -1;
    let guard = 0;
    while (queue.length && guard++ < 20000) {
      const next: number[] = [];
      for (const node of queue) {
        const l = Math.floor(node / layerCells);
        const rest = node % layerCells;
        const gy = Math.floor(rest / nx), gx = rest % nx;
        if (!startKs.includes(node) && openField(gx, gy, l)) { found = node; break; }
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;
        for (const [dx, dy] of dirs) {
          const ngx = gx + dx, ngy = gy + dy;
          for (const nl of cell.layers as number[]) {
            if (nl !== l && cell.layers.length === 1) continue; // smd: single layer, via allowed only below
            const nk = key(ngx, ngy, nl);
            if (visited.has(nk)) continue;
            if (ngx < 0 || ngx >= nx || ngy < 0 || ngy >= ny) continue;
            if (!ownHalo.has(nk) && (grid.core[nl][ngy * nx + ngx] || grid.halo[nl][ngy * nx + ngx])) continue;
            visited.add(nk);
            prev.set(nk, node);
            next.push(nk);
          }
        }
        // via out of the cluster for smd pads (position-preserving)
        const nl = l === 0 ? 1 : 0;
        if (cell.layers.includes(nl)) {
          const nk = key(gx, gy, nl);
          if (!visited.has(nk) && ownHalo.has(nk)) {
            visited.add(nk); prev.set(nk, node); next.push(nk);
          }
        }
      }
      if (found !== -1) break;
      queue = next;
    }
    if (found === -1) return null;
    const path: PathStep[] = [];
    let node: number = found;
    while (node !== -1) {
      const l = Math.floor(node / layerCells);
      const rest = node % layerCells;
      path.push({ gx: rest % nx, gy: Math.floor(rest / nx), layer: l as 0 | 1 });
      node = prev.get(node) ?? -1;
    }
    path.reverse();
    for (let i = 0; i < path.length; i++) grid.core[path[i].layer][path[i].gy * nx + path[i].gx] = 1;
    const last = path[path.length - 1];
    return { path, gx: last.gx, gy: last.gy, layer: last.layer, pad: cell };
  }

  // collect all pads needing stubs; most-constrained (fewest open neighbours) first
  interface PadJob { net: Net; idx: number; label: string; cell: PadCell; openness: number }
  const jobs: PadJob[] = [];
  for (const net of nets) {
    if (net.name === "GND") continue;
    const cells = padCellsOf(net);
    net.pads.forEach((p, idx) => {
      const c = cells[idx];
      let openness = 0;
      for (let dy = -3; dy <= 3; dy++)
        for (let dx = -3; dx <= 3; dx++)
          for (const l of c.layers) if (openField(c.gx + dx, c.gy + dy, l)) openness++;
      jobs.push({ net, idx, label: `${p.ref}.${p.pad}`, cell: c, openness });
    });
  }
  jobs.sort((a, b) => a.openness - b.openness || a.label.localeCompare(b.label));

  const stubMap = new Map<string, Stub>();
  for (const job of jobs) {
    const stub = fanOut(job.cell);
    if (stub) {
      stubMap.set(`${job.net.name}#${job.idx}`, stub);
    } else {
      warnings.push({ level: "warning", message: `no escape route for pad ${job.label} — A* will route from the pad directly`, net: job.net.name });
      stubMap.set(`${job.net.name}#${job.idx}`, { path: [], gx: job.cell.gx, gy: job.cell.gy, layer: job.cell.layers[0] as 0 | 1, pad: job.cell });
    }
  }

  // ── phase 2: negotiated-congestion routing (PathFinder style) ─────────
  // All MST edges route in multiple rounds. In each round every edge is
  // re-routed with a rising penalty for cells contested by other nets, so
  // nets negotiate around each other instead of hard-blocking. The final
  // round hard-blocks contested cells: whatever it produces is DRC-clean.
  const edgePool: Array<{ net: Net; a: number; b: number; d: number }> = [];
  const stubsByNet = new Map<string, Stub[]>();
  for (const net of nets) {
    if (net.name === "GND") continue; // handled by the B.Cu pour zone
    const cells = padCellsOf(net);
    const stubs: Stub[] = cells.map((_, i) => stubMap.get(`${net.name}#${i}`)!);
    stubsByNet.set(net.name, stubs);
    if (net.pads.length < 2) continue;
    const distTo = (a: Stub, b: Stub) => Math.abs(a.gx - b.gx) + Math.abs(a.gy - b.gy);
    const inTree = new Set<number>([0]);
    while (inTree.size < stubs.length) {
      let best: [number, number] = [-1, -1], bestD = Infinity;
      for (const a of inTree)
        for (let b = 0; b < stubs.length; b++) {
          if (inTree.has(b)) continue;
          const d = distTo(stubs[a], stubs[b]);
          if (d < bestD - 1e-9 || (d === bestD && (best[1] === -1 || b < best[1]))) { bestD = d; best = [a, b]; }
        }
      inTree.add(best[1]);
      edgePool.push({ net, a: best[0], b: best[1], d: bestD });
    }
  }
  // longest-first: long nets have the fewest alternatives
  edgePool.sort((e1, e2) => e2.d - e1.d || (e1.net.name < e2.net.name ? -1 : 1) || e1.b - e2.b);

  const netIdx = new Map<string, number>();
  nets.forEach((n, i) => netIdx.set(n.name, i));
  // dynamic usage maps: which net currently occupies each cell (+via cells),
  // and a historical congestion counter
  const useNet: [Int16Array, Int16Array] = [new Int16Array(layerCells).fill(-1), new Int16Array(layerCells).fill(-1)];
  const history: [Float32Array, Float32Array] = [new Float32Array(layerCells), new Float32Array(layerCells)];
  const edgePaths = new Array<PathStep[] | null>(edgePool.length).fill(null);

  const ROUNDS = 5;
  for (let round = 0; round < ROUNDS; round++) {
    const finalRound = round === ROUNDS - 1;
    const penalty = Math.pow(2, round + 2); // 4, 8, 16, 32, then hard
    useNet[0].fill(-1); useNet[1].fill(-1);
    // stub reservations persist (they are the pads' escape corridors)
    for (const net of nets) {
      const idx = netIdx.get(net.name)!;
      const stubs = stubsByNet.get(net.name);
      if (!stubs) continue;
      for (const s of stubs) for (const p of s.path) useNet[p.layer][p.gy * nx + p.gx] = idx;
    }
    for (let e = 0; e < edgePool.length; e++) {
      const { net, a, b } = edgePool[e];
      const stubs = stubsByNet.get(net.name)!;
      const mid = aStar(stubs[a], stubs[b], netIdx.get(net.name)!, penalty, finalRound);
      if (mid) {
        const full = [...stubs[a].path, ...mid, ...stubs[b].path.slice().reverse()];
        edgePaths[e] = full;
        const idx = netIdx.get(net.name)!;
        for (const p of full) useNet[p.layer][p.gy * nx + p.gx] = idx;
      } else if (edgePaths[e]) {
        edgePaths[e] = null; // keep null; it failed this round
      }
    }
    // accumulate congestion history
    for (let l = 0; l < 2; l++)
      for (let i = 0; i < layerCells; i++)
        if (useNet[l][i] >= 0) history[l][i] += 0.5;
  }

  // emit final copper + failures

  const okNets = new Set<string>();
  edgePool.forEach((e, i) => {
    if (!edgePaths[i]) {
      warnings.push({ level: "warning", message: `could not route ${e.net.name} between pads ${e.a + 1} and ${e.b + 1}`, net: e.net.name });
      return;
    }
    applyPath(edgePaths[i]!, e.net.name);
    okNets.add(e.net.name);
  });
  for (const net of nets) {
    if (net.name === "GND") { routedNets++; continue; }
    if (net.pads.length < 2) { routedNets++; continue; }
    if (okNets.has(net.name)) routedNets++; else failedNets++;
  }

  function aStar(from: Stub, to: Stub, netI: number, penalty: number, hard: boolean): PathStep[] | null {
    const ownCore = new Set<number>();
    const ownHalo = new Set<number>();
    // stub end cells are reserved core but belong to this net's pads
    ownCore.add(key(from.gx, from.gy, from.layer));
    ownCore.add(key(to.gx, to.gy, to.layer));
    // if the stub is empty (fan-out failed) escape directly from the pad
    const fromPad = from.path.length === 0 ? from.pad : null;
    const toPad = to.path.length === 0 ? to.pad : null;
    for (const c of [fromPad, toPad]) {
      if (!c) continue;
      const cr = Math.ceil(c.r / RES);
      for (let dy = -cr; dy <= cr; dy++)
        for (let dx = -cr; dx <= cr; dx++) {
          if (dx * dx + dy * dy > ((c.r + 1e-9) / RES) ** 2) continue;
          const gx = c.gx + dx, gy = c.gy + dy;
          if (gx < 0 || gx >= nx || gy < 0 || gy >= ny) continue;
          for (const l of c.layers) {
            ownHalo.add(key(gx, gy, l));
          }
        }
      for (const l of c.layers) ownCore.add(key(c.gx, c.gy, l));
    }
    const goalSet = new Set<number>();
    if (toPad) { for (const l of toPad.layers) goalSet.add(key(to.gx, to.gy, l)); }
    else goalSet.add(key(to.gx, to.gy, to.layer));

    const dist = new Float32Array(layerCells * 2).fill(Infinity);
    const prev = new Int32Array(layerCells * 2).fill(-1);
    const closed = new Uint8Array(layerCells * 2);
    const heap = new Heap();
    const startLayer = from.layer;
    const startK = key(from.gx, from.gy, startLayer);
    dist[startK] = 0;
    heap.push(0, startK);
    if (fromPad) for (const l of fromPad.layers) { const k = key(from.gx, from.gy, l); dist[k] = 0; heap.push(0, k); }

    const goalLayer = toPad ? null : to.layer;
    const H = (gx: number, gy: number, l: number) => {
      const h = Math.abs(gx - to.gx) + Math.abs(gy - to.gy);
      return goalLayer == null || l === goalLayer ? h : h + VIA_COST;
    };
    const DIRS: Array<[number, number, number]> = [
      [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
      [1, 1, DIAG], [1, -1, DIAG], [-1, 1, DIAG], [-1, -1, DIAG],
    ];
    let goalNode = -1, iter = 0;
    while (heap.size && iter++ < 150000) {
      const popped = heap.pop()!;
      const node = popped[1];
      if (closed[node]) continue;
      closed[node] = 1;
      if (goalSet.has(node)) { goalNode = node; break; }
      const l = Math.floor(node / layerCells);
      const rest = node % layerCells;
      const gy = Math.floor(rest / nx), gx = rest % nx;
      const dyn = (ngx: number, ngy: number, nl: number): number => {
        // returns the extra cost of entering this cell (0 if free for us)
        const idx = ngy * nx + ngx;
        const u = useNet[nl][idx];
        if (u < 0 || u === netI) return 0;
        return hard ? Infinity : penalty;
      };
      const free = (ngx: number, ngy: number, nl: number) => {
        if (ngx < 0 || ngx >= nx || ngy < 0 || ngy >= ny) return false;
        const idx = ngy * nx + ngx;
        if (grid.core[nl][idx] && !ownCore.has(key(ngx, ngy, nl))) return false;
        if (grid.halo[nl][idx] && !ownHalo.has(key(ngx, ngy, nl))) return false;
        return true;
      };
      const hist = (ngx: number, ngy: number, nl: number) => history[nl][ngy * nx + ngx];
      for (const [dx, dy, cost] of DIRS) {
        const ngx = gx + dx, ngy = gy + dy;
        if (!free(ngx, ngy, l)) continue;
        const d = dyn(ngx, ngy, l);
        if (!isFinite(d)) continue;
        if (dx && dy && (!free(gx + dx, gy, l) || !free(gx, gy + dy, l))) continue;
        const nk = key(ngx, ngy, l);
        const nd = dist[node] + cost + d + hist(ngx, ngy, l);
        if (nd < dist[nk] - 1e-9 && !closed[nk]) {
          dist[nk] = nd; prev[nk] = node;
          heap.push(nd + H(ngx, ngy, l), nk);
        }
      }
      const nl = l === 0 ? 1 : 0;
      const nk = key(gx, gy, nl);
      const dvia = dyn(gx, gy, nl);
      if (isFinite(dvia) && free(gx, gy, nl) && !closed[nk]) {
        const nd = dist[node] + VIA_COST + dvia + hist(gx, gy, nl);
        if (nd < dist[nk] - 1e-9) { dist[nk] = nd; prev[nk] = node; heap.push(nd + H(gx, gy, nl), nk); }
      }
    }
    if (goalNode === -1) return null;
    const path: PathStep[] = [];
    let node: number = goalNode;
    while (node !== -1) {
      const l = Math.floor(node / layerCells);
      const rest = node % layerCells;
      path.push({ gx: rest % nx, gy: Math.floor(rest / nx), layer: l as 0 | 1 });
      node = prev[node];
    }
    path.reverse();
    return path;
  }

  function toWorld(s: PathStep) {
    return {
      x: Math.round((x0 + s.gx * RES) * 1000) / 1000,
      y: Math.round((y0 + s.gy * RES) * 1000) / 1000,
    };
  }

  function simplify(pts: PathStep[]): PathStep[] {
    if (pts.length < 3) return pts;
    const out = [pts[0]];
    for (let i = 1; i < pts.length - 1; i++) {
      const a = out[out.length - 1], b = pts[i], c = pts[i + 1];
      const cross = (b.gx - a.gx) * (c.gy - b.gy) - (b.gy - a.gy) * (c.gx - b.gx);
      if (Math.abs(cross) < 1e-9) continue;
      out.push(b);
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  function applyPath(path: PathStep[], netName: string) {
    if (path.length < 2) return;
    const width = netName === "+3V3" ? TRACE_W_POWER : TRACE_W;
    const layerName = (l: 0 | 1) => (l === 0 ? "F.Cu" : "B.Cu");
    let runStart = 0;
    for (let k = 1; k <= path.length; k++) {
      const isRunEnd = k === path.length || path[k].layer !== path[runStart].layer;
      if (!isRunEnd) continue;
      const run = simplify(path.slice(runStart, k));
      for (let m = 0; m < run.length - 1; m++) {
        const s = toWorld(run[m]), e = toWorld(run[m + 1]);
        if (Math.abs(s.x - e.x) < 1e-6 && Math.abs(s.y - e.y) < 1e-6) continue;
        segments.push({ start: s, end: e, width, layer: layerName(path[runStart].layer), net: netName });
        traceMm += Math.hypot(e.x - s.x, e.y - s.y);
      }
      if (k < path.length) {
        const at = toWorld(run[run.length - 1]);
        vias.push({ at, size: VIA_SIZE, drill: VIA_DRILL, net: netName });
        const gx = cxOf(at.x), gy = cyOf(at.y);
        grid.core[0][gy * nx + gx] = 1;
        grid.core[1][gy * nx + gx] = 1;
      }
      runStart = k;
    }
  }

  return { segments, vias, warnings, routedNets, failedNets, traceMm };
}
