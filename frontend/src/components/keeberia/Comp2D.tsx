import { Monitor, RectangleHorizontal, X } from "lucide-react";

export type CompType =
  | "key"
  | "encoder"
  | "knob"
  | "oled"
  | "eink"
  | "joystick"
  | "touch"
  | "spacer"
  | "blocker";

export function Comp2D({
  type,
  w,
  h,
}: {
  type: CompType;
  w: number;
  h: number;
}) {
  if (type === "key") {
    return (
      <div className="w-full h-full bg-stone-100 border border-stone-300 rounded-md analog-shadow-sm flex items-center justify-center">
        <div className="size-1.5 rounded-full bg-stone-300" />
      </div>
    );
  }
  if (type === "encoder") {
    const d = Math.min(w, h) - 14;
    return (
      <div className="w-full h-full bg-stone-50 border border-stone-300 rounded-md flex items-center justify-center analog-shadow-sm">
        <div
          className="rounded-full border-2 border-stone-500 bg-stone-200"
          style={{ width: d, height: d }}
        />
      </div>
    );
  }
  if (type === "knob") {
    const d = Math.min(w, h) - 8;
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div
          className="rounded-full border-2 border-stone-700 bg-stone-200 analog-shadow-sm relative"
          style={{ width: d, height: d }}
        >
          <div className="absolute left-1/2 top-1 -translate-x-1/2 w-[3px] h-1/3 bg-stone-700 rounded" />
        </div>
      </div>
    );
  }
  if (type === "oled") {
    return (
      <div className="w-full h-full bg-stone-900 rounded-md flex items-center justify-center analog-shadow-sm">
        <Monitor size={Math.min(w, h) / 2} className="text-emerald-300" />
      </div>
    );
  }
  if (type === "eink") {
    return (
      <div className="w-full h-full bg-stone-50 border border-stone-400 rounded-md flex items-center justify-center analog-shadow-sm">
        <RectangleHorizontal size={Math.min(w, h) / 2} className="text-stone-600" />
      </div>
    );
  }
  if (type === "joystick") {
    const d = Math.min(w, h) - 12;
    return (
      <div className="w-full h-full bg-stone-50 border border-stone-300 rounded-md flex items-center justify-center analog-shadow-sm">
        <div
          className="rounded-full border-2 border-stone-700 bg-stone-300 flex items-center justify-center"
          style={{ width: d, height: d }}
        >
          <div className="size-2 rounded-full bg-stone-700" />
        </div>
      </div>
    );
  }
  if (type === "touch") {
    return (
      <div className="w-full h-full bg-stone-100 border border-stone-300 rounded-full flex items-center justify-center analog-shadow-sm">
        <div className="w-3/4 h-1 bg-stone-400 rounded-full" />
      </div>
    );
  }
  if (type === "spacer") {
    return <div className="w-full h-full border border-dashed border-stone-300 rounded-md" />;
  }
  return (
    <div className="w-full h-full bg-stone-200 border border-stone-400 rounded-md flex items-center justify-center">
      <X size={Math.min(w, h) / 3} className="text-stone-500" />
    </div>
  );
}

/** Fixed-size swatch used in marketing/landing grids. */
export function ComponentSwatch({ type, size = 56 }: { type: CompType; size?: number }) {
  return (
    <div style={{ width: size, height: size }}>
      <Comp2D type={type} w={size} h={size} />
    </div>
  );
}
