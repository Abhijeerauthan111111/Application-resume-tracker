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
};

module.exports = { env, requireEnv };
