import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SiteHeader, SiteFooter } from "@/components/keeberia/SiteChrome";

export const Route = createFileRoute("/start")({
  head: () => ({
    meta: [
      { title: "start — keeberia" },
      { name: "description", content: "create a new keeberia project. pick a preset or start blank." },
    ],
  }),
  component: StartPage,
});

const PRESETS: { id: string; name: string; rows: number; cols: number; blurb: string }[] = [
  { id: "2x2", name: "2 × 2", rows: 2, cols: 2, blurb: "tiny macropad" },
  { id: "3x3", name: "3 × 3", rows: 3, cols: 3, blurb: "classic ninepad" },
  { id: "4x4", name: "4 × 4", rows: 4, cols: 4, blurb: "macro grid" },
  { id: "numpad", name: "numpad", rows: 5, cols: 4, blurb: "5 × 4 numeric" },
  { id: "streamdeck", name: "streamdeck", rows: 3, cols: 5, blurb: "3 × 5 streamer" },
];

const MAX_R = 10;
const MAX_C = 12;

function StartPage() {
  const navigate = useNavigate();
  const [blankOpen, setBlankOpen] = useState(false);

  function go(rows: number, cols: number, name: string) {
    sessionStorage.setItem("keeberia.init", JSON.stringify({ rows, cols, name }));
    navigate({ to: "/editor" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-3xl bg-card rounded-md border border-border analog-shadow p-8">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ new project</span>
          <h1 className="mt-2 font-display text-3xl lowercase">start a macropad</h1>
          <p className="mt-2 font-mono text-xs text-muted-foreground lowercase max-w-md">
            pick a preset to start fast, or start blank and define your own grid.
          </p>

          <div className="mt-8">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">presets</div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => go(p.rows, p.cols, p.name + " macropad")}
                  className="text-left bg-secondary/40 hover:bg-secondary/80 border border-border rounded-md p-4 transition-colors analog-shadow-sm"
                >
                  <PresetThumb rows={p.rows} cols={p.cols} />
                  <div className="mt-3 font-display text-base lowercase">{p.name}</div>
                  <div className="font-mono text-[10px] text-muted-foreground lowercase mt-0.5">{p.blurb}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 border-t border-dashed border-border pt-6">
            <button
              onClick={() => setBlankOpen(true)}
              className="w-full text-left bg-stone-900 hover:bg-stone-800 rounded-md p-5 text-stone-50 transition-colors"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-300">start blank</div>
              <div className="mt-1 font-display text-lg lowercase">define your own grid</div>
              <div className="font-mono text-[10px] text-stone-400 lowercase mt-0.5">drag-select or enter rows × columns</div>
            </button>
          </div>

          <div className="mt-6 text-center">
            <Link to="/" className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500 hover:text-stone-900">
              ← back home
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />

      <BlankSizeDialog
        open={blankOpen}
        onOpenChange={setBlankOpen}
        onConfirm={(r, c) => go(r, c, "untitled macropad")}
      />
    </div>
  );
}

function PresetThumb({ rows, cols }: { rows: number; cols: number }) {
  return (
    <div
      className="aspect-square w-full bg-card border border-stone-300 rounded-sm p-1.5 grid gap-[3px]"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
    >
      {Array.from({ length: rows * cols }).map((_, i) => (
        <div key={i} className="bg-stone-200 border border-stone-300 rounded-[2px]" />
      ))}
    </div>
  );
}

function BlankSizeDialog({
  open, onOpenChange, onConfirm,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onConfirm: (r: number, c: number) => void;
}) {
  const [r, setR] = useState(4);
  const [c, setC] = useState(4);
  const [hoverR, setHoverR] = useState(0);
  const [hoverC, setHoverC] = useState(0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl lowercase font-normal">pick a grid size</DialogTitle>
          <DialogDescription className="font-mono text-xs lowercase">
            hover across cells to preview, click to set, or type values.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-6 items-start mt-2">
          <div
            className="bg-secondary/40 border border-border rounded-md p-3"
            onMouseLeave={() => { setHoverR(0); setHoverC(0); }}
          >
            <div
              className="grid gap-[3px]"
              style={{ gridTemplateColumns: `repeat(${MAX_C}, 16px)`, gridTemplateRows: `repeat(${MAX_R}, 16px)` }}
            >
              {Array.from({ length: MAX_R }).map((_, ry) =>
                Array.from({ length: MAX_C }).map((__, cx) => {
                  const active = ry < (hoverR || r) && cx < (hoverC || c);
                  return (
                    <button
                      key={`${ry}-${cx}`}
                      onMouseEnter={() => { setHoverR(ry + 1); setHoverC(cx + 1); }}
                      onClick={() => { setR(ry + 1); setC(cx + 1); }}
                      className={`rounded-[2px] border ${active ? "bg-stone-900 border-stone-900" : "bg-card border-stone-300"} transition-colors`}
                    />
                  );
                })
              )}
            </div>
            <div className="mt-3 font-mono text-[11px] lowercase text-stone-700 text-center">
              {(hoverR || r)} × {(hoverC || c)}
            </div>
          </div>

          <div className="flex-1 space-y-3 w-full">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">rows</label>
              <input
                type="number" min={1} max={MAX_R} value={r}
                onChange={(e) => setR(Math.max(1, Math.min(MAX_R, Number(e.target.value) || 1)))}
                className="mt-1 w-full bg-card border border-input rounded-md px-3 py-2 font-mono text-sm"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">columns</label>
              <input
                type="number" min={1} max={MAX_C} value={c}
                onChange={(e) => setC(Math.max(1, Math.min(MAX_C, Number(e.target.value) || 1)))}
                className="mt-1 w-full bg-card border border-input rounded-md px-3 py-2 font-mono text-sm"
              />
            </div>
            <button
              onClick={() => onConfirm(r, c)}
              className="w-full mt-2 rounded-md bg-stone-900 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-50 hover:bg-stone-800"
            >
              create layout
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
