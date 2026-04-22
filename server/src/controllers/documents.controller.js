const mongoose = require("mongoose");
const { Document } = require("../models/Document");
const { Application } = require("../models/Application");

async function listDocuments(req, res) {
  const { type, q } = req.validated.query;

  const filter = { userId: req.user.userId };
  if (type) filter.type = type;
  if (q) {
    const regex = new RegExp(String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: regex }, { roleFocus: regex }, { tags: regex }, { notes: regex }];
  }

  const docs = await Document.find(filter).sort({ createdAt: -1 }).lean();
  res.json({ data: docs });
}

async function createDocument(req, res) {
  const body = req.validated.body;

  if (body.source === "external" && !body.externalUrl) {
    return res.status(400).json({ error: { message: "externalUrl required for external documents" } });
  }

  const doc = await Document.create({
    userId: req.user.userId,
    type: body.type,
    name: body.name.trim(),
    roleFocus: body.roleFocus || "",
    tags: body.tags || [],
    notes: body.notes || "",
    source: body.source,
    externalUrl: body.source === "external" ? body.externalUrl || "" : "",
    file: body.source === "cloudinary" ? body.file || undefined : undefined,
  });

  res.status(201).json({ data: doc });
}

async function updateDocument(req, res) {
  const { id } = req.validated.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: { message: "Invalid id" } });

  const updates = { ...req.validated.body };
  const doc = await Document.findOneAndUpdate({ _id: id, userId: req.user.userId }, { $set: updates }, { new: true });
  if (!doc) return res.status(404).json({ error: { message: "Document not found" } });
  res.json({ data: doc });
}

async function deleteDocument(req, res) {
  const { id } = req.validated.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: { message: "Invalid id" } });

  const uses = await Application.countDocuments({ userId: req.user.userId, documentIds: id });
  if (uses > 0) {
    return res.status(409).json({ error: { message: "Document is attached to applications. Detach it first." } });
  }

  const deleted = await Document.findOneAndDelete({ _id: id, userId: req.user.userId });
  if (!deleted) return res.status(404).json({ error: { message: "Document not found" } });
  res.json({ data: { ok: true } });
}

module.exports = { listDocuments, createDocument, updateDocument, deleteDocument };
