/**
 * silhouette regression: the board edge follows the arrangement.
 *
 * the ui lets you put switches anywhere, so a pad is often not a rectangle. the
 * engine used to take the bounding box of every part, which meant an L, a T or a
 * ring silently shipped as a rectangle with dead board where the notch should
 * be: the user drew a shape and got a rectangle back.
 *
 * the rule: the board is the envelope everything must fit inside, minus the
 * cells the user blocked. a part never carves a notch (the mcu and a display sit
 * on the board, they do not reshape it), an empty cell always does, because that
 * is the shape the user painted. unioning part courtyards instead looked honest
 * and made every display a wing; on the reference streamdeck it cost six nets
 * of routing space, which the fab suite caught.
 *
 * this suite locks: a painted step survives (L/T), a plain block stays plain,
 * a blocked cell inside becomes a millable hole, disconnected shapes are
 * refused, and the geometry that ships still keeps every pad on the board.
 *
 * engine-level cases then prove the rest of the pipeline agrees: pads stay on
 * the board, mounting holes land on real corners, a blocked cell in the middle
 * becomes a cutout with a fab-legal slot, and every reference board still
 * produces its known dimensions.
 */
import { generatePcb } from "../src/index.ts";
import { layouts } from "./layouts.ts";
import { placeComponents } from "../src/layout.ts";
import { pointInShape } from "../src/outline.ts";
import { exportGerbers } from "../src/gerber.ts";
import { padAbsPos } from "../src/layout.ts";
import { FOOTPRINTS } from "../src/footprints.ts";
import { uniteRects, boardRegion, rect, coalesceRects, signedArea, mountableCorners } from "../src/silhouette.ts";

let failed = 0;
const check = (label: string, cond: boolean, detail = "") => {
  if (!cond) { failed++; console.log(`FAIL ${label}${detail ? `: ${detail}` : ""}`); }
  else console.log(`ok   ${label}`);
};

const loopArea = (pts: { x: number; y: number }[]) => Math.abs(signedArea(pts));

// ── 1. the union itself ────────────────────────────────────────────────────
const one = uniteRects([rect(0, 0, 10, 10)]);
check("single rect stays a rect", one.ok && one.silhouette.rectangular && one.silhouette.outer.length === 4);

const L = uniteRects([rect(0, 0, 10, 10), rect(10, 0, 20, 10), rect(0, 10, 10, 20)]);
check("L keeps its step", L.ok && !L.silhouette.rectangular && L.silhouette.outer.length === 6, L.ok ? `${L.silhouette.outer.length} pts` : L.error);
check("L covers the right area", L.ok && loopArea(L.silhouette.outer) === 300, L.ok ? `${loopArea(L.silhouette.outer)}` : "");

const T = uniteRects([rect(0, 0, 30, 10), rect(10, 10, 20, 20)]);
check("T keeps its stem", T.ok && !T.silhouette.rectangular && T.silhouette.outer.length === 8);
check("T covers the right area", T.ok && loopArea(T.silhouette.outer) === 400);

const ringRects = [];
for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (!(i === 1 && j === 1)) ringRects.push(rect(i * 10, j * 10, i * 10 + 10, j * 10 + 10));
const ring = uniteRects(ringRects);
check("ring keeps its hole", ring.ok && ring.silhouette.holes.length === 1 && loopArea(ring.silhouette.holes[0]) === 100);
check("a rect with a hole is not emitted as a plain rect", ring.ok && !ring.silhouette.rectangular);

const split = uniteRects([rect(0, 0, 10, 10), rect(20, 0, 30, 10)]);
check("two disconnected pieces are refused", !split.ok && /disconnected/.test(split.error), split.ok ? "" : split.error);

// the region rule: envelope minus blockers
const notch = boardRegion(rect(0, 0, 30, 20), [rect(0, 0, 10, 10)]);
check("a corner blocker becomes a notch", notch.ok && !notch.silhouette.rectangular && notch.silhouette.outer.length === 6);
check("the notch removes exactly the blocked area", notch.ok && loopArea(notch.silhouette.outer) === 500);

