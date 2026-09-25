import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "../components/keeberia/SiteChrome";
import { Comp2D, ComponentSwatch, type CompType } from "../components/keeberia/Comp2D";

export const Route = createFileRoute("/")({ component: Index });

const FEELS_LIKE = [
  { y: "yes", v: "figma" },
  { y: "yes", v: "notion" },
  { y: "yes", v: "canva" },
  { y: "yes", v: "modular building systems" },
];
const NOT_LIKE = [
  { v: "kicad" },
  { v: "fusion 360" },
  { v: "traditional eda software" },
];

const FLOWS = [
  { n: "01", t: "layout", q: "where are things?", d: "drag-select a grid. every cell starts as a key. merge, split, rearrange — purely spatial." },
  { n: "02", t: "components", q: "what are these things?", d: "switches, encoders, oleds, joysticks. select cells and apply properties like notion." },
  { n: "03", t: "pcb", q: "what does the board look like?", d: "shape, edges, silkscreen, labels. routing is generated for you in the background." },
  { n: "04", t: "case", q: "how is it housed?", d: "mounting style, wall thickness, typing angle, cutouts. parametric, with live preview." },
  { n: "05", t: "caps & covers", q: "what does it feel like?", d: "keycap profiles, knob covers, materials, legends. the project becomes a product." },
];

const SURFACES = [
  { l: "macropads", n: "01" },
  { l: "macro controllers", n: "02" },
  { l: "small keyboards", n: "03" },
  { l: "control surfaces", n: "04" },
  { l: "encoder decks", n: "05" },
  { l: "display-based input", n: "06" },
];

const COMPONENTS: { type: CompType; l: string }[] = [
  { type: "key", l: "key" },
  { type: "encoder", l: "encoder" },
  { type: "knob", l: "knob" },
  { type: "oled", l: "oled" },
  { type: "eink", l: "e-ink" },
  { type: "joystick", l: "joystick" },
  { type: "touch", l: "touch strip" },
  { type: "spacer", l: "spacer" },
];

