import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  Grid3x3, SlidersHorizontal, CircuitBoard, Box, Keyboard,
  Square, Circle, Disc, Monitor, RectangleHorizontal, Gamepad2, Minus,
  ArrowLeft, ArrowRight, type LucideIcon,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "../components/keeberia/SiteChrome";

type Slug = "layout" | "components" | "pcb" | "case" | "caps";

export const Route = createFileRoute("/howitworks/flow/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `flow · ${params.slug} — keeberia` },
      { name: "description", content: `the ${params.slug} flow in keeberia — part of the spatial-first design pipeline.` },
      { property: "og:title", content: `flow · ${params.slug} — keeberia` },
    ],
  }),
  loader: ({ params }) => {
    if (!FLOW_ORDER.includes(params.slug as Slug)) throw notFound();
    return null;
  },
  component: FlowDetail,
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-24 text-center">
        <h1 className="font-display text-4xl lowercase">flow not found</h1>
        <Link to="/howitworks/flow" className="mt-6 inline-block font-mono text-[11px] uppercase tracking-[0.2em] underline">back to overview</Link>
      </main>
      <SiteFooter />
    </div>
  ),
});

const FLOW_ORDER: Slug[] = ["layout", "components", "pcb", "case", "caps"];

const META: Record<Slug, {
  n: string; t: string; q: string; Icon: LucideIcon;
  intro: string;
  bullets: string[];
  visual: "grid" | "components" | "pcb" | "case" | "caps";
}> = {
  layout: {
    n: "01", t: "layout", q: "where are things?", Icon: Grid3x3,
    intro: "purely spatial. you place regions on a grid. every cell defaults to a key. no electronics, no footprints — just shape, position, and intent.",
    bullets: [
      "default grid where every cell is a key",
      "drag-select or numeric input to size the matrix",
      "merge adjacent cells into 2u keys, encoders, displays",
      "split, resize, duplicate via right-click",
      "switch any region to a different component type",
      "abstract symbols: squares for keys, circles for knobs, rectangles for displays",
    ],
    visual: "grid",
  },
  components: {
    n: "02", t: "components", q: "what are these things?", Icon: SlidersHorizontal,
    intro: "real hardware specs, applied like notion properties. select cells, change types, edit in bulk. nothing about footprints leaks through.",
    bullets: [
      "switch types: cherry mx, kailh choc, gateron low profile",
      "encoders: ec11, low profile, side-mount",
      "displays: 128×32 oled, 128×64 oled, eink modules",
      "hotswap or soldered mounting",
      "rgb: underglow, per-key sk6812, side leds, none",
      "stabilizers, joysticks, touch strips, sliders",
      "multi-select property editing across regions",
    ],
    visual: "components",
  },
  pcb: {
    n: "03", t: "pcb", q: "what does the board look like?", Icon: CircuitBoard,
    intro: "fabrication structure derived from your layout. shape, edges, silkscreen — the design surface, not a schematic. routing happens for you in the background.",
    bullets: [
      "auto shapes: rectangular, rounded, convex hull",
      "custom dxf outline import",
      "corner radius and edge chamfer controls",
      "front + back silkscreen as a design surface",
      "svg upload, labels, graphics on the board",
      "matrix routing generated automatically",
      "advanced trace + via editing later, off by default",
    ],
    visual: "pcb",
  },
  case: {
    n: "04", t: "case", q: "how is it housed?", Icon: Box,
    intro: "the parametric enclosure. mount style, wall thickness, typing angle, cutouts. live preview as a real object — printable or millable.",
    bullets: [
      "tray mount, sandwich, top mount, integrated plate",
      "wall thickness, margin, typing angle",
      "front + rear height controls",
      "screw type and heatset insert placement",
      "usb, reset, and indicator cutouts",
      "rubber feet, bumpons, recessed feet",
      "live preview as a real object",
    ],
    visual: "case",
  },
  caps: {
    n: "05", t: "caps & covers", q: "what does it feel like?", Icon: Keyboard,
    intro: "the tactile identity layer. profiles, materials, legends, knob covers. the moment the project becomes a finished product.",
    bullets: [
      "profiles: cherry, oem, xda, dsa, sa, choc",
      "materials: abs, pbt, resin",
      "legend styles: blank, side, dye sub, transparent",
      "knob cover styles: aluminum, ribbed, smooth, fluted",
      "diameter, height, indicator line",
    ],
    visual: "caps",
  },
};

