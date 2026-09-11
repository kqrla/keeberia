// freerouting bridge validation: dsn out → freerouting routes → ses in →
// our own drc judges the result. skips cleanly when FREEROUTING_BIN is
// not wired (CI); in the sandbox we run the real thing.
//
// the bar, honestly stated:
//   1. every net with pads receives wires
//   2. every pad of every net actually touches that net's copper
//      (point-to-segment distance within pad radius + trace width)
//   3. all segments land inside the board outline
//   4. keeberia's own drc passes on the imported routes — the same
//      bar the engine's a* router is held to. freerouting's internal
//      "violations" counter flags input board state it cannot fix;
//      our drc is the manufacture gate.
import { generatePcb } from "../src/index.ts";
import { placeComponents } from "../src/layout.ts";
import { exportDsn } from "../src/dsn.ts";
import { parseSes } from "../src/ses.ts";
import { runDrc } from "../src/drc.ts";
import { layouts } from "./layouts.ts";
import { FootprintDef, PcbResult, Segment, Via } from "../src/types.ts";
import { FOOTPRINTS } from "../src/footprints.ts";
import { padAbsPos } from "../src/layout.ts";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const bin = process.env.FREEROUTING_BIN;
if (!bin) {
  console.log("freerouting bridge: SKIPPED (FREEROUTING_BIN not set)");
  process.exit(0);
}
const java = process.env.FREEROUTING_JAVA || "java";
mkdirSync("out/freerouting", { recursive: true });

let failed = false;

function runFreerouting(dsnPath: string, sesPath: string) {
  return bin.endsWith(".jar")
    ? spawnSync(java, ["-jar", bin, "-de", dsnPath, "-do", sesPath], { timeout: 300000, encoding: "utf8" })
    : spawnSync(bin, ["-de", dsnPath, "-do", sesPath], { timeout: 300000, encoding: "utf8" });
}

for (const [name, layout] of layouts) {
  const out = generatePcb(layout);
  const ctx = { ...placeComponents(layout), placements: out.result.placements };
  const nets = out.netlist.nets.filter((n) => n.pads.length > 1); // single-pad power stubs: nothing to route

  const dsn = exportDsn(out.result, out.netlist.nets);
  writeFileSync(`out/freerouting/${name}.dsn`, dsn);

  const dir = mkdtempSync(join(tmpdir(), "keeberia-fr-"));
  const dsnPath = join(dir, "board.dsn");
  const sesPath = join(dir, "board.ses");
  writeFileSync(dsnPath, dsn);
  const run = runFreerouting(dsnPath, sesPath);
  try {
    if (run.status !== 0) {
      console.log(`${name}: freerouting exited ${run.status} — ${(run.stderr || run.stdout || "").slice(0, 300)}`);
      failed = true;
      continue;
    }
    const routes = parseSes(readFileSync(sesPath, "utf8"));

    // 1. all nets wired
    const missing = nets.filter((n) => !routes.routedNetNames.has(n.name));
    if (missing.length) { console.log(`${name}: nets unrouted: ${missing.map((m) => m.name).join(", ")}`); failed = true; }

    // 2. connectivity: every pad touches its net's copper
    const segsByNet = new Map<string, Segment[]>();
    for (const s of routes.segments) {
      const arr = segsByNet.get(s.net) ?? [];
      arr.push(s);
      segsByNet.set(s.net, arr);
    }
    const padReach = (p: { x: number; y: number }, s: Segment) => {
      const dx = s.end.x - s.start.x, dy = s.end.y - s.start.y;
      const len2 = dx * dx + dy * dy;
      const t = len2 ? Math.max(0, Math.min(1, ((p.x - s.start.x) * dx + (p.y - s.start.y) * dy) / len2)) : 0;
      const cx = s.start.x + t * dx, cy = s.start.y + t * dy;
      return Math.hypot(p.x - cx, p.y - cy);
    };
    let orphan = 0;
    for (const n of nets) {
      const segs = segsByNet.get(n.name) ?? [];
      for (const pd of n.pads) {
        const pl = out.result.placements.find((x) => x.ref === pd.ref);
        if (!pl) continue;
        const fp = FOOTPRINTS[pl.library] as FootprintDef | undefined;
        const pad = fp?.pads.find((x) => x.pad === pd.pad);
        const padR = (pad ? Math.max(pad.size.w, pad.size.h) : 1.0) / 2 + 0.3;
        const touch = segs.some((s) => padReach(pd.pos, s) <= padR) ||
          routes.vias.some((v) => v.net === n.name && Math.hypot(v.at.x - pd.pos.x, v.at.y - pd.pos.y) <= padR);
        if (!touch) { orphan++; console.log(`${name}: pad ${pd.ref}-${pd.pad} (net ${n.name}) not connected`); }
      }
    }
    if (orphan) failed = true;

    // 3. inside the board
    const w = out.result.outline.width / 2, h = out.result.outline.height / 2;
    const outside = routes.segments.filter((s) =>
      Math.abs(s.start.x) > w || Math.abs(s.end.x) > w || Math.abs(s.start.y) > h || Math.abs(s.end.y) > h);
    if (outside.length) { console.log(`${name}: ${outside.length} segments outside the outline`); failed = true; }

    // 4. our drc on imported routes
    const imported: PcbResult = { ...out.result, segments: routes.segments, vias: routes.vias };
    const drc = runDrc(ctx as never, imported);
    const errors = (drc as unknown as { warnings?: Array<{ level: string }> }).warnings
      ? (drc as unknown as { warnings: Array<{ level: string }> }).warnings.filter((x) => x.level === "error")
      : [];
    if (errors.length) { console.log(`${name}: drc errors on freerouting routes: ${errors.length}`); failed = true; }

    const traceMm = Math.round(routes.segments.reduce((a, s) => a + Math.hypot(s.end.x - s.start.x, s.end.y - s.start.y), 0));
    console.log(`${name}: freerouting routed ${nets.length - missing.length}/${nets.length} nets, ` +
      `${routes.segments.length} segs, ${routes.vias.length} vias, ${traceMm}mm trace, drc ${errors.length} errors`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (failed) { console.log("freerouting bridge: FAILED"); process.exit(1); }
console.log("freerouting bridge: all reference layouts route clean through the bridge");
