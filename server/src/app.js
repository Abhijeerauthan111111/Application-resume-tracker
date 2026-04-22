const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { env } = require("./config/env");
const { errorHandler } = require("./middleware/errorHandler");
const { getClientIp } = require("./middleware/ip");

const authRoutes = require("./routes/auth.routes");
const companyRoutes = require("./routes/companies.routes");
const applicationRoutes = require("./routes/applications.routes");
const taskRoutes = require("./routes/tasks.routes");
const documentRoutes = require("./routes/documents.routes");
const shareRoutes = require("./routes/shares.routes");
const analyticsRoutes = require("./routes/analytics.routes");

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));
  app.set("trust proxy", true);
  app.use((req, _res, next) => {
    // Keep a stable IP even behind proxies (Render/Vercel/Cloudflare).
    req.rateLimitKey = getClientIp(req);
    next();
  });

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/companies", companyRoutes);
  app.use("/api/applications", applicationRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/documents", documentRoutes);
  app.use("/api/shares", shareRoutes);
  app.use("/api/analytics", analyticsRoutes);

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
