const { User } = require("../models/User");

async function updateSettings(req, res) {
  const updates = req.validated.body;
  const set = {};
  for (const [k, v] of Object.entries(updates)) {
    set[`settings.${k}`] = v;
  }

  const user = await User.findByIdAndUpdate(req.user.userId, { $set: set }, { new: true }).lean();
  res.json({
    data: {
      id: String(user._id),
      email: user.email,
      name: user.name,
      photoURL: user.photoURL,
      settings: user.settings,
    },
  });
}

module.exports = { updateSettings };

