const admin = require("firebase-admin");

const { env } = require("./env");

let initialized = false;

function initFirebaseAdmin() {
  if (initialized) return admin;

  const hasServiceAccount =
    env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY;

  if (hasServiceAccount) {
    const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  } else if (env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Uses Application Default Credentials (ADC). For local dev this typically points to a service account JSON file.
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } else {
    throw new Error(
      "Firebase Admin not configured. Provide FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY, or set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON path.",
    );
  }

  initialized = true;
  return admin;
}

module.exports = { initFirebaseAdmin };
