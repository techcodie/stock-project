/**
 * PDF Generator
 *
 * Converts plain text into a real, page-paginated PDF using pdfkit.
 * Used by the seed migration to turn sample financial-report text into
 * downloadable PDFs that look like genuine uploads.
 *
 * Output style:
 *   - A4 with comfortable margins
 *   - 18pt title at the top of page 1
 *   - 11pt body, generous line gap
 *   - Paragraph breaks preserved (`\n\n` in input → spacing in output)
 */
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

/**
 * Write a PDF to disk.
 *
 * @param {object} params
 * @param {string} params.title   shown at the top of page 1
 * @param {string} params.text    body text (paragraphs separated by blank lines)
 * @param {string} params.outputPath  absolute filesystem path
 * @returns {Promise<{ pageCount: number }>}
 */
function generatePdf({ title, text, outputPath }) {
  return new Promise((resolve, reject) => {
    // Ensure target directory exists.
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 64, bottom: 64, left: 64, right: 64 },
      info: { Title: title },
    });

    let pageCount = 1;
    doc.on('pageAdded', () => {
      pageCount += 1;
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Title
    doc.fontSize(18).font('Helvetica-Bold').text(title, { align: 'left' });
    doc.moveDown(1.2);

    // Body — split into paragraphs and write each with spacing in between.
    doc.fontSize(11).font('Helvetica');
    const paragraphs = text.replace(/\r\n/g, '\n').trim().split(/\n{2,}/);
    paragraphs.forEach((p, idx) => {
      doc.text(p.trim(), { align: 'left', lineGap: 4 });
      if (idx !== paragraphs.length - 1) doc.moveDown(0.8);
    });

    doc.end();
    stream.on('finish', () => resolve({ pageCount }));
    stream.on('error', reject);
  });
}

module.exports = { generatePdf };
