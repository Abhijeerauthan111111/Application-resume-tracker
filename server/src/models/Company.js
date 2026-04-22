const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    website: { type: String, default: "" },
    hqLocation: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

CompanySchema.index({ userId: 1, name: 1 }, { unique: true });

const Company = mongoose.model("Company", CompanySchema);

module.exports = { Company };