function FlowDetail() {
  const { slug } = Route.useParams() as { slug: Slug };
  const f = META[slug];
  const idx = FLOW_ORDER.indexOf(slug);
  const prev = idx > 0 ? FLOW_ORDER[idx - 1] : null;
  const next = idx < FLOW_ORDER.length - 1 ? FLOW_ORDER[idx + 1] : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 w-full">
        <Link to="/howitworks/flow" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground">
          <ArrowLeft size={12} /> all flows
        </Link>

        <header className="mt-6 mb-12">
          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">flow {f.n}</span>
            <span className="inline-flex items-center justify-center size-7 rounded bg-stone-100 border border-stone-300">
              <f.Icon size={14} className="text-stone-700" />
            </span>
          </div>
          <h1 className="font-display text-5xl lowercase tracking-tight">{f.t}</h1>
          <p className="mt-2 font-display text-xl lowercase text-stone-500 italic">"{f.q}"</p>
          <p className="mt-6 max-w-2xl font-mono text-sm leading-relaxed text-stone-700">{f.intro}</p>
        </header>

        <div className="grid md:grid-cols-12 gap-8">
          <div className="md:col-span-7">
            <FlowVisual kind={f.visual} />
          </div>
          <div className="md:col-span-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">/ what's in this flow</p>
            <ul className="space-y-2">
              {f.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2 font-mono text-[12px] lowercase text-stone-700">
                  <span className="text-stone-400 mt-[2px]">·</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <nav className="mt-16 flex items-center justify-between gap-4 border-t border-border pt-6">
          {prev ? (
            <Link to="/howitworks/flow/$slug" params={{ slug: prev }} className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-700 hover:text-foreground">
              <ArrowLeft size={14} /> {prev}
            </Link>
          ) : <span />}
          {next ? (
            <Link to="/howitworks/flow/$slug" params={{ slug: next }} className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-700 hover:text-foreground">
              {next} <ArrowRight size={14} />
            </Link>
          ) : (
            <Link to="/start" className="rounded-md bg-stone-900 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-50 hover:bg-stone-800">
              start a project →
            </Link>
          )}
        </nav>
      </main>
      <SiteFooter />
    </div>
  );
}

function FlowVisual({ kind }: { kind: "grid" | "components" | "pcb" | "case" | "caps" }) {
  if (kind === "grid") {
    return (
      <div className="rounded-md bg-card border border-border p-6 analog-shadow-sm">
        <div className="grid grid-cols-4 grid-rows-3 gap-2 aspect-[4/3]">
          {Array.from({ length: 12 }).map((_, i) => {
            const merged = i === 4; // first cell of "merged" 2u
            const skip = i === 5;
            if (skip) return null;
            return (
              <div
                key={i}
                className={`bg-stone-100 border border-stone-300 rounded ${merged ? "col-span-2" : ""} flex items-center justify-center`}
              >
                <Square size={14} className="text-stone-400" />
              </div>
            );
          })}
        </div>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">4×3 grid · one 2u merge</p>
      </div>
    );
  }
  if (kind === "components") {
    const items: { Icon: LucideIcon; l: string }[] = [
      { Icon: Square, l: "key" }, { Icon: Circle, l: "encoder" }, { Icon: Disc, l: "knob" },
      { Icon: Monitor, l: "oled" }, { Icon: RectangleHorizontal, l: "eink" },
      { Icon: Gamepad2, l: "joystick" }, { Icon: Minus, l: "touch strip" },
    ];
    return (
      <div className="rounded-md bg-card border border-border p-6 analog-shadow-sm">
        <div className="grid grid-cols-3 gap-3">
          {items.map((c) => (
            <div key={c.l} className="bg-stone-50 border border-stone-200 rounded p-4 flex flex-col items-center gap-2">
              <c.Icon size={20} className="text-stone-700" />
              <span className="font-mono text-[10px] lowercase text-stone-600">{c.l}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">switch any cell · apply in bulk</p>
      </div>
    );
  }
  if (kind === "pcb") {
    return (
      <div className="rounded-md bg-card border border-border p-6 analog-shadow-sm">
        <div className="aspect-[4/3] rounded-md bg-emerald-900/90 border-4 border-emerald-950 relative overflow-hidden">
          <div className="absolute inset-4 grid grid-cols-4 grid-rows-3 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="border border-emerald-300/40 rounded-sm flex items-center justify-center">
                <div className="size-2 rounded-full bg-amber-200/80" />
              </div>
            ))}
          </div>
          <div className="absolute bottom-2 left-3 right-3 flex justify-between font-mono text-[8px] text-emerald-200/80 tracking-wider uppercase">
            <span>keeberia · rev 1</span>
            <span>v1.0</span>
          </div>
        </div>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">auto routing · silkscreen surface</p>
      </div>
    );
  }
  if (kind === "case") {
    return (
      <div className="rounded-md bg-card border border-border p-6 analog-shadow-sm">
        <div className="aspect-[4/3] rounded-md bg-stone-200 border border-stone-400 relative">
          <div className="absolute inset-3 rounded bg-stone-300 border border-stone-400" />
          <div className="absolute inset-6 rounded bg-stone-100 border border-stone-300 grid grid-cols-4 grid-rows-3 gap-2 p-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-stone-50 border border-stone-300 rounded-sm" />
            ))}
          </div>
          <div className="absolute -bottom-1 left-6 right-6 h-2 rounded-b bg-stone-400/60" />
        </div>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">sandwich case · live parametric preview</p>
      </div>
    );
  }
  // caps
  return (
    <div className="rounded-md bg-card border border-border p-6 analog-shadow-sm">
      <div className="grid grid-cols-4 grid-rows-3 gap-3 aspect-[4/3]">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-md bg-gradient-to-b from-stone-50 to-stone-200 border border-stone-400/60 shadow-inner flex items-center justify-center">
            <span className="font-mono text-[10px] text-stone-500">{String.fromCharCode(65 + i)}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">cherry profile · pbt · dye sub</p>
    </div>
  );
}
