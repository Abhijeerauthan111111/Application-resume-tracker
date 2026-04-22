const mongoose = require("mongoose");
const { Task } = require("../models/Task");
const { Application } = require("../models/Application");

function asDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function listTasks(req, res) {
  const { status, applicationId } = req.validated.query;

  const filter = { userId: req.user.userId };
  if (status) filter.status = status;
  if (applicationId && mongoose.isValidObjectId(applicationId)) filter.applicationId = applicationId;

  const tasks = await Task.find(filter).sort({ dueAt: 1 }).lean();
  res.json({ data: tasks });
}

async function createTask(req, res) {
  const body = req.validated.body;
  if (!mongoose.isValidObjectId(body.applicationId)) {
    return res.status(400).json({ error: { message: "Invalid applicationId" } });
  }

  const app = await Application.findOne({ _id: body.applicationId, userId: req.user.userId }).lean();
  if (!app) return res.status(400).json({ error: { message: "Application not found" } });

  const dueAt = asDate(body.dueAt);
  if (!dueAt) return res.status(400).json({ error: { message: "Invalid dueAt" } });
  const remindAt = body.remindAt ? asDate(body.remindAt) : null;
  if (body.remindAt && !remindAt) return res.status(400).json({ error: { message: "Invalid remindAt" } });

  const task = await Task.create({
    userId: req.user.userId,
    applicationId: body.applicationId,
    type: body.type || "custom",
    title: body.title.trim(),
    description: body.description || "",
    dueAt,
    remindAt: remindAt || undefined,
    channels: {
      inApp: body.channels?.inApp ?? true,
      email: body.channels?.email ?? true,
    },
  });

  res.status(201).json({ data: task });
}

async function updateTask(req, res) {
  const { id } = req.validated.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: { message: "Invalid id" } });

  const updates = { ...req.validated.body };
  if (updates.dueAt) {
    const d = asDate(updates.dueAt);
    if (!d) return res.status(400).json({ error: { message: "Invalid dueAt" } });
    updates.dueAt = d;
  }
  if (updates.remindAt) {
    const d = asDate(updates.remindAt);
    if (!d) return res.status(400).json({ error: { message: "Invalid remindAt" } });
    updates.remindAt = d;
  }

  const task = await Task.findOneAndUpdate({ _id: id, userId: req.user.userId }, { $set: updates }, { new: true });
  if (!task) return res.status(404).json({ error: { message: "Task not found" } });
  res.json({ data: task });
}

async function completeTask(req, res) {
  const { id } = req.validated.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: { message: "Invalid id" } });

  const task = await Task.findOneAndUpdate(
    { _id: id, userId: req.user.userId },
    { $set: { status: "done", completedAt: new Date() } },
    { new: true },
  );
  if (!task) return res.status(404).json({ error: { message: "Task not found" } });
  res.json({ data: task });
}

async function dismissTask(req, res) {
  const { id } = req.validated.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: { message: "Invalid id" } });

  const task = await Task.findOneAndUpdate(
    { _id: id, userId: req.user.userId },
    { $set: { status: "dismissed", dismissedAt: new Date() } },
    { new: true },
  );
  if (!task) return res.status(404).json({ error: { message: "Task not found" } });
  res.json({ data: task });
}

async function deleteTask(req, res) {
  const { id } = req.validated.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: { message: "Invalid id" } });
  const deleted = await Task.findOneAndDelete({ _id: id, userId: req.user.userId });
  if (!deleted) return res.status(404).json({ error: { message: "Task not found" } });
  res.json({ data: { ok: true } });
}

module.exports = { listTasks, createTask, updateTask, completeTask, dismissTask, deleteTask };

