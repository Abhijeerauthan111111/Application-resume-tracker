const express = require("express");
const { z } = require("zod");

const { requireAuth } = require("../middleware/requireAuth");
const { validate } = require("../middleware/validate");
const {
  listTasks,
  createTask,
  updateTask,
  completeTask,
  dismissTask,
  deleteTask,
} = require("../controllers/tasks.controller");

const router = express.Router();

router.use(requireAuth);

router.get(
  "/",
  validate(
    z.object({
      body: z.object({}).passthrough(),
      params: z.object({}).passthrough(),
      query: z.object({
        status: z.enum(["open", "done", "dismissed"]).optional(),
        applicationId: z.string().optional(),
      }),
    }),
  ),
  listTasks,
);

router.post(
  "/",
  validate(
    z.object({
      body: z.object({
        applicationId: z.string().min(1),
        type: z.enum(["follow_up", "interview_prep", "custom"]).optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        dueAt: z.string().min(1),
        remindAt: z.string().optional(),
        channels: z
          .object({
            inApp: z.boolean().optional(),
            email: z.boolean().optional(),
          })
          .optional(),
      }),
      params: z.object({}).passthrough(),
      query: z.object({}).passthrough(),
    }),
  ),
  createTask,
);

router.patch(
  "/:id",
  validate(
    z.object({
      body: z
        .object({
          title: z.string().min(1).optional(),
          description: z.string().optional(),
          dueAt: z.string().optional(),
          remindAt: z.string().optional(),
          channels: z
            .object({
              inApp: z.boolean().optional(),
              email: z.boolean().optional(),
            })
            .optional(),
          status: z.enum(["open", "done", "dismissed"]).optional(),
        })
        .refine((v) => Object.keys(v).length > 0, { message: "No updates provided" }),
      params: z.object({ id: z.string() }),
      query: z.object({}).passthrough(),
    }),
  ),
  updateTask,
);

router.patch(
  "/:id/complete",
  validate(
    z.object({
      body: z.object({}).passthrough(),
      params: z.object({ id: z.string() }),
      query: z.object({}).passthrough(),
    }),
  ),
  completeTask,
);

router.patch(
  "/:id/dismiss",
  validate(
    z.object({
      body: z.object({}).passthrough(),
      params: z.object({ id: z.string() }),
      query: z.object({}).passthrough(),
    }),
  ),
  dismissTask,
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
  deleteTask,
);

module.exports = router;

