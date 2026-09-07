import { generatePcb } from "../src/index.ts";
import { KeeberiaLayout } from "../src/types.ts";
const layout: KeeberiaLayout = {
  name: "ninepad", grid: { rows: 3, cols: 3 }, options: { hotswap: true },
  cells: [
    { row: 0, col: 0, type: "key", label: "1" },
    { row: 0, col: 1, type: "key", label: "2" },
    { row: 0, col: 2, type: "encoder", label: "VOL" },
    { row: 1, col: 0, type: "key", label: "4" },
    { row: 1, col: 1, type: "key", label: "5" },
    { row: 1, col: 2, type: "key", label: "6" },
    { row: 2, col: 0, type: "key", label: "7" },
    { row: 2, col: 1, type: "key", label: "8" },
    { row: 2, col: 2, type: "key", label: "9" },
  ],
};
const out = generatePcb(layout);
const k1 = out.result.nets.find(n => n.name === "K1")!;
console.log("K1 pads:", k1.pads.map(p => `${p.ref}.${p.pad} @ (${p.pos.x.toFixed(2)}, ${p.pos.y.toFixed(2)})`).join("  "));
const u1 = out.result.placements.find(p => p.ref === "U1")!;
console.log("U1 pos:", u1.pos, "side:", u1.side);
console.log("U1 D0/D1/D2 net:", u1.nets["D0"], u1.nets["D1"], u1.nets["D2"]);
const k1segs = out.result.segments.filter(s => s.net === "K1");
console.log(`K1 segments (${k1segs.length}):`);
for (const s of k1segs.slice(-6)) console.log(`  ${s.layer} (${s.start.x},${s.start.y}) -> (${s.end.x},${s.end.y})`);
