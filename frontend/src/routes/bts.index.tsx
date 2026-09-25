import { createFileRoute, Link } from "@tanstack/react-router";
import { CircuitBoard, Box, FileCode2, ShieldCheck } from "lucide-react";
import { SiteHeader, SiteFooter } from "../components/keeberia/SiteChrome";

export const Route = createFileRoute("/bts/")({
  head: () => ({
    meta: [
      { title: "behind the scenes — keeberia" },
      {
        name: "description",
        content:
          "what happens after you stop dragging things around. a deterministic pipeline turns a keeberia layout into a manufacturable board, a printable case, and working firmware.",
      },
      { property: "og:title", content: "behind the scenes — keeberia" },
      {
        property: "og:description",
        content: "layout json in, copper and plastic out. no ai in the copper path.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BehindTheScenes,
});

// the two engines are named in the repo, so the marketing copy uses the same
// names rather than inventing friendlier ones. keeping one vocabulary across
// docs, code and site avoids the usual drift between what we build and what we say.
const ENGINES = [
  {
    to: "/bts/engines/circuitron",
    icon: CircuitBoard,
    name: "circuitron",
    role: "the pcb engine",
    line: "placement, nets, routing and design rule checks. layout in, manufacturable board out.",
    outputs: ["kicad 8 board file", "gerbers and drill", "bill of materials", "svg preview", "qmk and vial firmware"],
  },
  {
    to: "/bts/engines/paracraft",
    icon: Box,
    name: "paracraft",
    role: "the case engine",
    line: "the finished board becomes a tray, a switch plate and a usb slot on the correct wall.",
    outputs: ["dependency-free openscad file", "case bottom", "top plate", "stl when openscad is present"],
  },
] as const;

const ARTIFACTS = [
  "kicad_pcb board file",
  "gerber set + drill file",
  "bom csv",
  "svg board preview",
  "qmk keymap and rules",
  "vial json",
  "openscad case source",
  "stl case parts",
];

function BehindTheScenes() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="bg-editor-header border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-700">/ behind the scenes</span>
          <h1 className="mt-4 font-display text-5xl md:text-6xl leading-[0.95] lowercase tracking-tight">
            you drag rectangles around.<br />
            <span className="text-stone-700/70">something has to turn that into copper.</span>
          </h1>
          <p className="mt-6 max-w-2xl font-mono text-sm leading-relaxed text-stone-700">
            the editor is deliberately calm. underneath it sits a pair of engines that take the
            project you drew and compile it into files a factory and a 3d printer can actually
            accept. no ai touches the copper path. the same layout produces the same board, every
            time, forever.
          </p>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ the pipeline</span>
          <h2 className="mt-2 font-display text-3xl lowercase">one line, four moves</h2>
          <div className="mt-8 rounded-md border border-border bg-card p-6 analog-shadow-sm">
            <p className="font-mono text-xs sm:text-sm lowercase leading-relaxed text-stone-800">
              layout json
              <span className="text-stone-400"> → </span>
              circuitron
              <span className="text-stone-400"> → </span>
              paracraft
              <span className="text-stone-400"> → </span>
              exports you can send out
            </p>
          </div>
          <p className="mt-6 max-w-2xl font-mono text-sm leading-relaxed text-stone-700">
            your project is stored as plain layout data. circuitron reads it and produces the
            board. paracraft reads the finished board and produces the enclosure. nothing is
            hand-assembled between those steps, which is why changing one key in the editor can
            regenerate the whole set.
          </p>
        </div>
      </section>

      <section className="bg-secondary/40 border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ the engines</span>
          <h2 className="mt-2 font-display text-3xl lowercase">two compilers, one project model</h2>
          <div className="mt-10 grid md:grid-cols-2 gap-4">
            {ENGINES.map((engine) => {
              const Icon = engine.icon;
              return (
                <Link
                  key={engine.name}
                  to={engine.to}
                  className="group bg-card rounded-md border border-border p-6 analog-shadow-sm hover:border-stone-400 transition-colors"
                >
                  <Icon size={20} strokeWidth={1.5} className="text-stone-700" />
                  <div className="mt-4 font-display text-2xl lowercase">{engine.name}</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    {engine.role}
                  </div>
                  <p className="mt-4 font-mono text-xs leading-relaxed text-stone-700">{engine.line}</p>
                  <ul className="mt-5 space-y-1 font-mono text-[11px] text-muted-foreground lowercase">
                    {engine.outputs.map((o) => (
                      <li key={o}>· {o}</li>
                    ))}
                  </ul>
                  <span className="mt-6 inline-block font-mono text-[10px] uppercase tracking-[0.2em] text-stone-700 group-hover:text-stone-900">
                    read more →
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ what you get out</span>
          <h2 className="mt-2 font-display text-3xl lowercase">real files, not a rendering</h2>
          <ul className="mt-8 grid sm:grid-cols-2 gap-y-1 font-mono text-sm text-stone-700 lowercase">
            {ARTIFACTS.map((a) => (
              <li key={a}>· {a}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-secondary/40 border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10">
          <div>
            <FileCode2 size={20} strokeWidth={1.5} className="text-stone-700" />
            <h3 className="mt-4 font-display text-2xl lowercase">determinism is the feature</h3>
            <p className="mt-4 font-mono text-sm leading-relaxed text-stone-700">
              no timestamps, no randomness, no ordering that shifts between runs. if you send a
              board to a fab today and regenerate it in a year, the files match. that is what makes
              a generated design something you can trust rather than something you have to re-check.
            </p>
          </div>
          <div>
            <ShieldCheck size={20} strokeWidth={1.5} className="text-stone-700" />
            <h3 className="mt-4 font-display text-2xl lowercase">validation in human words</h3>
            <p className="mt-4 font-mono text-sm leading-relaxed text-stone-700">
              the engines never hand you an error code. they say things like "this board has no
              mounting holes, so the case cannot anchor the pcb". you get a sentence you can act on
              without knowing what a keepout is.
            </p>
          </div>
        </div>
      </section>

      <section className="py-24 text-center">
        <h2 className="font-display text-4xl lowercase text-stone-900">start with a shape. end with a device.</h2>
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
