const { env } = require("../config/env");

function requireCronOrJobsSecret(req, res, next) {
  const auth = String(req.headers.authorization || "");
  const providedJobsSecret = String(req.headers["x-jobs-secret"] || "");

  const cronOk = env.CRON_SECRET && auth === `Bearer ${env.CRON_SECRET}`;
  const jobsOk = env.JOBS_SECRET && providedJobsSecret === env.JOBS_SECRET;

  if (cronOk || jobsOk) return next();
  return res.status(401).json({ error: { message: "Unauthorized" } });
}

module.exports = { requireCronOrJobsSecret };