const interior = boardRegion(rect(0, 0, 30, 30), [rect(10, 10, 20, 20)]);
check("an interior blocker becomes a hole", interior.ok && interior.silhouette.holes.length === 1 && loopArea(interior.silhouette.holes[0]) === 100);

const plain = boardRegion(rect(0, 0, 30, 20), []);
check("no blockers means a plain envelope", plain.ok && plain.silhouette.rectangular);

const touching = uniteRects([rect(0, 0, 10, 10), rect(10, 10, 20, 20)]);
check("a diagonal touch traces one pinched loop", touching.ok && touching.silhouette.outer.length === 8);

// ── 2. hairline stairs are coalesced, real steps are not ──────────────────
const stair = coalesceRects([rect(0, 0, 10, 10), rect(0, 0.29, 20, 10)]);
check("a 0.29mm stair is merged outward", Math.abs(stair[0].y0 - stair[1].y0) < 1e-9, `${stair[0].y0} vs ${stair[1].y0}`);
const realStep = coalesceRects([rect(0, 0, 10, 10), rect(0, 3, 20, 10)]);
check("a 3mm step is left alone", Math.abs(realStep[0].y0 - realStep[1].y0) > 1, `${realStep[0].y0} vs ${realStep[1].y0}`);

// ── 3. engine: an L-shaped pad ────────────────────────────────────────────
const lLayout: any = {
  name: "silhouette-l",
  grid: { rows: 3, cols: 3 },
  options: { boardName: "keeberia-l", hotswap: true },
  cells: [
    { row: 0, col: 0, type: "key", label: "1" },
    { row: 0, col: 1, type: "key", label: "2" },
    { row: 1, col: 0, type: "key", label: "3" },
    { row: 1, col: 1, type: "key", label: "4" },
    { row: 2, col: 0, type: "key", label: "5" },
    { row: 2, col: 1, type: "key", label: "6" },
    { row: 0, col: 2, type: "blocker" },
    { row: 1, col: 2, type: "blocker" },
    { row: 2, col: 2, type: "key", label: "9" },
  ],
};
const lOut = generatePcb(lLayout);
const lShape = lOut.outline.shape;
check("an L layout ships a polygon edge", lShape === "polygon", String(lShape));
check("the L layout has no fabrication errors", lOut.result.warnings.every((r: any) => r.level !== "error"),
  lOut.result.warnings.filter((r: any) => r.level === "error").map((r: any) => r.message).join("; "));

const lResolved = placeComponents(lLayout);
const lPts = (lResolved.shape as any)?.points ?? [];
if (lPts.length >= 3) {
  const shape = { kind: "polygon" as const, points: lPts };
  let outside = 0;
  for (const pl of lResolved.placements) {
    for (const pad of FOOTPRINTS[pl.library].pads) {
      const abs = padAbsPos(pl, pad.pad);
      if (!pointInShape(shape, abs, 0)) outside++;
    }
  }
  check("every pad of the L is on the board", outside === 0, `${outside} pads outside`);
  const holes = lResolved.placements.filter((p) => p.library === "keeberia:Mount_M2");
  const badHoles = holes.filter((p) => !pointInShape(shape, p.pos, 0));
  check("every mounting hole is on the L", holes.length > 0 && badHoles.length === 0, `${holes.length} holes, ${badHoles.length} outside`);
} else {
  check("the L layout produced polygon points", false, `${lPts.length} points`);
}

