const { Task } = require("../models/Task");

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function subtractDays(date, days) {
  return new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
}

async function upsertFollowUpTask({ userId, applicationId, title, appliedDate, followUpDays }) {
  if (!appliedDate) return;

  const dueAt = addDays(appliedDate, followUpDays);
  const automationKey = `follow_up:${String(applicationId)}`;

  await Task.findOneAndUpdate(
    { userId, automationKey },
    {
      $setOnInsert: {
        userId,
        applicationId,
        type: "follow_up",
        description: "",
        channels: { inApp: true, email: true },
        status: "open",
        automationKey,
      },
      $set: {
        title,
        dueAt,
        remindAt: dueAt,
      },
    },
    { upsert: true, new: true },
  );
}

async function upsertInterviewPrepTask({ userId, applicationId, roundId, title, scheduledAt }) {
  if (!scheduledAt) return;
  const dueAt = subtractDays(scheduledAt, 1);
  const automationKey = `interview_round:${String(applicationId)}:${String(roundId)}`;

  await Task.findOneAndUpdate(
    { userId, automationKey },
    {
      $setOnInsert: {
        userId,
        applicationId,
        type: "interview_prep",
        description: "",
        channels: { inApp: true, email: true },
        status: "open",
        automationKey,
      },
      $set: {
        title,
        dueAt,
        remindAt: dueAt,
      },
    },
    { upsert: true, new: true },
  );
}

async function deleteInterviewPrepTask({ userId, applicationId, roundId }) {
  const automationKey = `interview_round:${String(applicationId)}:${String(roundId)}`;
  await Task.deleteOne({ userId, automationKey });
}

module.exports = { upsertFollowUpTask, upsertInterviewPrepTask, deleteInterviewPrepTask };
