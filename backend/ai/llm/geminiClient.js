/**
 * Centralized Gemini client.
 * All AI files import models from here — one place to configure key + names.
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
  console.warn('[AI] GEMINI_API_KEY is not set. AI features will fail until you add it to .env');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Chat model used by the RAG pipeline.
// gemini-2.5-flash is what's enabled on the current API key tier.
const chatModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Embedding model. gemini-embedding-001 is the current available model on this
// API key tier. It produces 3072-dim vectors by default but supports
// outputDimensionality to truncate. We use 768 to match our pgvector schema.
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

// Dimensionality the rest of the code (and the DB schema) expects.
const EMBEDDING_DIM = 768;

module.exports = {
  chatModel,
  embeddingModel,
  EMBEDDING_DIM,
};
