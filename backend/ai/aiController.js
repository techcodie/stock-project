/**
 * AI Controller — HTTP layer for the RAG feature.
 *
 * Thin wrapper around the pipeline: parse the request, call ragPipeline,
 * shape the response. All real logic lives in ai/rag/ragPipeline.js.
 */
const fs = require('fs/promises');
const { PrismaClient } = require('@prisma/client');
const { ingestDocument, answerQuestion } = require('./rag/ragPipeline');

const prisma = new PrismaClient();

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
    // Seeded samples use a `seed://` marker path with no real file on disk —
    // skip unlink for those.
    if (doc.filePath && !doc.filePath.startsWith('seed://')) {
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
 * Returns the document's indexed text (concatenated chunks, in order) as a
 * downloadable .txt file. This is what the LLM actually sees during retrieval,
 * so the user can verify answers against the real source.
 *
 * For uploaded PDFs: shows the extracted + chunked text (same content the
 * model received — no PDF rendering involved).
 * For seeded samples: shows the original sample text.
 */
async function downloadDocumentContent(req, res) {
  try {
    const { id } = req.params;
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });
    if (doc.userId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const chunks = await prisma.chunk.findMany({
      where: { documentId: id },
      orderBy: { chunkIndex: 'asc' },
      select: { chunkIndex: true, content: true },
    });

    if (chunks.length === 0) {
      return res.status(404).json({ success: false, message: 'No content found for this document.' });
    }

    // Header + clearly-delimited chunks so reviewers can see exactly what the
    // model retrieves over. Chunks have ~150 char overlap by design (helps
    // retrieval across boundaries) — that's why some content appears twice.
    const header =
`# ${doc.filename}
# Document ID: ${doc.id}
# Chunks: ${chunks.length}
# Note: chunks intentionally overlap by ~150 characters to improve retrieval
#       across boundaries. This is the exact text the LLM sees.

`;

    const body = chunks
      .map((c) => `===== Chunk ${c.chunkIndex} =====\n${c.content}`)
      .join('\n\n');

    const safeName = (doc.filename || 'document').replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9._-]/g, '_');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.txt"`);
    res.send(header + body);
  } catch (err) {
    console.error('[AI] downloadDocumentContent error:', err);
    res.status(500).json({ success: false, message: 'Failed to download document content.' });
  }
}

module.exports = {
  uploadDocument,
  chat,
  listDocuments,
  deleteDocument,
  downloadDocumentContent,
};
