/**
 * Text Splitter (recursive chunker with overlap)
 *
 * Why we chunk:
 *   LLMs have context limits, and retrieval works best when chunks are small
 *   enough to be specific but large enough to be meaningful. For financial
 *   reports, ~1000 characters (~250 tokens) is a good middle ground.
 *
 * Why "recursive" splitting:
 *   We try to split on natural boundaries first (paragraphs → sentences →
 *   words) and only fall back to hard character cuts if needed. This keeps
 *   semantic units intact, which improves retrieval quality.
 *
 * Why overlap:
 *   A sentence at the end of one chunk might be the start of an answer that
 *   continues in the next chunk. Overlapping the last N chars of chunk i
 *   into chunk i+1 prevents losing context at boundaries.
 */

const DEFAULT_CHUNK_SIZE = 1000;     // characters per chunk
const DEFAULT_CHUNK_OVERLAP = 150;   // characters of overlap between consecutive chunks

/**
 * Split text into overlapping chunks using paragraph/sentence-aware logic.
 *
 * @param {string} text
 * @param {object} [opts]
 * @param {number} [opts.chunkSize=1000]
 * @param {number} [opts.chunkOverlap=150]
 * @returns {string[]}
 */
function splitText(text, opts = {}) {
  const chunkSize = opts.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const chunkOverlap = opts.chunkOverlap ?? DEFAULT_CHUNK_OVERLAP;

  if (!text || text.length === 0) return [];
  if (text.length <= chunkSize) return [text.trim()];

  // Step 1: try splitting on paragraphs first. If we ever get a "paragraph"
  // that's larger than chunkSize, we recurse into it splitting on sentences.
  const paragraphs = text.split(/\n\n+/);

  /** @type {string[]} */
  const chunks = [];
  let current = '';

  const flush = () => {
    const trimmed = current.trim();
    if (trimmed.length > 0) chunks.push(trimmed);
    current = '';
  };

  for (const para of paragraphs) {
    // If a single paragraph is larger than chunkSize, break it down further.
    if (para.length > chunkSize) {
      flush();
      const subChunks = splitLongUnit(para, chunkSize);
      for (const sub of subChunks) chunks.push(sub);
      continue;
    }

    // If adding this paragraph would overflow, flush first.
    if (current.length + para.length + 2 > chunkSize) {
      flush();
    }
    current += (current ? '\n\n' : '') + para;
  }
  flush();

  // Step 2: apply overlap by prepending the tail of the previous chunk.
  return applyOverlap(chunks, chunkOverlap);
}

/**
 * Split a single oversized unit (paragraph) into chunkSize pieces.
 * Tries sentence boundaries first, then hard-cuts as a last resort.
 */
function splitLongUnit(text, chunkSize) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  /** @type {string[]} */
  const out = [];
  let current = '';

  for (const sentence of sentences) {
    if (sentence.length > chunkSize) {
      // Sentence itself is huge — hard cut.
      if (current) {
        out.push(current.trim());
        current = '';
      }
      for (let i = 0; i < sentence.length; i += chunkSize) {
        out.push(sentence.slice(i, i + chunkSize));
      }
      continue;
    }
    if (current.length + sentence.length + 1 > chunkSize) {
      out.push(current.trim());
      current = '';
    }
    current += (current ? ' ' : '') + sentence;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

/**
 * For each chunk after the first, prepend the last `overlap` characters of
 * the previous chunk. This creates a sliding-window effect across boundaries.
 */
function applyOverlap(chunks, overlap) {
  if (overlap <= 0 || chunks.length <= 1) return chunks;
  const result = [chunks[0]];
  for (let i = 1; i < chunks.length; i++) {
    const prev = chunks[i - 1];
    const tail = prev.slice(Math.max(0, prev.length - overlap));
    result.push(`${tail} ${chunks[i]}`.trim());
  }
  return result;
}

module.exports = { splitText };
