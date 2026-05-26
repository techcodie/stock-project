/**
 * Seed Sample Documents
 *
 * Creates 3 ready-to-query "financial report" documents for every user, so a
 * new user can hit AI Research and start asking questions immediately without
 * uploading a PDF first.
 *
 * Each sample is backed by a REAL PDF file generated once and shared across
 * all users (stored under backend/uploads/seed/). That way the "Download"
 * button in the UI returns a real PDF that the user can read independently
 * to verify LLM answers.
 *
 * Run:
 *   node scripts/seedSamples.js               # seed for all users
 *   node scripts/seedSamples.js <user-email>  # seed for one user
 *
 * Idempotent: skips users that already have all samples; the shared seed
 * PDFs are regenerated on every run (cheap, no embedding work).
 */
require('dotenv').config();

const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const { SAMPLES } = require('./aiSampleData');
const { splitText } = require('../ai/chunking/textSplitter');
const { embedMany } = require('../ai/embeddings/geminiEmbeddings');
const { upsertChunks } = require('../ai/vectorstore/pgVectorStore');
const { generatePdf } = require('../ai/pdf/pdfGenerator');

const prisma = new PrismaClient();
const SEED_DIR = path.resolve(__dirname, '..', 'uploads', 'seed');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Embed with automatic retry on 429 (rate limit). Honors the retryDelay hint
 * if Gemini returns one, otherwise uses exponential backoff.
 */
async function embedManyWithRetry(chunks, maxRetries = 5) {
  let attempt = 0;
  while (true) {
    try {
      return await embedMany(chunks);
    } catch (err) {
      const msg = err.message || '';
      const isRateLimit = msg.includes('429') || msg.includes('Too Many Requests');
      if (!isRateLimit || attempt >= maxRetries) throw err;
      const match = msg.match(/retry in (\d+(?:\.\d+)?)s/i);
      const waitSec = match ? Math.ceil(parseFloat(match[1])) + 1 : 2 ** attempt;
      console.log(`    ⏳ rate limited, waiting ${waitSec}s before retry`);
      await sleep(waitSec * 1000);
      attempt++;
    }
  }
}

/**
 * Generate the shared PDFs (one per sample). Returns a map of
 * filename -> { relativePath, fileSize, pageCount }.
 */
async function buildSeedPdfs() {
  fs.mkdirSync(SEED_DIR, { recursive: true });
  const out = {};
  for (const sample of SAMPLES) {
    const absolutePath = path.join(SEED_DIR, sample.filename);
    const title = sample.filename.replace(/_/g, ' ').replace(/\.pdf$/i, '');
    const { pageCount } = await generatePdf({
      title,
      text: sample.text,
      outputPath: absolutePath,
    });
    const stat = fs.statSync(absolutePath);
    // Store path relative to backend/ so it works regardless of CWD.
    const relativePath = path.relative(path.resolve(__dirname, '..'), absolutePath);
    out[sample.filename] = {
      relativePath,
      fileSize: stat.size,
      pageCount,
    };
    console.log(`  ✓ ${relativePath} (${pageCount} pages, ${stat.size} bytes)`);
  }
  return out;
}

async function seedForUser(user, pdfMeta) {
  console.log(`\n[seed] User: ${user.email} (${user.id})`);

  // Idempotency: skip filenames this user already has.
  const existing = await prisma.document.findMany({
    where: {
      userId: user.id,
      filename: { in: SAMPLES.map((s) => s.filename) },
    },
    select: { filename: true },
  });
  const existingNames = new Set(existing.map((d) => d.filename));

  const toSeed = SAMPLES.filter((s) => !existingNames.has(s.filename));
  if (toSeed.length === 0) {
    console.log('  · already has all samples, skipping');
    return;
  }

  for (const sample of toSeed) {
    console.log(`  · seeding: ${sample.filename}`);
    const meta = pdfMeta[sample.filename];

    const doc = await prisma.document.create({
      data: {
        userId: user.id,
        filename: sample.filename,
        filePath: meta.relativePath,
        fileSize: meta.fileSize,
        status: 'processing',
        pageCount: meta.pageCount,
      },
    });

    try {
      const chunks = splitText(sample.text.trim());
      const vectors = await embedManyWithRetry(chunks);
      const records = chunks.map((content, idx) => ({
        content,
        chunkIndex: idx,
        embedding: vectors[idx],
      }));
      await upsertChunks(doc.id, records);
      await prisma.document.update({
        where: { id: doc.id },
        data: { status: 'ready' },
      });
      console.log(`    ✓ ${chunks.length} chunks indexed`);
    } catch (err) {
      await prisma.document.update({
        where: { id: doc.id },
        data: { status: 'failed' },
      });
      console.error(`    ✗ failed: ${err.message.slice(0, 120)}`);
    }
  }
}

async function main() {
  const targetEmail = process.argv[2];

  console.log('[seed] Generating shared seed PDFs...');
  const pdfMeta = await buildSeedPdfs();

  /** @type {{ id: string, email: string }[]} */
  let users;
  if (targetEmail) {
    const u = await prisma.user.findUnique({ where: { email: targetEmail } });
    if (!u) {
      console.error(`No user found with email: ${targetEmail}`);
      process.exit(1);
    }
    users = [u];
  } else {
    users = await prisma.user.findMany({ select: { id: true, email: true } });
  }

  console.log(`\n[seed] Seeding ${SAMPLES.length} sample documents for ${users.length} user(s)`);

  for (const u of users) {
    await seedForUser(u, pdfMeta);
  }

  console.log('\n[seed] Done.');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
