/**
 * Seed Sample Documents
 *
 * Creates 3 ready-to-query "financial report" documents for every user, so a
 * new user can hit AI Research and start asking questions immediately without
 * uploading a PDF first.
 *
 * Run:
 *   node scripts/seedSamples.js               # seed for all users
 *   node scripts/seedSamples.js <user-email>  # seed for one user
 *
 * Idempotent: if a sample with the same filename already exists for the user,
 * it is skipped — running this multiple times is safe.
 *
 * Note: this script bypasses pdfParser (no real PDF) and feeds the sample text
 * directly through chunking → embedding → vector store. From the chat layer's
 * perspective, the resulting documents look identical to uploaded PDFs.
 */
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { splitText } = require('../ai/chunking/textSplitter');
const { embedMany } = require('../ai/embeddings/geminiEmbeddings');
const { upsertChunks } = require('../ai/vectorstore/pgVectorStore');

const prisma = new PrismaClient();

const SAMPLES = [
  {
    filename: 'TechCorp_2025_Annual_Report.pdf',
    pageCount: 18,
    text: `
TechCorp Inc. — Annual Report 2025
Letter from the Chief Executive Officer

Fiscal year 2025 was a pivotal year for TechCorp. Total revenue reached $4.82 billion, an increase of 14.3% year over year, driven primarily by strong demand for our Cloud Platform segment, which grew 32% to $1.71 billion. Gross margin improved to 68.4%, up from 65.1% in the prior year, reflecting greater operating leverage in our subscription business and a more favorable product mix.

Operating income for the year was $812 million, or 16.8% of revenue, compared to $604 million in fiscal 2024. Net income attributable to common shareholders was $611 million, or $2.94 per diluted share. We returned $340 million to shareholders through share repurchases and initiated our first quarterly dividend in the fourth quarter.

Strategic Highlights

Our investments in artificial intelligence continued at an accelerated pace. We deployed AI-powered features across 73% of our product surface area, including our flagship Workspace and Cloud Platform offerings. Customer adoption of AI features more than doubled, and we believe AI-driven differentiation is now a primary reason customers choose TechCorp over competitors. We expect AI investment to remain a meaningful component of operating expense in fiscal 2026, with capital expenditure for AI infrastructure planned at approximately $920 million, up from $510 million in 2025.

In April 2025, we completed our acquisition of NimbleStack, a data observability company, for $480 million in cash. The integration is on track, and NimbleStack’s capabilities are now embedded in our Cloud Platform’s monitoring tier. We expect the acquisition to be modestly accretive to earnings in fiscal 2027.

Business Segments

TechCorp operates in three reportable segments: Workspace, Cloud Platform, and Developer Tools. Workspace revenue was $2.31 billion, up 6%, with subscription revenue representing 88% of segment revenue. Cloud Platform revenue grew to $1.71 billion, up 32%, as enterprise customers continued migrating workloads to managed services. Developer Tools revenue was $800 million, up 9%, supported by growth in our open-source-aligned commercial editions.

Risk Factors (Summary)

Our business is subject to a number of material risks that investors should consider. First, the markets we serve are highly competitive and rapidly evolving; competitors include both well-capitalized technology incumbents and emerging startups. Failure to keep pace with technological change, particularly in generative AI, could harm our competitive position. Second, our growth depends on the continued ability to attract and retain enterprise customers; the loss of one or more large customers could materially affect our revenue. Third, we operate critical infrastructure on third-party hyperscale clouds and are exposed to outages, pricing changes, and concentration risk with those providers. Fourth, regulatory developments around data privacy, AI safety, and cross-border data transfer may impose new compliance obligations and could affect product design. Fifth, foreign currency fluctuations affected reported revenue by approximately 180 basis points in fiscal 2025.

Outlook

For fiscal 2026, we expect total revenue of $5.45 to $5.55 billion, representing growth of 13–15% year over year. We expect operating margin to expand by approximately 100 basis points to a range of 17.5–18.0%. We plan to continue investing aggressively in AI infrastructure, security, and global expansion, while maintaining capital discipline. We expect free cash flow conversion of approximately 95% of net income.

We are grateful for the continued trust of our customers, employees, and shareholders.

Sincerely,
Jordan A. Chen
Chief Executive Officer
`,
  },
  {
    filename: 'CloudServices_Q3_2025_Earnings.pdf',
    pageCount: 9,
    text: `
Cloud Services Inc. — Third Quarter Fiscal 2025 Earnings Release

Q3 Financial Summary

Cloud Services Inc. today reported financial results for the third quarter of fiscal year 2025, ended September 30, 2025. Total revenue was $1.24 billion, an increase of 28% year over year and 7% sequentially. Subscription revenue, which represents 92% of total revenue, grew 31% year over year to $1.14 billion. Net revenue retention was 121%, indicating strong expansion within existing customer accounts.

Gross profit was $940 million, representing a gross margin of 75.8%, up 130 basis points from the same quarter last year. Operating income was $182 million, or 14.7% of revenue, compared with $98 million, or 10.1% of revenue, in Q3 fiscal 2024. Net income was $137 million, or $0.78 per diluted share. Cash flow from operations was $310 million, and free cash flow was $268 million.

We ended the quarter with $2.94 billion in cash, cash equivalents, and short-term investments, and zero long-term debt.

Customer Highlights

We added 412 net new customers during the quarter, bringing the total customer count to 14,210. Customers contributing more than $1 million in annual recurring revenue grew to 218, up from 154 a year ago. Notable new logo wins included a Fortune 100 financial services firm and a leading European industrial conglomerate.

Operational Commentary from Management

“This was the strongest quarter in our company’s history,” said Priya Ramaswamy, Chief Executive Officer. “The combination of disciplined go-to-market execution and our recent AI-assisted onboarding features is producing meaningfully better conversion and faster time-to-value. We are seeing customers expand seat counts and adopt premium tiers earlier in their lifecycle.”

Chief Financial Officer Andrew Kim added: “We expanded operating margin while continuing to invest in product and platform. AI infrastructure spend grew to $48 million in the quarter, up from $19 million a year ago. We will continue investing into this area where we see strong returns, but we also remain committed to expanding non-GAAP operating margin by 200–300 basis points annually over the next two years.”

Guidance

For the fourth quarter of fiscal 2025, the company expects total revenue between $1.31 billion and $1.33 billion, representing growth of 26–28% year over year. Non-GAAP operating margin is expected to be in the range of 16–17%. For the full year, the company is raising its revenue guidance to a range of $4.85 to $4.88 billion, up from the prior range of $4.74 to $4.78 billion.

Conference Call

A conference call will be held today at 5:00 PM Eastern Time. A replay will be available on the investor relations website.
`,
  },
  {
    filename: 'GlobalBank_2025_10-K_Risk_Factors.pdf',
    pageCount: 24,
    text: `
GlobalBank Holdings — Form 10-K, Item 1A: Risk Factors (Excerpt)

The following discussion sets forth the material risks that we believe could affect our business, financial condition, and results of operations. The risks described below are not the only risks we face; additional risks not currently known to us or that we currently consider immaterial may also impair our business.

1. Macroeconomic and Interest Rate Risk

Our financial performance is significantly affected by general economic conditions, including the level of inflation, employment, GDP growth, consumer confidence, and most importantly, the trajectory of central bank interest rates. A sustained period of low or declining interest rates would compress our net interest margin, which was 2.94% in 2025. A sharp rise in rates, on the other hand, could pressure the value of our held-to-maturity securities portfolio and reduce mortgage originations. We hedge a portion of our interest-rate exposure using derivatives, but these hedges may not fully offset adverse movements.

2. Credit Risk

Loan losses are an inherent part of our business. As of December 31, 2025, our allowance for credit losses was $4.82 billion, or 1.32% of total loans. A material deterioration in macroeconomic conditions, particularly in commercial real estate and small business lending, could require us to increase our provisions for credit losses, which would reduce earnings. Approximately 18% of our commercial real estate exposure is in office properties, a segment that has experienced elevated vacancy rates in major metropolitan markets.

3. Liquidity and Funding Risk

We rely on a combination of customer deposits, wholesale funding, and access to capital markets to fund our operations. Approximately 64% of our deposits are insured, and approximately 11% are deposits in excess of insured limits held by commercial customers. A loss of customer confidence in the banking sector, even if not directly attributable to us, could trigger rapid deposit outflows. We maintain a liquidity coverage ratio of 128%, comfortably above regulatory minimums, but a severe stress event could still pressure our funding profile.

4. Regulatory and Compliance Risk

We operate in a heavily regulated industry. Recent and ongoing regulatory developments — including revisions to Basel III capital requirements, expanded supervisory expectations around climate-related financial risk, and new consumer protection rules in our cards and consumer lending businesses — may require us to hold higher capital, change product features, or increase compliance investment. Non-compliance could result in fines, restrictions on business activities, or reputational harm.

5. Cybersecurity and Operational Risk

We process millions of customer transactions daily across digital, branch, and ATM channels. A successful cyberattack, fraud event, or major operational outage could result in financial loss, regulatory scrutiny, and erosion of customer trust. We invested $612 million in cybersecurity and technology resilience in 2025, but the threat landscape continues to evolve rapidly, particularly in light of AI-enabled attack techniques.

6. Climate and Transition Risk

Physical climate risks (such as hurricanes and wildfires affecting collateral values in our mortgage portfolio) and transition risks (such as a faster-than-expected shift away from carbon-intensive industries to which we have lending exposure) could impact loan quality and capital. We have committed to net-zero financed emissions by 2050 and have begun integrating climate scenarios into our credit risk frameworks.

7. Strategic and Competitive Risk

The financial services industry is being reshaped by financial technology firms, large technology platforms entering payments and lending, and the rise of digital-native challenger banks. Our ability to invest in differentiated digital experiences, AI-powered personalization, and platform partnerships is critical to retaining and expanding our customer base, particularly among younger demographics.

8. Geopolitical Risk

We operate in 38 countries. Heightened geopolitical tension, sanctions regimes, and the fragmentation of global trade could affect our cross-border banking activities, increase operational complexity, and elevate compliance costs.
`,
  },
];

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

async function seedForUser(user) {
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

    const doc = await prisma.document.create({
      data: {
        userId: user.id,
        filename: sample.filename,
        filePath: `seed://${sample.filename}`,
        fileSize: Buffer.byteLength(sample.text, 'utf8'),
        status: 'processing',
        pageCount: sample.pageCount,
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

  console.log(`[seed] Seeding ${SAMPLES.length} sample documents for ${users.length} user(s)`);

  for (const u of users) {
    await seedForUser(u);
  }

  console.log('\n[seed] Done.');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
