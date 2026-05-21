/**
 * RAG Pipeline — the orchestrator.
 *
 * Two public functions:
 *   1) ingestDocument(buffer, filename, userId)
 *        PDF buffer -> text -> chunks -> embeddings -> stored in pgvector
 *
 *   2) answerQuestion(documentId, question)
 *        question -> embedding -> top-k chunks -> LLM call -> grounded answer
 *
 * All the "real" work lives in the sub-modules. This file is the glue that
 * makes the high-level flow readable in 30 seconds — exactly what you want
 * an interviewer to see.
 */
const fs = require('fs/promises');
const { PrismaClient } = require('@prisma/client');

const { parsePdf } = require('../pdf/pdfParser');
const { splitText } = require('../chunking/textSplitter');
const { embedOne, embedMany } = require('../embeddings/geminiEmbeddings');
const { upsertChunks, searchSimilar } = require('../vectorstore/pgVectorStore');
const { chatModel } = require('../llm/geminiClient');
const { SYSTEM_PROMPT, buildRagPrompt } = require('../prompts/ragPrompts');

const prisma = new PrismaClient();

const TOP_K = 4; // how many chunks we retrieve per question

/**
 * Ingest a single PDF and prepare it for question-answering.
 *
 * @param {object} params
 * @param {Buffer} params.buffer  raw PDF bytes
 * @param {string} params.filename  original filename
 * @param {string} params.filePath  where the file is stored on disk
 * @param {number} params.fileSize  bytes
 * @param {string} params.userId    who uploaded it
 * @returns {Promise<{ documentId: string, chunkCount: number, pageCount: number }>}
 */
async function ingestDocument({ buffer, filename, filePath, fileSize, userId }) {
  // 1. Create the Document row immediately so the user has a stable ID
  //    and the UI can show "processing..." while we work.
  const doc = await prisma.document.create({
    data: {
      userId,
      filename,
      filePath,
      fileSize,
      status: 'processing',
    },
  });

  try {
    // 2. Extract text from PDF.
    const { text, pageCount } = await parsePdf(buffer);
    if (!text || text.trim().length === 0) {
      throw new Error('PDF contains no extractable text (it may be a scanned image).');
    }

    // 3. Split into overlapping chunks.
    const rawChunks = splitText(text);

    // 4. Embed all chunks (parallel with a concurrency cap inside embedMany).
    const vectors = await embedMany(rawChunks);

    // 5. Persist chunks + their embeddings.
    const chunkRecords = rawChunks.map((content, idx) => ({
      content,
      chunkIndex: idx,
      embedding: vectors[idx],
    }));
    await upsertChunks(doc.id, chunkRecords);

    // 6. Mark the document ready.
    await prisma.document.update({
      where: { id: doc.id },
      data: { status: 'ready', pageCount },
    });

    return { documentId: doc.id, chunkCount: chunkRecords.length, pageCount };
  } catch (err) {
    // On failure, flip status so the UI can surface it. We keep the row
    // around for debugging instead of deleting silently.
    await prisma.document.update({
      where: { id: doc.id },
      data: { status: 'failed' },
    });
    // Also clean up the file on disk so we don't leak storage on failure.
    try {
      await fs.unlink(filePath);
    } catch {
      // best-effort
    }
    throw err;
  }
}

/**
 * Answer a question about a specific document using RAG.
 *
 * @param {object} params
 * @param {string} params.documentId
 * @param {string} params.userId       must match document.userId for access control
 * @param {string} params.question
 * @returns {Promise<{ answer: string, sources: Array<{ chunkIndex: number, content: string, distance: number }> }>}
 */
async function answerQuestion({ documentId, userId, question }) {
  // 1. Access control — verify the document belongs to the requesting user.
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new Error('Document not found.');
  if (doc.userId !== userId) throw new Error('Not authorized for this document.');
  if (doc.status !== 'ready') throw new Error(`Document is ${doc.status}, not ready for questions.`);

  // 2. Embed the question.
  const queryVector = await embedOne(question);

  // 3. Retrieve top-k relevant chunks via cosine similarity.
  const chunks = await searchSimilar(documentId, queryVector, TOP_K);
  if (chunks.length === 0) {
    return {
      answer: 'The document does not appear to contain any information related to your question.',
      sources: [],
    };
  }

  // 4. Build the grounded prompt and call the LLM.
  const userPrompt = buildRagPrompt(question, chunks);
  const result = await chatModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    systemInstruction: SYSTEM_PROMPT,
  });

  const answer = result.response.text();

  // 5. Return both the answer AND the sources used. Showing sources in the UI
  //    is what makes a RAG app trustworthy — users can verify the citations.
  return {
    answer,
    sources: chunks.map((c) => ({
      chunkIndex: c.chunkIndex,
      content: c.content,
      // Convert distance -> rough similarity score (0..1) for UI display.
      similarity: Math.max(0, 1 - Number(c.distance)),
    })),
  };
}

module.exports = {
  ingestDocument,
  answerQuestion,
};
