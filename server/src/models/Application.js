const mongoose = require("mongoose");

const ApplicationStatuses = [
  "Saved",
  "Applied",
  "Interview",
  "Offer",
  "Accepted",
  "Rejected",
  "Withdrawn",
];

const InterviewRoundSchema = new mongoose.Schema(
  {
    roundType: {
      type: String,
      enum: ["HR", "Technical", "Managerial", "Final", "Other"],
      required: true,
    },
    scheduledAt: { type: Date },
    status: { type: String, enum: ["Scheduled", "Completed", "Cleared", "Rejected"], default: "Scheduled" },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

const ApplicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    role: { type: String, required: true },
    status: { type: String, enum: ApplicationStatuses, required: true, index: true },
    appliedDate: { type: Date, required: true, index: true },
    jobLink: { type: String, default: "" },
    location: { type: String, default: "" },
    salaryRange: { type: String, default: "" },
    source: { type: String, default: "" },
    notes: { type: String, default: "" },
    interviewRounds: { type: [InterviewRoundSchema], default: [] },
  },
  { timestamps: true },
);

ApplicationSchema.index({ userId: 1, status: 1 });
ApplicationSchema.index({ userId: 1, appliedDate: -1 });

const Application = mongoose.model("Application", ApplicationSchema);

module.exports = { Application, ApplicationStatuses };

