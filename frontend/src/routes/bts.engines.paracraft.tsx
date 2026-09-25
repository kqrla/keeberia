import { createFileRoute, Link } from "@tanstack/react-router";
import { Box, ArrowLeft, SlidersHorizontal } from "lucide-react";
import { SiteHeader, SiteFooter } from "../components/keeberia/SiteChrome";

export const Route = createFileRoute("/bts/engines/paracraft")({
  head: () => ({
    meta: [
      { title: "paracraft, the case engine — keeberia" },
      {
        name: "description",
        content:
          "paracraft compiles a finished keeberia board into a printable enclosure: a tray with standoffs and a usb slot, plus a switch plate, as one dependency-free openscad file.",
      },
      { property: "og:title", content: "paracraft, the case engine — keeberia" },
      {
        property: "og:description",
        content: "the board becomes an enclosure. parametric, deterministic, printable.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ParacraftPage,
});

const PARTS = [
  {
    n: "01",
    t: "case bottom",
    d: "a tray with a floor and walls, standoffs sitting under the board's own mounting holes, and a usb-c slot cut into the wall nearest the mcu's usb edge. that wall is worked out from the placement rotation, never hardcoded.",
  },
  {
    n: "02",
    t: "top plate",
    d: "the switch plate: 14mm mx openings, 10mm encoder shaft holes, an oled window where the display sits, and m2 screw holes lining up with the standoffs below.",
  },
];

// these are the exact named parameters the generated scad file opens with, so
// the configurator sliders and the printed part can never drift apart.
const SLIDERS = [
  "pcb_width",
  "pcb_height",
  "case_margin",
  "wall_thickness",
  "base_thickness",
  "corner_radius",
  "front_height",
  "rear_height",
  "standoff_height",
  "screw_size",
  "plate_thickness",
];

const WARNINGS = [
  "the usb port would breach the case floor. raise the standoff height above 4.3mm.",
  "this board has no mounting holes, so the case cannot anchor the pcb.",
];

function ParacraftPage() {
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
            <Box size={22} strokeWidth={1.5} className="text-stone-700" />
          </div>
          <h1 className="mt-4 font-display text-5xl md:text-6xl leading-[0.95] lowercase tracking-tight">
            paracraft<br />
            <span className="text-stone-700/70">the board becomes an enclosure.</span>
          </h1>
          <p className="mt-6 max-w-2xl font-mono text-sm leading-relaxed text-stone-700">
            the parametric case compiler. it takes the finished pcb and writes openscad source for
            the two parts you print. pure, synchronous, deterministic: same board in, same case out,
            forever.
          </p>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ what it makes</span>
          <h2 className="mt-2 font-display text-3xl lowercase">two printed parts, one file</h2>
          <div className="mt-10 grid md:grid-cols-2 gap-3">
            {PARTS.map((p) => (
              <div key={p.n} className="bg-card rounded-md border border-border p-6 analog-shadow-sm">
                <div className="font-mono text-[10px] text-muted-foreground">{p.n}</div>
                <div className="mt-2 font-display text-xl lowercase">{p.t}</div>
                <p className="mt-3 font-mono text-xs text-muted-foreground leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-2xl font-mono text-sm leading-relaxed text-stone-700">
            both parts arrive in a single vanilla openscad file with no library dependencies, so you
            can print it, edit it, or paste it straight into a web playground. coordinates match the
            board: the origin is the board centre, and positive y points at the usb wall.
          </p>
        </div>
      </section>

      <section className="bg-secondary/40 border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <SlidersHorizontal size={20} strokeWidth={1.5} className="text-stone-700" />
          <span className="mt-4 block font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ the sliders</span>
          <h2 className="mt-2 font-display text-3xl lowercase">every case is a parameter block</h2>
          <p className="mt-6 max-w-2xl font-mono text-sm leading-relaxed text-stone-700">
            the generated file opens with named parameters. those same names become the sliders in
            the configurator, so moving one in the editor and editing the scad by hand do exactly
            the same thing.
          </p>
          <ul className="mt-8 grid sm:grid-cols-3 gap-y-1 font-mono text-sm text-stone-800 lowercase">
            {SLIDERS.map((s) => (
              <li key={s}>· {s}</li>
            ))}
          </ul>
          <p className="mt-8 max-w-2xl font-mono text-xs leading-relaxed text-stone-600">
            everything derived from them, the usb slot size and position, the standoff coordinates,
            the plate openings, is regenerated by the engine whenever the board changes.
          </p>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ where the numbers come from</span>
          <h2 className="mt-2 font-display text-3xl lowercase">component-driven, not example-driven</h2>
          <p className="mt-6 max-w-2xl font-mono text-sm leading-relaxed text-stone-700">
            dimensions come from the parts themselves: the usb-c shell at 9.4 by 3.26, the ec11
            shaft needing 10mm of clearance, the mx plate opening at 14mm. no measurement is copied
            from an existing keyboard. reference designs inform practice, they do not define the
            geometry.
          </p>
        </div>
      </section>

      <section className="bg-secondary/40 border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ validation</span>
          <h2 className="mt-2 font-display text-3xl lowercase">human words, never codes</h2>
          <div className="mt-8 space-y-3 max-w-2xl">
            {WARNINGS.map((w) => (
              <div key={w} className="rounded-md border border-dashed border-stone-400 bg-stone-50/50 p-5">
                <p className="font-mono text-sm lowercase text-stone-700">{w}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-2xl font-mono text-sm leading-relaxed text-stone-700">
            a case error stops the job, because retrying cannot fix a design flaw. warnings ride
            along with the files so you can decide whether they matter for your print.
          </p>
        </div>
      </section>

      <section className="py-24 text-center">
        <p className="font-display text-2xl md:text-3xl lowercase text-stone-800 leading-snug max-w-2xl mx-auto">
          the honest check is not a nice render. it is whether the geometry compiles to a real stl.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/bts/engines/circuitron"
            className="rounded-md border border-stone-400 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-800 hover:border-stone-600"
          >
            ← circuitron
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
