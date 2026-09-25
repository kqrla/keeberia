import { createFileRoute, Link } from "@tanstack/react-router";
import { CircuitBoard, ArrowLeft } from "lucide-react";
import { SiteHeader, SiteFooter } from "../components/keeberia/SiteChrome";

export const Route = createFileRoute("/bts/engines/circuitron")({
  head: () => ({
    meta: [
      { title: "circuitron, the pcb engine — keeberia" },
      {
        name: "description",
        content:
          "circuitron turns a keeberia layout into a routed kicad board: placement, netlist, negotiated-congestion routing, design rule checks, bom, silkscreen and firmware.",
      },
      { property: "og:title", content: "circuitron, the pcb engine — keeberia" },
      {
        property: "og:description",
        content: "layout in, manufacturable board out. deterministic, zero runtime dependencies.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://layout-to-device.lovable.app/bts/engines/circuitron" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://layout-to-device.lovable.app/bts/engines/circuitron" }],
  }),
  component: CircuitronPage,
});

// the stage list mirrors the engine's own module order. keeping the marketing
// page in that order means a reader can follow the source afterwards without
// re-learning the vocabulary.
const STAGES = [
  {
    n: "01",
    t: "placement",
    d: "grid cells become real components. switches, mcu, mounting holes and the board outline are derived from where you put things, not from a template board.",
  },
  {
    n: "02",
    t: "netlist",
    d: "direct gpio when there are enough pins, diode matrix when there are not. i2c and encoder budgets are checked before anything is routed.",
  },
  {
    n: "03",
    t: "routing",
    d: "fan-out stubs first, then negotiated-congestion a star on a 0.5mm grid with keepouts and vias. the router is never allowed to leave the board edge.",
  },
  {
    n: "04",
    t: "kicad export",
    d: "a kicad 8 .kicad_pcb file written as s-expressions, openable and editable in kicad if you want to take over by hand.",
  },
  {
    n: "05",
    t: "design rule check",
    d: "pad clearance, shorts, edge violations and unrouted nets. the drc and the router agree on the same edge margin, so they never argue.",
  },
  {
    n: "06",
    t: "bom, silkscreen, preview",
    d: "a parts list you can order from, board labelling, and an svg render of the finished board for the editor to show you.",
  },
];

const OUTPUTS = [
  "keeberia.kicad_pcb",
  "gerber layers, front and back copper, mask, paste, silkscreen",
  "edge cuts and drill file",
  "bom csv",
  "board preview svg",
  "qmk info.json, keymap.c, rules.mk",
  "vial.json",
];

const RULES = [
  "pad geometry lives in exactly one file, verified against kicad official libraries, the hackclub care package and perigoso.",
  "a new part is footprint-verified against three sources or a datasheet before it is allowed into the library.",
  "the router stays 0.45mm inside the board edge, and the design rule check enforces the same number.",
  "output is deterministic: no timestamps, no randomness, no leaks from map iteration order.",
];

const BOARDS = ["hackpad-3key", "ninepad", "ninepad-choc", "streamdeck"];

function CircuitronPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="bg-editor-header border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-20">
          <Link
            to="/bts"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft size={12} /> behind the scenes
          </Link>
          <div className="mt-8">
            <CircuitBoard size={22} strokeWidth={1.5} className="text-stone-700" />
          </div>
          <h1 className="mt-4 font-display text-5xl md:text-6xl leading-[0.95] lowercase tracking-tight">
            circuitron<br />
            <span className="text-stone-700/70">layout in, manufacturable board out.</span>
          </h1>
          <p className="mt-6 max-w-2xl font-mono text-sm leading-relaxed text-stone-700">
            the pcb and schematic engine. typescript, zero runtime dependencies, and no ai anywhere
            inside it. the same layout produces the same board on every run, which is the only way a
            generated pcb is worth sending to a fab.
          </p>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ pipeline</span>
          <h2 className="mt-2 font-display text-3xl lowercase">six stages, one pass</h2>
          <div className="mt-10 grid sm:grid-cols-2 gap-3">
            {STAGES.map((s) => (
              <div key={s.n} className="bg-card rounded-md border border-border p-5 analog-shadow-sm">
                <div className="font-mono text-[10px] text-muted-foreground">{s.n}</div>
                <div className="mt-2 font-display text-xl lowercase">{s.t}</div>
                <p className="mt-2 font-mono text-xs text-muted-foreground leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary/40 border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ outputs</span>
            <h2 className="mt-2 font-display text-2xl lowercase">what lands in your export folder</h2>
            <ul className="mt-6 space-y-2 font-mono text-sm text-stone-800 lowercase">
              {OUTPUTS.map((o) => (
                <li key={o}>· {o}</li>
              ))}
            </ul>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ tested against</span>
            <h2 className="mt-2 font-display text-2xl lowercase">reference boards</h2>
            <ul className="mt-6 space-y-2 font-mono text-sm text-stone-800 lowercase">
              {BOARDS.map((b) => (
                <li key={b}>· {b}</li>
              ))}
            </ul>
            <p className="mt-6 font-mono text-xs leading-relaxed text-stone-600">
              these are regression fixtures. every change to the engine has to keep producing valid,
              balanced, fully referenced boards for all of them.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ rules we do not bend</span>
          <h2 className="mt-2 font-display text-3xl lowercase">the boring guarantees</h2>
          <ul className="mt-8 space-y-4 max-w-2xl">
            {RULES.map((r) => (
              <li key={r} className="font-mono text-sm leading-relaxed text-stone-700 border-l border-stone-300 pl-4">
                {r}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-24 text-center">
        <p className="font-display text-2xl md:text-3xl lowercase text-stone-800 leading-snug max-w-2xl mx-auto">
          you never open the router. you just notice that the board it made is the same one it made
          yesterday.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/bts/engines/paracraft"
            className="rounded-md border border-stone-400 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-800 hover:border-stone-600"
          >
            next: paracraft →
          </Link>
          <Link
            to="/start"
            className="rounded-md bg-stone-900 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-50 hover:bg-stone-800 analog-shadow-sm"
          >
            open the editor →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
