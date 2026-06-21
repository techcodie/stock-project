/**
 * AI Controller — HTTP layer for the RAG feature.
 *
 * Thin wrapper around the pipeline: parse the request, call ragPipeline,
 * shape the response. All real logic lives in ai/rag/ragPipeline.js.
 */
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const axios = require('axios');
const { ingestDocument, answerQuestion } = require('./rag/ragPipeline');
const prisma = require('../lib/prisma');

// The Python ML microservice (FastAPI) that serves price-direction predictions.
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// Shared seed PDFs live here (one PDF per sample, shared across users).
// We must NOT delete files in this directory when a user deletes a doc,
// because other users still reference the same file.
const SEED_DIR_REL = path.join('uploads', 'seed');

/**
 * POST /api/ai/upload
 * Expects: multipart/form-data with a `file` field (PDF).
 * Auth required (req.user.userId from authMiddleware).
 */
async function uploadDocument(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF file provided.' });
    }

    // multer wrote the file to disk; we read it back to a buffer for parsing.
    // For Phase 1 PDFs (<= 10MB) this is simpler than streaming.
    const buffer = await fs.readFile(req.file.path);

    const { documentId, chunkCount, pageCount } = await ingestDocument({
      buffer,
      filename: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      userId: req.user.userId,
    });

    res.status(201).json({
      success: true,
      data: { documentId, chunkCount, pageCount },
      message: 'Document processed and ready for questions.',
    });
  } catch (err) {
    console.error('[AI] uploadDocument error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to process PDF.' });
  }
}

/**
 * POST /api/ai/chat
 * Body: { documentId: string, question: string }
 */
async function chat(req, res) {
  try {
    const { documentId, question } = req.body;
    if (!documentId || !question || question.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'documentId and question are required.' });
    }

    const { answer, sources } = await answerQuestion({
      documentId,
      userId: req.user.userId,
      question: question.trim(),
    });

    res.json({ success: true, data: { answer, sources } });
  } catch (err) {
    console.error('[AI] chat error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to answer question.' });
  }
}

/**
 * GET /api/ai/documents
 * Returns the user's uploaded documents (most recent first).
 */
async function listDocuments(req, res) {
  try {
    const docs = await prisma.document.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        filename: true,
        fileSize: true,
        status: true,
        pageCount: true,
        createdAt: true,
      },
    });
    res.json({ success: true, data: docs });
  } catch (err) {
    console.error('[AI] listDocuments error:', err);
    res.status(500).json({ success: false, message: 'Failed to list documents.' });
  }
}

/**
 * DELETE /api/ai/documents/:id
 * Removes the document row (cascading delete of chunks) and the file on disk.
 */
async function deleteDocument(req, res) {
  try {
    const { id } = req.params;
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });
    if (doc.userId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    // Best-effort file cleanup; the DB delete is the source of truth.
    // Two cases where we must NOT touch the file on disk:
    //   1. Legacy "seed://..." markers from before the PDF migration (no file).
    //   2. Files under uploads/seed/ — those are shared across users; deleting
    //      one user's row should not remove the shared sample PDF.
    const isSharedSeed =
      doc.filePath &&
      (doc.filePath.startsWith('seed://') ||
        doc.filePath.includes(`${SEED_DIR_REL}${path.sep}`) ||
        doc.filePath.includes('uploads/seed/'));

    if (doc.filePath && !isSharedSeed) {
      try {
        await fs.unlink(doc.filePath);
      } catch {
        // file may already be gone — ignore
      }
    }
    await prisma.document.delete({ where: { id } });

    res.json({ success: true, message: 'Document deleted.' });
  } catch (err) {
    console.error('[AI] deleteDocument error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete document.' });
  }
}

/**
 * GET /api/ai/documents/:id/content
 *
 * Streams the original PDF file back to the browser. Used by the "Download"
 * button so the user can verify LLM answers against the actual source PDF.
 *
 *  - For uploaded documents: streams the file multer wrote to disk.
 *  - For seeded sample documents: streams the shared PDF from uploads/seed/
 *    (generated by scripts/seedSamples.js or scripts/migrateSeedToPdf.js).
 */
async function downloadDocumentContent(req, res) {
  try {
    const { id } = req.params;
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });
    if (doc.userId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    // Legacy fallback: very old seeded rows might still have "seed://..." marker
    // paths (from before the PDF migration). Tell the user to run the migration.
    if (!doc.filePath || doc.filePath.startsWith('seed://')) {
      return res.status(404).json({
        success: false,
        message:
          'PDF not available for this document. Run scripts/migrateSeedToPdf.js to generate it.',
      });
    }

    // Resolve path: filePath is stored relative to backend/ for uploaded and
    // seeded files. Make absolute before streaming.
    const absolutePath = path.isAbsolute(doc.filePath)
      ? doc.filePath
      : path.resolve(__dirname, '..', doc.filePath);

    if (!fsSync.existsSync(absolutePath)) {
      return res.status(404).json({
        success: false,
        message: 'PDF file is missing on disk.',
      });
    }

    // Inline filename header so browsers save with the original name.
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(doc.filename || 'document.pdf')}"`,
    );

    fsSync.createReadStream(absolutePath).pipe(res);
  } catch (err) {
    console.error('[AI] downloadDocumentContent error:', err);
    res.status(500).json({ success: false, message: 'Failed to download document.' });
  }
}

/**
 * GET /api/ai/predict/:symbol
 * Proxies to the Python ML service for a next-day up/down prediction.
 */
async function predict(req, res) {
  const symbol = (req.params.symbol || '').toUpperCase();
  try {
    const { data } = await axios.get(`${ML_SERVICE_URL}/predict/${symbol}`, { timeout: 8000 });
    res.json({ success: true, data });
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ success: false, message: `No prediction available for ${symbol}.` });
    }
    console.error('[AI] predict error:', err.message);
    res.status(503).json({
      success: false,
      message: 'Prediction service is unavailable. Start it with: cd ml-service && uvicorn app:app --port 8000',
    });
  }
}

/**
 * GET /api/ai/model/metrics
 * Returns the model card (how it was trained + evaluation scores).
 */
async function modelMetrics(req, res) {
  try {
    const { data } = await axios.get(`${ML_SERVICE_URL}/metrics`, { timeout: 8000 });
    res.json({ success: true, data });
  } catch (err) {
    console.error('[AI] modelMetrics error:', err.message);
    res.status(503).json({ success: false, message: 'Prediction service is unavailable.' });
  }
}

module.exports = {
  uploadDocument,
  chat,
  listDocuments,
  deleteDocument,
  downloadDocumentContent,
  predict,
  modelMetrics,
};
