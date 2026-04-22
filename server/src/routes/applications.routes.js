const express = require("express");
const { z } = require("zod");

const { requireAuth } = require("../middleware/requireAuth");
const { validate } = require("../middleware/validate");
const {
  listApplications,
  createApplication,
  getApplication,
  updateApplication,
  setStatus,
  deleteApplication,
  addRound,
  updateRound,
  deleteRound,
} = require("../controllers/applications.controller");
const { ApplicationStatuses } = require("../models/Application");

const router = express.Router();

router.use(requireAuth);

router.get(
  "/",
  validate(
    z.object({
      body: z.object({}).passthrough(),
      params: z.object({}).passthrough(),
      query: z.object({
        status: z.enum(ApplicationStatuses).optional(),
        companyId: z.string().optional(),
        q: z.string().optional(),
        appliedFrom: z.string().optional(),
        appliedTo: z.string().optional(),
        sort: z.enum(["appliedDate_desc", "appliedDate_asc", "updatedAt_desc", "updatedAt_asc"]).optional(),
      }),
    }),
  ),
  listApplications,
);

router.post(
  "/",
  validate(
    z.object({
      body: z.object({
        companyId: z.string().optional(),
        companyName: z.string().optional(),
        role: z.string().min(1),
        status: z.enum(ApplicationStatuses),
        appliedDate: z.string().min(1),
        jobLink: z.string().optional(),
        location: z.string().optional(),
        salaryRange: z.string().optional(),
        source: z.string().optional(),
        notes: z.string().optional(),
        documentIds: z.array(z.string()).optional(),
      }),
      params: z.object({}).passthrough(),
      query: z.object({}).passthrough(),
    }),
  ),
  createApplication,
);

router.get(
  "/:id",
  validate(
    z.object({
      body: z.object({}).passthrough(),
      params: z.object({ id: z.string() }),
      query: z.object({}).passthrough(),
    }),
  ),
  getApplication,
);

router.patch(
  "/:id",
  validate(
    z.object({
      body: z
        .object({
          companyId: z.string().optional(),
          role: z.string().min(1).optional(),
          status: z.enum(ApplicationStatuses).optional(),
          appliedDate: z.string().optional(),
          jobLink: z.string().optional(),
          location: z.string().optional(),
          salaryRange: z.string().optional(),
          source: z.string().optional(),
          notes: z.string().optional(),
          documentIds: z.array(z.string()).optional(),
        })
        .refine((v) => Object.keys(v).length > 0, { message: "No updates provided" }),
      params: z.object({ id: z.string() }),
      query: z.object({}).passthrough(),
    }),
  ),
  updateApplication,
);

router.patch(
  "/:id/status",
  validate(
    z.object({
      body: z.object({
        status: z.enum(ApplicationStatuses),
      }),
      params: z.object({ id: z.string() }),
      query: z.object({}).passthrough(),
    }),
  ),
  setStatus,
);

router.delete(
  "/:id",
  validate(
    z.object({
      body: z.object({}).passthrough(),
      params: z.object({ id: z.string() }),
      query: z.object({}).passthrough(),
    }),
  ),
  deleteApplication,
);

// Interview rounds
router.post(
  "/:id/rounds",
  validate(
    z.object({
      body: z.object({
        roundType: z.enum(["HR", "Technical", "Managerial", "Final", "Other"]),
        scheduledAt: z.string().optional(),
        status: z.enum(["Scheduled", "Completed", "Cleared", "Rejected"]).optional(),
        notes: z.string().optional(),
      }),
      params: z.object({ id: z.string() }),
      query: z.object({}).passthrough(),
    }),
  ),
  addRound,
);

router.patch(
  "/:id/rounds/:roundId",
  validate(
    z.object({
      body: z
        .object({
          roundType: z.enum(["HR", "Technical", "Managerial", "Final", "Other"]).optional(),
          scheduledAt: z.string().optional(),
          status: z.enum(["Scheduled", "Completed", "Cleared", "Rejected"]).optional(),
          notes: z.string().optional(),
        })
        .refine((v) => Object.keys(v).length > 0, { message: "No updates provided" }),
      params: z.object({ id: z.string(), roundId: z.string() }),
      query: z.object({}).passthrough(),
    }),
  ),
  updateRound,
);

router.delete(
  "/:id/rounds/:roundId",
  validate(
    z.object({
      body: z.object({}).passthrough(),
      params: z.object({ id: z.string(), roundId: z.string() }),
      query: z.object({}).passthrough(),
    }),
  ),
  deleteRound,
);

module.exports = router;
