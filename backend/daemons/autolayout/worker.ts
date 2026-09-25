/**
 * autolayout worker — claim → run engine (retry ladder) → persist.
 *
 * portable by design: the queue is a pluggable transport behind the `Queue`
 * interface. xano-rest is the v1 transport; when we outgrow xano (or want
 * zero-xano), a plain http/sqs transport drops in without touching the run
 * ladder. hosting: render.com (see render.yaml); denser boards move to
 * amd cloud hardware later without changing a line of the ladder.
 */
import { generatePcb } from "../../engines/circuitron/src/index.ts";
import { generateCase } from "../../engines/paracraft/src/index.ts";
import { exportGerbers } from "../../engines/circuitron/src/gerber.ts";
import { buildQmkBundle } from "../../engines/circuitron/src/firmware.ts";
import { placeComponents } from "../../engines/circuitron/src/layout.ts";
import { renderSvg } from "../../engines/circuitron/src/preview.ts";

export interface DesignJob {
  id: number;
  layout: any; // keeberia layout json (validated upstream)
  attempts: number;
}

export interface JobResult {
  jobId: number;
  ok: boolean;
  status: string; // "done" | "error"
  artifacts?: Record<string, string>; // name → content (kicad, bom, svg, ...)
  error?: string; // user-readable
}

/** retry ladder: each rung relaxes routing until it succeeds or we give up */
/**
 * retry ladder: the engine's own a* first (fast, in-process), then
 * freerouting's push-and-shove as the big gun for dense boards —
 * deterministic either way, just a different (heavier) algorithm.
 * freerouting rung is skipped when the binary isn't wired into the host.
 */
const RETRY_LADDER = [
  { label: "engine-a*", router: "engine" as const },
  { label: "freerouting", router: "freerouting" as const },
];

export async function runJob(job: DesignJob): Promise<JobResult> {
  for (const rung of RETRY_LADDER) {
    try {
      if (rung.router === "freerouting" && !process.env.FREEROUTING_BIN) continue;
      const out = generatePcb(job.layout, rung.router);
      const errors = out.result.warnings.filter((w) => w.level === "error");
      if (errors.length > 0) continue; // next rung
      // the case compiles from the same board: one model, more artifacts
      const caseOut = generateCase(out.result);
      const caseErrors = caseOut.warnings.filter((w) => w.level === "error");
      if (caseErrors.length > 0) {
        // deterministic design flaw (e.g. no mounting holes) — retry rungs
        // can't fix it, so the job fails with words a designer can act on
        return { jobId: job.id, ok: false, status: "error", error: caseErrors[0].message };
      }
      // gerbers: the jlc-orderable output, one artifact per fab file
      const gerbs = exportGerbers(out.result);
      const gerberErrors = gerbs.warnings.filter((w) => w.level === "error");
      if (gerberErrors.length > 0) {
        return { jobId: job.id, ok: false, status: "error", error: gerberErrors[0].message };
      }
      const ctx = placeComponents(job.layout);
      const svg = renderSvg(ctx, out.result, 720);
      // firmware: qmk + vial bundle (anne's call — performance + live remap first)
      const fw = buildQmkBundle(ctx, out.netlist, out.qmkInfo as Record<string, unknown>);
      const artifacts: Record<string, string> = {
        kicad_pcb: out.kicadPcb,
        case_scad: caseOut.scad,
        case_params: JSON.stringify(caseOut.params),
        bom_csv: out.bomCsv,
        qmk_info: JSON.stringify(out.qmkInfo),
        preview_svg: svg,
        stats: JSON.stringify({ ...out.result.stats, standoffs: caseOut.stats.standoffs, plateOpenings: caseOut.stats.plateOpenings }),
      };
      for (const [fname, content] of Object.entries(gerbs.files)) {
        artifacts[`gerber_${fname.replace(/[^A-Za-z0-9._-]/g, "_")}`] = content;
      }
      for (const [fname, content] of Object.entries(fw.files)) {
        artifacts[`firmware_${fname.replace(/[^A-Za-z0-9._-]/g, "_")}`] = content;
      }
      return {
        jobId: job.id,
        ok: true,
        status: "done",
        artifacts,
      };
    } catch (e: any) {
      // keep climbing; last rung's error becomes the user-facing reason
      if (rung === RETRY_LADDER[RETRY_LADDER.length - 1]) {
        return { jobId: job.id, ok: false, status: "error", error: friendlyError(e) };
      }
    }
  }
  return { jobId: job.id, ok: false, status: "error", error: "routing did not converge — layout may be too dense" };
}

