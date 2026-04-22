const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      index: true,
    },
    type: { type: String, enum: ["follow_up", "interview_prep", "custom"], default: "custom" },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    dueAt: { type: Date, required: true, index: true },
    remindAt: { type: Date },
    channels: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
    },
    status: { type: String, enum: ["open", "done", "dismissed"], default: "open", index: true },
    completedAt: { type: Date },
    dismissedAt: { type: Date },
    emailLastSentAt: { type: Date },
    emailSendCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

TaskSchema.index({ userId: 1, status: 1, dueAt: 1 });
TaskSchema.index({ userId: 1, remindAt: 1 });

const Task = mongoose.model("Task", TaskSchema);

module.exports = { Task };

