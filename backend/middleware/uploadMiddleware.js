/**
 * Upload Middleware
 *
 * Wraps multer with PDF-only filtering, a configurable size limit, and a
 * unique filename scheme. Exposed as `uploadPdf.single('file')` so any route
 * can plug it in:
 *
 *   router.post('/upload', uploadPdf.single('file'), controllerFn);
 *
 * We store files on local disk under UPLOAD_DIR (default ./uploads). The
 * filename pattern is `<uuid>__<safe-original-name>.pdf` to avoid collisions
 * while keeping the original name visible for debugging.
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_PDF_SIZE_MB = Number(process.env.MAX_PDF_SIZE_MB || 10);

// Ensure the upload directory exists at startup. Synchronous is fine — runs once.
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // Sanitize the original name: keep letters/numbers/dots/dashes, replace the rest with _
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    cb(null, `${uuid()}__${safe}`);
  },
});

// Only accept PDFs. We check both mimetype and extension because mimetype
// can be spoofed and extension can be missing.
function fileFilter(_req, file, cb) {
  const isPdfMime = file.mimetype === 'application/pdf';
  const isPdfExt = path.extname(file.originalname).toLowerCase() === '.pdf';
  if (!isPdfMime || !isPdfExt) {
    return cb(new Error('Only PDF files are allowed.'));
  }
  cb(null, true);
}

const uploadPdf = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_PDF_SIZE_MB * 1024 * 1024 },
});

module.exports = { uploadPdf, UPLOAD_DIR };
