/**
 * vanity.ts: the parts of a board that are aesthetic on purpose.
 *
 * functional facts are not allowed in here. this module handles the silhouette
 * extras a user draws (decorative cutouts) and art on the silkscreen (logos,
 * words, patterns). those are separable from the electronics, so they live in
 * their own input and their own validation pass:
 *
 *   - vanity can never loosen a functional rule. a cutout still needs a
 *     fab-safe width and web, art still needs the fab's min stroke and text
 *     height, and nothing may sit on a pad.
 *   - vanity never touches copper. if a "decorative" idea needs a trace, it is
 *     a circuit, not decoration, and it does not belong in this module.
 */
import { Pt } from "./types.ts";
import { OutlineShape, selfIntersects, minFeatureWidth, pointInShape } from "./outline.ts";

export interface SilkArtItem {
  kind: "line" | "polyline" | "text";
  points?: Pt[];
  text?: string;
  at?: Pt;
  heightMm?: number;      // text height, defaults to 1.2
  rotation?: number;      // degrees, clockwise, board coords
}

export interface VanitySpec {
  /** decorative cutouts as closed loops in board coords (mm, origin = board center) */
  cutouts?: Pt[][];
  /** art on the top silkscreen, on top of the functional refdes/key legends */
  silkscreen?: SilkArtItem[];
  /** purely cosmetic fab options; validated against the record separately */
  finish?: { maskColor?: string; silkColor?: string; surfaceFinish?: string };
}

export interface VanityLimits {
  silkMinLineMm: number;
  silkMinTextMm: number;
  minCutoutWidthMm: number;
  minWebToEdgeMm: number;
}

export interface PadFootprint { pos: Pt; halfW: number; halfH: number }

export interface VanityVerdict {
  silkscreen: SilkArtItem[];
  cutouts: Pt[][];
  finish: VanitySpec["finish"];
  warnings: string[];
  errors: string[];
}

export function validateVanity(
  spec: VanitySpec | undefined,
  shape: OutlineShape,
  limits: VanityLimits,
  pads: PadFootprint[],
): VanityVerdict {
  const warnings: string[] = [];
  const errors: string[] = [];
  if (!spec) return { silkscreen: [], cutouts: [], finish: undefined, warnings, errors };

  const silk: SilkArtItem[] = [];
  for (const item of spec.silkscreen ?? []) {
    if (item.kind === "text") {
      const h = item.heightMm ?? 1.2;
      if (h < limits.silkMinTextMm) {
        errors.push(`silkscreen text "${item.text ?? ""}" is ${h}mm tall, under the fab's ${limits.silkMinTextMm}mm minimum`);
        continue;
      }
      const w = (item.text ?? "").length * h * 0.62;
      const at = item.at ?? { x: 0, y: 0 };
      if (!textBoxInside(at, w, h, shape, 0.3)) {
        warnings.push(`silkscreen text "${item.text ?? ""}" reaches past the board edge and will be trimmed by the fab`);
      }
      if (item.text && overlapsPad(at, w, h, pads)) errors.push(`silkscreen text "${item.text}" sits on a pad; move it or the fab will mask it out`);
      silk.push({ ...item, heightMm: h });
    } else {
      const pts = item.points ?? [];
      if (pts.length < 2) { errors.push("a silkscreen line needs at least two points"); continue; }
      for (const p of pts) {
        if (!pointInShape(shape, p, 0)) { warnings.push("silkscreen art leaves the board and will be trimmed"); break; }
      }
      silk.push(item);
    }
  }

  const cutouts: Pt[][] = [];
  for (const loop of spec.cutouts ?? []) {
    if (loop.length < 3) { errors.push("a decorative cutout needs a closed loop of at least 3 points"); continue; }
    if (selfIntersects(loop)) { errors.push("a decorative cutout crosses itself"); continue; }
    const w = minFeatureWidth(loop);
    if (w < limits.minCutoutWidthMm) {
      errors.push(`decorative cutout is ${w.toFixed(2)}mm across, under the fab's ${limits.minCutoutWidthMm}mm slot minimum`);
      continue;
    }
    if (!loop.every((p) => pointInShape(shape, p, limits.minWebToEdgeMm))) {
      errors.push(`decorative cutout sits closer than ${limits.minWebToEdgeMm}mm to the board edge`);
      continue;
    }
    cutouts.push(loop);
  }

  const finish = spec.finish;
  if (finish?.maskColor || finish?.silkColor) {
    warnings.push("board colors are cosmetic and ship as a note on the order, they do not change the artwork");
  }

  return { silkscreen: silk, cutouts, finish, warnings, errors };
}

function textBoxInside(at: Pt, w: number, h: number, shape: OutlineShape, margin: number): boolean {
  const corners = [
    { x: at.x - w / 2, y: at.y - h / 2 },
    { x: at.x + w / 2, y: at.y - h / 2 },
    { x: at.x + w / 2, y: at.y + h / 2 },
    { x: at.x - w / 2, y: at.y + h / 2 },
  ];
  return corners.every((c) => pointInShape(shape, c, margin));
}

function overlapsPad(at: Pt, w: number, h: number, pads: PadFootprint[]): boolean {
  const x0 = at.x - w / 2, x1 = at.x + w / 2, y0 = at.y - h / 2, y1 = at.y + h / 2;
  return pads.some((p) => !(p.pos.x + p.halfW < x0 || p.pos.x - p.halfW > x1 || p.pos.y + p.halfH < y0 || p.pos.y - p.halfH > y1));
}
