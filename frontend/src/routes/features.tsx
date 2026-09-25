import { createFileRoute, Link } from "@tanstack/react-router";
import {
  MousePointer2,
  Grid3x3,
  Combine,
  Replace,
  PanelRight,
  Keyboard,
  Layers,
  Undo2,
  Save,
  Share2,
  Library,
  Workflow,
  Eye,
  Wand2,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "../components/keeberia/SiteChrome";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "features — keeberia" },
      { name: "description", content: "what the keeberia app does: spatial editor, multi-select, merge, component switching, presets, project library, exports." },
      { property: "og:title", content: "features — keeberia" },
      { property: "og:description", content: "the editor capabilities of keeberia — a browser-based spatial design app for custom input hardware." },
    ],
  }),
  component: FeaturesPage,
});

const FEATURES = [
  { Icon: Grid3x3, t: "spatial grid editor", d: "drag-select a matrix up to 10×12, or start blank. every cell defaults to a key, ready to switch." },
  { Icon: MousePointer2, t: "google-docs-style controls", d: "hover edges to insert rows or columns. right-click headers to delete, shift, or reorder via drag handles." },
  { Icon: Combine, t: "marquee multi-select & merge", d: "drag across cells to select, then merge into 2u keys, encoder rows, or display modules in one action." },
  { Icon: Replace, t: "switch-to component types", d: "any region becomes a key, encoder, knob, oled, eink, joystick, touch strip, or spacer via the context menu." },
  { Icon: PanelRight, t: "inspector panel", d: "right-side panel for editing region properties, dimensions, and viewing live project stats." },
  { Icon: Workflow, t: "five-stage workflow", d: "advance from layout → components → pcb → case → caps using the stage tabs and next button in the header." },
  { Icon: Keyboard, t: "project presets", d: "start fast with 2×2, 3×3, 4×4, numpad, or streamdeck presets — or build a custom grid from scratch." },
  { Icon: Layers, t: "abstract visual language", d: "lucide-based symbols for every component. read your layout at a glance without engineering noise." },
  { Icon: Wand2, t: "context-aware right-click menus", d: "different actions on cells vs. row/column headers. everything is one click away, nothing buried in toolbars." },
  { Icon: Eye, t: "live preview as you edit", d: "the canvas always reflects current state. no compile step between thought and pixel." },
  { Icon: Undo2, t: "non-destructive editing", d: "split merged regions, undo type switches, and rearrange without losing existing component assignments." },
  { Icon: Save, t: "auto-saved projects", d: "your project persists in-browser between sessions and across the layout → caps progression." },
];

const ROADMAP_FEATURES = [
  { Icon: Library, t: "component library", d: "shared catalog of switches, encoders, displays, and knob covers — yours and the community's." },
  { Icon: Share2, t: "shareable project urls", d: "send a layout link. recipients open it in their browser, fork it, remix it." },
];

function FeaturesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 w-full">
        <header className="mb-14 max-w-3xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-3">features</p>
          <h1 className="font-display text-5xl lowercase tracking-tight">what the keeberia app actually does.</h1>
          <p className="mt-4 text-stone-700 leading-relaxed font-mono text-sm">
            the editor capabilities at a glance. for the broader design philosophy and the
            five-flow pipeline, see{" "}
            <Link to="/howitworks/flow" className="underline decoration-dotted underline-offset-4">how it works</Link>.
          </p>
        </header>

        <section>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-4">/ in the editor today</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURES.map((f) => (
              <div key={f.t} className="rounded-md border border-border bg-card/70 p-5 analog-shadow-sm">
                <div className="flex items-center gap-2">
                  <f.Icon size={16} className="text-stone-700" />
                  <h3 className="font-display text-lg lowercase">{f.t}</h3>
                </div>
                <p className="mt-2 font-mono text-[11px] text-stone-600 leading-relaxed lowercase">{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-4">/ coming soon</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {ROADMAP_FEATURES.map((f) => (
              <div key={f.t} className="rounded-md border border-dashed border-stone-300 bg-stone-50/40 p-5">
                <div className="flex items-center gap-2">
                  <f.Icon size={16} className="text-stone-500" />
                  <h3 className="font-display text-lg lowercase text-stone-700">{f.t}</h3>
                </div>
                <p className="mt-2 font-mono text-[11px] text-stone-500 leading-relaxed lowercase">{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 flex flex-wrap gap-3">
          <Link
            to="/start"
            className="rounded-md bg-stone-900 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-50 hover:bg-stone-800 analog-shadow-sm"
          >
            open the editor →
          </Link>
          <Link
            to="/howitworks/flow"
            className="rounded-md border border-stone-400/60 bg-stone-50/60 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] hover:bg-stone-50"
          >
            see the full pipeline
          </Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
