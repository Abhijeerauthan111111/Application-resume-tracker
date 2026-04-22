const express = require("express");
const { z } = require("zod");

const { requireAuth } = require("../middleware/requireAuth");
const { validate } = require("../middleware/validate");
const { updateSettings } = require("../controllers/users.controller");

const router = express.Router();
router.use(requireAuth);

router.patch(
  "/settings",
  validate(
    z.object({
      body: z
        .object({
          timezone: z.string().optional(),
          emailRemindersEnabled: z.boolean().optional(),
          dailyDigestEnabled: z.boolean().optional(),
          dailyDigestTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
          followUpDefaultDays: z.number().int().min(1).max(30).optional(),
        })
        .refine((v) => Object.keys(v).length > 0, { message: "No updates provided" }),
      params: z.object({}).passthrough(),
      query: z.object({}).passthrough(),
    }),
  ),
  updateSettings,
);

module.exports = router;

