import { generatePcb } from "../src/index.ts";
import { renderSvg } from "../src/preview.ts";
import { writeFileSync } from "node:fs";
import { placeComponents } from "../src/layout.ts";
import { buildSilkscreen } from "../src/silkscreen.ts";

const layouts: Array<[string, any]> = [
  ["ninepad", { grid: { rows: 3, cols: 3 }, options: { hotswap: true },
    cells: Array.from({ length: 9 }, (_, i) => {
      const row = Math.floor(i / 3), col = i % 3;
      return col === 2 && row === 0 ? { row, col, type: "encoder", label: "VOL" } : { row, col, type: "key" as const, label: `${i + 1}` };
    }) }],
  ["streamdeck", { grid: { rows: 3, cols: 4 }, options: { hotswap: true },
    cells: [
      { row: 0, col: 0, type: "key", label: "M1" }, { row: 0, col: 1, type: "key", label: "M2" },
      { row: 0, col: 2, type: "encoder", label: "MIX" }, { row: 0, col: 3, type: "oled" },
      ...[1, 2].flatMap(r => [0, 1, 2, 3].map(c => ({ row: r, col: c, type: "key" as const, label: `M${(r - 1) * 4 + c + 3}` }))),
    ] }],
];
for (const [name, layout] of layouts) {
  const out = generatePcb(layout);
  const ctx = placeComponents(layout);
  const svg = renderSvg(ctx, out.result, 640);
  writeFileSync(`out/${name}.svg`, svg);
  console.log(`${name}.svg written (${svg.length} bytes)`);
}
