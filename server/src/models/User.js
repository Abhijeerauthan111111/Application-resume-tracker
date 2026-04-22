const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: "" },
    photoURL: { type: String, default: "" },
    settings: {
      timezone: { type: String, default: "" },
      emailRemindersEnabled: { type: Boolean, default: true },
      dailyDigestEnabled: { type: Boolean, default: true },
      dailyDigestTime: { type: String, default: "09:00" },
      followUpDefaultDays: { type: Number, default: 4 },
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", UserSchema);

module.exports = { User };

