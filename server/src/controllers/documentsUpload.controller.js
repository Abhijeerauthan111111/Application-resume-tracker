const multer = require("multer");

const { configureCloudinary } = require("../config/cloudinary");
const { Document } = require("../models/Document");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

function uploadMiddleware() {
  return upload.single("file");
}

function cloudinaryUploadBuffer({ buffer, filename, folder }) {
  const cloudinary = configureCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder,
        filename_override: filename,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );
    stream.end(buffer);
  });
}

async function uploadDocument(req, res) {
  const file = req.file;
  if (!file) return res.status(400).json({ error: { message: "Missing file" } });

  const allowed = new Set([
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  ]);
  if (file.mimetype && !allowed.has(file.mimetype)) {
    return res.status(400).json({ error: { message: "Unsupported file type. Upload PDF or DOCX." } });
  }

  const body = req.validated.body;
  const folder = `application-tracker/${String(req.user.userId)}`;

  let tags = [];
  if (body.tags) {
    try {
      tags = JSON.parse(body.tags);
      if (!Array.isArray(tags)) tags = [];
    } catch (_e) {
      tags = [];
    }
  }

  const result = await cloudinaryUploadBuffer({
    buffer: file.buffer,
    filename: file.originalname,
    folder,
  });

  const doc = await Document.create({
    userId: req.user.userId,
    type: body.type,
    name: body.name.trim(),
    roleFocus: body.roleFocus || "",
    tags,
    notes: body.notes || "",
    source: "cloudinary",
    file: {
      cloudinaryPublicId: result.public_id || "",
      resourceType: result.resource_type || "",
      format: result.format || "",
      bytes: result.bytes || 0,
      originalFilename: file.originalname || "",
      secureUrl: result.secure_url || "",
    },
  });

  res.status(201).json({ data: doc });
}

module.exports = { uploadMiddleware, uploadDocument };
