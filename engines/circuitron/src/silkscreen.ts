/**
 * Silkscreen: key legends above each switch, board name on the back,
 * MCU pin-1 marker.
 */
import { BoardCtx } from "./layout.ts";
import { FOOTPRINTS } from "./footprints.ts";
import { Pt } from "./types.ts";

export function buildSilkscreen(ctx: BoardCtx): Array<{ kind: "text" | "line"; pos: Pt; text?: string; size?: number; rot?: number; layer: string }> {
  const items: Array<any> = [];
  for (const pl of ctx.placements) {
    if (!pl.cellRef) continue;
    const label = pl.cellRef.label ?? pl.ref;
    items.push({
      kind: "text",
      pos: { x: pl.pos.x, y: pl.pos.y - 9.6 },
      text: label,
      size: 0.8,
      layer: "F.SilkS",
    });
  }
  // board name on back (mirrored automatically by layer)
  items.push({
    kind: "text",
    pos: { x: 0, y: ctx.outline.height / 2 - 1.6 },
    text: ctx.options.boardName,
    size: 1,
    layer: "B.SilkS",
  });
  return items;
}
