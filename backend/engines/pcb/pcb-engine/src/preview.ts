/** SVG preview renderer: PcbResult → 2D board drawing (for the frontend + chat). */
import { PcbResult, Pt } from "./types.ts";
import { BoardCtx, padAbsPos } from "./layout.ts";
import { FOOTPRINTS } from "./footprints.ts";

export function renderSvg(ctx: BoardCtx, result: PcbResult, width = 720): string {
  const { width: bw, height: bh } = ctx.outline;
  const scale = width / (bw + 4);
  const h = Math.ceil((bh + 4) * scale);
  const tx = (x: number) => ((x + bw / 2 + 2) * scale).toFixed(2);
  const ty = (y: number) => ((y + bh / 2 + 2) * scale).toFixed(2);
  const parts: string[] = [];

  parts.push(`<rect x="0" y="0" width="${width}" height="${h}" fill="#111"/>`);
  // board substrate
  parts.push(`<rect x="${tx(-bw / 2)}" y="${ty(-bh / 2)}" width="${(bw * scale).toFixed(2)}" height="${(bh * scale).toFixed(2)}" rx="${(ctx.outline.cornerRadius * scale).toFixed(2)}" fill="#144b14" stroke="#39d353" stroke-width="1"/>`);

  // GND pour hint
  parts.push(`<rect x="${tx(-bw / 2 + 1)}" y="${ty(-bh / 2 + 1)}" width="${((bw - 2) * scale).toFixed(2)}" height="${((bh - 2) * scale).toFixed(2)}" rx="3" fill="#0d3a0d" opacity="0.55"/>`);

  // copper layers
  for (const seg of result.segments) {
    const col = seg.layer === "F.Cu" ? "#c95b0e" : "#37b3ff";
    parts.push(`<line x1="${tx(seg.start.x)}" y1="${ty(seg.start.y)}" x2="${tx(seg.end.x)}" y2="${ty(seg.end.y)}" stroke="${col}" stroke-width="${Math.max(0.7, seg.width * scale * 1.6).toFixed(2)}" stroke-linecap="round" opacity="0.95"/>`);
  }
  for (const via of result.vias) {
    parts.push(`<circle cx="${tx(via.at.x)}" cy="${ty(via.at.y)}" r="${(via.size / 2 * scale * 1.4).toFixed(2)}" fill="#ffd23f"/>`);
  }
  // pads
  for (const pl of ctx.placements) {
    const fp = FOOTPRINTS[pl.library];
    for (const pad of fp.pads) {
      const p = padAbsPos(pl, pad.pad);
      const net = pl.nets[pad.pad];
      const col = net === "GND" ? "#8a8a8a" : net === "+3V3" ? "#c95b0e" : net ? "#e8e8e8" : "#555";
      parts.push(`<rect x="${tx(p.x - pad.size.w / 2)}" y="${ty(p.y - pad.size.h / 2)}" width="${(pad.size.w * scale).toFixed(2)}" height="${(pad.size.h * scale).toFixed(2)}" rx="1" fill="${col}" opacity="0.95"/>`);
    }
    // courtyard hint
    parts.push(`<rect x="${tx(pl.pos.x - fp.size.w / 2)}" y="${ty(pl.pos.y - fp.size.h / 2)}" width="${(fp.size.w * scale).toFixed(2)}" height="${(fp.size.h * scale).toFixed(2)}" fill="none" stroke="#ffffff22" stroke-width="0.5"/>`);
  }
  // mounting holes
  for (const pl of ctx.placements) {
    if (FOOTPRINTS[pl.library]?.category !== "hole") continue;
    parts.push(`<circle cx="${tx(pl.pos.x)}" cy="${ty(pl.pos.y)}" r="${(2.2 / 2 * scale).toFixed(2)}" fill="#111" stroke="#fff" stroke-width="0.6"/>`);
  }
  // silkscreen
  for (const s of result.silkscreen) {
    if (s.kind !== "text") continue;
    const layerCol = s.layer.startsWith("F") ? "#e8f5e9" : "#9fb59f";
    parts.push(`<text x="${tx(s.pos.x)}" y="${ty(s.pos.y)}" fill="${layerCol}" font-size="${((s.size ?? 1) * scale * 0.9).toFixed(1)}" font-family="monospace" text-anchor="middle" dominant-baseline="middle">${s.text}</text>`);
  }
  // legend
  parts.push(`<text x="8" y="14" fill="#37b3ff" font-size="9">B.Cu</text>`);
  parts.push(`<text x="8" y="26" fill="#c95b0e" font-size="9">F.Cu</text>`);
  parts.push(`<text x="8" y="38" fill="#ffd23f" font-size="9">vias</text>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${h}" viewBox="0 0 ${width} ${h}">${parts.join("")}</svg>`;
}
