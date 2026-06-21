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
  predict,
  modelMetrics,
} = require('./aiController');

// Everything under /api/ai requires authentication.
router.use(authMiddleware);

// POST /api/ai/upload — multipart upload, field name "file"
router.post('/upload', uploadPdf.single('file'), uploadDocument);

// POST /api/ai/chat — ask a question about a specific document
router.post('/chat', chat);

// GET  /api/ai/documents — list current user's documents
router.get('/documents', listDocuments);

// GET /api/ai/documents/:id/content — download the original source PDF
router.get('/documents/:id/content', downloadDocumentContent);

// DELETE /api/ai/documents/:id — delete a document and its chunks
router.delete('/documents/:id', deleteDocument);

// --- ML price-prediction service (proxied to the Python FastAPI service) ---
// GET /api/ai/predict/:symbol — next-day up/down prediction for a stock
router.get('/predict/:symbol', predict);
// GET /api/ai/model/metrics — model card + evaluation metrics
router.get('/model/metrics', modelMetrics);

module.exports = router;
