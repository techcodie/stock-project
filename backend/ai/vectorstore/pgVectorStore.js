/**
 * pgvector Vector Store
 *
 * Stores chunk embeddings in Postgres using the pgvector extension and
 * performs cosine-similarity search.
 *
 * Why raw SQL?
 *   Prisma does not natively model the vector type yet. We use $executeRawUnsafe
 *   and $queryRawUnsafe for the few queries that touch the embedding column.
 *   All other tables stay fully Prisma-managed.
 *
 * Operator cheat sheet (pgvector):
 *   <->   euclidean distance
 *   <=>   cosine distance      ← we use this. Smaller = more similar.
 *   <#>   negative inner product
 */
const { PrismaClient } = require('@prisma/client');
const { v4: uuid } = require('uuid');

const prisma = new PrismaClient();

/**
 * Format a JS number[] as a pgvector literal: "[0.1,0.2,...]"
 * Required because we pass the vector as a string and cast it to ::vector
 * in the SQL itself.
 */
function toVectorLiteral(vector) {
  return `[${vector.join(',')}]`;
}

/**
 * Insert chunks + their embeddings for a given document.
 * @param {string} documentId
 * @param {Array<{ content: string, chunkIndex: number, embedding: number[] }>} chunks
 */
async function upsertChunks(documentId, chunks) {
  // We insert one row at a time. For Phase 1, the chunk count per document is
  // small (typically < 200), so the simplicity beats the marginal speed of
  // multi-row VALUES inserts.
  for (const chunk of chunks) {
    const id = uuid();
    await prisma.$executeRawUnsafe(
      `INSERT INTO chunks (id, "documentId", content, "chunkIndex", embedding)
       VALUES ($1, $2, $3, $4, $5::vector)`,
      id,
      documentId,
      chunk.content,
      chunk.chunkIndex,
      toVectorLiteral(chunk.embedding),
    );
  }
}

/**
 * Find the top-k most relevant chunks for a question, scoped to a single document.
 *
 * @param {string} documentId
 * @param {number[]} queryVector  768-dim vector for the user's question
 * @param {number} k              how many chunks to retrieve (default 4)
 * @returns {Promise<Array<{ id: string, content: string, chunkIndex: number, distance: number }>>}
 */
async function searchSimilar(documentId, queryVector, k = 4) {
  const vec = toVectorLiteral(queryVector);

  const rows = await prisma.$queryRawUnsafe(
    `SELECT id, content, "chunkIndex", embedding <=> $1::vector AS distance
       FROM chunks
      WHERE "documentId" = $2
      ORDER BY embedding <=> $1::vector
      LIMIT $3`,
    vec,
    documentId,
    k,
  );

  return rows;
}

/**
 * Delete all chunks for a document (called when the user deletes a document).
 * Note: Prisma's cascade delete handles this automatically when the Document
 * row is deleted, but we expose it for cases where we want to re-index.
 */
async function deleteChunksForDocument(documentId) {
  await prisma.chunk.deleteMany({ where: { documentId } });
}

module.exports = {
  upsertChunks,
  searchSimilar,
  deleteChunksForDocument,
};
