import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "../components/keeberia/SiteChrome";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "roadmap — keeberia" },
      { name: "description", content: "what's shipped, what's in progress, and what's next for keeberia." },
      { property: "og:title", content: "roadmap — keeberia" },
      { property: "og:description", content: "from macropad-first to a full modular human-interface design platform." },
    ],
  }),
  component: RoadmapPage,
});

type Status = "shipped" | "in-progress" | "next" | "later";

const MILESTONES: { date: string; status: Status; title: string; bullets: string[] }[] = [
  {
    date: "shipped",
    status: "shipped",
    title: "macropad layout editor",
    bullets: [
      "project create modal with presets (2×2, 3×3, 4×4, numpad, streamdeck)",
      "google-docs-style drag-select grid setup",
      "default matrix where every cell is a key",
      "right-click context menu: merge, split, switch to",
      "abstract symbol rendering: keys, knobs, encoders, oleds",
    ],
  },
  {
    date: "in progress",
    status: "in-progress",
    title: "flow two — components",
    bullets: [
      "switch type picker: cherry mx, kailh choc, gateron low profile",
      "encoder model selection (ec11 and friends)",
      "display modules: 128×32 oled, 128×64 oled, eink",
      "rgb modes: underglow, per-key, side leds, none",
      "notion-style multi-select property editing",
    ],
  },
  {
    date: "next",
    status: "next",
    title: "flow three — pcb",
    bullets: [
      "pcb shape: auto rectangular, rounded, convex hull, custom dxf",
      "edge controls: corner radius, chamfer, wall clearance",
      "silkscreen surface: text, labels, svg upload, graphics",
      "auto matrix routing in the background",
      "advanced trace + via editing later, off by default",
    ],
  },
  {
    date: "next",
    status: "next",
    title: "flow four — case",
    bullets: [
      "mount styles: tray, sandwich, top mount, integrated plate",
      "parametric wall thickness, typing angle, front/rear height",
      "screw type and heatset insert placement",
      "usb, reset, and indicator cutouts",
      "live preview of the housed object",
    ],
  },
  {
    date: "next",
    status: "next",
    title: "flow five — caps & covers",
    bullets: [
      "keycap profiles: cherry, oem, xda, dsa, sa, choc",
      "materials: abs, pbt, resin",
      "legend styles: blank, side, dye sub, transparent",
      "knob cover styles: aluminum, ribbed, smooth, fluted",
    ],
  },
  {
    date: "later",
    status: "later",
    title: "manufacturing outputs",
    bullets: [
      "kicad pcb file export",
      "gerbers, bom, cpl placement files",
      "qmk / via firmware configuration export",
      "step + dxf geometry for case and plate",
    ],
  },
  {
    date: "later",
    status: "later",
    title: "beyond macropads",
    bullets: [
      "split keyboards",
      "ergonomic keyboards",
      "modular desk controllers",
      "midi controllers",
      "industrial interfaces",
      "custom tactile devices",
      "embedded display systems",
    ],
  },
  {
    date: "later",
    status: "later",
    title: "shared library + community catalog",
    bullets: [
      "publish your components, layouts, and case styles",
      "remixable templates with attribution baked in",
      "community switch profiles, encoder packs, knob libraries",
    ],
  },
];

const STATUS_COLOR: Record<Status, string> = {
  shipped: "bg-emerald-600",
  "in-progress": "bg-amber-500",
  next: "bg-stone-700",
  later: "bg-stone-400",
};

function RoadmapPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 w-full">
        <header className="mb-14">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-3">roadmap</p>
          <h1 className="font-display text-5xl lowercase tracking-tight">macropad-first, then everything else.</h1>
          <p className="mt-4 max-w-xl text-stone-700 leading-relaxed font-mono text-sm">
            keeberia starts focused on the layout flow for small input devices, then expands into
            components, pcb, case, caps, and finally full manufacturing outputs.
          </p>
        </header>

        <ol className="relative border-l-2 border-dashed border-stone-300 ml-3 space-y-10">
          {MILESTONES.map((m) => (
            <li key={m.title} className="pl-8 relative">
              <span className={`absolute -left-[9px] top-1 size-4 rounded-full ring-4 ring-background ${STATUS_COLOR[m.status]}`} />
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{m.date}</p>
              <h3 className="mt-1 font-display text-2xl lowercase">{m.title}</h3>
              <ul className="mt-3 space-y-1.5">
                {m.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 font-mono text-[12px] lowercase text-stone-700">
                    <span className="text-stone-500 mt-[2px]">·</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </main>
      <SiteFooter />
    </div>
  );
}
