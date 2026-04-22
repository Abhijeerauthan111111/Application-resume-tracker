const http = require("http");

const { createApp } = require("./app");
const { connectDb } = require("./config/db");
const { env } = require("./config/env");
const { startJobs } = require("./jobs/runner");

async function main() {
  await connectDb(env.MONGODB_URI);

  const app = createApp();
  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] listening on http://localhost:${env.PORT}`);
  });

  startJobs();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[server] fatal error:", err);
  process.exit(1);
});
