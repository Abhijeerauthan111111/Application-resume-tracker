const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["resume", "cover_letter", "portfolio"], required: true, index: true },
    name: { type: String, required: true },
    roleFocus: { type: String, default: "" },
    tags: { type: [String], default: [] },
    notes: { type: String, default: "" },
    source: { type: String, enum: ["cloudinary", "external"], required: true },
    file: {
      cloudinaryPublicId: { type: String, default: "" },
      resourceType: { type: String, default: "" },
      format: { type: String, default: "" },
      bytes: { type: Number, default: 0 },
      originalFilename: { type: String, default: "" },
      secureUrl: { type: String, default: "" },
    },
    externalUrl: { type: String, default: "" },
  },
  { timestamps: true },
);

DocumentSchema.index({ userId: 1, type: 1, createdAt: -1 });

const Document = mongoose.model("Document", DocumentSchema);

module.exports = { Document };

