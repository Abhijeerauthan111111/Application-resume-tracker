const mongoose = require("mongoose");
const { Application, ApplicationStatuses } = require("../models/Application");
const { Company } = require("../models/Company");
const { Task } = require("../models/Task");
const { Document } = require("../models/Document");
const { User } = require("../models/User");
const { upsertFollowUpTask, upsertInterviewPrepTask, deleteInterviewPrepTask } = require("../services/automation");

function asDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function ensureDocumentsOwned({ userId, documentIds }) {
  if (!Array.isArray(documentIds)) return [];
  const ids = [];
  for (const id of documentIds) {
    if (!mongoose.isValidObjectId(id)) {
      const err = new Error("Invalid documentId");
      err.status = 400;
      throw err;
    }
    ids.push(id);
  }
  const uniqueIds = [...new Set(ids.map(String))];
  if (uniqueIds.length === 0) return [];
  const count = await Document.countDocuments({ userId, _id: { $in: uniqueIds } });
  if (count !== uniqueIds.length) {
    const err = new Error("One or more documents not found");
    err.status = 400;
    throw err;
  }
  return uniqueIds;
}

async function listApplications(req, res) {
  const { status, companyId, q, appliedFrom, appliedTo, sort } = req.validated.query;

  const filter = { userId: req.user.userId };
  if (status) filter.status = status;
  if (companyId && mongoose.isValidObjectId(companyId)) filter.companyId = companyId;
  if (appliedFrom || appliedTo) {
    const range = {};
    if (appliedFrom) {
      const d = asDate(appliedFrom);
      if (d) range.$gte = d;
    }
    if (appliedTo) {
      const d = asDate(appliedTo);
      if (d) {
        // inclusive end-of-day
        d.setHours(23, 59, 59, 999);
        range.$lte = d;
      }
    }
    filter.appliedDate = range;
  }

  if (q) {
    const regex = new RegExp(String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ role: regex }, { notes: regex }];
  }

  const sortMap = {
    appliedDate_desc: { appliedDate: -1, updatedAt: -1 },
    appliedDate_asc: { appliedDate: 1, updatedAt: -1 },
    updatedAt_desc: { updatedAt: -1 },
    updatedAt_asc: { updatedAt: 1 },
  };

  const apps = await Application.find(filter)
    .sort(sort ? sortMap[sort] : { appliedDate: -1, updatedAt: -1 })
    .populate("companyId", "name website")
    .lean();

  res.json({ data: apps });
}

async function createApplication(req, res) {
  const body = req.validated.body;

  let companyId = body.companyId;
  if (!companyId && body.companyName) {
    const name = body.companyName.trim();
    const existing = await Company.findOne({ userId: req.user.userId, name });
    const company = existing
      ? existing
      : await Company.create({ userId: req.user.userId, name, website: "", hqLocation: "", notes: "" });
    companyId = company._id;
  }

  if (!companyId || !mongoose.isValidObjectId(companyId)) {
    return res.status(400).json({ error: { message: "companyId or companyName required" } });
  }

  const appliedDate = asDate(body.appliedDate);
  if (!appliedDate) return res.status(400).json({ error: { message: "Invalid appliedDate" } });

  if (!ApplicationStatuses.includes(body.status)) {
    return res.status(400).json({ error: { message: "Invalid status" } });
  }

  // Ensure company belongs to the user
  const company = await Company.findOne({ _id: companyId, userId: req.user.userId }).lean();
  if (!company) return res.status(400).json({ error: { message: "Company not found" } });

  const app = await Application.create({
    userId: req.user.userId,
    companyId,
    role: body.role.trim(),
    status: body.status,
    appliedDate,
    jobLink: body.jobLink || "",
    location: body.location || "",
    salaryRange: body.salaryRange || "",
    source: body.source || "",
    notes: body.notes || "",
    documentIds: body.documentIds ? await ensureDocumentsOwned({ userId: req.user.userId, documentIds: body.documentIds }) : [],
  });

  const populated = await Application.findById(app._id).populate("companyId", "name website").lean();

  if (body.status === "Applied") {
    const user = await User.findById(req.user.userId).lean();
    const followUpDays = user?.settings?.followUpDefaultDays ?? 4;
    const title = `Follow up: ${populated.role} @ ${populated.companyId?.name || "Company"}`;
    await upsertFollowUpTask({
      userId: req.user.userId,
      applicationId: app._id,
      title,
      appliedDate,
      followUpDays,
    });
  }

  res.status(201).json({ data: populated });
}

