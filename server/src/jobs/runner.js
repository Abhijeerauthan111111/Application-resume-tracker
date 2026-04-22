const { env } = require("../config/env");
const { dispatchTaskReminders, sendDailyDigests } = require("./reminders");

function startJobs() {
  if (!env.ENABLE_JOBS) return;

  let runningReminders = false;
  let runningDigests = false;

  setInterval(async () => {
    if (runningReminders) return;
    runningReminders = true;
    try {
      await dispatchTaskReminders();
    } finally {
      runningReminders = false;
    }
  }, env.REMINDER_JOB_INTERVAL_MS);

  setInterval(async () => {
    if (runningDigests) return;
    runningDigests = true;
    try {
      await sendDailyDigests();
    } finally {
      runningDigests = false;
    }
  }, env.DIGEST_JOB_INTERVAL_MS);

  // eslint-disable-next-line no-console
  console.log("[jobs] enabled");
}

module.exports = { startJobs };

