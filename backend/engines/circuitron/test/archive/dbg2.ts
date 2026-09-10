import { generatePcb } from "../src/index.ts";
import { KeeberiaLayout } from "../src/types.ts";
// ninepad failing: K6, K7, K8 — right column keys. Dump those pads and the
// obstacles around them.
const layout: KeeberiaLayout = {
  name: "ninepad", grid: { rows: 3, cols: 3 }, options: { hotswap: true },
  cells: Array.from({ length: 9 }, (_, i) => {
    const row = Math.floor(i / 3), col = i % 3;
    return col === 2 && row === 0 ? { row, col, type: "encoder", label: "VOL" } : { row, col, type: "key" as const, label: `${i + 1}` };
  }),
};
const out = generatePcb(layout);
for (const nname of ["K6", "K7", "K8"]) {
  const n = out.result.nets.find(n => n.name === nname)!;
  console.log(nname, n.pads.map(p => `${p.ref}.${p.pad} (${p.pos.x.toFixed(1)},${p.pos.y.toFixed(1)}) ${p.side}`).join(" | "));
}
console.log("SW6/7/8 nets:", out.result.placements.filter(p => ["SW6","SW7","SW8"].includes(p.ref)).map(p => `${p.ref}@${p.pos.x.toFixed(1)},${p.pos.y.toFixed(1)} nets=${JSON.stringify(p.nets)}`));
console.log("U1 pos:", out.result.placements.find(p=>p.ref==="U1")!.pos);
const segs = out.result.segments.filter(s => ["K6","K7","K8"].includes(s.net));
console.log("K6-K8 segments:", segs.length);