// hero diorama: 4 cols × 3 rows of editor-style component previews
type DioCell = { type: CompType; cs?: number };
const HERO_DIORAMA: DioCell[] = [
  { type: "key" }, { type: "key" }, { type: "key" }, { type: "encoder" },
  { type: "oled", cs: 2 }, { type: "key" }, { type: "knob" },
  { type: "key" }, { type: "key" }, { type: "key" }, { type: "key" },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* HERO */}
      <section className="bg-editor-header border-b border-border/60">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 grid md:grid-cols-12 gap-10 items-end">
          <div className="md:col-span-7">
            <span className="inline-block font-mono text-[10px] uppercase tracking-[0.25em] text-stone-700 bg-stone-50/70 border border-stone-300/60 rounded-full px-3 py-1">
              v1 · spatial hardware design
            </span>
            <h1 className="mt-6 font-display text-5xl md:text-7xl leading-[0.92] tracking-tight lowercase">
              keeberia.<br />
              <span className="text-stone-700/70">design input hardware, visually.</span>
            </h1>
            <p className="mt-6 max-w-xl font-mono text-sm leading-relaxed text-stone-700">
              a browser-based design environment for custom macropads, encoder decks, and small
              keyboards. start with layout and interaction — pcb, case, and firmware are generated
              behind the scenes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/start"
                className="rounded-md bg-stone-900 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-50 hover:bg-stone-800 analog-shadow-sm"
              >
                start a project →
              </Link>
              <Link
                to="/philosophy"
                className="rounded-md border border-stone-400/60 bg-stone-50/60 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] hover:bg-stone-50"
              >
                read the philosophy
              </Link>
            </div>
          </div>

          {/* Mini macropad diorama — uses the same component previews as the editor */}
          <div className="md:col-span-5 relative">
            <div className="relative rounded-md bg-card border border-stone-900/10 analog-shadow p-5">
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: "repeat(4, 1fr)", gridAutoRows: "56px" }}
              >
                {HERO_DIORAMA.map((c, i) => (
                  <div
                    key={i}
                    style={c.cs ? { gridColumn: `span ${c.cs}` } : undefined}
                  >
                    <Comp2D type={c.type} w={c.cs ? 120 : 56} h={56} />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-stone-600">
              4×3 macropad · 2 encoders · 1 oled
            </div>
          </div>
        </div>
      </section>

      {/* FEELS LIKE / NOT LIKE */}
      <section className="border-b border-border/60">
        <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ feels like</span>
            <h2 className="mt-2 font-display text-3xl lowercase">closer to design tools</h2>
            <ul className="mt-6 space-y-2">
              {FEELS_LIKE.map((f) => (
                <li key={f.v} className="font-display text-2xl lowercase flex items-baseline gap-3">
                  <span className="font-mono text-[10px] text-emerald-700 uppercase tracking-wider">{f.y}</span>
                  <span>{f.v}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ not like</span>
            <h2 className="mt-2 font-display text-3xl lowercase">not engineering software</h2>
            <ul className="mt-6 space-y-2">
              {NOT_LIKE.map((f) => (
                <li key={f.v} className="font-display text-2xl lowercase text-stone-500 line-through decoration-stone-400/40">
                  {f.v}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FLOWS */}
      <section className="bg-secondary/40 border-b border-border/60">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ workflow</span>
          <h2 className="mt-2 font-display text-3xl md:text-4xl lowercase">five flows, increasing complexity</h2>
          <p className="mt-4 max-w-2xl font-mono text-sm text-stone-700 leading-relaxed">
            instead of <span className="text-stone-500">electronics → cad → manufacturing</span>,
            keeberia goes <span className="text-stone-900">layout → identity → fabrication</span>.
            how humans actually think about custom devices.
          </p>
          <div className="mt-10 grid md:grid-cols-5 gap-3">
            {FLOWS.map((f) => (
              <div key={f.n} className="bg-card rounded-md border border-border p-4 analog-shadow-sm">
                <div className="font-mono text-[10px] text-muted-foreground">{f.n}</div>
                <div className="mt-2 font-display text-xl lowercase">{f.t}</div>
                <div className="mt-1 font-mono text-[10px] text-stone-600 italic lowercase">"{f.q}"</div>
                <p className="mt-3 font-mono text-[11px] text-muted-foreground leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT YOU CAN BUILD */}
      <section className="border-b border-border/60">
        <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ what you can build</span>
            <h2 className="mt-2 font-display text-3xl md:text-4xl lowercase">small input devices, mostly</h2>
            <p className="mt-4 font-mono text-sm text-stone-700 leading-relaxed">
              keeberia starts focused on macropads and small keyboards. the longer-term vision
              extends to split keyboards, midi controllers, modular desk controllers, and
              embedded display systems — all built through the same spatial editor.
            </p>
          </div>
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SURFACES.map((a) => (
              <div key={a.l} className="bg-card rounded-md border border-border p-4 analog-shadow-sm">
                <div className="font-mono text-[10px] text-muted-foreground">{a.n}</div>
                <div className="mt-2 font-mono text-xs lowercase">{a.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VISUAL LANGUAGE */}
      <section className="bg-secondary/40 border-b border-border/60">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ visual language</span>
          <h2 className="mt-2 font-display text-3xl md:text-4xl lowercase">abstract symbols, not footprints</h2>
          <p className="mt-4 max-w-2xl font-mono text-sm text-stone-700 leading-relaxed">
            you place a <span className="font-mono">"knob"</span>, not an
            <span className="font-mono"> "ec11 with 15mm shaft and mounting pads"</span>.
            the translation happens internally.
          </p>
          <div className="mt-10 grid grid-cols-4 md:grid-cols-8 gap-3">
            {COMPONENTS.map((c) => (
              <div key={c.l} className="bg-card rounded-md border border-border p-3 text-center analog-shadow-sm">
                <div className="flex items-center justify-center"><ComponentSwatch type={c.type} size={56} /></div>
                <div className="mt-2 font-mono text-[10px] lowercase text-muted-foreground">{c.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUOTE */}
      <section className="border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <p className="font-display text-2xl md:text-3xl leading-snug lowercase text-stone-800">
            keeberia is a spatial hardware design platform that lets you visually create custom
            keyboards and input devices, then automatically translates those designs into
            manufacturable pcb, case, and firmware outputs.
          </p>
          <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            — in one sentence
          </div>
          <div className="mt-10">
            <Link
              to="/start"
              className="rounded-md bg-stone-900 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-50 hover:bg-stone-800 analog-shadow-sm"
            >
              start designing →
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
