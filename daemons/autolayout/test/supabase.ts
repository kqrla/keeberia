// end-to-end supabase queue test: enqueue as the frontend (anon), claim as
// the daemon (service key), verify no double-claim, complete, read back.
// run: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY_2=... SUPABASE_ANON_KEY=... npx tsx test/supabase.ts
// (from daemons/autolayout). exits 0 only if every step passes.
import { supabaseQueue } from "../worker.ts";
import { execSync } from "node:child_process";

const url = process.env.SUPABASE_URL ?? "";
const svc = process.env.SUPABASE_SERVICE_ROLE_KEY_2 ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const anon = process.env.SUPABASE_ANON_KEY ?? "";
if (!url || !svc || !anon) { console.error("needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY_2 + SUPABASE_ANON_KEY"); process.exit(1); }

const headers = (key: string) => ({ apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" });

async function step(name: string, fn: () => Promise<void>) {
  try { await fn(); console.log(`✓ ${name}`); }
  catch (e: any) { console.error(`✗ ${name}: ${String(e?.message ?? e).slice(0, 300)}`); process.exit(1); }
}

async function main() {
  // 0. does the table exist? (PGRST205 = the migration hasn't been applied yet)
  const probe = await fetch(`${url}/rest/v1/design_jobs?select=id&limit=1`, { headers: headers(svc) });
  if (!probe.ok && (await probe.text()).includes("PGRST205")) {
    console.log("table missing — apply backend/supabase/src/migrations/0001_design_jobs.sql in the dashboard sql editor first");
    process.exit(1);
  }

  // 1. enqueue as the frontend (anon key, rls insert policy)
  let jobId: number | null = null;
  await step("enqueue as anon (rls insert)", async () => {
    const res = await fetch(`${url}/rest/v1/design_jobs`, {
      method: "POST", headers: { ...headers(anon), Prefer: "return=representation" },
      body: JSON.stringify({ layout: { name: "supabase-smoke", keys: 3 } }),
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    const rows = await res.json();
    jobId = rows[0]?.id;
    if (!jobId) throw new Error("no id returned");
  });

  // 2. anon must NOT be able to mutate (rls: no update policy)
  await step("anon cannot mutate (rls blocks update)", async () => {
    const res = await fetch(`${url}/rest/v1/design_jobs?id=eq.${jobId}`, {
      method: "PATCH", headers: headers(anon), body: JSON.stringify({ status: "done" }),
    });
    if (res.ok) throw new Error("rls failed — anon updated a row!");
    if (res.status !== 404 && res.status !== 403) throw new Error(`unexpected status ${res.status}`);
  });

  // 3. claim as the daemon
  const queue = supabaseQueue(url, svc);
  let claimed: any = null;
  await step("daemon claims via rpc (atomic)", async () => {
    claimed = await queue.claim();
    if (!claimed || claimed.id !== jobId) throw new Error(`claimed ${claimed?.id} but enqueued ${jobId}`);
    if (claimed.status !== "running" || claimed.attempts !== 1) throw new Error(`bad claim shape: ${JSON.stringify(claimed)}`);
  });

  // 4. empty second claim (no double-claim)
  await step("second claim is empty (no double-claim)", async () => {
    const again = await queue.claim();
    if (again !== null) throw new Error(`double-claimed job ${again.id}!`);
  });

  // 5. complete
  await step("daemon completes via rpc", async () => {
    await queue.complete(claimed.id, { status: "ok", artifacts: { note: "smoke test" } });
  });

  // 6. frontend reads the result (anon select)
  await step("frontend reads result (anon select)", async () => {
    const res = await fetch(`${url}/rest/v1/design_jobs?id=eq.${jobId}&select=status,artifacts`, { headers: headers(anon) });
    if (!res.ok) throw new Error(`${res.status}`);
    const rows = await res.json();
    if (rows[0]?.status !== "done" || rows[0]?.artifacts?.note !== "smoke test") throw new Error(JSON.stringify(rows[0]));
  });

  // 7. cleanup (service role)
  await step("cleanup", async () => {
    const res = await fetch(`${url}/rest/v1/design_jobs?id=eq.${jobId}`, { method: "DELETE", headers: headers(svc) });
    if (!res.ok) throw new Error(`${res.status}`);
  });

  console.log("supabase queue: end-to-end pass — the migration is live and honest");

}
main();
