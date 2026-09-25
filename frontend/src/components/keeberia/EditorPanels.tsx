// editor panels: project tree, templates, component library,
// project health, readiness score, cost estimate.
//
// layout shape:
//   - left side is a narrow icon rail (tree / templates / library).
//     clicking an icon opens a flyout panel overlaid on top of the
//     workspace, so the main preview keeps its full width.
//   - readiness lives in a floating draggable modal triggered from a
//     menu icon. it stays closed until the user opens it.
import {
  Layers, Boxes, FolderOpen, Activity, Coins,
  ChevronDown, ChevronRight, Square, Circle, Disc,
  Monitor, RectangleHorizontal, Gamepad2, Minus, Dot, X,
  CheckCircle2, AlertTriangle, Circle as CircleIcon,
  Gauge, GripHorizontal, Info,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

// ---------- types (kept loose to avoid coupling) ----------
export type CompTypeLite =
  | "key" | "encoder" | "knob" | "oled" | "eink"
  | "joystick" | "touch" | "spacer" | "blocker";

export type RegionLite = {
  id: string;
  type: CompTypeLite;
  x: number; y: number; w: number; h: number;
  spec?: Record<string, string>;
};

export type Lens = "layout" | "components" | "pcb" | "case" | "caps";

export type ProjectHealthInput = {
  rows: number;
  cols: number;
  regions: RegionLite[];
  pcbValid: boolean;
  pcbWarnings: number;
  caseWarnings: number;
  caseErrors: number;
  hasUsbCutout: boolean;
  capsConfigured: boolean;
};

// ---------- templates ----------
export type ProjectTemplate = {
  id: string;
  name: string;
  description: string;
  rows: number;
  cols: number;
  regions: Omit<RegionLite, "id">[];
};

const T = (
  type: CompTypeLite, x: number, y: number, w = 1, h = 1,
): Omit<RegionLite, "id"> => ({ type, x, y, w, h });

export const TEMPLATES: ProjectTemplate[] = [
  {
    id: "macro-3x3",
    name: "3x3 macropad",
    description: "nine keys. the classic starter.",
    rows: 3, cols: 3,
    regions: Array.from({ length: 9 }, (_, i) => T("key", i % 3, Math.floor(i / 3))),
  },
  {
    id: "media",
    name: "media controller",
    description: "four keys plus a volume knob.",
    rows: 2, cols: 3,
    regions: [
      T("key", 0, 0), T("key", 1, 0), T("knob", 2, 0),
      T("key", 0, 1), T("key", 1, 1), T("key", 2, 1),
    ],
  },
  {
    id: "stream",
    name: "streamdeck-style",
    description: "fifteen labeled keys plus an oled.",
    rows: 4, cols: 5,
    regions: [
      T("oled", 0, 0, 5, 1),
      ...Array.from({ length: 15 }, (_, i) => T("key", i % 5, 1 + Math.floor(i / 5))),
    ],
  },
  {
    id: "knob-controller",
    name: "knob controller",
    description: "four endless rotaries.",
    rows: 2, cols: 2,
    regions: [
      T("knob", 0, 0), T("knob", 1, 0),
      T("knob", 0, 1), T("knob", 1, 1),
    ],
  },
  {
    id: "cad",
    name: "cad shortcut pad",
    description: "twelve keys plus a primary encoder.",
    rows: 4, cols: 4,
    regions: [
      T("encoder", 0, 0, 2, 2),
      T("key", 2, 0), T("key", 3, 0),
      T("key", 2, 1), T("key", 3, 1),
      ...Array.from({ length: 8 }, (_, i) => T("key", i % 4, 2 + Math.floor(i / 4))),
    ],
  },
  {
    id: "macro-board",
    name: "macro keyboard",
    description: "five-by-three with a side oled.",
    rows: 3, cols: 6,
    regions: [
      T("oled", 5, 0, 1, 3),
      ...Array.from({ length: 15 }, (_, i) => T("key", i % 5, Math.floor(i / 5))),
    ],
  },
];

// ---------- component library ----------
type LibraryEntry = {
  category: string;
  type: CompTypeLite;
  name: string;
  detail: string;
};

export const LIBRARY: LibraryEntry[] = [
  { category: "switches", type: "key", name: "cherry mx brown", detail: "tactile · 45g · 5-pin" },
  { category: "switches", type: "key", name: "kailh choc v2", detail: "low-profile · hotswap" },
  { category: "switches", type: "key", name: "gateron low profile", detail: "linear · 35g" },
  { category: "encoders", type: "encoder", name: "ec11 · 15mm shaft", detail: "20 detents · with switch" },
  { category: "encoders", type: "encoder", name: "ec12 low-profile", detail: "smooth · panel mount" },
  { category: "displays", type: "oled", name: "ssd1306 · 128x32", detail: "i2c · 0.91 inch" },
  { category: "displays", type: "oled", name: "ssd1306 · 128x64", detail: "i2c · 0.96 inch" },
  { category: "displays", type: "eink", name: "2.13 inch e-ink", detail: "spi · b/w · refresh ~1s" },
  { category: "controllers", type: "spacer", name: "xiao rp2040", detail: "21mm wide · usb-c" },
  { category: "controllers", type: "spacer", name: "rp2040 zero", detail: "23mm wide · usb-c" },
  { category: "controllers", type: "spacer", name: "nice!nano v2", detail: "ble · for wireless" },
];

const ICONS: Record<CompTypeLite, React.ComponentType<{ size?: number; className?: string }>> = {
  key: Square, encoder: Circle, knob: Disc, oled: Monitor, eink: RectangleHorizontal,
  joystick: Gamepad2, touch: Minus, spacer: Dot, blocker: X,
};

// ============================================================
// left sidebar: icon rail + flyout
// ============================================================
type LeftTab = "tree" | "templates" | "library";

export function LeftSidebar({
  regions, lens, setLens, onApplyTemplate, health, tips,
}: {
  regions: RegionLite[];
  lens: Lens;
  setLens: (l: Lens) => void;
  onApplyTemplate: (t: ProjectTemplate) => void;
  health: ProjectHealthInput;
  tips: string[];
}) {
  const [openTab, setOpenTab] = useState<LeftTab | null>(null);
  // each floating modal tracks its own open state + position so the
  // user can keep, say, readiness pinned while opening tips.
  const [readinessOpen, setReadinessOpen] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // close the flyout when the user clicks outside of either the rail or panel.
  useEffect(() => {
    if (!openTab) return;
    const onDown = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpenTab(null);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [openTab]);

  const railBtn = (
    tab: LeftTab,
    Icon: React.ComponentType<{ size?: number; className?: string }>,
    label: string,
  ) => (
    <button
      key={tab}
      onClick={() => setOpenTab((cur) => (cur === tab ? null : tab))}
      title={label}
      aria-label={label}
      className={`size-10 inline-flex items-center justify-center rounded-md transition-colors
        ${openTab === tab ? "bg-stone-900 text-stone-50" : "text-stone-600 hover:bg-stone-100"}`}
    >
      <Icon size={16} />
    </button>
  );

  const floatBtn = (
    active: boolean,
    onClick: () => void,
    Icon: React.ComponentType<{ size?: number; className?: string }>,
    label: string,
  ) => (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`size-10 inline-flex items-center justify-center rounded-md transition-colors
        ${active ? "bg-stone-900 text-stone-50" : "text-stone-600 hover:bg-stone-100"}`}
    >
      <Icon size={16} />
    </button>
  );

  return (
    <div ref={containerRef} className="relative shrink-0 z-30">
      <div className="w-12 h-full border-r border-border bg-sidebar flex flex-col items-center py-2 gap-1">
        {railBtn("tree", Layers, "tree")}
        {railBtn("templates", FolderOpen, "templates")}
        {railBtn("library", Boxes, "library")}
        {/* spacer pushes readiness + tips to the bottom of the rail. */}
        <div className="flex-1" />
        {floatBtn(readinessOpen, () => setReadinessOpen((v) => !v), Gauge, "manufacturing readiness")}
        {floatBtn(tipsOpen, () => setTipsOpen((v) => !v), Info, "tips")}
      </div>
      {openTab && (
        <aside
          className="absolute top-0 left-12 h-full w-64 border-r border-border bg-sidebar shadow-xl flex flex-col"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-stone-500">{openTab}</span>
            <button
              onClick={() => setOpenTab(null)}
              className="size-6 inline-flex items-center justify-center rounded text-stone-500 hover:bg-stone-100"
              aria-label="close panel"
            >
              <X size={12} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {openTab === "tree" && <ProjectTree regions={regions} lens={lens} setLens={setLens} />}
            {openTab === "templates" && <TemplatePicker onApply={onApplyTemplate} />}
            {openTab === "library" && <ComponentLibrary />}
          </div>
        </aside>
      )}
      {readinessOpen && (
        <ReadinessModal health={health} onClose={() => setReadinessOpen(false)} />
      )}
      {tipsOpen && (
        <TipsModal tips={tips} lens={lens} onClose={() => setTipsOpen(false)} />
      )}
    </div>
  );
}

function ProjectTree({
  regions, lens, setLens,
}: {
  regions: RegionLite[];
  lens: Lens;
  setLens: (l: Lens) => void;
}) {
  const grouped = useMemo(() => {
    const m = new Map<CompTypeLite, RegionLite[]>();
    for (const r of regions) {
      const arr = m.get(r.type) ?? [];
      arr.push(r);
      m.set(r.type, arr);
    }
    return Array.from(m.entries());
  }, [regions]);

  const lenses: { id: Lens; label: string }[] = [
    { id: "layout", label: "layout" },
    { id: "components", label: "components" },
    { id: "pcb", label: "pcb" },
    { id: "case", label: "enclosure" },
    { id: "caps", label: "keycaps and knobs" },
  ];

  return (
    <div className="space-y-3">
      <div>
        <TreeHeader>project</TreeHeader>
        <div className="space-y-0.5 mt-1">
          {lenses.map((l) => (
            <button
              key={l.id}
              onClick={() => setLens(l.id)}
              className={`w-full text-left flex items-center gap-1.5 px-2 py-1 rounded font-mono text-[11px] lowercase
                ${lens === l.id ? "bg-stone-900 text-stone-50" : "text-stone-700 hover:bg-stone-100"}`}
            >
              <ChevronRight size={10} className="opacity-40" />
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <TreeHeader>components</TreeHeader>
        <div className="mt-1 space-y-1">
          {grouped.length === 0 && (
            <div className="font-mono text-[10px] text-stone-500 lowercase px-2 py-1">no components yet.</div>
          )}
          {grouped.map(([type, rs]) => (
            <TreeGroup key={type} type={type} regions={rs} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TreeHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-stone-500 px-1">
      {children}
    </div>
  );
}

function TreeGroup({ type, regions }: { type: CompTypeLite; regions: RegionLite[] }) {
  const [open, setOpen] = useState(false);
  const Icon = ICONS[type];
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-1.5 px-2 py-1 rounded font-mono text-[11px] lowercase text-stone-700 hover:bg-stone-100"
      >
        {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        <Icon size={11} />
        <span>{type}</span>
        <span className="ml-auto text-stone-400">{regions.length}</span>
      </button>
      {open && (
        <div className="pl-6 space-y-0.5">
          {regions.map((r, i) => (
            <div key={r.id} className="font-mono text-[10px] text-stone-500 lowercase px-2 py-0.5">
              {type} {String(i + 1).padStart(2, "0")} <span className="text-stone-400">· {r.x},{r.y} · {r.w}x{r.h}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TemplatePicker({ onApply }: { onApply: (t: ProjectTemplate) => void }) {
  return (
    <div className="space-y-2">
      <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-stone-500 px-1">
        start from a template
      </div>
      <div className="font-mono text-[10px] text-stone-500 lowercase px-1 leading-relaxed">
        applying a template replaces the current grid and regions.
      </div>
      <div className="space-y-1.5 mt-1">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => onApply(t)}
            className="w-full text-left bg-card border border-border rounded-md p-2.5 hover:border-stone-500 transition-colors analog-shadow-sm"
          >
            <div className="font-display text-sm lowercase">{t.name}</div>
            <div className="font-mono text-[10px] text-stone-500 lowercase mt-0.5 leading-relaxed">{t.description}</div>
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-400 mt-1.5">
              {t.rows} x {t.cols} · {t.regions.length} regions
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ComponentLibrary() {
  const grouped = useMemo(() => {
    const m = new Map<string, LibraryEntry[]>();
    for (const e of LIBRARY) {
      const arr = m.get(e.category) ?? [];
      arr.push(e);
      m.set(e.category, arr);
    }
    return Array.from(m.entries());
  }, []);
  return (
    <div className="space-y-3">
      <div className="font-mono text-[10px] text-stone-500 lowercase px-1 leading-relaxed">
        searchable parts catalog. assignments are made in the components lens.
      </div>
      {grouped.map(([cat, items]) => (
        <div key={cat}>
          <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-stone-500 px-1 mb-1">{cat}</div>
          <div className="space-y-1">
            {items.map((e) => {
              const Icon = ICONS[e.type];
              return (
                <div key={e.name} className="bg-card border border-border rounded-md p-2 flex items-start gap-2">
                  <Icon size={12} className="text-stone-600 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-mono text-[11px] lowercase text-stone-800 truncate">{e.name}</div>
                    <div className="font-mono text-[9px] text-stone-500 lowercase">{e.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// floating draggable modal (shared)
// ============================================================
// both readiness and tips render through a single draggable shell so
// they feel like the same family of utility windows.
function DraggableModal({
  title, defaultOffsetRight, defaultTop, width, onClose, children,
}: {
  title: string;
  defaultOffsetRight: number;
  defaultTop: number;
  width: number;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    if (typeof window === "undefined") return { x: 100, y: defaultTop };
    return { x: Math.max(20, window.innerWidth - defaultOffsetRight), y: defaultTop };
  });
  const dragState = useRef<{ dx: number; dy: number } | null>(null);

  function onDragStart(e: React.MouseEvent) {
    dragState.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    const onMove = (ev: MouseEvent) => {
      if (!dragState.current) return;
      const nx = Math.max(0, Math.min(window.innerWidth - width, ev.clientX - dragState.current.dx));
      const ny = Math.max(0, Math.min(window.innerHeight - 80, ev.clientY - dragState.current.dy));
      setPos({ x: nx, y: ny });
    };
    const onUp = () => {
      dragState.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <div
      className="fixed z-50 max-h-[80vh] bg-card border border-border rounded-md shadow-2xl flex flex-col"
      style={{ left: pos.x, top: pos.y, width }}
    >
      <div
        onMouseDown={onDragStart}
        className="flex items-center gap-2 px-3 py-2 border-b border-border bg-sidebar cursor-grab active:cursor-grabbing rounded-t-md select-none"
      >
        <GripHorizontal size={14} className="text-stone-400" />
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-600 flex-1">
          {title}
        </span>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onClose}
          className="size-6 inline-flex items-center justify-center rounded text-stone-500 hover:bg-stone-100"
          aria-label="close"
        >
          <X size={12} />
        </button>
      </div>
      <div className="overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

function ReadinessModal({
  health, onClose,
}: {
  health: ProjectHealthInput;
  onClose: () => void;
}) {
  const checks = buildHealthChecks(health);
  const score = readinessScore(checks);
  const costs = estimateCost(health);
  return (
    <DraggableModal
      title="manufacturing readiness"
      defaultOffsetRight={340}
      defaultTop={120}
      width={320}
      onClose={onClose}
    >
      <ReadinessHeader score={score} />
      <div className="p-3 space-y-4">
        <ProjectHealthPanel checks={checks} />
        <CostPanel costs={costs} />
      </div>
    </DraggableModal>
  );
}

function TipsModal({
  tips, lens, onClose,
}: {
  tips: string[];
  lens: Lens;
  onClose: () => void;
}) {
  return (
    <DraggableModal
      title={`tips · ${lens}`}
      defaultOffsetRight={320}
      defaultTop={180}
      width={280}
      onClose={onClose}
    >
      <div className="p-4 space-y-1.5 font-mono text-[11px] lowercase text-stone-700 leading-relaxed">
        {tips.length === 0 ? (
          <p className="text-stone-500">no tips for this view yet.</p>
        ) : (
          tips.map((t, i) => <p key={i}>· {t}</p>)
        )}
      </div>
    </DraggableModal>
  );
}


type HealthCheck = {
  id: string;
  label: string;
  state: "ok" | "warn" | "todo";
  detail?: string;
};

function buildHealthChecks(h: ProjectHealthInput): HealthCheck[] {
  const placedCells = h.regions.reduce((acc, r) => acc + r.w * r.h, 0);
  const gridCells = Math.max(1, h.rows * h.cols);
  const coverage = placedCells / gridCells;
  const assigned = h.regions.filter((r) => r.spec && Object.keys(r.spec).length > 0).length;
  return [
    {
      id: "layout",
      label: "layout complete",
      state: coverage > 0.6 ? "ok" : coverage > 0 ? "warn" : "todo",
      detail: `${Math.round(coverage * 100)}% of grid placed.`,
    },
    {
      id: "components",
      label: "components assigned",
      state: assigned >= h.regions.length && h.regions.length > 0 ? "ok"
        : assigned > 0 ? "warn" : "todo",
      detail: `${assigned} of ${h.regions.length} regions specified.`,
    },
    {
      id: "pcb",
      label: "pcb valid",
      state: h.pcbValid && h.pcbWarnings === 0 ? "ok"
        : h.pcbWarnings > 0 ? "warn" : "todo",
      detail: h.pcbWarnings > 0 ? `${h.pcbWarnings} pcb warnings` : "no warnings.",
    },
    {
      id: "enclosure",
      label: "enclosure clearance",
      state: h.caseErrors > 0 ? "warn"
        : h.caseWarnings > 0 ? "warn" : "ok",
      detail: h.caseWarnings + h.caseErrors > 0
        ? `${h.caseWarnings} warnings, ${h.caseErrors} errors`
        : "all clearances pass.",
    },
    {
      id: "usb",
      label: "usb accessibility",
      state: h.hasUsbCutout ? "ok" : "warn",
      detail: h.hasUsbCutout ? "cutout enabled." : "no usb cutout in case.",
    },
    {
      id: "export",
      label: "export ready",
      state: h.pcbValid && h.hasUsbCutout && h.capsConfigured && h.caseErrors === 0
        ? "ok" : "todo",
      detail: "gerbers + step + firmware generation.",
    },
  ];
}

function readinessScore(checks: HealthCheck[]): number {
  const weight = { ok: 1, warn: 0.6, todo: 0 } as const;
  const total = checks.reduce((acc, c) => acc + weight[c.state], 0);
  return Math.round((total / checks.length) * 100);
}

function ReadinessHeader({ score }: { score: number }) {
  const tone = score >= 90 ? "text-emerald-700" : score >= 60 ? "text-amber-700" : "text-stone-700";
  return (
    <div className="border-b border-border px-4 py-4 bg-card">
      <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-stone-500">
        manufacturing readiness
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className={`font-display text-3xl lowercase ${tone}`}>{score}%</span>
        <span className="font-mono text-[10px] text-stone-500 lowercase">
          {score >= 90 ? "production ready" : score >= 60 ? "near complete" : "in progress"}
        </span>
      </div>
      <div className="mt-2 h-1.5 bg-stone-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${score >= 90 ? "bg-emerald-600" : score >= 60 ? "bg-amber-500" : "bg-stone-500"}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function ProjectHealthPanel({ checks }: { checks: HealthCheck[] }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Activity size={11} className="text-stone-500" />
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-stone-500">project health</span>
      </div>
      <div className="space-y-1">
        {checks.map((c) => {
          const Icon = c.state === "ok" ? CheckCircle2 : c.state === "warn" ? AlertTriangle : CircleIcon;
          const tone = c.state === "ok" ? "text-emerald-700" : c.state === "warn" ? "text-amber-700" : "text-stone-400";
          return (
            <div key={c.id} className="bg-card border border-border rounded-md p-2">
              <div className="flex items-center gap-2">
                <Icon size={12} className={tone} />
                <span className="font-mono text-[11px] lowercase text-stone-800">{c.label}</span>
              </div>
              {c.detail && (
                <div className="font-mono text-[10px] text-stone-500 lowercase pl-5 mt-0.5">{c.detail}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- cost estimation ----------
type CostLine = { label: string; amount: number };

function estimateCost(h: ProjectHealthInput): { lines: CostLine[]; total: number } {
  const counts = h.regions.reduce<Record<string, number>>((acc, r) => {
    acc[r.type] = (acc[r.type] ?? 0) + 1;
    return acc;
  }, {});
  const area = h.rows * h.cols;
  const pcb = 2 + area * 0.15;
  const assembly = 4 + h.regions.length * 0.4;
  const switches = (counts.key ?? 0) * 0.45;
  const knobs = (counts.knob ?? 0) * 1.8 + (counts.encoder ?? 0) * 1.2;
  const displays = (counts.oled ?? 0) * 4.5 + (counts.eink ?? 0) * 9;
  const caseCost = 3 + area * 0.25;
  const lines: CostLine[] = [
    { label: "pcb fabrication", amount: pcb },
    { label: "assembly", amount: assembly },
    { label: "switches", amount: switches },
    { label: "encoders and knobs", amount: knobs },
    { label: "displays", amount: displays },
    { label: "enclosure", amount: caseCost },
  ].filter((l) => l.amount > 0);
  const total = lines.reduce((acc, l) => acc + l.amount, 0);
  return { lines, total };
}

function CostPanel({ costs }: { costs: { lines: CostLine[]; total: number } }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Coins size={11} className="text-stone-500" />
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-stone-500">estimated cost</span>
      </div>
      <div className="bg-card border border-border rounded-md p-3">
        <div className="space-y-1">
          {costs.lines.map((l) => (
            <div key={l.label} className="flex items-center justify-between font-mono text-[10px] lowercase">
              <span className="text-stone-600">{l.label}</span>
              <span className="text-stone-800">${l.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-border mt-2 pt-2 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">total</span>
          <span className="font-display text-lg lowercase">${costs.total.toFixed(2)}</span>
        </div>
        <div className="font-mono text-[9px] text-stone-400 lowercase mt-2 leading-relaxed">
          per-unit estimate at small batch quantities. excludes shipping and import duty.
        </div>
      </div>
    </div>
  );
}
