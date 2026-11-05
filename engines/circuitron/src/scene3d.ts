/**
 * scene3d.ts: deterministic 3d scene description for the result viewer.
 *
 * two views come out of one scene:
 *   pcb only        board plus component bodies
 *   pcb with case   the same plus paracraft's plate and shell sitting on the
 *                   shared stack facts (plate thickness, standoff height)
 *
 * the engine emits numbers, never files: model bindings are handed in the
 * same way fab records are. without bindings every component renders as a
 * proxy box at its recorded footprint size, so the preview never blocks on a
 * missing asset.
 *
 * z convention: 0 is the board bottom face, the board spans 0..thicknessMm,
 * front-side parts sit on the top face, back-side parts hang below it with
 * flipZ set. units are millimetres everywhere.
 */
import { PcbResult } from "./types.ts";
import { BoardCtx } from "./layout.ts";
import { FOOTPRINTS } from "./footprints.ts";

export interface SceneModel {
  id: string;
  glb: string;
  bbox: { min: number[]; max: number[]; size: number[] };
  license: string;
  source: string;
}

export interface Scene3dOptions {
  thicknessMm?: number;
  /** footprint library id → model id, overrides the default map */
  modelByLib?: Record<string, string>;
  /** model id → built asset (from assets/models/manifest.json) */
  models?: Record<string, SceneModel>;
  case?: { plateThicknessMm?: number; standoffMm?: number; wallMm?: number } | null;
}

export interface SceneComponent {
  ref: string;
  lib: string;
  category: string;
  side: "F" | "B";
  x: number;
  y: number;
  rotationDeg: number;
  body: { w: number; h: number };
  z: { base: number; top: number | null };
  flipZ: boolean;
  model: { id: string; glb: string; license: string } | null;
  proxy: boolean;
}

export interface Scene3d {
  schema: 1;
  units: "mm";
  board: { w: number; h: number; thicknessMm: number; cornerRadius: number };
  components: SceneComponent[];
  case: {
    plateThicknessMm: number;
    standoffMm: number;
    wallMm: number;
    plateZ: { base: number; top: number };
    shell: { w: number; h: number; heightMm: number };
  } | null;
  warnings: string[];
}

/** default body for each footprint library; oleds stay proxies until a licensed file lands */
export const DEFAULT_MODEL_BY_LIB: Record<string, string> = {
  "keeberia:MX_solder": "mx_switch_body",
  "keeberia:MX_hotswap": "mx_switch_body",
  "keeberia:Choc_v1": "choc_v1_body",
  "keeberia:EC11": "ec11_body",
  "keeberia:XIAO": "xiao_rp2040",
  "keeberia:Diode_SOD123": "diode_sod123",
  "keeberia:Mount_M2": "m2_screw",
};

export function buildScene3d(ctx: BoardCtx, result: PcbResult, opts: Scene3dOptions = {}): Scene3d {
  const t = opts.thicknessMm ?? 1.6;
  const byLib = opts.modelByLib ?? DEFAULT_MODEL_BY_LIB;
  const models = opts.models ?? {};
  const warnings: string[] = [];

  const components: SceneComponent[] = result.placements.map((pl) => {
    const fp = FOOTPRINTS[pl.library];
    const modelId = byLib[pl.library];
    const bound = modelId ? models[modelId] : undefined;
    if (modelId && !bound) warnings.push(`${pl.ref}: model ${modelId} not bound, rendering proxy`);
    const base = pl.side === "F" ? t : 0;
    // model bbox gives the real height; a proxy has none, the viewer draws a flat box
    const height = bound ? bound.bbox.size[2] : null;
    return {
      ref: pl.ref,
      lib: pl.library,
      category: fp?.category ?? "passive",
      side: pl.side,
      x: +pl.pos.x.toFixed(3),
      y: +pl.pos.y.toFixed(3),
      rotationDeg: pl.rotation ?? 0,
      body: { w: fp?.size.w ?? 0, h: fp?.size.h ?? 0 },
      z: { base, top: height === null ? null : +(base + height).toFixed(3) },
      flipZ: pl.side === "B",
      model: bound ? { id: bound.id, glb: bound.glb, license: bound.license } : null,
      proxy: !bound,
    };
  });

  const plateThicknessMm = opts.case?.plateThicknessMm ?? 1.5;
  const standoffMm = opts.case?.standoffMm ?? 5;
  const wallMm = opts.case?.wallMm ?? 2;
  const plateBase = t + standoffMm;
  const caseOut = opts.case
    ? {
        plateThicknessMm,
        standoffMm,
        wallMm,
        plateZ: { base: +plateBase.toFixed(3), top: +(plateBase + plateThicknessMm).toFixed(3) },
        shell: { w: +(ctx.outline.width + 2 * wallMm).toFixed(3), h: +(ctx.outline.height + 2 * wallMm).toFixed(3), heightMm: +(plateBase + plateThicknessMm).toFixed(3) },
      }
    : null;

  return {
    schema: 1,
    units: "mm",
    board: { w: ctx.outline.width, h: ctx.outline.height, thicknessMm: t, cornerRadius: ctx.outline.cornerRadius ?? 0 },
    components,
    case: caseOut,
    warnings,
  };
}
