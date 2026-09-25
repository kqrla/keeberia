import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "../components/keeberia/SiteChrome";

export const Route = createFileRoute("/philosophy")({
  head: () => ({
    meta: [
      { title: "philosophy — keeberia" },
      { name: "description", content: "keeberia separates conceptual design from fabrication implementation. you place a 'knob', not 'ec11 with 15mm shaft and mounting pads'." },
      { property: "og:title", content: "philosophy — keeberia" },
      { property: "og:description", content: "interaction first. fabrication is an implementation detail." },
    ],
  }),
  component: PhilosophyPage,
});

const NOT = ["kicad", "fusion 360", "traditional eda software", "footprint editing", "manual routing", "manufacturing-first workflows"];
const IS = ["figma", "notion", "canva", "modular building systems", "spatial editors", "interaction-first design"];

const PRINCIPLES = [
  { n: "01", t: "conceptual before fabrication", d: "users decide what goes where before they ever see a footprint. routing, clearance, and mounting geometry resolve internally." },
  { n: "02", t: "logical vs physical", d: "you edit logical regions and component occupancy. real pcb traces are a later, optional layer." },
  { n: "03", t: "abstract symbols, not engineering", d: "a knob is a circle. a display is a rectangle. visual language reads instantly without ever opening a datasheet." },
  { n: "04", t: "progressive complexity", d: "layout → components → pcb → case → caps. each flow adds detail on top of decisions already made." },
  { n: "05", t: "interaction is the primary surface", d: "drag, select, merge, switch-to. the editor feels like a productivity tool, not cad software." },
  { n: "06", t: "manufacturing is a backend detail", d: "gerbers, step files, firmware — generated from a unified project model, not assembled by hand." },
];

const TRANSLATION_A = `“encoder”`;
const TRANSLATION_B = `“ec11 footprint with mounting pads and shaft clearance, matrix net, plate cutout, knob shaft height”`;

function PhilosophyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="bg-editor-header border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-700">/ philosophy</span>
          <h1 className="mt-4 font-display text-5xl md:text-6xl leading-[0.95] lowercase tracking-tight">
            interaction first.<br />
            <span className="text-stone-700/70">fabrication is an implementation detail.</span>
          </h1>
          <p className="mt-6 max-w-2xl font-mono text-sm leading-relaxed text-stone-700">
            most hardware design tools expose manufacturing complexity immediately. keeberia
            intentionally separates conceptual design from fabrication implementation so users
            can focus on interaction and form rather than low-level engineering details.
          </p>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ not like</span>
            <h2 className="mt-2 font-display text-2xl lowercase">not engineering software</h2>
            <ul className="mt-6 space-y-2 font-mono text-sm text-stone-500 lowercase line-through decoration-stone-400/40">
              {NOT.map((n) => <li key={n}>· {n}</li>)}
            </ul>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ feels like</span>
            <h2 className="mt-2 font-display text-2xl lowercase">closer to creative tools</h2>
            <ul className="mt-6 space-y-2 font-mono text-sm text-stone-800 lowercase">
              {IS.map((n) => <li key={n}>· {n}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-secondary/40 border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ the translation layer</span>
          <h2 className="mt-2 font-display text-3xl lowercase">you place this</h2>
          <div className="mt-6 rounded-md border border-border bg-card p-6 analog-shadow-sm">
            <p className="font-mono text-2xl lowercase text-stone-900">{TRANSLATION_A}</p>
          </div>
          <h3 className="mt-10 font-display text-xl lowercase text-stone-700">instead of this</h3>
          <div className="mt-3 rounded-md border border-dashed border-stone-400 bg-stone-50/50 p-6">
            <p className="font-mono text-sm lowercase text-stone-500">{TRANSLATION_B}</p>
          </div>
          <p className="mt-8 max-w-2xl font-mono text-sm text-stone-700 leading-relaxed">
            the system internally resolves footprint placement, spacing, routing logic, cutouts,
            and mounting geometry — so you can focus on interaction and form.
          </p>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ principles</span>
          <h2 className="mt-2 font-display text-3xl lowercase">what we hold to</h2>
          <div className="mt-10 grid sm:grid-cols-2 gap-3">
            {PRINCIPLES.map((p) => (
              <div key={p.n} className="bg-card rounded-md border border-border p-5 analog-shadow-sm">
                <div className="font-mono text-[10px] text-muted-foreground">{p.n}</div>
                <div className="mt-2 font-display text-xl lowercase">{p.t}</div>
                <p className="mt-2 font-mono text-xs text-muted-foreground leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary/40 border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-24">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ in one sentence</span>
          <p className="mt-6 font-display text-2xl md:text-3xl lowercase leading-snug text-stone-800">
            keeberia is a spatial hardware design platform that lets users visually create custom
            keyboards and input devices, then automatically translates those designs into
            manufacturable pcb, case, and firmware outputs.
          </p>
        </div>
      </section>

      <section className="py-20 text-center">
        <h2 className="font-display text-4xl lowercase text-stone-900">build something with your hands.</h2>
        <div className="mt-8">
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
