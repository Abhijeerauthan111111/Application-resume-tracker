const { Task } = require("../models/Task");
const { User } = require("../models/User");
const { sendEmail, isSendgridConfigured } = require("../config/sendgrid");
const { env } = require("../config/env");
const { getTimePartsInZone } = require("../utils/timezone");

function effectiveRemindAt(task) {
  return task.remindAt || task.dueAt;
}

async function dispatchTaskReminders() {
  if (!isSendgridConfigured()) return { ok: true, skipped: true };

  const now = new Date();

  const tasks = await Task.find({
    status: "open",
    "channels.email": true,
    $or: [
      { remindAt: { $lte: now } },
      { remindAt: { $exists: false }, dueAt: { $lte: now } },
      { remindAt: null, dueAt: { $lte: now } },
    ],
  })
    .sort({ dueAt: 1 })
    .limit(200)
    .lean();

  if (tasks.length === 0) return { ok: true, sent: 0 };

  const userIds = [...new Set(tasks.map((t) => String(t.userId)))];
  const users = await User.find({ _id: { $in: userIds } }).select("email settings").lean();
  const usersById = new Map(users.map((u) => [String(u._id), u]));

  let sent = 0;

  for (const task of tasks) {
    const user = usersById.get(String(task.userId));
    if (!user?.email) continue;
    if (user?.settings?.emailRemindersEnabled === false) continue;

    const remindAt = effectiveRemindAt(task);
    if (!remindAt) continue;

    // Anti-spam: only send once per remindAt value.
    if (task.emailLastRemindAt && new Date(task.emailLastRemindAt).getTime() === new Date(remindAt).getTime()) {
      continue;
    }

    const subject = `Reminder: ${task.title}`;
    const text = [
      `Reminder: ${task.title}`,
      "",
      `Due: ${new Date(task.dueAt).toLocaleString()}`,
      "",
      `Open your tracker: ${env.APP_BASE_URL}`,
    ].join("\n");

    try {
      await sendEmail({ to: user.email, subject, text });
      await Task.updateOne(
        { _id: task._id },
        {
          $set: { emailLastSentAt: now, emailLastRemindAt: remindAt },
          $inc: { emailSendCount: 1 },
        },
      );
      sent += 1;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[jobs] send reminder failed:", e?.message || e);
    }
  }

  return { ok: true, sent };
}

async function sendDailyDigests() {
  if (!isSendgridConfigured()) return { ok: true, skipped: true };

  const now = new Date();
  const users = await User.find({ "settings.dailyDigestEnabled": true }).select("email settings").lean();

  let sent = 0;

  for (const user of users) {
    if (!user.email) continue;
    const timezone = user.settings?.timezone;
    const digestTime = user.settings?.dailyDigestTime || "09:00";
    if (!timezone) continue;

    const partsNow = getTimePartsInZone(now, timezone);
    // Tolerance window: send if we are within the job interval after the target time.
    const [dh, dm] = digestTime.split(":").map((x) => Number(x));
    const [nh, nm] = partsNow.hhmm.split(":").map((x) => Number(x));
    if (!Number.isFinite(dh) || !Number.isFinite(dm) || !Number.isFinite(nh) || !Number.isFinite(nm)) continue;
    const digestMin = dh * 60 + dm;
    const nowMin = nh * 60 + nm;
    const intervalMin = Math.max(1, Math.round(env.DIGEST_JOB_INTERVAL_MS / 60000));
    if (!(nowMin >= digestMin && nowMin - digestMin < intervalMin)) continue;

    // Ensure only once per local day.
    const lastSentAt = user.settings?.dailyDigestLastSentAt ? new Date(user.settings.dailyDigestLastSentAt) : null;
    if (lastSentAt) {
      const partsLast = getTimePartsInZone(lastSentAt, timezone);
      if (partsLast.ymd === partsNow.ymd) continue;
    }

    const lookaheadMs = env.DIGEST_LOOKAHEAD_HOURS * 60 * 60 * 1000;
    const soon = new Date(now.getTime() + lookaheadMs);

    const overdue = await Task.find({ userId: user._id, status: "open", dueAt: { $lt: now } })
      .sort({ dueAt: 1 })
      .limit(50)
      .lean();
    const upcoming = await Task.find({ userId: user._id, status: "open", dueAt: { $gte: now, $lte: soon } })
      .sort({ dueAt: 1 })
      .limit(50)
      .lean();

    const subject = "Daily digest: upcoming reminders";
    const lines = [];
    lines.push("Daily digest");
    lines.push("");

    if (overdue.length === 0 && upcoming.length === 0) {
      lines.push("No tasks due soon. Keep going!");
    } else {
      if (overdue.length > 0) {
        lines.push("Overdue:");
        for (const t of overdue) lines.push(`- ${t.title} (due ${new Date(t.dueAt).toLocaleString()})`);
        lines.push("");
      }
      if (upcoming.length > 0) {
        lines.push(`Due in next ${env.DIGEST_LOOKAHEAD_HOURS} hours:`);
        for (const t of upcoming) lines.push(`- ${t.title} (due ${new Date(t.dueAt).toLocaleString()})`);
        lines.push("");
      }
    }

    lines.push(`Open your tracker: ${env.APP_BASE_URL}`);

    try {
      await sendEmail({ to: user.email, subject, text: lines.join("\n") });
      await User.updateOne(
        { _id: user._id },
        { $set: { "settings.dailyDigestLastSentAt": now } },
      );
      sent += 1;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[jobs] send digest failed:", e?.message || e);
    }
  }

  return { ok: true, sent };
}

module.exports = { dispatchTaskReminders, sendDailyDigests };
