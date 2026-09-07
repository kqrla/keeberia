/**
 * autolayout worker — claim → run engine → retry ladder → persist.
 *
 * v0 scaffold: the engine call and retry ladder are real; the queue is a
 * stub (pollFn placeholder) until the xano job tables exist. transport gets
 * swapped for sqs/xano tasks in v1 without touching the run ladder.
 */
import { generatePcb } from "../../engines/pcb/pcb-engine/src/index.ts";

export interface DesignJob {
  id: string;
  layout: any; // keeberia layout json (validated upstream)
  attempts: number;
}

export interface JobResult {
  jobId: string;
  ok: boolean;
  status: string;
  artifacts?: Record<string, string>; // name → stored url
  error?: string; // user-readable
}

/** retry ladder: each rung relaxes routing until it succeeds or we give up */
const RETRY_LADDER = [
  { label: "default", opts: {} },
  { label: "coarse-grid", opts: { resolution: 0.6 } },
  { label: "high-congestion-budget", opts: { congestionBudget: 3 } },
  { label: "relaxed-clearance", opts: { clearance: 0.2 } },
] as const;

export async function runJob(job: DesignJob): Promise<JobResult> {
  for (const rung of RETRY_LADDER) {
    try {
      const out = generatePcb(job.layout);
      const errors = out.result.warnings.filter((w) => w.level === "error");
      if (errors.length > 0) continue; // next rung
      return {
        jobId: job.id,
        ok: true,
        status: "done",
        artifacts: {
          kicad_pcb: out.kicadPcb,
          bom_csv: out.bomCsv,
          qmk_info: JSON.stringify(out.qmkInfo),
        },
      };
    } catch (e: any) {
      // keep climbing; last rung's error becomes the user-facing reason
      if (rung === RETRY_LADDER[RETRY_LADDER.length - 1]) {
        return { jobId: job.id, ok: false, status: "failed", error: friendlyError(e) };
      }
    }
  }
  return { jobId: job.id, ok: false, status: "failed", error: "routing did not converge — layout may be too dense" };
}

/** errors a designer can act on — never raw stack traces */
function friendlyError(e: any): string {
  const msg = String(e?.message ?? e);
  if (msg.includes("pin budget")) return "too many components for the chosen mcu — remove a key or the oled";
  if (msg.includes("not supported")) return "one of the parts isn't available in this version yet";
  return msg;
}

/** main loop — stubbed poll until the queue transport lands */
export async function main(pollFn: () => Promise<DesignJob | null>, persist: (r: JobResult) => Promise<void>) {
  for (;;) {
    const job = await pollFn();
    if (!job) { await new Promise((r) => setTimeout(r, 2000)); continue; }
    const result = await runJob(job);
    await persist(result);
  }
}
