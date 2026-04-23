export default {
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(runScheduled(controller.cron, env));
  },
};

async function runScheduled(cron, env) {
  const baseUrl = (env.API_BASE_URL || "").replace(/\/$/, "");
  if (!baseUrl) throw new Error("Missing API_BASE_URL");
  if (!env.JOBS_SECRET) throw new Error("Missing JOBS_SECRET");

  // If you configure multiple crons, you can branch on `cron`.
  // For a single cron, just run both.
  const jobs = [];

  // Reminder dispatch (safe to run frequently)
  jobs.push(callJob(`${baseUrl}/api/jobs/reminders/dispatch`, env.JOBS_SECRET));

  // Digest runner (it only sends when user's local time matches)
  jobs.push(callJob(`${baseUrl}/api/jobs/digest/run`, env.JOBS_SECRET));

  const results = await Promise.allSettled(jobs);
  const failures = results.filter((r) => r.status === "rejected");
  if (failures.length > 0) {
    throw new Error(`Some jobs failed: ${failures.length}`);
  }
}

async function callJob(url, jobsSecret) {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "x-jobs-secret": jobsSecret,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Job failed ${res.status} ${url} ${body}`);
  }
}

