import { Link, useLocation } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const OTHER_LINKS = [
  { to: "/philosophy", label: "philosophy" },
  { to: "/roadmap", label: "roadmap" },
] as const;

// the engine pages sit under the behind-the-scenes hub, so they are grouped
// together in the menu rather than scattered among the general pages.
const BTS_LINKS = [
  { to: "/bts", label: "behind the scenes" },
  { to: "/bts/engines/circuitron", label: "circuitron · pcb engine" },
  { to: "/bts/engines/paracraft", label: "paracraft · case engine" },
] as const;

const FLOW_LINKS = [
  { to: "/howitworks/flow", slug: null, label: "flow · overview" },
  { to: "/howitworks/flow/$slug", slug: "layout", label: "flow 01 · layout" },
  { to: "/howitworks/flow/$slug", slug: "components", label: "flow 02 · components" },
  { to: "/howitworks/flow/$slug", slug: "pcb", label: "flow 03 · pcb" },
  { to: "/howitworks/flow/$slug", slug: "case", label: "flow 04 · case" },
  { to: "/howitworks/flow/$slug", slug: "caps", label: "flow 05 · caps & covers" },
] as const;

export function SiteHeader() {
  const { pathname } = useLocation();
  const otherActive =
    pathname.startsWith("/howitworks") ||
    pathname.startsWith("/bts") ||
    pathname === "/philosophy" ||
    pathname === "/roadmap";

  const NavLink = ({ to, label }: { to: string; label: string }) => (
    <Link
      to={to as any}
      className={`font-mono text-[11px] uppercase tracking-[0.18em] hover:text-foreground transition-colors ${
        pathname === to ? "text-foreground" : "text-stone-600"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="bg-editor-header border-b border-border/60">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center size-5 rounded-[4px] bg-stone-900 text-stone-50 font-mono text-[10px]">k</span>
          <span className="font-display text-lg lowercase tracking-tight">keeberia</span>
        </Link>
        <nav className="flex items-center gap-5">
          <NavLink to="/" label="home" />
          <NavLink to="/about" label="about" />
          <NavLink to="/features" label="features" />

          <DropdownMenu>
            <DropdownMenuTrigger
              className={`inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.18em] hover:text-foreground transition-colors outline-none ${
                otherActive ? "text-foreground" : "text-stone-600"
              }`}
            >
              other <ChevronDown size={12} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                pages
              </DropdownMenuLabel>
              {OTHER_LINKS.map((l) => (
                <DropdownMenuItem key={l.to} asChild>
                  <Link
                    to={l.to as any}
                    className="font-mono text-[11px] uppercase tracking-[0.16em] lowercase"
                  >
                    {l.label}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                under the hood
              </DropdownMenuLabel>
              {BTS_LINKS.map((l) => (
                <DropdownMenuItem key={l.to} asChild>
                  <Link
                    to={l.to as any}
                    className="font-mono text-[11px] tracking-[0.12em] lowercase"
                  >
                    {l.label}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                how it works
              </DropdownMenuLabel>
              {FLOW_LINKS.map((l) => (
                <DropdownMenuItem key={l.label} asChild>
                  <Link
                    to={l.to as any}
                    params={l.slug ? { slug: l.slug } : undefined as any}
                    className="font-mono text-[11px] tracking-[0.12em] lowercase"
                  >
                    {l.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link
            to="/start"
            className="rounded-md bg-stone-900 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-50 hover:bg-stone-800"
          >
            start →
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center size-4 rounded-[4px] bg-stone-900 text-stone-50 font-mono text-[9px]">k</span>
          <span className="font-display text-base lowercase tracking-tight">keeberia</span>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          a spatial design environment for custom input hardware
        </p>
      </div>
    </footer>
  );
}
