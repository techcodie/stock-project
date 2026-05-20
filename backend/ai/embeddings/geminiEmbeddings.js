/**
 * Embeddings Service
 *
 * Turns text into 768-dim vectors using Gemini's gemini-embedding-001 model.
 * The model's native output is 3072 dims; we pass outputDimensionality=768 so
 * the result fits our pgvector column without changing the schema.
 *
 * Public helpers:
 *   - embedOne(text):     for the user's question
 *   - embedMany(texts):   for an array of chunks (batched with concurrency cap)
 */
const { embeddingModel, EMBEDDING_DIM } = require('../llm/geminiClient');

const CONCURRENCY = 5; // parallel embedding calls (rate-limit friendly)

/**
 * Build the request shape that Gemini's embedContent expects.
 * outputDimensionality lets us truncate the Matryoshka embedding to 768 dims.
 */
function buildEmbedRequest(text) {
  return {
    content: { parts: [{ text }], role: 'user' },
    outputDimensionality: EMBEDDING_DIM,
  };
}

/**
 * @param {string} text
 * @returns {Promise<number[]>} 768-length array of floats
 */
async function embedOne(text) {
  const result = await embeddingModel.embedContent(buildEmbedRequest(text));
  return result.embedding.values;
}

/**
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
async function embedMany(texts) {
  /** @type {number[][]} */
  const out = new Array(texts.length);

  // Concurrency-capped parallelism: process CONCURRENCY items at a time.
  for (let i = 0; i < texts.length; i += CONCURRENCY) {
    const slice = texts.slice(i, i + CONCURRENCY);
    const vectors = await Promise.all(slice.map((t) => embedOne(t)));
    for (let j = 0; j < vectors.length; j++) {
      out[i + j] = vectors[j];
    }
  }
  return out;
}

module.exports = { embedOne, embedMany };
