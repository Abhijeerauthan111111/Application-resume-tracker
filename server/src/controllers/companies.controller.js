const mongoose = require("mongoose");
const { Company } = require("../models/Company");
const { Application } = require("../models/Application");

async function listCompanies(req, res) {
  const companies = await Company.find({ userId: req.user.userId })
    .sort({ name: 1 })
    .lean();
  res.json({ data: companies });
}

async function createCompany(req, res) {
  const { name, website, hqLocation, notes } = req.validated.body;
  const company = await Company.create({
    userId: req.user.userId,
    name: name.trim(),
    website: website || "",
    hqLocation: hqLocation || "",
    notes: notes || "",
  });
  res.status(201).json({ data: company });
}

async function updateCompany(req, res) {
  const { id } = req.validated.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: { message: "Invalid id" } });

  const updates = req.validated.body;
  const company = await Company.findOneAndUpdate(
    { _id: id, userId: req.user.userId },
    { $set: updates },
    { new: true },
  );
  if (!company) return res.status(404).json({ error: { message: "Company not found" } });
  res.json({ data: company });
}

async function deleteCompany(req, res) {
  const { id } = req.validated.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: { message: "Invalid id" } });

  const appsCount = await Application.countDocuments({ userId: req.user.userId, companyId: id });
  if (appsCount > 0) {
    return res.status(409).json({
      error: {
        message: "Company has applications. Delete or reassign applications first.",
      },
    });
  }

  const deleted = await Company.findOneAndDelete({ _id: id, userId: req.user.userId });
  if (!deleted) return res.status(404).json({ error: { message: "Company not found" } });
  res.json({ data: { ok: true } });
}

module.exports = { listCompanies, createCompany, updateCompany, deleteCompany };
