/**
 * SES (Specctra session) parser — the freerouting bridge, in-bound.
 * reads the routes freerouting produced and turns them back into
 * circuitron's own segment/via model. plain s-expression tokenizer:
 * no regex torture, no deps.
 *
 * freerouting's wire form (as emitted sept 2026, v2.4.1):
 *   (net GND
 *     (wire (path F.Cu 25000 x1 y1 x2 y2 ...))
 *     (via "padstack_name" x y)
 *   )
 * net-scoped: a wire belongs to the nearest enclosing (net ...).
 */
import { Segment, Via } from "./types.ts";

export interface SesRoutes {
  segments: Segment[];
  vias: Via[];
  /** nets that received at least one wire */
  routedNetNames: Set<string>;
}

const UNIT = 10000; // (resolution um 10): 1mm

export function parseSes(ses: string): SesRoutes {
  const tokens = tokenize(ses);
  const segments: Segment[] = [];
  const vias: Via[] = [];
  const routedNetNames = new Set<string>();
  const padstackSize = new Map<string, number>(); // name → diameter (dsn units)

  let i = 0;
  const peek = () => tokens[i];
  const next = () => tokens[i++];

  const skipScope = () => { // consume a balanced ( ... ) — cursor sits after "("
    let depth = 1;
    while (i < tokens.length && depth > 0) {
      const t = next();
      if (t === "(") depth++;
      else if (t === ")") depth--;
    }
  };

  const parseNet = () => { // cursor after "net" + name token
    const netName = unquote(next());
    let sawWire = false;
    while (peek() !== ")" && i < tokens.length) {
      const t = next();
      if (t === "(") {
        const head = next();
        if (head === "wire") {
          sawWire = true;
          parseWire(netName);
        } else if (head === "via") {
          parseVia(netName);
        } else if (head === "net") { // (net ... (net ...)) guard
          parseNet();
        } else {
          skipScope();
        }
      }
    }
    if (peek() === ")") next();
    if (sawWire) routedNetNames.add(netName);
  };

  // (wire (path LAYER WIDTH x1 y1 x2 y2 ...)) — cursor after "wire"
  const parseWire = (net: string) => {
    let layer = "F.Cu";
    let width = 0.25;
    const pts: Array<{ x: number; y: number }> = [];
    // enter (path ... )
    if (peek() === "(") {
      next(); // (
      const head = next();
      if (head === "path") {
        layer = next();
        width = Number(next()) / UNIT;
        while (peek() !== ")") {
          const x = Number(next());
          const y = Number(next());
          pts.push({ x: x / UNIT, y: y / UNIT });
        }
        next(); // )
      } else {
        skipScope();
      }
    }
    // wire tail (should be ")")
    while (peek() !== ")" ) { const t = next(); if (t === "(") skipScope(); }
    next();
    for (let k = 1; k < pts.length; k++) {
      segments.push({
        start: pts[k - 1], end: pts[k], width,
        layer: layer as "F.Cu" | "B.Cu", net,
      });
    }
  };

  // (via "padstack" x y) — cursor after "via"
  const parseVia = (net: string) => {
    const stack = unquote(next());
    const x = Number(next()) / UNIT;
    const y = Number(next()) / UNIT;
    while (peek() !== ")") { const t = next(); if (t === "(") skipScope(); }
    next();
    const size = (padstackSize.get(stack) ?? 6000) / UNIT;
    vias.push({ at: { x, y }, size, drill: size * 0.5, net });
    routedNetNames.add(net);
  };

  const parsePadstackOut = () => { // library_out padstacks, for via sizes
    const name = unquote(next());
    while (peek() !== ")" && i < tokens.length) {
      const t = next();
      if (t === "(") {
        const head = next();
        if (head === "shape") {
          // (shape (circle F.Cu 60000 0 0))
          if (peek() === "(") {
            next();
            const sh = next();
            if (sh === "circle") {
              next(); // layer
              padstackSize.set(name, Number(next()));
            }
            skipScope();
          }
        } else {
          skipScope();
        }
      }
    }
    if (peek() === ")") next();
  };

  // descend everywhere: (session (routes (net ...))) — nets can sit at
  // any depth, so unknown scopes are walked into, not skipped
  const walk = (): void => {
    while (i < tokens.length) {
      const t = peek();
      if (t === ")") { next(); return; }
      if (t === "(") {
        next();
        const head = next();
        if (head === "net") parseNet();
        else if (head === "padstack") parsePadstackOut();
        else walk();
      } else {
        next();
      }
    }
  };
  walk();

  return { segments, vias, routedNetNames };
}

function unquote(s: string): string {
  return s.startsWith('"') && s.endsWith('"') && s.length > 1 ? s.slice(1, -1) : s;
}

/** tiny s-expression tokenizer: returns "(", ")" and atoms */
function tokenize(src: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '"') {
      let j = i + 1;
      while (j < src.length && src[j] !== '"') j++;
      tokens.push(src.slice(i, j + 1));
      i = j + 1;
    } else if (ch === "(" || ch === ")") {
      tokens.push(ch);
      i++;
    } else if (/\s/.test(ch)) {
      i++;
    } else {
      let j = i;
      while (j < src.length && !/[\s()"]/.test(src[j])) j++;
      tokens.push(src.slice(i, j));
      i = j;
    }
  }
  return tokens;
}
