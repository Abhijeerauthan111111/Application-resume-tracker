const { User } = require("../models/User");

async function me(req, res) {
  const user = await User.findById(req.user.userId).lean();
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

module.exports = { me };

