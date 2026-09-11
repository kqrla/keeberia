/**
 * the freerouting bridge runner — dsn out, freerouting runs, ses back in.
 *
 * deterministic, no ai: freerouting's push-and-shove router is the industry
 * veteran. this bridge makes it circuitron's big-gun router: the engine's
 * own a* handles the boards it can (fast, in-process), and freerouting is
 * the retry rung for dense boards — same inputs, same outputs, forever.
 *
 * env knobs (all optional):
 *   FREEROUTING_BIN  path to freerouting.jar (or the native binary)
 *   FREEROUTING_JAVA java executable (default: "java")
 *   FREEROUTING_TIMEOUT_MS  kill switch (default: 120000)
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Net, PcbResult, Segment, Via, RouteWarning } from "./types.ts";
import { exportDsn } from "./dsn.ts";
import { parseSes } from "./ses.ts";

export interface FreerouteResult {
  segments: Segment[];
  vias: Via[];
  warnings: RouteWarning[];
  routedNets: number;
  failedNets: number;
  traceMm: number;
  routedNetNames: Set<string>;
}

export function routeViaFreerouting(result: PcbResult, nets: Net[], opts: { traceWidthMm?: number } = {}): FreerouteResult {
  const bin = process.env.FREEROUTING_BIN;
  if (!bin) throw new Error("FREEROUTING_BIN not set — freerouting is not wired");

  const dir = mkdtempSync(join(tmpdir(), "keeberia-fr-"));
  const dsnPath = join(dir, "board.dsn");
  const sesPath = join(dir, "board.ses");
  writeFileSync(dsnPath, exportDsn(result, nets, { traceWidthMm: opts.traceWidthMm }));

  const java = process.env.FREEROUTING_JAVA || "java";
  const timeoutMs = Number(process.env.FREEROUTING_TIMEOUT_MS || 120000);
  // -de design in, -do session out. headless: no gui opens with -de present.
  const run = bin.endsWith(".jar")
    ? spawnSync(java, ["-jar", bin, "-de", dsnPath, "-do", sesPath], { timeout: timeoutMs, encoding: "utf8" })
    : spawnSync(bin, ["-de", dsnPath, "-do", sesPath], { timeout: timeoutMs, encoding: "utf8" });

  try {
    if (run.error) throw new Error(`freerouting failed to start: ${run.error.message}`);
    if (run.status !== 0) {
      throw new Error(`freerouting exited ${run.status}: ${(run.stderr || run.stdout || "").slice(0, 600)}`);
    }
    const ses = readFileSync(sesPath, "utf8");
    const parsed = parseSes(ses);
    // single-pad nets (power stubs) have nothing to route — trivially complete
    const expected = new Set(nets.filter((n) => n.pads.length > 1).map((n) => n.name));
    const missing = [...expected].filter((n) => !parsed.routedNetNames.has(n));
    const warnings: RouteWarning[] = [
      ...missing.map((n) => ({ level: "warning" as const, net: n, message: `freerouting left net ${n} unrouted` })),
    ];
    if (!parsed.segments.length) warnings.push({ level: "warning", message: "freerouting returned no wires" });
    const traceMm = Math.round(parsed.segments.reduce(
      (sum, s) => sum + Math.hypot(s.end.x - s.start.x, s.end.y - s.start.y), 0));
    return {
      segments: parsed.segments,
      vias: parsed.vias,
      warnings,
      routedNets: expected.size - missing.length,
      failedNets: missing.length,
      traceMm,
      routedNetNames: parsed.routedNetNames,
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
