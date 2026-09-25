import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Square, Circle, Disc, RectangleHorizontal, Gamepad2, Minus, Dot, X,
  Plus, Trash2, ChevronRight, SplitSquareVertical, Monitor,
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown, GripVertical, GripHorizontal,
  Check,
} from "lucide-react";
import { Comp2D, type CompType } from "../components/keeberia/Comp2D";
import { LeftSidebar, type ProjectTemplate } from "../components/keeberia/EditorPanels";

// per-lens tip text. keeping these here (not in the panel module)
// means each workspace owns its own help copy and the modal stays
// generic.
const TIPS_BY_LENS: Record<Stage, string[]> = {
  layout: [
    "drag across cells to multi-select",
    "shift-click to add to selection",
    "right-click a cell for switch, insert, delete",
    "drag a row or column header to reorder",
  ],
  components: [
    "click a cell to select",
    "shift-click to multi-select",
    "click a palette item to assign",
    "filter view to focus on one type",
  ],
  pcb: [
    "the pcb outline follows your layout automatically",
    "warnings flag clearance and routing issues",
    "switch traces and pad density live in the inspector",
  ],
  case: [
    "case style changes how the pcb mounts",
    "watch the clearance checks before exporting",
    "usb and reset cutouts can be toggled here",
  ],
  caps: [
    "switch view modes to preview the finished device",
    "exploded view helps verify stack heights",
    "keycap profile changes typing feel and overall height",
  ],
};

export const Route = createFileRoute("/editor")({
  head: () => ({
    meta: [
      { title: "editor — keeberia" },
      { name: "description", content: "design your macropad layout." },
    ],
  }),
  component: EditorPage,
});

// ---------- types ----------
type Stage = "layout" | "components" | "pcb" | "case" | "caps";

type Region = {
  id: string;
  type: CompType;
  x: number;
  y: number;
  w: number;
  h: number;
  spec?: Record<string, string>;
};

const STAGES: Stage[] = ["layout", "components", "pcb", "case", "caps"];

const COMP_OPTIONS: { type: CompType; label: string; Icon: React.ComponentType<{ className?: string; size?: number }> }[] = [
  { type: "key", label: "key", Icon: Square },
  { type: "encoder", label: "encoder", Icon: Circle },
  { type: "knob", label: "knob", Icon: Disc },
  { type: "oled", label: "oled", Icon: Monitor },
  { type: "eink", label: "e-ink", Icon: RectangleHorizontal },
  { type: "joystick", label: "joystick", Icon: Gamepad2 },
  { type: "touch", label: "touch strip", Icon: Minus },
  { type: "spacer", label: "spacer", Icon: Dot },
  { type: "blocker", label: "blocker", Icon: X },
];

// ---------- per-type spec catalog ----------
type SpecField = { key: string; label: string; options: string[] };

const SPECS: Record<CompType, SpecField[]> = {
  key: [
    { key: "switch", label: "switch", options: ["cherry mx brown", "cherry mx red", "cherry mx blue", "gateron yellow", "kailh choc brown v1", "kailh choc v2", "kailh box white", "boba u4t silent", "gateron low profile"] },
    { key: "mount", label: "mounting", options: ["hotswap", "soldered"] },
    { key: "stab", label: "stabilizer", options: ["none", "plate-mount", "pcb-mount screw-in", "pcb-mount snap-in"] },
    { key: "rgb", label: "rgb", options: ["none", "per-key (sk6812)", "underglow", "side leds"] },
    { key: "cap", label: "keycap", options: ["cherry profile", "oem profile", "xda profile", "mt3 profile", "choc profile"] },
    { key: "size", label: "size", options: ["1u", "1.25u", "1.5u", "1.75u", "2u", "2.25u"] },
  ],
  encoder: [
    { key: "model", label: "model", options: ["ec11 · 15mm shaft", "ec11 · 20mm shaft", "ec12 low-profile", "evqwgd001 scroll"] },
    { key: "shaft", label: "shaft diameter", options: ["6mm knurled", "6mm flatted", "4mm low-profile"] },
    { key: "mount", label: "mounting", options: ["through-hole", "surface mount", "panel mount"] },
    { key: "press", label: "with switch", options: ["yes", "no"] },
    { key: "detents", label: "detents", options: ["20", "24", "30", "smooth"] },
    { key: "knobfit", label: "knob compatibility", options: ["d-shaft caps", "knurled caps", "press-fit caps", "any"] },
  ],
  knob: [
    { key: "cover", label: "cover", options: ["smooth aluminum", "knurled aluminum", "knurled brass", "delrin", "wood"] },
    { key: "diameter", label: "diameter", options: ["15mm", "20mm", "25mm", "30mm"] },
    { key: "base", label: "base encoder", options: ["ec11 · 15mm shaft", "ec11 · 20mm shaft"] },
  ],
  oled: [
    { key: "panel", label: "panel", options: ["ssd1306 · 128×32", "ssd1306 · 128×64", "sh1106 · 128×64", "sh1107 · 128×128"] },
    { key: "bus", label: "interface", options: ["i2c", "spi"] },
    { key: "connector", label: "connector orientation", options: ["top", "bottom", "left", "right"] },
    { key: "cutout", label: "cutout", options: ["window", "flush mount", "raised bezel"] },
    { key: "color", label: "pixel color", options: ["white", "blue", "yellow"] },
  ],
  eink: [
    { key: "panel", label: "panel", options: ["1.54\"", "2.13\"", "2.9\"", "4.2\""] },
    { key: "connector", label: "connector orientation", options: ["top", "bottom", "left", "right"] },
    { key: "cutout", label: "cutout", options: ["window", "flush mount", "raised bezel"] },
    { key: "color", label: "color", options: ["b/w", "b/w/red", "b/w/yellow"] },
  ],
  joystick: [
    { key: "model", label: "model", options: ["alps rkjxv", "psp analog", "hall-effect 3-axis"] },
    { key: "mount", label: "mounting", options: ["through-hole", "surface mount"] },
    { key: "press", label: "click button", options: ["yes", "no"] },
  ],
  touch: [
    { key: "length", label: "length", options: ["40mm", "60mm", "80mm"] },
    { key: "controller", label: "controller", options: ["mpr121", "cap1188", "iqs7222"] },
  ],
  spacer: [],
  blocker: [],
};

function defaultSpec(type: CompType): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of SPECS[type]) out[f.key] = f.options[0];
  return out;
}

function specSummary(r: Region): string {
  const fields = SPECS[r.type];
  if (!fields.length) return "";
  const spec = r.spec ?? defaultSpec(r.type);
  return fields.map((f) => spec[f.key] ?? f.options[0]).join(" · ");
}

const uid = () => Math.random().toString(36).slice(2, 9);

function buildDefaultRegions(rows: number, cols: number): Region[] {
  const out: Region[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      out.push({ id: uid(), type: "key", x, y, w: 1, h: 1 });
    }
  }
  return out;
}

function cellsInRegion(r: Region): string[] {
  const out: string[] = [];
  for (let dy = 0; dy < r.h; dy++)
    for (let dx = 0; dx < r.w; dx++)
      out.push(`${r.x + dx},${r.y + dy}`);
  return out;
}

