import { createFileRoute, Link } from "@tanstack/react-router";
import { Grid3x3, SlidersHorizontal, CircuitBoard, Box, Keyboard, ArrowRight } from "lucide-react";
import { SiteHeader, SiteFooter } from "../components/keeberia/SiteChrome";

export const Route = createFileRoute("/howitworks/flow/")({
  head: () => ({
    meta: [
      { title: "the flow — keeberia" },
      { name: "description", content: "five flows from spatial layout to manufacturing outputs. layout, components, pcb, case, caps & covers." },
      { property: "og:title", content: "how it works — the flow" },
      { property: "og:description", content: "layout, components, pcb, case, caps. five flows that handle the full design pipeline." },
    ],
  }),
  component: FlowOverview,
});

const FLOWS = [
  { n: "01", slug: "layout" as const, t: "layout", q: "where are things?", Icon: Grid3x3, blurb: "pure spatial planning. grids, regions, merges." },
  { n: "02", slug: "components" as const, t: "components", q: "what are these things?", Icon: SlidersHorizontal, blurb: "switches, encoders, displays, rgb modes." },
  { n: "03", slug: "pcb" as const, t: "pcb", q: "what does the board look like?", Icon: CircuitBoard, blurb: "shape, edges, silkscreen, auto routing." },
  { n: "04", slug: "case" as const, t: "case", q: "how is it housed?", Icon: Box, blurb: "mount style, walls, cutouts, typing angle." },
  { n: "05", slug: "caps" as const, t: "caps & covers", q: "what does it feel like?", Icon: Keyboard, blurb: "keycap profiles, knob covers, materials, legends." },
];

function FlowOverview() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 w-full">
        <header className="mb-14 max-w-3xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-3">how it works · the flow</p>
          <h1 className="font-display text-5xl lowercase tracking-tight">five flows, from spatial layout to manufacturable hardware.</h1>
          <p className="mt-4 text-stone-700 leading-relaxed font-mono text-sm">
            each flow answers a different mental question. complexity increases gradually — the
            way humans actually think about custom devices.
          </p>
        </header>

        <ol className="space-y-3">
          {FLOWS.map((f) => (
            <li key={f.slug}>
              <Link
                to="/howitworks/flow/$slug"
                params={{ slug: f.slug }}
                className="group flex items-center gap-6 rounded-md border border-border bg-card/60 hover:bg-card hover:border-stone-400/70 transition-colors p-5 analog-shadow-sm"
              >
                <span className="font-mono text-[10px] text-muted-foreground w-8">{f.n}</span>
                <span className="inline-flex items-center justify-center size-10 rounded bg-stone-100 border border-stone-300">
                  <f.Icon size={18} className="text-stone-700" />
                </span>
                <span className="flex-1">
                  <span className="block font-display text-2xl lowercase">{f.t}</span>
                  <span className="block font-mono text-[11px] text-stone-600 italic lowercase">"{f.q}" — {f.blurb}</span>
                </span>
                <ArrowRight size={16} className="text-stone-500 group-hover:translate-x-1 transition-transform" />
              </Link>
            </li>
          ))}
        </ol>
      </main>
      <SiteFooter />
    </div>
  );
}
