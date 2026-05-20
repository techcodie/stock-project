/**
 * PDF Parser
 * Extracts plain text from a PDF buffer using pdf-parse (v1).
 *
 * Returns { text, pageCount }.
 * Throws if the PDF is corrupted or password-protected.
 */
const pdf = require('pdf-parse');

/**
 * @param {Buffer} buffer - raw PDF file buffer (from multer or fs.readFile)
 * @returns {Promise<{ text: string, pageCount: number }>}
 */
async function parsePdf(buffer) {
  const data = await pdf(buffer);

  // pdf-parse v1 returns: { text, numpages, info, metadata, version }.
  // We normalize whitespace so chunking is consistent.
  const normalizedText = (data.text || '')
    .replace(/\r\n/g, '\n')      // unify line endings
    .replace(/\n{3,}/g, '\n\n')  // collapse 3+ blank lines into a paragraph break
    .trim();

  return {
    text: normalizedText,
    pageCount: data.numpages || 0,
  };
}

module.exports = { parsePdf };