// blocking the row the mcu sits under must refuse, never quietly clip the mcu
const underMcu: any = {
  name: "silhouette-under-mcu",
  grid: { rows: 3, cols: 3 },
  options: { boardName: "keeberia-under", hotswap: true },
  cells: [
    ...Array(6).keys(),
  ].map((i) => ({ row: Math.floor(i / 3), col: i % 3, type: "key", label: String(i + 1) }))
    .concat([2, 2, 2].map((row, i) => ({ row, col: i, type: "blocker" }))),
};
const underOut = generatePcb(underMcu);
const underErrors = underOut.result.warnings.filter((r: any) => r.level === "error").map((r: any) => r.message);
// either verdict is honest: the shape falls apart, or a pad no longer fits
check("blocking the row under the mcu is refused",
  underErrors.some((m: string) => /disconnected|outside the board silhouette/.test(m)),
  underErrors.join("; ") || "no error raised");

// ── 4. engine: a blocked cell in the middle is a real hole ────────────────
const ringLayout: any = {
  name: "silhouette-ring",
  grid: { rows: 3, cols: 3 },
  options: { boardName: "keeberia-ring", hotswap: true },
  cells: [...Array(9).keys()].map((i) => ({
    row: Math.floor(i / 3), col: i % 3,
    type: i === 4 ? "blocker" : "key",
    label: String(i + 1),
  })),
};
const ringOut = generatePcb(ringLayout);
const ringCutouts = (ringOut.outline as any).cutouts ?? [];
check("an interior blocked cell becomes a cutout", ringCutouts.length === 1, `${ringCutouts.length} cutouts`);
if (ringCutouts.length) {
  const xs = ringCutouts[0].map((p: any) => p.x);
  const ys = ringCutouts[0].map((p: any) => p.y);
  const wMin = Math.min(...xs), wMax = Math.max(...xs), hMin = Math.min(...ys), hMax = Math.max(...ys);
  check("the hole is big enough to mill", Math.min(wMax - wMin, hMax - hMin) >= 1, `${(wMax - wMin).toFixed(2)}mm`);
}
// the hole has to reach the fab as a routed slot, not just as outline data
const ringShape = ringOut.outline.shape === "polygon"
  ? { kind: "polygon" as const, points: ringOut.outline.points }
  : { kind: "rect" as const, width: ringOut.outline.bbox.width, height: ringOut.outline.bbox.height, cornerRadius: ringOut.outline.cornerRadius };
const ringGerbers = exportGerbers(ringOut.result, ringShape, ringOut.outline.cutouts);
const rout = ringGerbers.files["keeberia-cutouts.drl"] ?? "";
const slotCount = (rout.match(/G85/g) ?? []).length;
const loopEdges = (ringOut.outline.cutouts[0] ?? []).length;
check("the hole reaches the drill file as a routed slot", slotCount > 0 && slotCount === loopEdges,
  `${slotCount} slots for ${loopEdges} loop edges`);
check("no fabrication errors from the ring board", ringGerbers.warnings.every((w: any) => w.level !== "error"),
  ringGerbers.warnings.filter((w: any) => w.level === "error").map((w: any) => w.message).join("; "));

// ── 5. reference boards keep their dimensions ─────────────────────────────
const dims: Record<string, [number, number, boolean]> = {
  "hackpad-3key": [58.3, 42.95, true],
  "ninepad": [60.3, 82.05, true],
  "streamdeck": [89.75, 92.45, true], // all cells painted, so the display wing is absorbed
  "ninepad-choc": [57.15, 80.475, true],
};
for (const [name, layout] of layouts) {
  const out = generatePcb(layout as any);
  const bbox = (out.outline as any).bbox;
  const want = dims[name];
  if (!want) continue;
  check(`${name}: ${want[0]} x ${want[1]}mm`, Math.abs(bbox.width - want[0]) < 0.01 && Math.abs(bbox.height - want[1]) < 0.01,
    `${bbox.width} x ${bbox.height}`);
  check(`${name}: shape is ${want[2] ? "a rect" : "a polygon"}`, ((out.outline as any).shape === "rect") === want[2], String((out.outline as any).shape));
}

if (failed) { console.log(`\nsilhouette: ${failed} failed`); process.exit(1); }
console.log("\nsilhouette: all checks passed");
