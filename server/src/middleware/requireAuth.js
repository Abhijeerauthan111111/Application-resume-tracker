const { initFirebaseAdmin } = require("../config/firebaseAdmin");
const { User } = require("../models/User");

async function upsertUserFromFirebase({ firebaseUid, email, name, photoURL }) {
  // Primary key: firebase uid
  let user = await User.findOne({ firebaseUid });
  if (user) {
    const updates = {};
    if (email && user.email !== email) updates.email = email;
    if (name && user.name !== name) updates.name = name;
    if (photoURL && user.photoURL !== photoURL) updates.photoURL = photoURL;
    if (Object.keys(updates).length > 0) {
      user = await User.findByIdAndUpdate(user._id, updates, { new: true });
    }
    return user;
  }

  // Fallback: link by email (helps when switching Firebase projects in dev)
  if (email) {
    user = await User.findOne({ email });
    if (user) {
      const updates = {
        firebaseUid,
      };
      if (name && user.name !== name) updates.name = name;
      if (photoURL && user.photoURL !== photoURL) updates.photoURL = photoURL;
      user = await User.findByIdAndUpdate(user._id, updates, { new: true });
      return user;
    }
  }

  // Create new
  try {
    return await User.create({
      firebaseUid,
      email,
      name,
      photoURL,
    });
  } catch (err) {
    // Race/dup: resolve by fetching and linking by email/uid
    if (err && err.code === 11000) {
      const existingByUid = await User.findOne({ firebaseUid });
      if (existingByUid) return existingByUid;
      if (email) {
        const existingByEmail = await User.findOne({ email });
        if (existingByEmail) {
          return await User.findByIdAndUpdate(existingByEmail._id, { firebaseUid }, { new: true });
        }
      }
    }
    throw err;
  }
}

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
    if (!token) return res.status(401).json({ error: { message: "Missing Bearer token" } });

    const admin = initFirebaseAdmin();
    const decoded = await admin.auth().verifyIdToken(token);

    const firebaseUid = decoded.uid;
    const email = decoded.email || "";
    const name = decoded.name || "";
    const photoURL = decoded.picture || "";

    const user = await upsertUserFromFirebase({ firebaseUid, email, name, photoURL });

    req.user = {
      userId: user._id,
      firebaseUid,
      email: user.email,
    };

    next();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[auth] verification failed:", err);

    const code = err?.code || "";
    if (typeof code === "string" && code.startsWith("auth/")) {
      return res.status(401).json({ error: { message: "Invalid or expired token" } });
    }

    // Anything else is typically server misconfiguration (Firebase Admin credentials, etc.)
    return res.status(500).json({
      error: {
        message:
          process.env.NODE_ENV === "development"
            ? `Server auth misconfigured. ${err?.message || "Check Firebase Admin env vars."}`
            : "Server auth misconfigured. Check Firebase Admin env vars.",
      },
    });
  }
}

module.exports = { requireAuth };
