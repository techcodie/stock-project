/**
 * AI Routes
 *
 * Mounted at /api/ai in app.js. All routes require JWT auth.
 */
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const { uploadPdf } = require('../middleware/uploadMiddleware');
const {
  uploadDocument,
  chat,
  listDocuments,
  deleteDocument,
  downloadDocumentContent,
} = require('./aiController');

// Everything under /api/ai requires authentication.
router.use(authMiddleware);

// POST /api/ai/upload — multipart upload, field name "file"
router.post('/upload', uploadPdf.single('file'), uploadDocument);

// POST /api/ai/chat — ask a question about a specific document
router.post('/chat', chat);

// GET  /api/ai/documents — list current user's documents
router.get('/documents', listDocuments);

// GET /api/ai/documents/:id/content — download the indexed text as .txt
router.get('/documents/:id/content', downloadDocumentContent);

// DELETE /api/ai/documents/:id — delete a document and its chunks
router.delete('/documents/:id', deleteDocument);

module.exports = router;
