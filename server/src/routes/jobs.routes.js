const express = require("express");

const { requireCronOrJobsSecret } = require("../middleware/requireCronSecret");
const { dispatchTaskReminders, sendDailyDigests } = require("../jobs/reminders");

const router = express.Router();
router.use(requireCronOrJobsSecret);

async function remindersHandler(_req, res) {
  const result = await dispatchTaskReminders();
  res.json({ data: result });
}

async function digestHandler(_req, res) {
  const result = await sendDailyDigests();
  res.json({ data: result });
}

// Vercel cron invokes with GET.
router.get("/reminders/dispatch", remindersHandler);
router.post("/reminders/dispatch", remindersHandler);

router.get("/digest/run", digestHandler);
router.post("/digest/run", digestHandler);

module.exports = router;

