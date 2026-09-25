import { placeComponents } from "../src/layout.ts";
import { buildNetlist } from "../src/netlist.ts";
import { routeAll } from "../src/route.ts";
(globalThis as any).KEEBERIA_DEBUG = "K6";
const ctx = placeComponents({ grid: { rows: 3, cols: 3 }, options: { hotswap: true },
  cells: Array.from({length: 9}, (_, i) => {
    const row = Math.floor(i/3), col = i%3;
    return col===2 && row===0 ? {row,col,type:"encoder",label:"VOL"} : {row,col,type:"key" as const,label:`${i+1}`};
  })});
const nl = buildNetlist(ctx);
const r = routeAll(ctx, nl.nets);
console.log("routed:", r.routedNets, "failed:", r.failedNets);
console.log("warnings:", r.warnings.map(w=>w.message));
