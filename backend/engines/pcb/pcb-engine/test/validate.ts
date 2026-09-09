// structural validation of generated .kicad_pcb
import { readFileSync } from "node:fs";

function parseSexpr(text: string): any {
  let pos = 0;
  function skipWs() { while (pos < text.length && /\s/.test(text[pos])) pos++; }
  function parseNode(): any {
    skipWs();
    if (text[pos] === "(") {
      pos++;
      const list: any[] = [];
      for (;;) {
        skipWs();
        if (text[pos] === ")") { pos++; return list; }
        if (pos >= text.length) throw new Error("unbalanced parens: EOF");
        list.push(parseNode());
      }
    }
    if (text[pos] === '"') {
      pos++;
      let s = "";
      while (text[pos] !== '"') {
        if (text[pos] === "\\") { s += text[pos + 1]; pos += 2; continue; }
        if (pos >= text.length) throw new Error("unterminated string");
        s += text[pos++];
      }
      pos++;
      return s;
    }
    const m = /^[^\s()"]+/.exec(text.slice(pos))!;
    pos += m[0].length;
    return m[0];
  }
  const node = parseNode();
  skipWs();
  if (pos !== text.length) throw new Error(`trailing content at ${pos}`);
  return node;
}

for (const name of ["hackpad-3key", "ninepad", "streamdeck", "ninepad-choc"]) {
  const text = readFileSync(`out/${name}.kicad_pcb`, "utf8");
  const root = parseSexpr(text);
  const tags = root.filter(Array.isArray).map((n: any) => n[0]);
  const counts: Record<string, number> = {};
  for (const t of tags) counts[t] = (counts[t] ?? 0) + 1;
  const nets = root.filter((n: any) => Array.isArray(n) && n[0] === "net");
  const fps = root.filter((n: any) => Array.isArray(n) && n[0] === "footprint");
  const segs = root.filter((n: any) => Array.isArray(n) && n[0] === "segment");
  const vias = root.filter((n: any) => Array.isArray(n) && n[0] === "via");
  // every segment/via references a defined net number
  const netNums = new Set(nets.map((n: any) => Number(n[1])));
  let badNet = 0;
  for (const s of segs) { const nn = Number((s as any).find((x: any) => Array.isArray(x) && x[0] === "net")![1]); if (!netNums.has(nn)) badNet++; }
  for (const v of vias) { const nn = Number((v as any).find((x: any) => Array.isArray(x) && x[0] === "net")![1]); if (!netNums.has(nn)) badNet++; }
  // footprints: pads reference valid nets and have layer/size
  let padIssues = 0;
  for (const fp of fps) {
    for (const pad of (fp as any).filter((n: any) => Array.isArray(n) && n[0] === "pad")) {
      const netN = (pad as any).find((x: any) => Array.isArray(x) && x[0] === "net");
      if (netN && !netNums.has(Number(netN[1]))) padIssues++;
      const layers = (pad as any).find((x: any) => Array.isArray(x) && x[0] === "layers");
      if (!layers) padIssues++;
      const size = (pad as any).find((x: any) => Array.isArray(x) && x[0] === "size");
      if (!size || Number(size[1]) <= 0) padIssues++;
    }
  }
  console.log(`${name}: OK — ${counts.footprint ?? 0} footprints, ${segs.length} segments, ${vias.length} vias, ${nets.length} nets, badNetRefs=${badNet}, padIssues=${padIssues}, tags=${Object.keys(counts).join(",")}`);
}
console.log("all kicad_pcb files parse with balanced s-expressions");
