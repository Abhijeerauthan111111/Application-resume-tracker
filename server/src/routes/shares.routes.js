const express = require("express");
const { z } = require("zod");

const { requireAuth } = require("../middleware/requireAuth");
const { validate } = require("../middleware/validate");
const { createShare, listShares, revokeShare, getSharePublic } = require("../controllers/shares.controller");
const { createRateLimiter } = require("../middleware/rateLimit");

const router = express.Router();

// Public route (no auth)
router.get(
  "/public/:token",
  createRateLimiter({ windowMs: 60 * 1000, max: 30 }),
  validate(
    z.object({
      body: z.object({}).passthrough(),
      params: z.object({ token: z.string().min(1) }),
      query: z.object({}).passthrough(),
    }),
  ),
  getSharePublic,
);

router.use(requireAuth);

router.get("/", listShares);

router.post(
  "/",
  validate(
    z.object({
      body: z.object({
        applicationId: z.string().min(1),
        includeDocuments: z.boolean().optional(),
        expiresInDays: z.number().optional(), // 0 means no expiry
      }),
      params: z.object({}).passthrough(),
      query: z.object({}).passthrough(),
    }),
  ),
  createShare,
);

router.patch(
  "/:id/revoke",
  validate(
    z.object({
      body: z.object({}).passthrough(),
      params: z.object({ id: z.string().min(1) }),
      query: z.object({}).passthrough(),
    }),
  ),
  revokeShare,
);

module.exports = router;
