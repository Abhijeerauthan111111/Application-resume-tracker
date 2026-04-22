const express = require("express");
const { z } = require("zod");

const { requireAuth } = require("../middleware/requireAuth");
const { validate } = require("../middleware/validate");
const { listDocuments, createDocument, updateDocument, deleteDocument } = require("../controllers/documents.controller");
const { uploadMiddleware, uploadDocument } = require("../controllers/documentsUpload.controller");

const router = express.Router();
router.use(requireAuth);

router.get(
  "/",
  validate(
    z.object({
      body: z.object({}).passthrough(),
      params: z.object({}).passthrough(),
      query: z.object({
        type: z.enum(["resume", "cover_letter", "portfolio"]).optional(),
        q: z.string().optional(),
      }),
    }),
  ),
  listDocuments,
);

router.post(
  "/",
  validate(
    z.object({
      body: z.object({
        type: z.enum(["resume", "cover_letter", "portfolio"]),
        name: z.string().min(1),
        roleFocus: z.string().optional(),
        tags: z.array(z.string()).optional(),
        notes: z.string().optional(),
        source: z.enum(["cloudinary", "external"]),
        externalUrl: z.string().optional(),
        file: z
          .object({
            cloudinaryPublicId: z.string().optional(),
            resourceType: z.string().optional(),
            format: z.string().optional(),
            bytes: z.number().optional(),
            originalFilename: z.string().optional(),
            secureUrl: z.string().optional(),
          })
          .optional(),
      }),
      params: z.object({}).passthrough(),
      query: z.object({}).passthrough(),
    }),
  ),
  createDocument,
);

router.post(
  "/upload",
  uploadMiddleware(),
  validate(
    z.object({
      // multipart/form-data: everything comes as string
      body: z.object({
        type: z.enum(["resume", "cover_letter", "portfolio"]),
        name: z.string().min(1),
        roleFocus: z.string().optional(),
        tags: z.string().optional(), // JSON string like ["tag1","tag2"]
        notes: z.string().optional(),
      }),
      params: z.object({}).passthrough(),
      query: z.object({}).passthrough(),
    }),
  ),
  uploadDocument,
);

router.patch(
  "/:id",
  validate(
    z.object({
      body: z
        .object({
          name: z.string().min(1).optional(),
          roleFocus: z.string().optional(),
          tags: z.array(z.string()).optional(),
          notes: z.string().optional(),
        })
        .refine((v) => Object.keys(v).length > 0, { message: "No updates provided" }),
      params: z.object({ id: z.string() }),
      query: z.object({}).passthrough(),
    }),
  ),
  updateDocument,
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
  deleteDocument,
);

module.exports = router;