async function getApplication(req, res) {
  const { id } = req.validated.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: { message: "Invalid id" } });

  const app = await Application.findOne({ _id: id, userId: req.user.userId })
    .populate("companyId", "name website")
    .lean();
  if (!app) return res.status(404).json({ error: { message: "Application not found" } });
  res.json({ data: app });
}

async function updateApplication(req, res) {
  const { id } = req.validated.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: { message: "Invalid id" } });

  const updates = { ...req.validated.body };

  if (updates.appliedDate) {
    const d = asDate(updates.appliedDate);
    if (!d) return res.status(400).json({ error: { message: "Invalid appliedDate" } });
    updates.appliedDate = d;
  }

  if (updates.status && !ApplicationStatuses.includes(updates.status)) {
    return res.status(400).json({ error: { message: "Invalid status" } });
  }

  if (updates.companyId) {
    if (!mongoose.isValidObjectId(updates.companyId)) {
      return res.status(400).json({ error: { message: "Invalid companyId" } });
    }
    const company = await Company.findOne({ _id: updates.companyId, userId: req.user.userId }).lean();
    if (!company) return res.status(400).json({ error: { message: "Company not found" } });
  }

  if (updates.documentIds) {
    updates.documentIds = await ensureDocumentsOwned({ userId: req.user.userId, documentIds: updates.documentIds });
  }

  const app = await Application.findOneAndUpdate(
    { _id: id, userId: req.user.userId },
    { $set: updates },
    { new: true },
  )
    .populate("companyId", "name website")
    .lean();

  if (!app) return res.status(404).json({ error: { message: "Application not found" } });

  // Automation: ensure follow-up exists when status is Applied.
  if (app.status === "Applied") {
    const user = await User.findById(req.user.userId).lean();
    const followUpDays = user?.settings?.followUpDefaultDays ?? 4;
    const title = `Follow up: ${app.role} @ ${app.companyId?.name || "Company"}`;
    await upsertFollowUpTask({
      userId: req.user.userId,
      applicationId: app._id,
      title,
      appliedDate: new Date(app.appliedDate),
      followUpDays,
    });
  }

  res.json({ data: app });
}

async function setStatus(req, res) {
  const { id } = req.validated.params;
  const { status } = req.validated.body;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: { message: "Invalid id" } });
  if (!ApplicationStatuses.includes(status)) return res.status(400).json({ error: { message: "Invalid status" } });

  const app = await Application.findOneAndUpdate(
    { _id: id, userId: req.user.userId },
    { $set: { status } },
    { new: true },
  )
    .populate("companyId", "name website")
    .lean();

  if (!app) return res.status(404).json({ error: { message: "Application not found" } });

  if (status === "Applied") {
    const user = await User.findById(req.user.userId).lean();
    const followUpDays = user?.settings?.followUpDefaultDays ?? 4;
    const title = `Follow up: ${app.role} @ ${app.companyId?.name || "Company"}`;
    await upsertFollowUpTask({
      userId: req.user.userId,
      applicationId: app._id,
      title,
      appliedDate: new Date(app.appliedDate),
      followUpDays,
    });
  }

  res.json({ data: app });
}

