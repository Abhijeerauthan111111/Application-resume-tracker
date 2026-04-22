const express = require("express");
const { z } = require("zod");

const { requireAuth } = require("../middleware/requireAuth");
const { validate } = require("../middleware/validate");
const { listCompanies, createCompany, updateCompany, deleteCompany } = require("../controllers/companies.controller");

const router = express.Router();

router.use(requireAuth);

router.get("/", listCompanies);

router.post(
  "/",
  validate(
    z.object({
      body: z.object({
        name: z.string().min(1),
        website: z.string().optional(),
        hqLocation: z.string().optional(),
        notes: z.string().optional(),
      }),
      params: z.object({}).passthrough(),
      query: z.object({}).passthrough(),
    }),
  ),
  createCompany,
);

router.patch(
  "/:id",
  validate(
    z.object({
      body: z
        .object({
          name: z.string().min(1).optional(),
          website: z.string().optional(),
          hqLocation: z.string().optional(),
          notes: z.string().optional(),
        })
        .refine((v) => Object.keys(v).length > 0, { message: "No updates provided" }),
      params: z.object({ id: z.string() }),
      query: z.object({}).passthrough(),
    }),
  ),
  updateCompany,
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
  deleteCompany,
);

module.exports = router;

