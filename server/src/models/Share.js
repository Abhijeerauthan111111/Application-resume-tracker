const mongoose = require("mongoose");

const ShareSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      index: true,
    },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date },
    revokedAt: { type: Date },
    includeDocuments: { type: Boolean, default: false },
  },
  { timestamps: true },
);

ShareSchema.index({ applicationId: 1, revokedAt: 1, expiresAt: 1 });

const Share = mongoose.model("Share", ShareSchema);

module.exports = { Share };

