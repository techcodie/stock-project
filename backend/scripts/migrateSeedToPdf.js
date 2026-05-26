/**
 * Migrate Seeded Documents to Real PDFs
 *
 * Problem this fixes:
 *   The original seed script stored sample documents with filePath="seed://..."
 *   (a marker, no real file). When a user clicks "Download" in the UI, we
 *   want them to get a real PDF — not a text rendition.
 *
 * What this script does:
 *   1. Generates 3 real PDFs from the SAMPLES sample text and writes them to
 *      backend/uploads/seed/  (one PDF per sample, shared across all users).
 *   2. Finds every Document row whose filePath starts with "seed://" and
 *      updates filePath to point to the corresponding real PDF on disk.
 *   3. Does NOT touch chunks/embeddings — those are already correct.
 *
 * Safe to re-run: it overwrites the seed PDFs and updates filePath again,
 * but skips embedding work entirely. No Gemini quota burned.
 *
 * Run:
 *   node scripts/migrateSeedToPdf.js
 */
require('dotenv').config();

const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { SAMPLES } = require('./aiSampleData');
const { generatePdf } = require('../ai/pdf/pdfGenerator');

const prisma = new PrismaClient();

// Where the shared seed PDFs live.
const SEED_DIR = path.resolve(__dirname, '..', 'uploads', 'seed');

async function main() {
  fs.mkdirSync(SEED_DIR, { recursive: true });

  // ---- Step 1: generate one PDF per sample (shared across all users) ----
  /** @type {Record<string, { absolutePath: string, pageCount: number }>} */
  const fileByFilename = {};

  for (const sample of SAMPLES) {
    const title = sample.filename.replace(/_/g, ' ').replace(/\.pdf$/i, '');
    const absolutePath = path.join(SEED_DIR, sample.filename);
    const { pageCount } = await generatePdf({
      title,
      text: sample.text,
      outputPath: absolutePath,
    });
    fileByFilename[sample.filename] = { absolutePath, pageCount };
    console.log(`Generated PDF (${pageCount} pages): ${absolutePath}`);
  }

  // ---- Step 2: update DB rows ----
  // Find every document still pointing to seed:// markers.
  const seededDocs = await prisma.document.findMany({
    where: { filePath: { startsWith: 'seed://' } },
    select: { id: true, filename: true, userId: true },
  });

  console.log(`\nFound ${seededDocs.length} seeded Document rows to migrate.`);

  let migrated = 0;
  let skipped = 0;
  for (const doc of seededDocs) {
    const target = fileByFilename[doc.filename];
    if (!target) {
      console.warn(`  ! Skipping ${doc.filename} — no matching sample PDF`);
      skipped += 1;
      continue;
    }

    // Use a path relative to backend/ so it works regardless of where the
    // server is run from (multer also stores relative paths like "uploads/...").
    const relativePath = path.relative(path.resolve(__dirname, '..'), target.absolutePath);
    const stat = fs.statSync(target.absolutePath);

    await prisma.document.update({
      where: { id: doc.id },
      data: {
        filePath: relativePath,
        fileSize: stat.size,
        pageCount: target.pageCount,
      },
    });
    migrated += 1;
  }

  console.log(`\nDone. Migrated ${migrated}, skipped ${skipped}.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