async function deleteApplication(req, res) {
  const { id } = req.validated.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: { message: "Invalid id" } });

  const deleted = await Application.findOneAndDelete({ _id: id, userId: req.user.userId });
  if (!deleted) return res.status(404).json({ error: { message: "Application not found" } });

  await Task.deleteMany({ userId: req.user.userId, applicationId: id });

  res.json({ data: { ok: true } });
}

async function addRound(req, res) {
  const { id } = req.validated.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: { message: "Invalid id" } });

  const { roundType, scheduledAt, status, notes } = req.validated.body;
  const scheduled = scheduledAt ? asDate(scheduledAt) : null;
  if (scheduledAt && !scheduled) return res.status(400).json({ error: { message: "Invalid scheduledAt" } });

  const app = await Application.findOneAndUpdate(
    { _id: id, userId: req.user.userId },
    {
      $push: {
        interviewRounds: {
          roundType,
          scheduledAt: scheduled || undefined,
          status: status || "Scheduled",
          notes: notes || "",
        },
      },
    },
    { new: true },
  )
    .populate("companyId", "name website")
    .lean();

  if (!app) return res.status(404).json({ error: { message: "Application not found" } });

  // Automation: create interview prep task (if scheduledAt provided).
  const createdRound = app.interviewRounds?.[app.interviewRounds.length - 1];
  if (createdRound?.scheduledAt) {
    const title = `Interview prep: ${createdRound.roundType} - ${app.role} @ ${app.companyId?.name || "Company"}`;
    await upsertInterviewPrepTask({
      userId: req.user.userId,
      applicationId: app._id,
      roundId: createdRound._id,
      title,
      scheduledAt: new Date(createdRound.scheduledAt),
    });
  }

  res.json({ data: app });
}

async function updateRound(req, res) {
  const { id, roundId } = req.validated.params;
  if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(roundId)) {
    return res.status(400).json({ error: { message: "Invalid id" } });
  }

  const updates = { ...req.validated.body };
  if (updates.scheduledAt) {
    const d = asDate(updates.scheduledAt);
    if (!d) return res.status(400).json({ error: { message: "Invalid scheduledAt" } });
    updates.scheduledAt = d;
  }

  const set = {};
  for (const [k, v] of Object.entries(updates)) set[`interviewRounds.$.${k}`] = v;

  const app = await Application.findOneAndUpdate(
    { _id: id, userId: req.user.userId, "interviewRounds._id": roundId },
    { $set: set },
    { new: true },
  )
    .populate("companyId", "name website")
    .lean();

  if (!app) return res.status(404).json({ error: { message: "Round not found" } });

  const round = (app.interviewRounds || []).find((r) => String(r._id) === String(roundId));
  if (round) {
    if (round.scheduledAt) {
      const title = `Interview prep: ${round.roundType} - ${app.role} @ ${app.companyId?.name || "Company"}`;
      await upsertInterviewPrepTask({
        userId: req.user.userId,
        applicationId: app._id,
        roundId: round._id,
        title,
        scheduledAt: new Date(round.scheduledAt),
      });
    } else {
      await deleteInterviewPrepTask({ userId: req.user.userId, applicationId: app._id, roundId });
    }
  }

  res.json({ data: app });
}

async function deleteRound(req, res) {
  const { id, roundId } = req.validated.params;
  if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(roundId)) {
    return res.status(400).json({ error: { message: "Invalid id" } });
  }

  const app = await Application.findOneAndUpdate(
    { _id: id, userId: req.user.userId },
    { $pull: { interviewRounds: { _id: roundId } } },
    { new: true },
  )
    .populate("companyId", "name website")
    .lean();

  if (!app) return res.status(404).json({ error: { message: "Application not found" } });

  await deleteInterviewPrepTask({ userId: req.user.userId, applicationId: id, roundId });

  res.json({ data: app });
}

module.exports = {
  listApplications,
  createApplication,
  getApplication,
  updateApplication,
  setStatus,
  deleteApplication,
  addRound,
  updateRound,
  deleteRound,
};