/** errors a designer can act on — never raw stack traces */
function friendlyError(e: any): string {
  const msg = String(e?.message ?? e);
  if (msg.includes("pin budget")) return "too many components for the chosen mcu — remove a key or the oled";
  if (msg.includes("not supported")) return "one of the parts isn't available in this version yet";
  return msg;
}

/** the only contract the run ladder knows about: claim a job, report a result */
export interface Queue {
  claim(): Promise<DesignJob | null>;
  complete(jobId: number, result: JobResult): Promise<void>;
}

/** v1 transport: xano rest queue (POST /claim, POST /complete) */
export function xanoQueue(base: string): Queue {
  return {
    async claim() {
      const res = await fetch(`${base}/claim`, { method: "POST" });
      if (!res.ok) throw new Error(`claim failed: ${res.status} ${await res.text()}`);
      const body = await res.text();
      if (!body || body === "null") return null; // queue empty (xano quirk: null body)
      return JSON.parse(body) as DesignJob;
    },
    async complete(jobId: number, result: JobResult) {
      const res = await fetch(`${base}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: jobId,
          status: result.status,
          artifacts: result.artifacts ?? {},
          error: result.error ?? null,
        }),
      });
      if (!res.ok) throw new Error(`complete failed: ${res.status} ${await res.text()}`);
    },
  };
}

/**
 * v2 transport: supabase. postgres + three rpcs (claim_job / complete_job /
 * requeue_stale — see backend/supabase/migrations/0001_design_jobs.sql).
 * the queue is a table; the claim is atomic (for update skip locked), so
 * two daemons can poll the same project and never claim the same job twice.
 */
export function supabaseQueue(url: string, serviceKey: string): Queue {
  const rpc = async (fn: string, body: object) => {
    const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${fn} failed: ${res.status} ${await res.text()}`);
    return res.json();
  };
  return {
    async claim() {
      const rows = await rpc("claim_job", {});
      return (rows && rows[0]) ?? null; // empty array = queue empty (honest shape, no xano null quirk)
    },
    async complete(jobId: number, result: JobResult) {
      await rpc("complete_job", {
        p_id: jobId,
        p_artifacts: result.artifacts ?? (result.status === "ok" ? {} : null),
        p_error: result.error ?? null,
      });
    },
  };
}

/**
 * run the daemon. env:
 *   KEEBERIA_XANO_BASE — queue base url (defaults to the live keeberia instance)
 *   KEEBERIA_ONCE=1    — process one job then exit (cron-style); otherwise poll forever
 */
export async function main() {
  const once = process.env.KEEBERIA_ONCE === "1" || process.argv.includes("--once");
  const transport = process.env.KEEBERIA_QUEUE ?? "supabase"; // xano retired sept 25; kept via KEEBERIA_QUEUE=xano
  let queue: Queue;
  let where: string;
  if (transport === "xano") {
    const base = process.env.KEEBERIA_XANO_BASE ?? "";
    if (!base) throw new Error("KEEBERIA_QUEUE=xano needs KEEBERIA_XANO_BASE");
    queue = xanoQueue(base);
    where = base;
  } else {
    const url = process.env.SUPABASE_URL ?? "";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY_2 ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    if (!url || !key) throw new Error("supabase transport needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY_2");
    queue = supabaseQueue(url, key);
    where = `${url} (supabase)`;
  }
  console.log(`autolayout daemon up — queue: ${where}${once ? " (single pass)" : " (polling)"}`);
  for (;;) {
    const job = await queue.claim();
    if (!job) {
      if (once) { console.log("queue empty — exiting"); return; }
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }
    console.log(`job ${job.id}: claimed (attempt ${job.attempts}, "${job.layout?.name ?? "unnamed"}")`);
    const result = await runJob(job);
    await queue.complete(job.id, result);
    console.log(`job ${job.id}: ${result.status}${result.error ? ` — ${result.error}` : ""}`);
    if (once) return;
  }
}

// only run when invoked directly — tests import the transport without waking the daemon
if (process.argv[1]?.endsWith("worker.ts")) main();
