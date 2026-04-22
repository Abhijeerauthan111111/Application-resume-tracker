const mongoose = require("mongoose");
const { Share } = require("../models/Share");
const { Application } = require("../models/Application");
const { Document } = require("../models/Document");
const { env } = require("../config/env");
const { generateToken, hashShareToken } = require("../utils/token");

function computeExpiresAt(expiresInDays) {
  if (expiresInDays === null || expiresInDays === undefined) return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  if (expiresInDays === 0) return null; // no expiry
  return new Date(Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000);
}

async function createShare(req, res) {
  const body = req.validated.body;
  if (!mongoose.isValidObjectId(body.applicationId)) {
    return res.status(400).json({ error: { message: "Invalid applicationId" } });
  }

  const app = await Application.findOne({ _id: body.applicationId, userId: req.user.userId }).lean();
  if (!app) return res.status(404).json({ error: { message: "Application not found" } });

  const token = generateToken(32);
  const tokenHash = hashShareToken(token, env.SHARE_TOKEN_PEPPER);
  const expiresAt = computeExpiresAt(body.expiresInDays);

  const share = await Share.create({
    userId: req.user.userId,
    applicationId: body.applicationId,
    tokenHash,
    expiresAt: expiresAt || undefined,
    includeDocuments: body.includeDocuments ?? false,
  });

  const shareUrl = `${env.APP_BASE_URL.replace(/\/$/, "")}/share/${token}`;

  res.status(201).json({
    data: {
      id: String(share._id),
      shareUrl,
      expiresAt: share.expiresAt || null,
      includeDocuments: share.includeDocuments,
    },
  });
}

async function listShares(req, res) {
  const now = new Date();
  const shares = await Share.find({
    userId: req.user.userId,
    revokedAt: { $exists: false },
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }],
  })
    .sort({ createdAt: -1 })
    .lean();

  const appIds = shares.map((s) => s.applicationId);
  const apps = await Application.find({ _id: { $in: appIds }, userId: req.user.userId })
    .populate("companyId", "name")
    .select("role status companyId")
    .lean();
  const byId = new Map(apps.map((a) => [String(a._id), a]));

  const data = shares.map((s) => {
    const app = byId.get(String(s.applicationId));
    return {
      id: String(s._id),
      applicationId: String(s.applicationId),
      includeDocuments: Boolean(s.includeDocuments),
      expiresAt: s.expiresAt || null,
      createdAt: s.createdAt,
      application: app
        ? {
            role: app.role,
            status: app.status,
            companyName: app.companyId?.name || "",
          }
        : null,
    };
  });

  res.json({ data });
}

async function revokeShare(req, res) {
  const { id } = req.validated.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: { message: "Invalid id" } });

  const share = await Share.findOneAndUpdate(
    { _id: id, userId: req.user.userId, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } },
    { new: true },
  );
  if (!share) return res.status(404).json({ error: { message: "Share not found" } });
  res.json({ data: { ok: true } });
}

async function getSharePublic(req, res) {
  const { token } = req.validated.params;
  if (!token || typeof token !== "string" || token.length < 32) {
    return res.status(404).json({ error: { message: "Not found" } });
  }

  let tokenHash;
  try {
    tokenHash = hashShareToken(token, env.SHARE_TOKEN_PEPPER);
  } catch (e) {
    return res.status(500).json({ error: { message: "Sharing not configured" } });
  }

  const share = await Share.findOne({ tokenHash }).lean();
  if (!share) return res.status(404).json({ error: { message: "Not found" } });
  if (share.revokedAt) return res.status(404).json({ error: { message: "Not found" } });
  if (share.expiresAt && new Date(share.expiresAt).getTime() < Date.now()) {
    return res.status(404).json({ error: { message: "Not found" } });
  }

  const app = await Application.findById(share.applicationId).populate("companyId", "name website").lean();
  if (!app) return res.status(404).json({ error: { message: "Not found" } });

  let documents = [];
  if (share.includeDocuments && Array.isArray(app.documentIds) && app.documentIds.length > 0) {
    documents = await Document.find({ _id: { $in: app.documentIds }, userId: share.userId })
      .select("type name roleFocus tags notes source externalUrl file.secureUrl file.format file.bytes createdAt")
      .lean();
  }

  res.json({
    data: {
      application: {
        id: String(app._id),
        role: app.role,
        status: app.status,
        appliedDate: app.appliedDate,
        jobLink: app.jobLink,
        location: app.location,
        salaryRange: app.salaryRange,
        source: app.source,
        notes: app.notes,
        interviewRounds: app.interviewRounds || [],
        company: app.companyId ? { name: app.companyId.name, website: app.companyId.website } : null,
      },
      documents,
      expiresAt: share.expiresAt || null,
    },
  });
}

module.exports = { createShare, listShares, revokeShare, getSharePublic };
