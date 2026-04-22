const dotenv = require("dotenv");

dotenv.config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 4000),
  MONGODB_URI: requireEnv("MONGODB_URI"),
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",

  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "",
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || "",
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || "",
  GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS || "",

  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || "",
  EMAIL_FROM: process.env.EMAIL_FROM || "",
  APP_BASE_URL: process.env.APP_BASE_URL || "http://localhost:5173",

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",

  SHARE_TOKEN_PEPPER: process.env.SHARE_TOKEN_PEPPER || "",

  ENABLE_JOBS: process.env.ENABLE_JOBS === "true",
  REMINDER_JOB_INTERVAL_MS: Number(process.env.REMINDER_JOB_INTERVAL_MS || 60_000),
  DIGEST_JOB_INTERVAL_MS: Number(process.env.DIGEST_JOB_INTERVAL_MS || 300_000),
  DIGEST_LOOKAHEAD_HOURS: Number(process.env.DIGEST_LOOKAHEAD_HOURS || 48),
};

module.exports = { env, requireEnv };
