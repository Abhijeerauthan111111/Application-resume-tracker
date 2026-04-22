const { createApp } = require("../server/src/app");
const { connectDb } = require("../server/src/config/db");
const { env } = require("../server/src/config/env");

let app;
let dbPromise;

module.exports = async (req, res) => {
  if (!dbPromise) dbPromise = connectDb(env.MONGODB_URI);
  await dbPromise;

  if (!app) app = createApp();
  return app(req, res);
};