function regionAt(regions: Region[], x: number, y: number): Region | undefined {
  return regions.find((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
}

// ---------- page ----------
// the editor is a unified workspace. lenses (layout, components,
// pcb, case, caps) are different views into the same project model;
// state is hoisted here so configs and selections survive lens
// switches, and the side panels read the same source of truth.
function EditorPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(4);
  const [regions, setRegions] = useState<Region[]>(() => buildDefaultRegions(4, 4));
  const [projectName, setProjectName] = useState("untitled macropad");
  const [stage, setStage] = useState<Stage>("layout");
  const [ready, setReady] = useState(false);

  // hoisted configs so switching lenses never resets work the user has done.
  const [pcbCfg, setPcbCfg] = useState<PcbConfig>(() => defaultPcb());
  const [caseCfg, setCaseCfg] = useState<CaseConfig>(() => defaultCase());
  const [capsCfg, setCapsCfg] = useState<CapsConfig>(() => defaultCaps());

  useEffect(() => {
    const raw = typeof window !== "undefined" ? sessionStorage.getItem("keeberia.init") : null;
    if (raw) {
      try {
        const { rows: r, cols: c, name } = JSON.parse(raw);
        setRows(r); setCols(c); setRegions(buildDefaultRegions(r, c));
        if (name) setProjectName(name);
      } catch { /* ignore */ }
    }
    setReady(true);
  }, []);

  const stageIdx = STAGES.indexOf(stage);
  const next = () => stageIdx < STAGES.length - 1 && setStage(STAGES[stageIdx + 1]);
  const prev = () => stageIdx > 0 && setStage(STAGES[stageIdx - 1]);

  function applyTemplate(t: ProjectTemplate) {
    setRows(t.rows);
    setCols(t.cols);
    setRegions(t.regions.map((r) => ({ ...r, id: uid() })));
    setProjectName(t.name);
  }

  // health inputs derived from the live project model. these hooks must
  // run on every render — never gate them behind an early return, or
  // react sees a changing hook count between renders.
  const pcbValidations = useMemo(
    () => validatePcb(pcbCfg, regions, rows, cols),
    [pcbCfg, regions, rows, cols],
  );
  const caseValidations = useMemo(
    () => validateCase(caseCfg, regions, rows, cols),
    [caseCfg, regions, rows, cols],
  );

  if (!ready) return null;

  const healthInput = {
    rows, cols,
    regions: regions.map((r) => ({ id: r.id, type: r.type, x: r.x, y: r.y, w: r.w, h: r.h, spec: r.spec })),
    pcbValid: pcbValidations.every((v) => v.level !== "error"),
    pcbWarnings: pcbValidations.filter((v) => v.level === "warn").length,
    caseWarnings: caseValidations.filter((v) => v.level === "warn").length,
    caseErrors: caseValidations.filter((v) => v.level === "error").length,
    hasUsbCutout: caseCfg.cutoutUsb,
    capsConfigured: regions.some((r) => r.type === "key"),
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <EditorHeader
        projectName={projectName}
        onRename={setProjectName}
        onNew={() => navigate({ to: "/start" })}
        stage={stage}
        setStage={setStage}
        onNext={next}
        onPrev={prev}
      />
      <div className="flex-1 flex min-h-0">
        <LeftSidebar
          regions={regions}
          lens={stage}
          setLens={setStage}
          onApplyTemplate={applyTemplate}
          health={healthInput}
          tips={TIPS_BY_LENS[stage]}
        />
        <main className="flex-1 flex min-w-0 relative">
          {stage === "layout" ? (
            <EditorWorkspace
              rows={rows}
              cols={cols}
              setRows={setRows}
              setCols={setCols}
              regions={regions}
              setRegions={setRegions}
            />
          ) : stage === "components" ? (
            <ComponentsWorkspace
              rows={rows}
              cols={cols}
              regions={regions}
              setRegions={setRegions}
            />
          ) : stage === "pcb" ? (
            <PcbWorkspace rows={rows} cols={cols} regions={regions} cfg={pcbCfg} setCfg={setPcbCfg} />
          ) : stage === "case" ? (
            <CaseWorkspace rows={rows} cols={cols} regions={regions} cfg={caseCfg} setCfg={setCaseCfg} />
          ) : stage === "caps" ? (
            <CapsWorkspace rows={rows} cols={cols} regions={regions} cfg={capsCfg} setCfg={setCapsCfg} caseCfg={caseCfg} />
          ) : (
            <StagePlaceholder stage={stage} regions={regions} rows={rows} cols={cols} />
          )}
        </main>
      </div>
    </div>
  );
}

function EditorHeader({
  projectName, onRename, onNew, stage, setStage, onNext, onPrev,
}: {
  projectName: string;
  onRename: (s: string) => void;
  onNew: () => void;
  stage: Stage;
  setStage: (s: Stage) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const stageIdx = STAGES.indexOf(stage);
  return (
    <header className="bg-editor-header border-b border-border/60">
      <div className="px-5 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center size-5 rounded-[4px] bg-stone-900 text-stone-50 font-mono text-[10px]">k</span>
            <span className="font-display text-base lowercase tracking-tight">keeberia</span>
          </Link>
          <span className="text-stone-400">/</span>
          <input
            value={projectName}
            onChange={(e) => onRename(e.target.value)}
            className="bg-transparent font-mono text-sm lowercase text-stone-800 focus:outline-none focus:bg-stone-50/60 rounded px-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrev}
            disabled={stageIdx === 0}
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded inline-flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={12} /> back
          </button>
          <button
            onClick={onNext}
            disabled={stageIdx === STAGES.length - 1}
            className="font-mono text-[10px] uppercase tracking-[0.18em] bg-stone-900 text-stone-50 hover:bg-stone-800 px-3 py-1.5 rounded inline-flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            next: {STAGES[Math.min(stageIdx + 1, STAGES.length - 1)]} <ArrowRight size={12} />
          </button>
          <button onClick={onNew} className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded">
            new
          </button>
          <Link to="/" className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded">
            exit
          </Link>
        </div>
      </div>
      <div className="px-5 pb-2 flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em]">
        {STAGES.map((f, i) => (
          <button
            key={f}
            onClick={() => setStage(f)}
            className={`px-3 py-1.5 rounded-md transition-colors ${stage === f ? "bg-stone-900 text-stone-50" : "text-stone-500 hover:text-stone-800"}`}
          >
            {String(i + 1).padStart(2, "0")} · {f}
          </button>
        ))}
      </div>
    </header>
  );
}

// ---------- placeholder for later stages ----------
function StagePlaceholder({ stage, regions, rows, cols }: { stage: Stage; regions: Region[]; rows: number; cols: number }) {
  const counts = regions.reduce<Record<string, number>>((acc, r) => {
    acc[r.type] = (acc[r.type] ?? 0) + 1;
    return acc;
  }, {});
  return (
    <div className="flex-1 bg-editor-canvas p-12">
      <div className="max-w-3xl mx-auto bg-card border border-border rounded-md analog-shadow p-10">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">stage</div>
        <h1 className="font-display text-3xl lowercase mt-1">{stage}</h1>
        <p className="font-mono text-sm lowercase text-stone-600 mt-3 leading-relaxed">
          this stage is being designed. your layout below has been carried over.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3">
          <Stat label="grid" value={`${rows} × ${cols}`} />
          <Stat label="regions" value={regions.length} />
          {Object.entries(counts).map(([k, v]) => (
            <Stat key={k} label={k} value={v} />
          ))}
        </div>
      </div>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-secondary/40 border border-border rounded-md p-3">
      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="font-mono text-base lowercase">{value}</div>
    </div>
  );
}

// ---------- editor workspace ----------
const MAX_R = 12;
const MAX_C = 14;

type MenuState =
  | { kind: "region"; x: number; y: number; regionId: string; submenu: boolean }
  | { kind: "row"; x: number; y: number; rowIndex: number }
  | { kind: "col"; x: number; y: number; colIndex: number }
  | null;

function EditorWorkspace({
  rows, cols, setRows, setCols, regions, setRegions,
}: {
  rows: number;
  cols: number;
  setRows: React.Dispatch<React.SetStateAction<number>>;
  setCols: React.Dispatch<React.SetStateAction<number>>;
  regions: Region[];
  setRegions: React.Dispatch<React.SetStateAction<Region[]>>;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [menu, setMenu] = useState<MenuState>(null);

  useEffect(() => {
    const close = () => setMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  function selectRegionIds(ids: string[], additive: boolean) {
    setSelected((prev) => {
      const next = new Set(additive ? prev : []);
      for (const id of ids) next.add(id);
      return next;
    });
  }
  function toggleSelect(id: string, additive: boolean) {
    setSelected((prev) => {
      const next = new Set(additive ? prev : []);
      if (prev.has(id) && additive) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  const clearSelection = () => setSelected(new Set());

  function switchType(regionId: string, type: CompType) {
    setRegions((rs) => rs.map((r) => (r.id === regionId ? { ...r, type } : r)));
    setMenu(null);
  }
  function deleteRegion(regionId: string) {
    setRegions((rs) => rs.filter((r) => r.id !== regionId));
    setSelected((s) => { const n = new Set(s); n.delete(regionId); return n; });
    setMenu(null);
  }
  function mergeSelected() {
    if (selected.size < 2) return;
    const sel = regions.filter((r) => selected.has(r.id));
    const minX = Math.min(...sel.map((r) => r.x));
    const minY = Math.min(...sel.map((r) => r.y));
    const maxX = Math.max(...sel.map((r) => r.x + r.w));
    const maxY = Math.max(...sel.map((r) => r.y + r.h));
    const w = maxX - minX, h = maxY - minY;
    const cov = new Set(sel.flatMap(cellsInRegion));
    if (cov.size !== w * h) return;
    const nr: Region = { id: uid(), type: sel[0].type, x: minX, y: minY, w, h };
    setRegions((rs) => [...rs.filter((r) => !selected.has(r.id)), nr]);
    setSelected(new Set([nr.id]));
  }
  function splitRegion(regionId: string) {
    const r = regions.find((x) => x.id === regionId);
    if (!r || (r.w === 1 && r.h === 1)) return;
    const pieces: Region[] = [];
    for (let dy = 0; dy < r.h; dy++)
      for (let dx = 0; dx < r.w; dx++)
        pieces.push({ id: uid(), type: "key", x: r.x + dx, y: r.y + dy, w: 1, h: 1 });
    setRegions((rs) => [...rs.filter((x) => x.id !== regionId), ...pieces]);
    setSelected(new Set());
    setMenu(null);
  }

  // ---- row / column ops ----
  function insertColumn(at: number) {
    if (cols >= MAX_C) return;
    setRegions((rs) => {
      const next: Region[] = [];
      for (const r of rs) {
        if (r.x >= at) next.push({ ...r, x: r.x + 1 });
        else if (r.x < at && r.x + r.w > at) next.push({ ...r, w: r.w + 1 });
        else next.push(r);
      }
      for (let y = 0; y < rows; y++) {
        const covered = next.some((r) => at >= r.x && at < r.x + r.w && y >= r.y && y < r.y + r.h);
        if (!covered) next.push({ id: uid(), type: "key", x: at, y, w: 1, h: 1 });
      }
      return next;
    });
    setCols((c) => c + 1);
    setMenu(null);
  }
  function insertRow(at: number) {
    if (rows >= MAX_R) return;
    setRegions((rs) => {
      const next: Region[] = [];
      for (const r of rs) {
        if (r.y >= at) next.push({ ...r, y: r.y + 1 });
        else if (r.y < at && r.y + r.h > at) next.push({ ...r, h: r.h + 1 });
        else next.push(r);
      }
      for (let x = 0; x < cols; x++) {
        const covered = next.some((r) => x >= r.x && x < r.x + r.w && at >= r.y && at < r.y + r.h);
        if (!covered) next.push({ id: uid(), type: "key", x, y: at, w: 1, h: 1 });
      }
      return next;
    });
    setRows((r) => r + 1);
    setMenu(null);
  }
  function deleteColumn(at: number) {
    if (cols <= 1) return;
    setRegions((rs) => {
      const next: Region[] = [];
      for (const r of rs) {
        const inside = at >= r.x && at < r.x + r.w;
        if (inside) {
          if (r.w === 1) continue;
          next.push({ ...r, w: r.w - 1, x: r.x });
        } else if (r.x > at) {
          next.push({ ...r, x: r.x - 1 });
        } else {
          next.push(r);
        }
      }
      return next;
    });
    setCols((c) => c - 1);
    setSelected(new Set());
    setMenu(null);
  }
  function deleteRow(at: number) {
    if (rows <= 1) return;
    setRegions((rs) => {
      const next: Region[] = [];
      for (const r of rs) {
        const inside = at >= r.y && at < r.y + r.h;
        if (inside) {
          if (r.h === 1) continue;
          next.push({ ...r, h: r.h - 1, y: r.y });
        } else if (r.y > at) {
          next.push({ ...r, y: r.y - 1 });
        } else {
          next.push(r);
        }
      }
      return next;
    });
    setRows((r) => r - 1);
    setSelected(new Set());
    setMenu(null);
  }

  // ---- reorder: move column `from` to position `to` (insertion index) ----
  function canMoveCol(from: number, to: number): boolean {
    if (from === to || from === to - 1) return false;
    // any merged region that overlaps but isn't fully inside the moved column blocks the move
    return !regions.some((r) => r.w > 1 && r.x <= from && r.x + r.w > from && !(r.x === from && r.w === 1));
  }
  function moveColumn(from: number, to: number) {
    if (!canMoveCol(from, to)) return;
    // build new mapping: extract column `from`, splice into position `to`
    const order: number[] = [];
    for (let i = 0; i < cols; i++) if (i !== from) order.push(i);
    const insertAt = to > from ? to - 1 : to;
    order.splice(insertAt, 0, from);
    // remap regions (only valid because no region spans the from column with w>1)
    const xMap = new Map<number, number>();
    order.forEach((oldX, newX) => xMap.set(oldX, newX));
    setRegions((rs) => rs.map((r) => {
      if (r.w === 1) return { ...r, x: xMap.get(r.x)! };
      // wide region: its columns are not the moved one — keep adjusted by counting how many of its old columns shifted
      const newXs = Array.from({ length: r.w }, (_, k) => xMap.get(r.x + k)!).sort((a, b) => a - b);
      // ensure still contiguous; if not, snap by leftmost (rare)
      return { ...r, x: newXs[0], w: r.w };
    }));
    setSelected(new Set());
  }
  function canMoveRow(from: number, to: number): boolean {
    if (from === to || from === to - 1) return false;
    return !regions.some((r) => r.h > 1 && r.y <= from && r.y + r.h > from && !(r.y === from && r.h === 1));
  }
  function moveRow(from: number, to: number) {
    if (!canMoveRow(from, to)) return;
    const order: number[] = [];
    for (let i = 0; i < rows; i++) if (i !== from) order.push(i);
    const insertAt = to > from ? to - 1 : to;
    order.splice(insertAt, 0, from);
    const yMap = new Map<number, number>();
    order.forEach((oldY, newY) => yMap.set(oldY, newY));
    setRegions((rs) => rs.map((r) => {
      if (r.h === 1) return { ...r, y: yMap.get(r.y)! };
      const newYs = Array.from({ length: r.h }, (_, k) => yMap.get(r.y + k)!).sort((a, b) => a - b);
      return { ...r, y: newYs[0], h: r.h };
    }));
    setSelected(new Set());
  }

  const selectedRegion = selected.size === 1 ? regions.find((r) => selected.has(r.id)) ?? null : null;
  const canMerge = selected.size >= 2;

  return (
    <div className="flex-1 flex bg-editor-canvas">
      {/* sidebar */}
      <aside className="w-56 border-r border-border bg-sidebar p-4 overflow-y-auto">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">components</div>
        <div className="space-y-1">
          {COMP_OPTIONS.map((c) => (
            <button
              key={c.type}
              disabled={!selectedRegion}
              onClick={() => selectedRegion && switchType(selectedRegion.id, c.type)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm font-mono lowercase hover:bg-stone-200/40 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <c.Icon size={14} className="text-stone-700 shrink-0" />
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">selection</div>
          <button disabled={!canMerge} onClick={mergeSelected}
            className="w-full font-mono text-[11px] uppercase tracking-[0.18em] bg-stone-900 text-stone-50 rounded-md py-2 disabled:opacity-30 disabled:cursor-not-allowed">
            merge ({selected.size})
          </button>
          <button
            disabled={!selectedRegion || (selectedRegion.w === 1 && selectedRegion.h === 1)}
            onClick={() => selectedRegion && splitRegion(selectedRegion.id)}
            className="mt-2 w-full font-mono text-[11px] uppercase tracking-[0.18em] border border-stone-400 rounded-md py-2 disabled:opacity-30 disabled:cursor-not-allowed">
            split
          </button>
          <button onClick={clearSelection}
            className="mt-2 w-full font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500 hover:text-stone-800">
            clear selection
          </button>
        </div>

      </aside>

      {/* canvas. cell size is measured from the available area so the
          grid grows with the editor body and doesn't leave whitespace. */}
      <CanvasFrame rows={rows} cols={cols} onClickEmpty={() => clearSelection()}>
        {(cell) => (
          <>
        <Canvas
          cell={cell}
          rows={rows}
          cols={cols}
          regions={regions}
          selected={selected}
          onSelectRegion={(id, e) => { e.stopPropagation(); toggleSelect(id, e.shiftKey); }}
          onDragSelect={(ids, additive) => selectRegionIds(ids, additive)}
          onRegionContext={(id, x, y, e) => { e.preventDefault(); e.stopPropagation(); setSelected(new Set([id])); setMenu({ kind: "region", x, y, regionId: id, submenu: false }); }}
          onRowContext={(rowIndex, x, y, e) => { e.preventDefault(); e.stopPropagation(); setMenu({ kind: "row", x, y, rowIndex }); }}
          onColContext={(colIndex, x, y, e) => { e.preventDefault(); e.stopPropagation(); setMenu({ kind: "col", x, y, colIndex }); }}
          onInsertCol={insertColumn}
          onInsertRow={insertRow}
          onDeleteCol={deleteColumn}
          onDeleteRow={deleteRow}
          onMoveCol={moveColumn}
          onMoveRow={moveRow}
          canMoveCol={canMoveCol}
          canMoveRow={canMoveRow}
        />

        {menu?.kind === "region" && (() => {
          const r = regions.find((x) => x.id === menu.regionId);
          if (!r) return null;
          return (
            <RegionMenu
              x={menu.x} y={menu.y}
              region={r}
              submenuOpen={menu.submenu}
              onToggleSub={() => setMenu((m) => m && m.kind === "region" ? { ...m, submenu: !m.submenu } : m)}
              onPick={(t) => switchType(menu.regionId, t)}
              onDelete={() => deleteRegion(menu.regionId)}
              onSplit={() => splitRegion(menu.regionId)}
              onInsertRowAbove={() => insertRow(r.y)}
              onInsertRowBelow={() => insertRow(r.y + r.h)}
              onInsertColLeft={() => insertColumn(r.x)}
              onInsertColRight={() => insertColumn(r.x + r.w)}
            />
          );
        })()}
        {menu?.kind === "row" && (
          <AxisMenu
            x={menu.x} y={menu.y} kind="row" index={menu.rowIndex} total={rows}
            onInsertBefore={() => insertRow(menu.rowIndex)}
            onInsertAfter={() => insertRow(menu.rowIndex + 1)}
            onDelete={() => deleteRow(menu.rowIndex)}
            onMoveUp={() => moveRow(menu.rowIndex, menu.rowIndex - 1)}
            onMoveDown={() => moveRow(menu.rowIndex, menu.rowIndex + 2)}
            canMovePrev={canMoveRow(menu.rowIndex, menu.rowIndex - 1)}
            canMoveNext={canMoveRow(menu.rowIndex, menu.rowIndex + 2)}
          />
        )}
        {menu?.kind === "col" && (
          <AxisMenu
            x={menu.x} y={menu.y} kind="column" index={menu.colIndex} total={cols}
            onInsertBefore={() => insertColumn(menu.colIndex)}
            onInsertAfter={() => insertColumn(menu.colIndex + 1)}
            onDelete={() => deleteColumn(menu.colIndex)}
            onMoveUp={() => moveColumn(menu.colIndex, menu.colIndex - 1)}
            onMoveDown={() => moveColumn(menu.colIndex, menu.colIndex + 2)}
            canMovePrev={canMoveCol(menu.colIndex, menu.colIndex - 1)}
            canMoveNext={canMoveCol(menu.colIndex, menu.colIndex + 2)}
          />
        )}
          </>
        )}
      </CanvasFrame>

      {/* inspector */}
      <aside className="w-64 border-l border-border bg-sidebar p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">inspector</div>
        {selectedRegion ? (
          <InspectorPanel region={selectedRegion} />
        ) : selected.size > 1 ? (
          <div className="font-mono text-xs lowercase text-stone-700">
            {selected.size} regions selected. merge them or apply a component.
          </div>
        ) : (
          <div className="font-mono text-xs lowercase text-stone-500">
            select a cell to inspect.
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-border">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">project</div>
          <ul className="font-mono text-[11px] lowercase text-stone-700 space-y-1">
            <li>· grid: {rows} × {cols}</li>
            <li>· regions: {regions.length}</li>
            <li>· keys: {regions.filter((r) => r.type === "key").length}</li>
            <li>· special: {regions.filter((r) => r.type !== "key" && r.type !== "spacer" && r.type !== "blocker").length}</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

// ---------- canvas ----------
// the layout grid is sized to fill its container. CanvasFrame
// measures the available area and tells Canvas how large each cell
// should be — so adding rows or columns just shrinks cells until
// they hit a sensible floor, instead of leaving large white margins.
const DEFAULT_CELL = 64;
const MIN_CELL = 32;
const MAX_CELL = 140;
const GAP = 8;
const RIM = 22;
const CANVAS_PADDING = 24; // inner padding of the canvas card
const CANVAS_OUTER_PADDING = 40; // p-10 around the canvas card

function CanvasFrame({
  rows, cols, onClickEmpty, children,
}: {
  rows: number;
  cols: number;
  onClickEmpty: () => void;
  children: (cell: number) => React.ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [cell, setCell] = useState(DEFAULT_CELL);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const compute = () => {
      const w = el.clientWidth - CANVAS_OUTER_PADDING * 2;
      const h = el.clientHeight - CANVAS_OUTER_PADDING * 2;
      // the card itself consumes padding (CANVAS_PADDING*2) plus the
      // rim that holds row/column headers (RIM*2) plus the gaps
      // between cells.
      const fitW = (w - CANVAS_PADDING * 2 - RIM * 2 - Math.max(0, cols - 1) * GAP) / Math.max(1, cols);
      const fitH = (h - CANVAS_PADDING * 2 - RIM * 2 - Math.max(0, rows - 1) * GAP) / Math.max(1, rows);
      const next = Math.max(MIN_CELL, Math.min(MAX_CELL, Math.floor(Math.min(fitW, fitH))));
      setCell(next);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [rows, cols]);

  return (
    <div
      ref={wrapRef}
      className="flex-1 relative overflow-auto p-10 flex items-center justify-center"
      onClick={onClickEmpty}
    >
      {children(cell)}
    </div>
  );
}

function Canvas({
  cell, rows, cols, regions, selected,
  onSelectRegion, onDragSelect, onRegionContext,
  onRowContext, onColContext,
  onInsertCol, onInsertRow, onDeleteCol, onDeleteRow,
  onMoveCol, onMoveRow, canMoveCol, canMoveRow,
}: {
  cell: number;
  rows: number; cols: number; regions: Region[]; selected: Set<string>;
  onSelectRegion: (id: string, e: React.MouseEvent) => void;
  onDragSelect: (ids: string[], additive: boolean) => void;
  onRegionContext: (id: string, x: number, y: number, e: React.MouseEvent) => void;
  onRowContext: (rowIndex: number, x: number, y: number, e: React.MouseEvent) => void;
  onColContext: (colIndex: number, x: number, y: number, e: React.MouseEvent) => void;
  onInsertCol: (at: number) => void;
  onInsertRow: (at: number) => void;
  onDeleteCol: (at: number) => void;
  onDeleteRow: (at: number) => void;
  onMoveCol: (from: number, to: number) => void;
  onMoveRow: (from: number, to: number) => void;
  canMoveCol: (from: number, to: number) => boolean;
  canMoveRow: (from: number, to: number) => boolean;
}) {
  const CELL = cell;
  const totalW = cols * CELL + (cols - 1) * GAP;
  const totalH = rows * CELL + (rows - 1) * GAP;

  const cellsRef = useRef<HTMLDivElement | null>(null);
  const [marquee, setMarquee] = useState<{ x0: number; y0: number; x1: number; y1: number; additive: boolean } | null>(null);

  // cell coord from pixel (relative to cells container)
  function cellFromPx(px: number, py: number): { cx: number; cy: number } | null {
    const cx = Math.floor((px + GAP / 2) / (CELL + GAP));
    const cy = Math.floor((py + GAP / 2) / (CELL + GAP));
    if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) return null;
    return { cx, cy };
  }

  function onCellsMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    // ignore if drag started outside the cells container's empty area
    const rect = cellsRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const start = cellFromPx(x, y);
    if (!start) return;
    const additive = e.shiftKey;
    e.stopPropagation();
    e.preventDefault();
    const startCx = start.cx;
    const startCy = start.cy;
    setMarquee({ x0: startCx, y0: startCy, x1: startCx, y1: startCy, additive });

    let moved = false;
    const startId = regionAt(regions, startCx, startCy)?.id;

    function onMove(ev: MouseEvent) {
      const r = cellsRef.current?.getBoundingClientRect();
      if (!r) return;
      const px = ev.clientX - r.left;
      const py = ev.clientY - r.top;
      const c = cellFromPx(Math.max(0, Math.min(totalW - 1, px)), Math.max(0, Math.min(totalH - 1, py)));
      if (!c) return;
      if (c.cx !== startCx || c.cy !== startCy) moved = true;
      setMarquee((m) => m ? { ...m, x1: c.cx, y1: c.cy } : m);
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setMarquee((m) => {
        if (!m) return null;
        if (!moved) {
          // simple click — single-select region
          if (startId) onDragSelect([startId], additive);
          return null;
        }
        const minX = Math.min(m.x0, m.x1), maxX = Math.max(m.x0, m.x1);
        const minY = Math.min(m.y0, m.y1), maxY = Math.max(m.y0, m.y1);
        const ids = new Set<string>();
        for (const r of regions) {
          if (r.x + r.w - 1 >= minX && r.x <= maxX && r.y + r.h - 1 >= minY && r.y <= maxY) {
            ids.add(r.id);
          }
        }
        onDragSelect(Array.from(ids), additive);
        return null;
      });
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <div
      className="relative mx-auto bg-card border border-stone-300 rounded-md analog-shadow"
      style={{ width: totalW + 48 + RIM * 2, minHeight: totalH + 48 + RIM * 2, padding: 24 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative" style={{ width: totalW + RIM * 2, height: totalH + RIM * 2 }}>
        {/* column header strip (top) — draggable to reorder */}
        {Array.from({ length: cols }).map((_, ci) => {
          const left = RIM + ci * (CELL + GAP);
          return (
            <div
              key={`ch-${ci}`}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/x-keeberia-col", String(ci));
              }}
              onContextMenu={(e) => onColContext(ci, e.clientX, e.clientY, e)}
              style={{ position: "absolute", left, top: 0, width: CELL, height: RIM }}
              className="group flex items-center justify-center cursor-grab active:cursor-grabbing"
              title="drag to reorder column · right-click for menu"
            >
              <GripHorizontal size={10} className="text-stone-300 group-hover:text-stone-600 mr-1" />
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-400 group-hover:text-stone-700">
                {ci + 1}
              </span>
              {cols > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteCol(ci); }}
                  title="delete column"
                  className="absolute -top-0.5 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          );
        })}
        {/* row header strip (left) — draggable to reorder */}
        {Array.from({ length: rows }).map((_, ri) => {
          const top = RIM + ri * (CELL + GAP);
          return (
            <div
              key={`rh-${ri}`}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/x-keeberia-row", String(ri));
              }}
              onContextMenu={(e) => onRowContext(ri, e.clientX, e.clientY, e)}
              style={{ position: "absolute", left: 0, top, width: RIM, height: CELL }}
              className="group flex flex-col items-center justify-center cursor-grab active:cursor-grabbing"
              title="drag to reorder row · right-click for menu"
            >
              <GripVertical size={10} className="text-stone-300 group-hover:text-stone-600" />
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-400 group-hover:text-stone-700">
                {ri + 1}
              </span>
              {rows > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteRow(ri); }}
                  title="delete row"
                  className="absolute bottom-0 -left-0.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          );
        })}

        {/* column add buttons + drop slots */}
        {Array.from({ length: cols + 1 }).map((_, i) => {
          const left = RIM + i * (CELL + GAP) - GAP / 2 - 8;
          return (
            <div
              key={`addc-${i}`}
              style={{ position: "absolute", left: left - 4, top: 0, width: 24, height: RIM + totalH }}
              className="group z-20"
              onDragOver={(e) => {
                if (e.dataTransfer.types.includes("text/x-keeberia-col")) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }
              }}
              onDrop={(e) => {
                const raw = e.dataTransfer.getData("text/x-keeberia-col");
                if (raw === "") return;
                e.preventDefault();
                const from = Number(raw);
                if (canMoveCol(from, i)) onMoveCol(from, i);
              }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); onInsertCol(i); }}
                title="insert column"
                style={{ position: "absolute", left: 4, top: RIM - 18, width: 16, height: 16 }}
                className="rounded-full bg-stone-900 text-stone-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Plus size={10} />
              </button>
            </div>
          );
        })}

        {/* row add buttons + drop slots */}
        {Array.from({ length: rows + 1 }).map((_, i) => {
          const top = RIM + i * (CELL + GAP) - GAP / 2 - 8;
          return (
            <div
              key={`addr-${i}`}
              style={{ position: "absolute", left: 0, top: top - 4, width: RIM + totalW, height: 24 }}
              className="group z-20"
              onDragOver={(e) => {
                if (e.dataTransfer.types.includes("text/x-keeberia-row")) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }
              }}
              onDrop={(e) => {
                const raw = e.dataTransfer.getData("text/x-keeberia-row");
                if (raw === "") return;
                e.preventDefault();
                const from = Number(raw);
                if (canMoveRow(from, i)) onMoveRow(from, i);
              }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); onInsertRow(i); }}
                title="insert row"
                style={{ position: "absolute", left: RIM - 18, top: 4, width: 16, height: 16 }}
                className="rounded-full bg-stone-900 text-stone-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Plus size={10} />
              </button>
            </div>
          );
        })}

        {/* cells container */}
        <div
          ref={cellsRef}
          className="absolute"
          style={{ left: RIM, top: RIM, width: totalW, height: totalH }}
          onMouseDown={onCellsMouseDown}
        >
          {regions.map((r) => (
            <CellTile
              key={r.id}
              cell={CELL}
              region={r}
              selected={selected.has(r.id)}
              onClick={(e) => onSelectRegion(r.id, e)}
              onContextMenu={(e) => onRegionContext(r.id, e.clientX, e.clientY, e)}
            />
          ))}
          {marquee && (() => {
            const minX = Math.min(marquee.x0, marquee.x1);
            const maxX = Math.max(marquee.x0, marquee.x1);
            const minY = Math.min(marquee.y0, marquee.y1);
            const maxY = Math.max(marquee.y0, marquee.y1);
            const left = minX * (CELL + GAP);
            const top = minY * (CELL + GAP);
            const w = (maxX - minX + 1) * CELL + (maxX - minX) * GAP;
            const h = (maxY - minY + 1) * CELL + (maxY - minY) * GAP;
            return (
              <div
                className="absolute pointer-events-none rounded-md bg-stone-900/5 border-2 border-stone-900/40"
                style={{ left, top, width: w, height: h }}
              />
            );
          })()}
        </div>
      </div>
    </div>
  );
}

function CellTile({
  cell, region, selected, onClick, onContextMenu,
}: {
  cell: number;
  region: Region; selected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  const CELL = cell;
  const left = region.x * (CELL + GAP);
  const top = region.y * (CELL + GAP);
  const w = region.w * CELL + (region.w - 1) * GAP;
  const h = region.h * CELL + (region.h - 1) * GAP;
  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseDown={(e) => e.stopPropagation()}
      style={{ position: "absolute", left, top, width: w, height: h }}
      className={`cursor-pointer transition-all rounded-md flex items-center justify-center select-none
        ${selected ? "ring-2 ring-stone-900 ring-offset-2 ring-offset-card" : ""}`}
    >
      <Comp2D type={region.type} w={w} h={h} />
    </div>
  );
}

// Comp2D imported from shared module


// ---------- region context menu ----------
function RegionMenu({
  x, y, region, submenuOpen, onToggleSub, onPick, onDelete, onSplit,
  onInsertRowAbove, onInsertRowBelow, onInsertColLeft, onInsertColRight,
}: {
  x: number; y: number;
  region: Region;
  submenuOpen: boolean;
  onToggleSub: () => void;
  onPick: (t: CompType) => void;
  onDelete: () => void;
  onSplit: () => void;
  onInsertRowAbove: () => void;
  onInsertRowBelow: () => void;
  onInsertColLeft: () => void;
  onInsertColRight: () => void;
}) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed z-50 bg-card border border-border rounded-md analog-shadow text-stone-800 font-mono text-xs lowercase min-w-[200px]"
      style={{ left: x, top: y }}
    >
      <button onClick={onToggleSub} className="w-full text-left px-3 py-2 hover:bg-secondary/60 flex items-center justify-between">
        <span>switch to</span>
        <ChevronRight size={12} className="text-stone-400" />
      </button>
      <button
        onClick={onSplit}
        disabled={region.w === 1 && region.h === 1}
        className="w-full text-left px-3 py-2 hover:bg-secondary/60 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <SplitSquareVertical size={12} /> split
      </button>
      <div className="border-t border-border" />
      <button onClick={onInsertRowAbove} className="w-full text-left px-3 py-2 hover:bg-secondary/60 flex items-center gap-2">
        <Plus size={12} /> insert row above
      </button>
      <button onClick={onInsertRowBelow} className="w-full text-left px-3 py-2 hover:bg-secondary/60 flex items-center gap-2">
        <Plus size={12} /> insert row below
      </button>
      <button onClick={onInsertColLeft} className="w-full text-left px-3 py-2 hover:bg-secondary/60 flex items-center gap-2">
        <Plus size={12} /> insert column left
      </button>
      <button onClick={onInsertColRight} className="w-full text-left px-3 py-2 hover:bg-secondary/60 flex items-center gap-2">
        <Plus size={12} /> insert column right
      </button>
      <div className="border-t border-border" />
      <button onClick={onDelete} className="w-full text-left px-3 py-2 hover:bg-secondary/60 text-rose-700 flex items-center gap-2">
        <Trash2 size={12} /> delete region
      </button>
      {submenuOpen && (
        <div className="absolute left-full top-0 ml-1 bg-card border border-border rounded-md analog-shadow min-w-[160px]">
          {COMP_OPTIONS.map((c) => (
            <button key={c.type} onClick={() => onPick(c.type)}
              className="w-full text-left px-3 py-2 hover:bg-secondary/60 flex items-center gap-2">
              <c.Icon size={12} className="text-stone-600" />
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- axis (row/col) context menu ----------
function AxisMenu({
  x, y, kind, index, total, onInsertBefore, onInsertAfter, onDelete,
  onMoveUp, onMoveDown, canMovePrev, canMoveNext,
}: {
  x: number; y: number;
  kind: "row" | "column";
  index: number; total: number;
  onInsertBefore: () => void;
  onInsertAfter: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMovePrev: boolean;
  canMoveNext: boolean;
}) {
  const PrevIcon = kind === "row" ? ArrowUp : ArrowLeft;
  const NextIcon = kind === "row" ? ArrowDown : ArrowRight;
  const prevLabel = kind === "row" ? "move up" : "move left";
  const nextLabel = kind === "row" ? "move down" : "move right";
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed z-50 bg-card border border-border rounded-md analog-shadow text-stone-800 font-mono text-xs lowercase min-w-[200px]"
      style={{ left: x, top: y }}
    >
      <div className="px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground border-b border-border">
        {kind} {index + 1}
      </div>
      <button onClick={onInsertBefore} className="w-full text-left px-3 py-2 hover:bg-secondary/60 flex items-center gap-2">
        <Plus size={12} /> insert {kind} before
      </button>
      <button onClick={onInsertAfter} className="w-full text-left px-3 py-2 hover:bg-secondary/60 flex items-center gap-2">
        <Plus size={12} /> insert {kind} after
      </button>
      <div className="border-t border-border" />
      <button
        disabled={!canMovePrev}
        onClick={onMoveUp}
        className="w-full text-left px-3 py-2 hover:bg-secondary/60 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <PrevIcon size={12} /> {prevLabel}
      </button>
      <button
        disabled={!canMoveNext}
        onClick={onMoveDown}
        className="w-full text-left px-3 py-2 hover:bg-secondary/60 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <NextIcon size={12} /> {nextLabel}
      </button>
      <div className="border-t border-border" />
      <button
        disabled={total <= 1}
        onClick={onDelete}
        className="w-full text-left px-3 py-2 hover:bg-secondary/60 text-rose-700 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Trash2 size={12} /> delete {kind}
      </button>
    </div>
  );
}

// ---------- inspector ----------
function InspectorPanel({
  region,
  onSpecChange,
}: {
  region: Region;
  onSpecChange?: (key: string, value: string) => void;
}) {
  const meta = useMemo(() => {
    switch (region.type) {
      case "key": return { name: "key", note: "switch site. pick your switch + cap below." };
      case "encoder": return { name: "encoder", note: "rotary input. choose model and detents." };
      case "knob": return { name: "knob", note: "encoder + capped knob cover." };
      case "oled": return { name: "oled display", note: "pick panel + bus interface." };
      case "eink": return { name: "e-ink", note: "low-power info panel." };
      case "joystick": return { name: "joystick", note: "analog 2-axis input." };
      case "touch": return { name: "touch strip", note: "capacitive linear input." };
      case "spacer": return { name: "spacer", note: "intentionally empty region." };
      case "blocker": return { name: "blocker", note: "cut-out / no component here." };
    }
  }, [region.type]);

  const fields = SPECS[region.type];
  const spec = region.spec ?? defaultSpec(region.type);

  return (
    <div className="space-y-3">
      <div>
        <div className="font-display text-lg lowercase">{meta.name}</div>
        <div className="font-mono text-[10px] text-muted-foreground lowercase">id: {region.id}</div>
      </div>
      <p className="font-mono text-[11px] lowercase text-stone-700 leading-relaxed">{meta.note}</p>

      {fields.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-border">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">specs</div>
          {fields.map((f) => (
            <SpecSelect
              key={f.key}
              field={f}
              value={spec[f.key] ?? f.options[0]}
              onChange={onSpecChange ? (v) => onSpecChange(f.key, v) : undefined}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border">
        <Field label="x" value={region.x} />
        <Field label="y" value={region.y} />
        <Field label="w" value={region.w} />
        <Field label="h" value={region.h} />
      </div>
    </div>
  );
}

function SpecSelect({
  field, value, onChange,
}: {
  field: SpecField;
  value: string;
  onChange?: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{field.label}</span>
      {onChange ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full bg-card border border-border rounded-md px-2 py-1.5 font-mono text-xs lowercase focus:outline-none focus:ring-2 focus:ring-stone-900"
        >
          {field.options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : (
        <div className="mt-1 bg-card border border-border rounded-md px-2 py-1.5 font-mono text-xs lowercase">
          {value}
        </div>
      )}
    </label>
  );
}

function Field({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card border border-border rounded-md px-2 py-1.5">
      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="font-mono text-sm">{value}</div>
    </div>
  );
}

// ---------- components stage ----------
const C_CELL = 64;
const C_GAP = 8;

function ComponentsWorkspace({
  rows, cols, regions, setRegions,
}: {
  rows: number;
  cols: number;
  regions: Region[];
  setRegions: React.Dispatch<React.SetStateAction<Region[]>>;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<CompType | "all">("all");

  function toggle(id: string, additive: boolean) {
    setSelected((prev) => {
      const next = new Set(additive ? prev : []);
      if (prev.has(id) && additive) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function applyType(t: CompType) {
    if (selected.size === 0) return;
    setRegions((rs) =>
      rs.map((r) => (selected.has(r.id) ? { ...r, type: t, spec: defaultSpec(t) } : r)),
    );
  }
  function applySpecField(key: string, value: string) {
    setRegions((rs) =>
      rs.map((r) =>
        selected.has(r.id)
          ? { ...r, spec: { ...(r.spec ?? defaultSpec(r.type)), [key]: value } }
          : r,
      ),
    );
  }
  function selectAllOfType(t: CompType) {
    setSelected(new Set(regions.filter((r) => r.type === t).map((r) => r.id)));
  }

  const totalW = cols * C_CELL + (cols - 1) * C_GAP;
  const totalH = rows * C_CELL + (rows - 1) * C_GAP;

  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const r of regions) out[r.type] = (out[r.type] ?? 0) + 1;
    return out;
  }, [regions]);

  const selectedRegions = regions.filter((r) => selected.has(r.id));
  const selectedTypes = new Set(selectedRegions.map((r) => r.type));
  const visibleIds = new Set(
    filter === "all" ? regions.map((r) => r.id) : regions.filter((r) => r.type === filter).map((r) => r.id),
  );

  return (
    <div className="flex-1 flex bg-editor-canvas">
      {/* palette */}
      <aside className="w-60 border-r border-border bg-sidebar p-4 overflow-y-auto">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">palette</div>
        <p className="font-mono text-[11px] lowercase text-stone-600 leading-relaxed mb-4">
          select cells on the right, then click a component to assign it.
        </p>
        <div className="space-y-1">
          {COMP_OPTIONS.map((c) => {
            const isCurrent = selectedTypes.size === 1 && selectedTypes.has(c.type);
            return (
              <button
                key={c.type}
                disabled={selected.size === 0}
                onClick={() => applyType(c.type)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm font-mono lowercase transition-colors
                  ${isCurrent ? "bg-stone-900 text-stone-50" : "hover:bg-stone-200/40"}
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent`}
              >
                <c.Icon size={14} className={isCurrent ? "text-stone-50 shrink-0" : "text-stone-700 shrink-0"} />
                <span className="flex-1">{c.label}</span>
                <span className={`font-mono text-[10px] ${isCurrent ? "text-stone-300" : "text-stone-400"}`}>
                  {counts[c.type] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">selection</div>
          <button
            onClick={() => setSelected(new Set(regions.map((r) => r.id)))}
            className="w-full font-mono text-[11px] uppercase tracking-[0.18em] border border-stone-400 rounded-md py-2 hover:bg-stone-100"
          >
            select all ({regions.length})
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="mt-2 w-full font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500 hover:text-stone-800"
          >
            clear selection
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">filter view</div>
          <div className="flex flex-wrap gap-1">
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="all" count={regions.length} />
            {COMP_OPTIONS.filter((c) => (counts[c.type] ?? 0) > 0).map((c) => (
              <FilterChip
                key={c.type}
                active={filter === c.type}
                onClick={() => setFilter(c.type)}
                label={c.label}
                count={counts[c.type] ?? 0}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* canvas */}
      <div className="flex-1 overflow-auto p-10" onClick={() => setSelected(new Set())}>
        <div
          className="relative mx-auto bg-card border border-stone-300 rounded-md analog-shadow"
          style={{ width: totalW + 48, padding: 24 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative" style={{ width: totalW, height: totalH }}>
            {regions.map((r) => {
              const left = r.x * (C_CELL + C_GAP);
              const top = r.y * (C_CELL + C_GAP);
              const w = r.w * C_CELL + (r.w - 1) * C_GAP;
              const h = r.h * C_CELL + (r.h - 1) * C_GAP;
              const isSelected = selected.has(r.id);
              const isVisible = visibleIds.has(r.id);
              return (
                <div
                  key={r.id}
                  onClick={(e) => { e.stopPropagation(); toggle(r.id, e.shiftKey); }}
                  style={{ position: "absolute", left, top, width: w, height: h }}
                  className={`cursor-pointer rounded-md transition-all select-none
                    ${isSelected ? "ring-2 ring-stone-900 ring-offset-2 ring-offset-card" : ""}
                    ${isVisible ? "opacity-100" : "opacity-25"}`}
                >
                  <Comp2D type={r.type} w={w} h={h} />
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 size-4 rounded-full bg-stone-900 text-stone-50 flex items-center justify-center">
                      <Check size={10} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* summary strip */}
        <div className="max-w-3xl mx-auto mt-6 grid grid-cols-2 md:grid-cols-4 gap-2">
          <SummaryStat label="regions" value={regions.length} />
          <SummaryStat label="keys" value={counts.key ?? 0} />
          <SummaryStat
            label="inputs"
            value={(counts.encoder ?? 0) + (counts.knob ?? 0) + (counts.joystick ?? 0) + (counts.touch ?? 0)}
          />
          <SummaryStat label="displays" value={(counts.oled ?? 0) + (counts.eink ?? 0)} />
        </div>
      </div>

      {/* inspector */}
      <aside className="w-64 border-l border-border bg-sidebar p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">inspector</div>
        {selectedRegions.length === 0 ? (
          <div className="font-mono text-xs lowercase text-stone-500">
            select a cell to inspect, or shift-click to multi-select.
          </div>
        ) : selectedRegions.length === 1 ? (
          <InspectorPanel
            region={selectedRegions[0]}
            onSpecChange={(k, v) => applySpecField(k, v)}
          />
        ) : (
          <div className="space-y-3">
            <div className="font-display text-lg lowercase">{selectedRegions.length} selected</div>
            {selectedTypes.size === 1 ? (
              <>
                <p className="font-mono text-[11px] lowercase text-stone-700 leading-relaxed">
                  editing specs for all <strong>{selectedRegions.length}</strong>{" "}
                  {[...selectedTypes][0]} cells.
                </p>
                {SPECS[[...selectedTypes][0] as CompType].length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-border">
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">shared specs</div>
                    {SPECS[[...selectedTypes][0] as CompType].map((f) => {
                      const values = new Set(
                        selectedRegions.map((r) => (r.spec ?? defaultSpec(r.type))[f.key] ?? f.options[0]),
                      );
                      const display = values.size === 1 ? [...values][0] : "—mixed—";
                      return (
                        <SpecSelect
                          key={f.key}
                          field={values.size === 1 ? f : { ...f, options: ["—mixed—", ...f.options] }}
                          value={display}
                          onChange={(v) => v !== "—mixed—" && applySpecField(f.key, v)}
                        />
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <p className="font-mono text-[11px] lowercase text-stone-700 leading-relaxed">
                mixed types selected. pick a single component from the palette to unify them, then edit specs.
              </p>
            )}
            <div className="pt-3 border-t border-border">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1">current types</div>
              <ul className="font-mono text-[11px] lowercase text-stone-700 space-y-1">
                {Array.from(selectedTypes).map((t) => (
                  <li key={t}>
                    · {t} ({selectedRegions.filter((r) => r.type === t).length})
                    <button
                      onClick={() => selectAllOfType(t)}
                      className="ml-2 text-[10px] uppercase tracking-[0.18em] text-stone-500 hover:text-stone-900"
                    >
                      select all
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

      </aside>
    </div>
  );
}

function FilterChip({
  active, onClick, label, count,
}: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`font-mono text-[10px] uppercase tracking-[0.18em] px-2 py-1 rounded border
        ${active ? "bg-stone-900 text-stone-50 border-stone-900" : "bg-stone-50/60 text-stone-600 border-stone-300 hover:bg-stone-100"}`}
    >
      {label} <span className="opacity-60">{count}</span>
    </button>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card border border-border rounded-md p-3 analog-shadow-sm">
      <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <div className="font-display text-2xl lowercase mt-1">{value}</div>
    </div>
  );
}

// ============================================================
// flow 03 · pcb
// ============================================================

type PcbShape = "rectangular" | "rounded" | "hull" | "dxf";
type SilkSide = "front" | "back";
type SilkItem = {
  id: string;
  side: SilkSide;
  kind: "text" | "label" | "svg";
  text: string;
  x: number; // 0..1 normalized
  y: number;
};

type PcbConfig = {
  shape: PcbShape;
  cornerRadius: number; // mm
  margin: number; // mm padding around components
  pcbColor: "black" | "white" | "green" | "blue" | "red" | "purple" | "yellow";
  finish: "hasl" | "enig" | "lead-free hasl";
  silkFront: "white" | "black" | "yellow";
  silkBack: "white" | "black" | "yellow";
  usbPosition: "top" | "bottom" | "left" | "right";
  silk: SilkItem[];
  dxfFilename?: string;
};

const PCB_COLOR_HEX: Record<PcbConfig["pcbColor"], string> = {
  black: "#1a1a1a",
  white: "#f5f5f0",
  green: "#0d4f2a",
  blue: "#0e2a5e",
  red: "#5e1414",
  purple: "#3a1856",
  yellow: "#a88600",
};
const SILK_HEX: Record<PcbConfig["silkFront"], string> = {
  white: "#f5f5f0",
  black: "#111111",
  yellow: "#f5d76e",
};

function defaultPcb(): PcbConfig {
  return {
    shape: "rounded",
    cornerRadius: 4,
    margin: 6,
    pcbColor: "black",
    finish: "enig",
    silkFront: "white",
    silkBack: "white",
    usbPosition: "top",
    silk: [
      { id: uid(), side: "front", kind: "text", text: "keeberia", x: 0.04, y: 0.04 },
    ],
  };
}

function PcbWorkspace({
  rows, cols, regions, cfg, setCfg,
}: {
  rows: number;
  cols: number;
  regions: Region[];
  cfg: PcbConfig;
  setCfg: React.Dispatch<React.SetStateAction<PcbConfig>>;
}) {
  const [activeSide, setActiveSide] = useState<SilkSide>("front");

  function patch(p: Partial<PcbConfig>) {
    setCfg((c) => ({ ...c, ...p }));
  }
  function addSilk(kind: SilkItem["kind"]) {
    const text = kind === "text" ? "label" : kind === "label" ? "1" : "logo.svg";
    setCfg((c) => ({
      ...c,
      silk: [...c.silk, { id: uid(), side: activeSide, kind, text, x: 0.5, y: 0.5 }],
    }));
  }
  function updateSilk(id: string, p: Partial<SilkItem>) {
    setCfg((c) => ({ ...c, silk: c.silk.map((s) => (s.id === id ? { ...s, ...p } : s)) }));
  }
  function removeSilk(id: string) {
    setCfg((c) => ({ ...c, silk: c.silk.filter((s) => s.id !== id) }));
  }
  function onDxfPick(file: File | null) {
    if (!file) return;
    patch({ shape: "dxf", dxfFilename: file.name });
  }

  const validations = useMemo(() => validatePcb(cfg, regions, rows, cols), [cfg, regions, rows, cols]);

  return (
    <div className="flex-1 flex bg-editor-canvas">
      {/* left config */}
      <aside className="w-72 border-r border-border bg-sidebar p-4 overflow-y-auto">
        <SectionTitle>shape</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {(["rectangular", "rounded", "hull", "dxf"] as PcbShape[]).map((s) => (
            <button
              key={s}
              onClick={() => patch({ shape: s })}
              className={`font-mono text-[10px] uppercase tracking-[0.18em] px-2 py-3 rounded-md border transition-colors
                ${cfg.shape === s
                  ? "bg-stone-900 text-stone-50 border-stone-900"
                  : "bg-card border-stone-300 hover:bg-stone-100"}`}
            >
              {s}
            </button>
          ))}
        </div>

        {cfg.shape === "rounded" && (
          <div className="mt-3">
            <RangeField label="corner radius" suffix="mm" min={0} max={20} value={cfg.cornerRadius}
              onChange={(v) => patch({ cornerRadius: v })} />
          </div>
        )}
        {cfg.shape === "dxf" && (
          <label className="mt-3 block">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">upload dxf outline</span>
            <input
              type="file"
              accept=".dxf"
              onChange={(e) => onDxfPick(e.target.files?.[0] ?? null)}
              className="mt-1 w-full text-[11px] font-mono lowercase"
            />
            {cfg.dxfFilename && (
              <div className="mt-2 font-mono text-[10px] text-stone-700 lowercase">
                · {cfg.dxfFilename}
              </div>
            )}
          </label>
        )}

        <div className="mt-3">
          <RangeField label="edge margin" suffix="mm" min={0} max={20} value={cfg.margin}
            onChange={(v) => patch({ margin: v })} />
        </div>

        <SectionTitle className="mt-6">appearance</SectionTitle>
        <div className="space-y-2">
          <label className="block">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">pcb color</span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {(Object.keys(PCB_COLOR_HEX) as PcbConfig["pcbColor"][]).map((c) => (
                <button
                  key={c}
                  onClick={() => patch({ pcbColor: c })}
                  title={c}
                  className={`size-6 rounded border ${cfg.pcbColor === c ? "ring-2 ring-stone-900 ring-offset-1" : "border-stone-300"}`}
                  style={{ background: PCB_COLOR_HEX[c] }}
                />
              ))}
            </div>
          </label>
          <SelectField label="surface finish" value={cfg.finish}
            options={["hasl", "enig", "lead-free hasl"]} onChange={(v) => patch({ finish: v as PcbConfig["finish"] })} />
          <SelectField label="front silkscreen" value={cfg.silkFront}
            options={["white", "black", "yellow"]} onChange={(v) => patch({ silkFront: v as PcbConfig["silkFront"] })} />
          <SelectField label="back silkscreen" value={cfg.silkBack}
            options={["white", "black", "yellow"]} onChange={(v) => patch({ silkBack: v as PcbConfig["silkBack"] })} />
          <SelectField label="usb position" value={cfg.usbPosition}
            options={["top", "bottom", "left", "right"]} onChange={(v) => patch({ usbPosition: v as PcbConfig["usbPosition"] })} />
        </div>

        <SectionTitle className="mt-6">routing</SectionTitle>
        <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 font-mono text-[11px] lowercase text-emerald-900 leading-relaxed">
          routing automatically generated. matrix and traces hidden by default. advanced mode coming later.
        </div>
      </aside>

      {/* preview */}
      <div className="flex-1 overflow-auto p-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">pcb preview · {activeSide}</div>
            <div className="inline-flex rounded-md border border-border bg-card overflow-hidden">
              {(["front", "back"] as SilkSide[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveSide(s)}
                  className={`font-mono text-[10px] uppercase tracking-[0.18em] px-3 py-1.5
                    ${activeSide === s ? "bg-stone-900 text-stone-50" : "text-stone-600 hover:bg-stone-100"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <PcbPreview cfg={cfg} regions={regions} rows={rows} cols={cols} side={activeSide} onMoveSilk={updateSilk} />

          {/* silkscreen editor */}
          <div className="mt-6 bg-card border border-border rounded-md p-4 analog-shadow-sm">
            <div className="flex items-center justify-between">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                silkscreen · {activeSide}
              </div>
              <div className="flex gap-2">
                <button onClick={() => addSilk("text")}
                  className="font-mono text-[10px] uppercase tracking-[0.18em] px-2 py-1 rounded border border-stone-300 hover:bg-stone-100">
                  + text
                </button>
                <button onClick={() => addSilk("label")}
                  className="font-mono text-[10px] uppercase tracking-[0.18em] px-2 py-1 rounded border border-stone-300 hover:bg-stone-100">
                  + label
                </button>
                <button onClick={() => addSilk("svg")}
                  className="font-mono text-[10px] uppercase tracking-[0.18em] px-2 py-1 rounded border border-stone-300 hover:bg-stone-100">
                  + svg
                </button>
              </div>
            </div>
            <ul className="mt-3 divide-y divide-border">
              {cfg.silk.filter((s) => s.side === activeSide).length === 0 && (
                <li className="font-mono text-[11px] text-stone-500 lowercase py-3">
                  no items on this side. add text, labels, or upload svg artwork.
                </li>
              )}
              {cfg.silk.filter((s) => s.side === activeSide).map((s) => (
                <li key={s.id} className="py-2 flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500 w-12">{s.kind}</span>
                  <input
                    value={s.text}
                    onChange={(e) => updateSilk(s.id, { text: e.target.value })}
                    className="flex-1 bg-card border border-border rounded px-2 py-1 font-mono text-xs lowercase focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                  <button onClick={() => removeSilk(s.id)} className="text-stone-400 hover:text-rose-700">
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 font-mono text-[10px] lowercase text-stone-500">drag items in the preview to position. front and back are edited separately.</p>
          </div>
        </div>
      </div>

      {/* validation */}
      <aside className="w-64 border-l border-border bg-sidebar p-4 overflow-y-auto">
        <SectionTitle>manufacturing checks</SectionTitle>
        {validations.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 font-mono text-[11px] lowercase text-emerald-900">
            all clear. design is ready to fabricate.
          </div>
        ) : (
          <ul className="space-y-2">
            {validations.map((v, i) => (
              <li key={i} className={`rounded-md p-3 font-mono text-[11px] lowercase leading-relaxed border
                ${v.level === "error"
                  ? "bg-rose-50 border-rose-200 text-rose-900"
                  : "bg-amber-50 border-amber-200 text-amber-900"}`}>
                <span className="uppercase tracking-[0.18em] text-[9px] block mb-1 opacity-70">{v.level}</span>
                {v.message}
              </li>
            ))}
          </ul>
        )}

        <SectionTitle className="mt-6">summary</SectionTitle>
        <div className="space-y-1.5 font-mono text-[11px] lowercase text-stone-700">
          <SummaryRow k="shape" v={cfg.shape} />
          <SummaryRow k="dimensions" v={`${cols * 19 + cfg.margin * 2}mm × ${rows * 19 + cfg.margin * 2}mm`} />
          <SummaryRow k="color" v={cfg.pcbColor} />
          <SummaryRow k="finish" v={cfg.finish} />
          <SummaryRow k="silkscreen items" v={String(cfg.silk.length)} />
          <SummaryRow k="usb" v={cfg.usbPosition} />
        </div>
      </aside>
    </div>
  );
}

function validatePcb(cfg: PcbConfig, regions: Region[], rows: number, cols: number): { level: "warn" | "error"; message: string }[] {
  const out: { level: "warn" | "error"; message: string }[] = [];
  if (cfg.margin < 2) out.push({ level: "warn", message: "edge margin under 2mm. components may sit too close to the board edge." });
  const displays = regions.filter((r) => r.type === "oled" || r.type === "eink");
  for (const d of displays) {
    const onEdge = d.x === 0 || d.y === 0 || d.x + d.w === cols || d.y + d.h === rows;
    if (onEdge && cfg.margin < 5) {
      out.push({ level: "warn", message: `display at (${d.x},${d.y}) sits near the board edge. consider a larger margin.` });
    }
  }
  const encoders = regions.filter((r) => r.type === "encoder" || r.type === "knob");
  for (const e of encoders) {
    const neighbors = regions.filter((r) => r.id !== e.id && Math.abs(r.x - e.x) <= 1 && Math.abs(r.y - e.y) <= 1);
    if (neighbors.some((n) => n.type === "encoder" || n.type === "knob")) {
      out.push({ level: "warn", message: `encoder/knob at (${e.x},${e.y}) is adjacent to another rotary. check shaft clearance.` });
      break;
    }
  }
  if (cfg.shape === "rectangular" && cfg.cornerRadius > 0) {
    // no-op
  }
  if (cfg.shape === "dxf" && !cfg.dxfFilename) {
    out.push({ level: "error", message: "dxf shape selected but no outline uploaded yet." });
  }
  // usb accessibility heuristic
  const usbBlocked = regions.some((r) => {
    if (cfg.usbPosition === "top") return r.y === 0 && r.type !== "key" && r.type !== "spacer";
    if (cfg.usbPosition === "bottom") return r.y + r.h === rows && r.type !== "key" && r.type !== "spacer";
    if (cfg.usbPosition === "left") return r.x === 0 && r.type !== "key" && r.type !== "spacer";
    return r.x + r.w === cols && r.type !== "key" && r.type !== "spacer";
  });
  if (usbBlocked) {
    out.push({ level: "warn", message: `usb on the ${cfg.usbPosition} edge may be obstructed by a display or rotary component.` });
  }
  return out;
}

function PcbPreview({
  cfg, regions, rows, cols, side, onMoveSilk,
}: {
  cfg: PcbConfig;
  regions: Region[];
  rows: number;
  cols: number;
  side: SilkSide;
  onMoveSilk: (id: string, p: Partial<SilkItem>) => void;
}) {
  const CELL = 44;
  const GAP_PCB = 6;
  const padding = Math.max(12, cfg.margin * 2);
  const innerW = cols * CELL + (cols - 1) * GAP_PCB;
  const innerH = rows * CELL + (rows - 1) * GAP_PCB;
  const boardW = innerW + padding * 2;
  const boardH = innerH + padding * 2;

  const bg = PCB_COLOR_HEX[cfg.pcbColor];
  const silkColor = SILK_HEX[side === "front" ? cfg.silkFront : cfg.silkBack];
  const isDarkBoard = ["black", "green", "blue", "red", "purple"].includes(cfg.pcbColor);

  const borderRadius =
    cfg.shape === "rectangular" ? 0
    : cfg.shape === "rounded" ? cfg.cornerRadius * 2
    : cfg.shape === "hull" ? 18
    : 12;

  const boardRef = useRef<HTMLDivElement>(null);
  function onSilkDrag(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    const board = boardRef.current;
    if (!board) return;
    const rect = board.getBoundingClientRect();
    function move(ev: MouseEvent) {
      const x = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (ev.clientY - rect.top) / rect.height));
      onMoveSilk(id, { x, y });
    }
    function up() {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }

  // usb tab
  const tabW = 24, tabH = 8;
  const tabStyle: React.CSSProperties = (() => {
    switch (cfg.usbPosition) {
      case "top": return { left: boardW / 2 - tabW / 2, top: -tabH + 1, width: tabW, height: tabH };
      case "bottom": return { left: boardW / 2 - tabW / 2, bottom: -tabH + 1, width: tabW, height: tabH };
      case "left": return { top: boardH / 2 - tabW / 2, left: -tabH + 1, width: tabH, height: tabW };
      case "right": return { top: boardH / 2 - tabW / 2, right: -tabH + 1, width: tabH, height: tabW };
    }
  })();

  // mounting holes (corners)
  const holeInset = padding / 2;
  const holes = [
    { left: holeInset, top: holeInset },
    { right: holeInset, top: holeInset },
    { left: holeInset, bottom: holeInset },
    { right: holeInset, bottom: holeInset },
  ];

  return (
    <div
      ref={boardRef}
      className="relative mx-auto select-none"
      style={{
        width: boardW,
        height: boardH,
        background: bg,
        borderRadius,
        boxShadow: "0 14px 40px -18px rgba(0,0,0,0.45), inset 0 0 0 2px rgba(0,0,0,0.25)",
      }}
    >
      {/* usb tab */}
      <div
        className="absolute bg-stone-300 border border-stone-400 rounded-[2px]"
        style={tabStyle}
        title={`usb · ${cfg.usbPosition}`}
      />

      {/* mounting holes */}
      {holes.map((h, i) => (
        <div
          key={i}
          className="absolute size-2 rounded-full bg-stone-900/70 border border-stone-100/30"
          style={{ ...h, transform: "translate(-50%,-50%)", marginLeft: 0, marginTop: 0 }}
        />
      ))}

      {/* component footprints */}
      <div
        className="absolute"
        style={{ left: padding, top: padding, width: innerW, height: innerH }}
      >
        {regions.map((r) => {
          const left = r.x * (CELL + GAP_PCB);
          const top = r.y * (CELL + GAP_PCB);
          const w = r.w * CELL + (r.w - 1) * GAP_PCB;
          const h = r.h * CELL + (r.h - 1) * GAP_PCB;
          return (
            <div
              key={r.id}
              className="absolute"
              style={{ left, top, width: w, height: h }}
            >
              <PcbFootprint type={r.type} w={w} h={h} silkColor={silkColor} isDarkBoard={isDarkBoard} />
            </div>
          );
        })}
      </div>

      {/* silkscreen overlay */}
      {cfg.silk.filter((s) => s.side === side).map((s) => (
        <div
          key={s.id}
          onMouseDown={(e) => onSilkDrag(e, s.id)}
          className="absolute cursor-move font-mono text-[10px] uppercase tracking-[0.18em] px-1 py-0.5 rounded hover:ring-1 hover:ring-white/40"
          style={{
            left: `${s.x * 100}%`,
            top: `${s.y * 100}%`,
            color: silkColor,
            transform: "translate(-50%,-50%)",
          }}
          title={`drag to position · ${s.kind}`}
        >
          {s.kind === "svg" ? `[${s.text}]` : s.text}
        </div>
      ))}

      {/* rev label */}
      <div
        className="absolute bottom-1 right-2 font-mono text-[9px] uppercase tracking-[0.22em] opacity-70"
        style={{ color: silkColor }}
      >
        keeberia · rev 1
      </div>
    </div>
  );
}

function PcbFootprint({
  type, w, h, silkColor, isDarkBoard,
}: { type: CompType; w: number; h: number; silkColor: string; isDarkBoard: boolean }) {
  const padColor = isDarkBoard ? "rgba(240, 220, 150, 0.9)" : "rgba(180, 140, 60, 0.85)";
  const outlineColor = silkColor;
  if (type === "key") {
    const cutout = Math.min(w, h) * 0.55;
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute inset-0 rounded-[3px] border border-dashed" style={{ borderColor: `${outlineColor}55` }} />
        <div
          className="rounded-[3px]"
          style={{ width: cutout, height: cutout, background: "transparent", boxShadow: `inset 0 0 0 1.5px ${outlineColor}aa` }}
        />
      </div>
    );
  }
  if (type === "encoder" || type === "knob") {
    const d = Math.min(w, h) - 8;
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="rounded-full"
          style={{ width: d, height: d, boxShadow: `inset 0 0 0 1.5px ${outlineColor}aa` }}
        />
        <div className="absolute size-1.5 rounded-full" style={{ background: padColor }} />
      </div>
    );
  }
  if (type === "oled" || type === "eink") {
    return (
      <div className="absolute inset-1 rounded-sm" style={{ boxShadow: `inset 0 0 0 1.5px ${outlineColor}aa` }}>
        <div className="absolute inset-1 rounded-sm" style={{ background: "rgba(0,0,0,0.55)" }} />
      </div>
    );
  }
  if (type === "joystick") {
    const d = Math.min(w, h) - 10;
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-full" style={{ width: d, height: d, boxShadow: `inset 0 0 0 1.5px ${outlineColor}aa` }} />
      </div>
    );
  }
  if (type === "touch") {
    return (
      <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-1.5 rounded-full" style={{ background: `${outlineColor}55` }} />
    );
  }
  if (type === "spacer") return null;
  // blocker
  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ color: `${outlineColor}aa` }}>
      <X size={Math.min(w, h) / 3} />
    </div>
  );
}

function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2 ${className}`}>
      {children}
    </div>
  );
}

function RangeField({
  label, value, min, max, onChange, suffix,
}: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
        <span className="font-mono text-[10px] text-stone-700">{value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full"
      />
    </label>
  );
}

function SelectField({
  label, value, options, onChange,
}: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-card border border-border rounded-md px-2 py-1.5 font-mono text-xs lowercase focus:outline-none focus:ring-2 focus:ring-stone-900"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function SummaryRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-dashed border-border pb-1">
      <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500">{k}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}

// ============================================================
// flow four: case
// ============================================================

type CaseStyle = "tray" | "sandwich" | "top mount" | "integrated plate" | "open frame";
type ScrewType = "m2" | "m2.5" | "m3" | "heatset insert";
type ViewMode = "2d" | "3d";

type CaseConfig = {
  style: CaseStyle;
  wallThickness: number;     // mm
  pcbMargin: number;         // mm between pcb edge and inner wall
  frontHeight: number;       // mm
  rearHeight: number;        // mm
  typingAngle: number;       // degrees
  plateThickness: number;    // mm
  screw: ScrewType;
  cutoutUsb: boolean;
  cutoutReset: boolean;
  cutoutDisplay: boolean;
  cutoutIndicators: boolean;
  showPcb: boolean;
  showCase: boolean;
  showInternals: boolean;
  view: ViewMode;
};

function defaultCase(): CaseConfig {
  return {
    style: "sandwich",
    wallThickness: 3,
    pcbMargin: 4,
    frontHeight: 12,
    rearHeight: 22,
    typingAngle: 6,
    plateThickness: 1.6,
    screw: "m2",
    cutoutUsb: true,
    cutoutReset: true,
    cutoutDisplay: true,
    cutoutIndicators: false,
    showPcb: true,
    showCase: true,
    showInternals: false,
    view: "3d",
  };
}

const CASE_STYLES: CaseStyle[] = ["tray", "sandwich", "top mount", "integrated plate", "open frame"];

function validateCase(cfg: CaseConfig, regions: Region[], rows: number, cols: number) {
  const out: { level: "warn" | "error"; message: string }[] = [];
  const displays = regions.filter((r) => r.type === "oled" || r.type === "eink");
  for (const d of displays) {
    const onEdge = d.x === 0 || d.y === 0 || d.x + d.w === cols || d.y + d.h === rows;
    if (onEdge && cfg.wallThickness > 2.5 && cfg.pcbMargin < 2) {
      out.push({ level: "warn", message: `display at (${d.x},${d.y}) may collide with the enclosure wall. add pcb margin or thin the wall.` });
    }
  }
  const rotaries = regions.filter((r) => r.type === "encoder" || r.type === "knob");
  if (rotaries.length && cfg.style === "integrated plate" && cfg.frontHeight < 10) {
    out.push({ level: "warn", message: "encoder/knob may collide with the lid. raise front height or pick a different case style." });
  }
  if (!cfg.cutoutUsb) {
    out.push({ level: "error", message: "usb cutout disabled. port will not be accessible." });
  }
  if (cfg.pcbMargin < 1) {
    out.push({ level: "warn", message: "pcb margin under 1mm. mounting pillars may overlap with components." });
  }
  if (cfg.rearHeight < cfg.frontHeight) {
    out.push({ level: "warn", message: "rear height is lower than front. typing angle will be negative." });
  }
  if (cfg.wallThickness < 1.5) {
    out.push({ level: "warn", message: "wall thickness under 1.5mm may not survive printing or milling." });
  }
  return out;
}

function CaseWorkspace({
  rows, cols, regions, cfg, setCfg,
}: {
  rows: number; cols: number; regions: Region[];
  cfg: CaseConfig; setCfg: React.Dispatch<React.SetStateAction<CaseConfig>>;
}) {
  function patch(p: Partial<CaseConfig>) { setCfg((c) => ({ ...c, ...p })); }
  const validations = useMemo(() => validateCase(cfg, regions, rows, cols), [cfg, regions, rows, cols]);

  const outerW = cols * 19 + (cfg.pcbMargin + cfg.wallThickness) * 2;
  const outerH = rows * 19 + (cfg.pcbMargin + cfg.wallThickness) * 2;

  return (
    <div className="flex-1 flex bg-editor-canvas">
      <aside className="w-72 border-r border-border bg-sidebar p-4 overflow-y-auto">
        <SectionTitle>case style</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {CASE_STYLES.map((s) => (
            <button
              key={s}
              onClick={() => patch({ style: s })}
              className={`font-mono text-[10px] uppercase tracking-[0.16em] px-2 py-3 rounded-md border transition-colors text-left
                ${cfg.style === s ? "bg-stone-900 text-stone-50 border-stone-900" : "bg-card border-stone-300 hover:bg-stone-100"}`}
            >
              {s}
            </button>
          ))}
        </div>

        <SectionTitle className="mt-6">dimensions</SectionTitle>
        <div className="space-y-3">
          <RangeField label="wall thickness" suffix="mm" min={1} max={8} value={cfg.wallThickness} onChange={(v) => patch({ wallThickness: v })} />
          <RangeField label="pcb margin" suffix="mm" min={0} max={10} value={cfg.pcbMargin} onChange={(v) => patch({ pcbMargin: v })} />
          <RangeField label="front height" suffix="mm" min={4} max={40} value={cfg.frontHeight} onChange={(v) => patch({ frontHeight: v })} />
          <RangeField label="rear height" suffix="mm" min={4} max={50} value={cfg.rearHeight} onChange={(v) => patch({ rearHeight: v })} />
          <RangeField label="typing angle" suffix="°" min={0} max={15} value={cfg.typingAngle} onChange={(v) => patch({ typingAngle: v })} />
          <RangeField label="plate thickness" suffix="mm" min={1} max={5} value={cfg.plateThickness} onChange={(v) => patch({ plateThickness: v })} />
        </div>

        <SectionTitle className="mt-6">mounting</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {(["m2", "m2.5", "m3", "heatset insert"] as ScrewType[]).map((s) => (
            <button
              key={s}
              onClick={() => patch({ screw: s })}
              className={`font-mono text-[10px] uppercase tracking-[0.16em] px-2 py-2 rounded-md border
                ${cfg.screw === s ? "bg-stone-900 text-stone-50 border-stone-900" : "bg-card border-stone-300 hover:bg-stone-100"}`}
            >
              {s}
            </button>
          ))}
        </div>

        <SectionTitle className="mt-6">cutouts</SectionTitle>
        <div className="space-y-1.5">
          <ToggleRow label="usb cutout" value={cfg.cutoutUsb} onChange={(v) => patch({ cutoutUsb: v })} />
          <ToggleRow label="reset button" value={cfg.cutoutReset} onChange={(v) => patch({ cutoutReset: v })} />
          <ToggleRow label="display windows" value={cfg.cutoutDisplay} onChange={(v) => patch({ cutoutDisplay: v })} />
          <ToggleRow label="indicator openings" value={cfg.cutoutIndicators} onChange={(v) => patch({ cutoutIndicators: v })} />
        </div>

        <SectionTitle className="mt-6">visibility</SectionTitle>
        <div className="space-y-1.5">
          <ToggleRow label="show pcb" value={cfg.showPcb} onChange={(v) => patch({ showPcb: v })} />
          <ToggleRow label="show enclosure" value={cfg.showCase} onChange={(v) => patch({ showCase: v })} />
          <ToggleRow label="show internals (x-ray)" value={cfg.showInternals} onChange={(v) => patch({ showInternals: v })} />
        </div>
      </aside>

      <div className="flex-1 overflow-auto p-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">case preview · {cfg.view}</div>
            <ViewToggle value={cfg.view} onChange={(v) => patch({ view: v })} />
          </div>

          <DevicePreview
            mode={cfg.view}
            stage="case"
            rows={rows}
            cols={cols}
            regions={regions}
            caseCfg={cfg}
          />

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="outer size" value={`${outerW.toFixed(0)} × ${outerH.toFixed(0)} mm`} />
            <Stat label="profile" value={`${cfg.frontHeight}/${cfg.rearHeight} mm`} />
            <Stat label="style" value={cfg.style} />
            <Stat label="mount" value={cfg.screw} />
          </div>

          <div className="mt-6 bg-card border border-border rounded-md p-4 analog-shadow-sm">
            <SectionTitle>exports ready at end of stage</SectionTitle>
            <ul className="font-mono text-[11px] lowercase text-stone-700 space-y-1">
              <li>· enclosure.step</li>
              <li>· enclosure-top.stl</li>
              <li>· enclosure-bottom.stl</li>
              <li>· plate.dxf</li>
              <li>· assembly-bom.csv</li>
            </ul>
          </div>
        </div>
      </div>

      <aside className="w-64 border-l border-border bg-sidebar p-4 overflow-y-auto">
        <SectionTitle>collision checks</SectionTitle>
        {validations.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 font-mono text-[11px] lowercase text-emerald-900">
            no collisions detected. enclosure is ready.
          </div>
        ) : (
          <ul className="space-y-2">
            {validations.map((v, i) => (
              <li key={i} className={`rounded-md p-3 font-mono text-[11px] lowercase leading-relaxed border
                ${v.level === "error" ? "bg-rose-50 border-rose-200 text-rose-900" : "bg-amber-50 border-amber-200 text-amber-900"}`}>
                <span className="uppercase tracking-[0.18em] text-[9px] block mb-1 opacity-70">{v.level}</span>
                {v.message}
              </li>
            ))}
          </ul>
        )}
        <SectionTitle className="mt-6">summary</SectionTitle>
        <div className="space-y-1.5 font-mono text-[11px] lowercase text-stone-700">
          <SummaryRow k="style" v={cfg.style} />
          <SummaryRow k="walls" v={`${cfg.wallThickness}mm`} />
          <SummaryRow k="angle" v={`${cfg.typingAngle}°`} />
          <SummaryRow k="screws" v={cfg.screw} />
          <SummaryRow k="cutouts" v={[cfg.cutoutUsb && "usb", cfg.cutoutReset && "reset", cfg.cutoutDisplay && "display", cfg.cutoutIndicators && "led"].filter(Boolean).join(", ") || "none"} />
        </div>
      </aside>
    </div>
  );
}

// ============================================================
// flow five: keys & knobs
// ============================================================

type KeyProfile = "cherry" | "oem" | "dsa" | "xda" | "sa" | "mt3" | "choc";
type LegendStyle = "blank" | "top" | "side" | "custom";
type CapMaterial = "abs" | "pbt" | "resin";
type KnobStyle = "smooth" | "ribbed" | "fluted" | "synth" | "industrial" | "low profile";
type IndicatorStyle = "line" | "dot" | "none";
type PreviewLayer = "wireframe" | "pcb" | "enclosure" | "finished" | "exploded";

type CapsConfig = {
  profile: KeyProfile;
  legend: LegendStyle;
  customLegends: Record<string, string>; // regionId -> text
  material: CapMaterial;
  capColor: string;
  legendColor: string;
  knobStyle: KnobStyle;
  knobDiameter: number;   // mm
  knobHeight: number;     // mm
  indicator: IndicatorStyle;
  layer: PreviewLayer;
  view: ViewMode;
};

function defaultCaps(): CapsConfig {
  return {
    profile: "cherry",
    legend: "top",
    customLegends: {},
    material: "pbt",
    capColor: "#e9e4d8",
    legendColor: "#1c1c1c",
    knobStyle: "ribbed",
    knobDiameter: 20,
    knobHeight: 14,
    indicator: "line",
    layer: "finished",
    view: "3d",
  };
}

const CAP_PRESETS = ["#e9e4d8", "#1c1c1c", "#c94f4f", "#3a6ea5", "#e8b84a", "#5f8a5a", "#8a5fb4"];
const KNOB_STYLES: KnobStyle[] = ["smooth", "ribbed", "fluted", "synth", "industrial", "low profile"];

function CapsWorkspace({
  rows, cols, regions, cfg, setCfg, caseCfg,
}: {
  rows: number; cols: number; regions: Region[];
  cfg: CapsConfig; setCfg: React.Dispatch<React.SetStateAction<CapsConfig>>;
  caseCfg: CaseConfig;
}) {
  function patch(p: Partial<CapsConfig>) { setCfg((c) => ({ ...c, ...p })); }

  const keys = regions.filter((r) => r.type === "key");
  const knobs = regions.filter((r) => r.type === "encoder" || r.type === "knob");

  return (
    <div className="flex-1 flex bg-editor-canvas">
      <aside className="w-72 border-r border-border bg-sidebar p-4 overflow-y-auto">
        <SectionTitle>keycap profile</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {(["cherry", "oem", "dsa", "xda", "sa", "mt3", "choc"] as KeyProfile[]).map((p) => (
            <button
              key={p}
              onClick={() => patch({ profile: p })}
              className={`font-mono text-[10px] uppercase tracking-[0.16em] px-2 py-2 rounded-md border
                ${cfg.profile === p ? "bg-stone-900 text-stone-50 border-stone-900" : "bg-card border-stone-300 hover:bg-stone-100"}`}
            >
              {p}
            </button>
          ))}
        </div>

        <SectionTitle className="mt-6">material</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {(["abs", "pbt", "resin"] as CapMaterial[]).map((m) => (
            <button
              key={m}
              onClick={() => patch({ material: m })}
              className={`font-mono text-[10px] uppercase tracking-[0.16em] px-2 py-2 rounded-md border
                ${cfg.material === m ? "bg-stone-900 text-stone-50 border-stone-900" : "bg-card border-stone-300 hover:bg-stone-100"}`}
            >
              {m}
            </button>
          ))}
        </div>

        <SectionTitle className="mt-6">cap color</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {CAP_PRESETS.map((c) => (
            <button
              key={c}
              onClick={() => patch({ capColor: c })}
              className={`size-7 rounded border ${cfg.capColor === c ? "ring-2 ring-stone-900 ring-offset-1" : "border-stone-300"}`}
              style={{ background: c }}
              title={c}
            />
          ))}
          <input type="color" value={cfg.capColor} onChange={(e) => patch({ capColor: e.target.value })} className="size-7 rounded border border-stone-300" />
        </div>

        <SectionTitle className="mt-4">legend</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {(["blank", "top", "side", "custom"] as LegendStyle[]).map((l) => (
            <button
              key={l}
              onClick={() => patch({ legend: l })}
              className={`font-mono text-[10px] uppercase tracking-[0.16em] px-2 py-2 rounded-md border
                ${cfg.legend === l ? "bg-stone-900 text-stone-50 border-stone-900" : "bg-card border-stone-300 hover:bg-stone-100"}`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">legend color</span>
          <input type="color" value={cfg.legendColor} onChange={(e) => patch({ legendColor: e.target.value })} className="size-6 rounded border border-stone-300" />
        </div>

        <SectionTitle className="mt-6">knob style</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {KNOB_STYLES.map((s) => (
            <button
              key={s}
              onClick={() => patch({ knobStyle: s })}
              className={`font-mono text-[10px] uppercase tracking-[0.16em] px-2 py-2 rounded-md border text-left
                ${cfg.knobStyle === s ? "bg-stone-900 text-stone-50 border-stone-900" : "bg-card border-stone-300 hover:bg-stone-100"}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="mt-3 space-y-3">
          <RangeField label="knob diameter" suffix="mm" min={10} max={40} value={cfg.knobDiameter} onChange={(v) => patch({ knobDiameter: v })} />
          <RangeField label="knob height" suffix="mm" min={6} max={30} value={cfg.knobHeight} onChange={(v) => patch({ knobHeight: v })} />
          <SelectField label="indicator line" value={cfg.indicator} options={["line", "dot", "none"]} onChange={(v) => patch({ indicator: v as IndicatorStyle })} />
        </div>
      </aside>

      <div className="flex-1 overflow-auto p-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">device preview · {cfg.layer}</div>
            <div className="flex items-center gap-2">
              <LayerToggle value={cfg.layer} onChange={(l) => patch({ layer: l })} />
              <ViewToggle value={cfg.view} onChange={(v) => patch({ view: v })} />
            </div>
          </div>

          <DevicePreview
            mode={cfg.view}
            stage="caps"
            layer={cfg.layer}
            rows={rows}
            cols={cols}
            regions={regions}
            caseCfg={caseCfg}
            capsCfg={cfg}
          />

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="keys" value={keys.length} />
            <Stat label="knobs" value={knobs.length} />
            <Stat label="profile" value={cfg.profile} />
            <Stat label="material" value={cfg.material} />
          </div>
        </div>
      </div>

      <aside className="w-64 border-l border-border bg-sidebar p-4 overflow-y-auto">
        <SectionTitle>finish summary</SectionTitle>
        <div className="space-y-1.5 font-mono text-[11px] lowercase text-stone-700">
          <SummaryRow k="profile" v={cfg.profile} />
          <SummaryRow k="material" v={cfg.material} />
          <SummaryRow k="legend" v={cfg.legend} />
          <SummaryRow k="cap color" v={cfg.capColor} />
          <SummaryRow k="knob" v={`${cfg.knobStyle} · ${cfg.knobDiameter}mm`} />
          <SummaryRow k="indicator" v={cfg.indicator} />
        </div>

        <SectionTitle className="mt-6">tactile notes</SectionTitle>
        <p className="font-mono text-[11px] lowercase text-stone-600 leading-relaxed">
          {cfg.material === "pbt" && "pbt resists shine, matte texture, slightly harder feel."}
          {cfg.material === "abs" && "abs is smoother, develops shine over time, crisper sound."}
          {cfg.material === "resin" && "resin gives custom shapes and translucency, often heavier."}
        </p>
      </aside>
    </div>
  );
}

// ============================================================
// shared preview engine
// ============================================================

function DevicePreview({
  mode, stage, layer = "finished", rows, cols, regions, caseCfg, capsCfg,
}: {
  mode: ViewMode;
  stage: "case" | "caps";
  layer?: PreviewLayer;
  rows: number;
  cols: number;
  regions: Region[];
  caseCfg: CaseConfig;
  capsCfg?: CapsConfig;
}) {
  const unit = 22; // px per 1u
  const padding = (caseCfg.pcbMargin + caseCfg.wallThickness) * 2;
  const pcbW = cols * unit;
  const pcbH = rows * unit;
  const wall = caseCfg.wallThickness * 2;
  const pcbMargin = caseCfg.pcbMargin * 2;
  const outerW = pcbW + (pcbMargin + wall) * 2;
  const outerH = pcbH + (pcbMargin + wall) * 2;

  const showPcb = (stage === "case" ? caseCfg.showPcb : layer !== "enclosure") && layer !== "wireframe";
  const showCase = stage === "case" ? caseCfg.showCase : layer !== "pcb";
  const showInternals = stage === "case" ? caseCfg.showInternals : layer === "exploded";
  const showCaps = stage === "caps" && (layer === "finished" || layer === "exploded");
  const wireframe = layer === "wireframe";
  const exploded = layer === "exploded";

  const transform = mode === "3d"
    ? `perspective(1400px) rotateX(${24 + caseCfg.typingAngle * 0.6}deg) rotateZ(-2deg)`
    : "none";

  return (
    <div className="relative bg-stone-100 border border-border rounded-md p-10 overflow-hidden" style={{ minHeight: 420 }}>
      {/* grid background */}
      <div className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div className="relative flex items-center justify-center" style={{ minHeight: 340 }}>
        <div
          style={{
            width: outerW,
            height: outerH,
            transform,
            transformStyle: "preserve-3d",
            transition: "transform 250ms ease",
          }}
          className="relative"
        >
          {/* case base */}
          {showCase && (
            <div
              className={`absolute inset-0 rounded-md ${wireframe ? "bg-transparent border-2 border-dashed border-stone-500" : "bg-stone-200 border border-stone-400"}`}
              style={{
                boxShadow: wireframe ? "none" : "0 12px 28px -10px rgba(0,0,0,0.35), inset 0 -3px 0 rgba(0,0,0,0.08)",
              }}
            />
          )}
          {/* wall ring (inner cavity outline) */}
          {showCase && (
            <div
              className="absolute rounded-sm border border-stone-400/60"
              style={{
                top: wall, left: wall, right: wall, bottom: wall,
                background: wireframe ? "transparent" : "rgba(255,255,255,0.35)",
              }}
            />
          )}
          {/* pcb */}
          {showPcb && (
            <div
              className="absolute rounded-sm"
              style={{
                top: wall + pcbMargin,
                left: wall + pcbMargin,
                width: pcbW,
                height: pcbH,
                background: wireframe ? "transparent" : "#0d4f2a",
                border: wireframe ? "1px dashed #555" : "1px solid #08321b",
                transform: exploded ? "translateZ(-12px)" : "none",
                boxShadow: wireframe ? "none" : "inset 0 0 0 2px rgba(255,255,255,0.06)",
              }}
            >
              {/* mounting holes (corners) */}
              {[[0,0],[1,0],[0,1],[1,1]].map(([cx,cy], i) => (
                <div key={i}
                  className="absolute rounded-full border"
                  style={{
                    width: 6, height: 6,
                    top: cy ? pcbH - 10 : 4,
                    left: cx ? pcbW - 10 : 4,
                    background: wireframe ? "transparent" : "#1a1a1a",
                    borderColor: "#888",
                  }}
                />
              ))}
              {/* components */}
              {regions.map((r) => (
                <RegionGlyph key={r.id} r={r} unit={unit} wireframe={wireframe}
                  showCaps={!!showCaps} caps={capsCfg} />
              ))}
              {/* usb tab */}
              <div
                className="absolute bg-stone-300 rounded-sm border border-stone-400"
                style={usbStyle(pcbW, pcbH)}
              >
                <div className="size-full opacity-70" />
              </div>
            </div>
          )}
          {/* x-ray internals */}
          {showInternals && showCase && (
            <>
              {[[0,0],[1,0],[0,1],[1,1]].map(([cx,cy], i) => (
                <div key={`pillar-${i}`} className="absolute rounded-full border border-dashed border-stone-500/70 bg-amber-100/40"
                  style={{
                    width: 12, height: 12,
                    top: cy ? outerH - wall - 14 : wall + 2,
                    left: cx ? outerW - wall - 14 : wall + 2,
                  }}
                />
              ))}
            </>
          )}
          {/* cutout labels */}
          {showCase && caseCfg.cutoutUsb && (
            <div className="absolute font-mono text-[8px] uppercase tracking-[0.2em] text-stone-500"
              style={{ top: -14, left: outerW / 2 - 18 }}>
              usb
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-3 left-4 font-mono text-[9px] uppercase tracking-[0.2em] text-stone-500">
        {stage === "case" ? "pcb + enclosure" : layer === "wireframe" ? "wireframe" : layer === "pcb" ? "pcb only" : layer === "enclosure" ? "enclosure only" : layer === "exploded" ? "exploded" : "pcb + enclosure + caps + knobs"}
      </div>
      <div className="absolute bottom-3 right-4 font-mono text-[9px] uppercase tracking-[0.2em] text-stone-500">
        {mode === "3d" ? "press 2d for flat plan view" : "press 3d for perspective"}
      </div>
    </div>
  );
}

function usbStyle(pcbW: number, pcbH: number): React.CSSProperties {
  // simple top edge tab
  return { top: -4, left: pcbW / 2 - 12, width: 24, height: 8 };
}

function RegionGlyph({
  r, unit, wireframe, showCaps, caps,
}: {
  r: Region;
  unit: number;
  wireframe: boolean;
  showCaps: boolean;
  caps?: CapsConfig;
}) {
  const x = r.x * unit;
  const y = r.y * unit;
  const w = r.w * unit;
  const h = r.h * unit;

  if (r.type === "key") {
    const capColor = showCaps && caps ? caps.capColor : "#1a1a1a";
    const profileLift = showCaps && caps?.profile === "sa" ? 6 : showCaps && caps?.profile === "mt3" ? 5 : showCaps ? 3 : 0;
    return (
      <div className="absolute" style={{ left: x + 2, top: y + 2, width: w - 4, height: h - 4 }}>
        {/* switch base */}
        <div className={`absolute inset-1 rounded-sm ${wireframe ? "border border-dashed border-stone-300" : "bg-stone-800 border border-stone-700"}`} />
        {/* keycap on top */}
        {showCaps && !wireframe && (
          <div
            className="absolute rounded-[3px] border"
            style={{
              inset: 2,
              background: capColor,
              borderColor: "rgba(0,0,0,0.25)",
              boxShadow: `0 ${profileLift}px 0 rgba(0,0,0,0.18), inset 0 -2px 0 rgba(0,0,0,0.12)`,
              transform: `translateZ(${profileLift * 2}px)`,
            }}
          >
            {caps?.legend !== "blank" && (
              <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px]"
                style={{ color: caps?.legendColor ?? "#222" }}>
                {caps?.customLegends?.[r.id] ?? ""}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
  if (r.type === "encoder" || r.type === "knob") {
    const d = Math.min(w, h) - 4;
    const knobD = showCaps && caps ? Math.min(d, caps.knobDiameter) : d - 6;
    const ribbed = caps?.knobStyle === "ribbed" || caps?.knobStyle === "fluted" || caps?.knobStyle === "industrial";
    return (
      <div className="absolute" style={{ left: x + (w - d) / 2, top: y + (h - d) / 2, width: d, height: d }}>
        <div className={`absolute inset-0 rounded-full ${wireframe ? "border border-dashed border-stone-300" : "bg-stone-700 border border-stone-800"}`} />
        {showCaps && !wireframe && (
          <div
            className="absolute rounded-full"
            style={{
              left: (d - knobD) / 2, top: (d - knobD) / 2, width: knobD, height: knobD,
              background: caps?.capColor ?? "#bbb",
              border: "1px solid rgba(0,0,0,0.3)",
              boxShadow: `0 ${caps?.knobHeight ? caps.knobHeight / 3 : 3}px 0 rgba(0,0,0,0.25), inset 0 -3px 0 rgba(0,0,0,0.15)`,
              backgroundImage: ribbed
                ? "repeating-conic-gradient(from 0deg, rgba(0,0,0,0.18) 0deg 6deg, transparent 6deg 12deg)"
                : "none",
            }}
          >
            {caps?.indicator !== "none" && (
              <div
                className="absolute bg-stone-900"
                style={
                  caps?.indicator === "dot"
                    ? { width: 4, height: 4, borderRadius: 9999, top: 4, left: knobD / 2 - 2 }
                    : { width: 2, height: knobD / 2 - 2, top: 2, left: knobD / 2 - 1 }
                }
              />
            )}
          </div>
        )}
      </div>
    );
  }
  if (r.type === "oled" || r.type === "eink") {
    return (
      <div className="absolute" style={{ left: x + 2, top: y + 2, width: w - 4, height: h - 4 }}>
        <div className={`absolute inset-1 rounded-sm ${wireframe ? "border border-dashed border-stone-300" : "bg-stone-900 border border-stone-700"}`}>
          {!wireframe && (
            <div className="absolute inset-1 rounded-[2px]"
              style={{
                background: r.type === "oled"
                  ? "linear-gradient(180deg, #1ec0ff 0%, #0a3a55 100%)"
                  : "linear-gradient(180deg, #f5f0e0 0%, #c2bca8 100%)",
              }} />
          )}
        </div>
      </div>
    );
  }
  // misc
  return (
    <div className="absolute" style={{ left: x + 4, top: y + 4, width: w - 8, height: h - 8 }}>
      <div className={`absolute inset-0 rounded-sm ${wireframe ? "border border-dashed border-stone-300" : "bg-stone-700/60 border border-stone-700"}`} />
    </div>
  );
}

function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="inline-flex rounded-md border border-border bg-card overflow-hidden">
      {(["2d", "3d"] as ViewMode[]).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`font-mono text-[10px] uppercase tracking-[0.18em] px-3 py-1.5
            ${value === v ? "bg-stone-900 text-stone-50" : "text-stone-600 hover:bg-stone-100"}`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

function LayerToggle({ value, onChange }: { value: PreviewLayer; onChange: (v: PreviewLayer) => void }) {
  const layers: PreviewLayer[] = ["wireframe", "pcb", "enclosure", "finished", "exploded"];
  return (
    <div className="inline-flex rounded-md border border-border bg-card overflow-hidden">
      {layers.map((l) => (
        <button
          key={l}
          onClick={() => onChange(l)}
          className={`font-mono text-[10px] uppercase tracking-[0.16em] px-2.5 py-1.5
            ${value === l ? "bg-stone-900 text-stone-50" : "text-stone-600 hover:bg-stone-100"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-2 cursor-pointer">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-700">{label}</span>
      <button
        onClick={() => onChange(!value)}
        type="button"
        className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${value ? "bg-stone-900" : "bg-stone-300"}`}
      >
        <span className={`inline-block size-3 transform rounded-full bg-white transition-transform ${value ? "translate-x-3.5" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}
