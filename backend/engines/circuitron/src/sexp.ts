/**
 * Minimal s-expression serializer for KiCad files.
 * Values: numbers stay bare, strings get quoted with escaping.
 */

export type Sexpr = number | string | boolean | Sexpr[];

export function sexp(items: Sexpr[]): string {
  const parts: string[] = [];
  for (const item of items) {
    if (typeof item === "number") {
      parts.push(num(item));
    } else if (typeof item === "boolean") {
      parts.push(item ? "yes" : "no");
    } else if (typeof item === "string") {
      parts.push(quote(item));
    } else if (Array.isArray(item)) {
      parts.push(sexp(item));
    }
  }
  return `(${parts.join(" ")})`;
}

export function quote(s: string): string {
  if (/^-?\d+(\.\d+)?$/.test(s)) return `"${s}"`;
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
}

export function num(n: number): string {
  // KiCad writes at most 6 decimals; trim trailing zeros but keep at least x.x form stable
  if (!isFinite(n)) throw new Error(`bad number: ${n}`);
  if (Number.isInteger(n)) return String(n);
  return String(Number(n.toFixed(6)));
}

/** (at x y [rot]) helper */
export function at(x: number, y: number, rot?: number): Sexpr[] {
  const a: Sexpr[] = ["at", x, y];
  if (rot !== undefined && rot !== 0) a.push(rot);
  return a;
}

/** (start x y) / (end x y) / (center x y) helpers */
export const start = (x: number, y: number): Sexpr[] => ["start", x, y];
export const end = (x: number, y: number): Sexpr[] => ["end", x, y];
export const center = (x: number, y: number): Sexpr[] => ["center", x, y];
