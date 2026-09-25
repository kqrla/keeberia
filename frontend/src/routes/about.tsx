import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "../components/keeberia/SiteChrome";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "about — keeberia" },
      { name: "description", content: "keeberia is a browser-based design environment for custom macropads and small input devices. layout first, manufacturing later." },
      { property: "og:title", content: "about — keeberia" },
      { property: "og:description", content: "design custom input hardware visually. keeberia handles pcb, case, and firmware behind the scenes." },
    ],
  }),
  component: About,
});

const BUILDS = [
  "macropads",
  "macro controllers",
  "small keyboards",
  "custom control surfaces",
  "encoder decks",
  "display-based input devices",
];

const USERS_DEFINE = ["layout", "components", "pcb structure", "enclosure / case", "keycaps & tactile elements"];
const SYSTEM_GENERATES = ["pcb layouts", "manufacturing-ready exports", "plate files", "case geometry", "firmware configurations"];

const AUDIENCE = [
  "keyboard makers",
  "macropad enthusiasts",
  "indie hardware designers",
  "studios prototyping control surfaces",
  "people who want to skip kicad",
  "people who think spatially",
];

function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="bg-editor-header border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-700">/ about</span>
          <h1 className="mt-4 font-display text-5xl md:text-6xl leading-[0.95] lowercase tracking-tight">
            a spatial design environment for custom input hardware.
          </h1>
          <p className="mt-6 max-w-2xl font-mono text-sm leading-relaxed text-stone-700">
            keeberia is a browser-based tool for creating custom macropads and small input devices
            without manually working through traditional pcb or cad workflows from the beginning.
            instead of starting with electronics software, users start with layout and interaction.
          </p>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ what you build</span>
          <h2 className="mt-2 font-display text-3xl lowercase">keeberia lets you visually construct</h2>
          <ul className="mt-8 space-y-2">
            {BUILDS.map((b, i) => (
              <li key={b} className="flex items-baseline gap-3 font-display text-2xl lowercase">
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground w-8">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <p className="mt-10 font-mono text-sm text-stone-700 leading-relaxed">
            through a layered workflow system. the platform treats keyboards and macropads as
            spatial, modular objects first, then translates those decisions into manufacturable
            outputs behind the scenes.
          </p>
        </div>
      </section>

      <section className="bg-secondary/40 border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ users define</span>
            <h3 className="mt-2 font-display text-2xl lowercase">the design</h3>
            <ul className="mt-6 space-y-2 font-mono text-sm text-stone-800 lowercase">
              {USERS_DEFINE.map((u) => <li key={u}>· {u}</li>)}
            </ul>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ system generates</span>
            <h3 className="mt-2 font-display text-2xl lowercase">the manufacturing</h3>
            <ul className="mt-6 space-y-2 font-mono text-sm text-stone-800 lowercase">
              {SYSTEM_GENERATES.map((u) => <li key={u}>· {u}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ interface philosophy</span>
          <h2 className="mt-2 font-display text-3xl lowercase">calm, modular, spatial</h2>
          <p className="mt-6 max-w-2xl font-mono text-sm leading-relaxed text-stone-700">
            keeberia is designed to feel calm, modular, spatial, visual, and approachable —
            rather than technical or intimidating. the interface emphasizes soft geometry,
            contextual actions, drag-and-drop composition, and minimal engineering noise.
          </p>
          <p className="mt-4 max-w-2xl font-mono text-sm leading-relaxed text-stone-700">
            the goal is to make hardware design feel exploratory and creative rather than procedural.
          </p>
        </div>
      </section>

      <section className="bg-secondary/40 border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ made for</span>
          <h2 className="mt-2 font-display text-3xl lowercase">people who want to design without learning eda</h2>
          <ul className="mt-6 grid sm:grid-cols-2 gap-y-1 font-mono text-sm text-stone-700 lowercase">
            {AUDIENCE.map((a) => <li key={a}>· {a}</li>)}
          </ul>
        </div>
      </section>

      <section>
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <p className="font-display text-2xl md:text-3xl lowercase text-stone-800 leading-snug">
            most hardware design tools expose manufacturing complexity immediately.<br />
            keeberia intentionally separates conceptual design from fabrication implementation.
          </p>
          <div className="mt-10">
            <Link
              to="/start"
              className="rounded-md bg-stone-900 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-50 hover:bg-stone-800 analog-shadow-sm"
            >
              start a project →
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
