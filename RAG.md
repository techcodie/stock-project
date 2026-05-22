# RAG Feature — Architecture & Interview Notes

This document explains the AI-powered Financial Report Analysis feature added
to StockTrader. It is written to be read top-to-bottom before an interview.

---

## 1. What this feature does

Users upload a financial PDF (annual report, 10-K, earnings release) and ask
natural-language questions about it. The system retrieves the most relevant
excerpts and asks an LLM to compose a grounded answer with source citations.

Example questions it can answer:

- "What risks are mentioned in this report?"
- "Summarize quarterly performance."
- "What did management say about AI investments?"

---

## 2. High-level architecture

```
React (Vite) ──► Express API ──► AI module ──► Postgres (pgvector)
                                       │
                                       └─► Google Gemini (embeddings + chat)
```

Key design point: **the AI module is a self-contained subsystem inside the
existing Express backend.** No new servers, no microservices. The existing
JWT auth, controllers, and routes are untouched.

---

## 3. The RAG flow (two paths)

### Ingestion (one-time per document)

```
PDF buffer
   │
   ▼
pdfParser.parsePdf  →  plain text
   │
   ▼
textSplitter.splitText  →  ~1000-char chunks with overlap
   │
   ▼
geminiEmbeddings.embedMany  →  768-dim vectors
   │
   ▼
pgVectorStore.upsertChunks  →  rows in `chunks` table
```

### Query (per user question)

```
User question
   │
   ▼
geminiEmbeddings.embedOne  →  query vector
   │
   ▼
pgVectorStore.searchSimilar  →  top-4 chunks for this documentId
   │                          (cosine distance via pgvector `<=>`)
   ▼
ragPrompts.buildRagPrompt  →  system prompt + context + question
   │
   ▼
chatModel.generateContent (Gemini)  →  answer
   │
   ▼
Returned to UI with sources for citation display
```

---

## 4. Folder structure

```
backend/
├── ai/
│   ├── llm/geminiClient.js          # one shared SDK client
│   ├── pdf/pdfParser.js             # PDF buffer -> text
│   ├── chunking/textSplitter.js     # recursive splitter with overlap
│   ├── embeddings/geminiEmbeddings.js  # embedOne / embedMany
│   ├── vectorstore/pgVectorStore.js # upsertChunks + searchSimilar (raw SQL)
│   ├── prompts/ragPrompts.js        # system prompt + buildRagPrompt
│   ├── rag/ragPipeline.js           # orchestrator (ingest / answer)
│   ├── aiController.js              # HTTP handlers
│   └── aiRoutes.js                  # mounted at /api/ai
├── middleware/uploadMiddleware.js   # multer config for PDFs
├── uploads/                         # PDF storage (gitignored)
└── prisma/schema.prisma             # adds Document + Chunk + pgvector ext

frontend/src/
├── pages/AIResearch.jsx             # 2-col layout: upload+list / chat
└── components/ai/
    ├── PDFUpload.jsx                # drag-and-drop + file picker
    ├── DocumentList.jsx             # sidebar list, select/delete
    ├── ChatBox.jsx                  # message list + input
    └── MessageBubble.jsx            # one message, expandable sources
```

Each folder under `ai/` has **one responsibility**. You can read the names and
guess what's inside — that's the goal.

---

## 5. Key technical choices and WHY

### Why Gemini (vs OpenAI)
- Generous free tier — no credit card required for dev/demo.
- One SDK covers both chat (`gemini-2.5-flash`) and embeddings (`gemini-embedding-001`).
- Embeddings are Matryoshka-style — we request 768-dim output via the `outputDimensionality` parameter to match our pgvector column without changing the schema.

### Why no framework (vanilla JS, no LangChain)
- The RAG pipeline is ~80 lines of clear code. You can read it end-to-end and
  explain every step in an interview.
- LangChain hides chunking and retrieval behind abstractions. Without it you
  *are* the abstraction — interviewers can ask "how does retrieval work?" and
  you point at `ragPipeline.js` and `pgVectorStore.js`.

### Why pgvector (vs ChromaDB / Pinecone)
- We already deploy Postgres on Render. Adding the `vector` extension is one
  line in the schema; no new service, no new credentials, no extra deploy.
- One database to back up, migrate, and reason about. The "single source of
  truth" architecture story is strong.
- Performance is more than enough for thousands of chunks per user.

### Why store PDFs on local disk (vs S3)
- Phase 1 priority is making the feature work and explainable. S3 adds an
  external dependency and IAM complexity that we don't need yet.
- Render's persistent disk works for production demos. S3 is a Phase 2 swap
  via a `storageService` interface if needed.

### Why ~1000-char chunks with 150-char overlap
- Small enough to be specific (one financial fact per chunk on average).
- Large enough to contain a complete sentence or two for meaningful retrieval.
- Overlap prevents losing answers that span a chunk boundary.

### Why retrieve top-4 chunks (not top-1 or top-10)
- Top-1 is brittle — the single best chunk might miss adjacent context.
- Top-10 dilutes the prompt with weakly-related chunks and risks confusing
  the LLM with off-topic context.
- Top-4 strikes a good balance for financial documents where related
  information often appears in nearby sections.

---

## 6. Data model

```prisma
model Document {
  id        String   @id @default(uuid())
  userId    String
  filename  String
  filePath  String
  fileSize  Int
  status    String   @default("processing") // processing | ready | failed
  pageCount Int?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  chunks    Chunk[]
}

model Chunk {
  id         String                     @id @default(uuid())
  documentId String
  content    String                     @db.Text
  chunkIndex Int
  embedding  Unsupported("vector(768)") // pgvector type, accessed via raw SQL
  document   Document                   @relation(fields: [documentId], references: [id], onDelete: Cascade)
}
```

Cascading deletes mean deleting a document cleans up all its chunks
automatically. No orphan rows.

---

## 7. API endpoints

| Method | Path | Auth | Body / Form | Returns |
|---|---|---|---|---|
| POST | `/api/ai/upload` | ✓ | multipart `file` | `{ documentId, chunkCount, pageCount }` |
| POST | `/api/ai/chat` | ✓ | `{ documentId, question }` | `{ answer, sources[] }` |
| GET | `/api/ai/documents` | ✓ | — | `[{ id, filename, status, ... }]` |
| DELETE | `/api/ai/documents/:id` | ✓ | — | `{ success }` |

All routes are behind the same `authMiddleware` used by the rest of the app —
the AI feature plugs into the existing JWT flow.

---

## 8. Interview questions you should be able to answer

### "Walk me through what happens when a user asks a question."
1. The browser POSTs `{ documentId, question }` to `/api/ai/chat` with the JWT.
2. The controller verifies the document belongs to this user.
3. We call Gemini's embedding API on the question → 768-dim vector.
4. We run a SQL query against the `chunks` table: `ORDER BY embedding <=> $1::vector LIMIT 4` to get the 4 most semantically similar chunks for this document.
5. We assemble a prompt: a system prompt that says "answer only from the provided context" + the 4 chunks + the user's question.
6. We call Gemini's chat model with that prompt.
7. We return the answer along with the source chunks so the UI can show citations.

### "What is RAG and why use it instead of fine-tuning?"
RAG = Retrieval-Augmented Generation. Instead of training a custom model on
documents, we retrieve relevant passages at query time and inject them into
the prompt. Advantages: no training cost, immediately incorporates new
documents, the answer is grounded in citable sources, and you can confine
the model to a specific document trivially. Tradeoff: latency is higher than
a fine-tuned model, and answer quality depends on retrieval quality.

### "How do you chunk the text and why?"
Recursive paragraph-first splitting with overlap. We split on `\n\n` first,
fall back to sentence boundaries if a paragraph exceeds the chunk size, and
hard-cut as a last resort. We add a 150-character overlap between consecutive
chunks so that information spanning a boundary doesn't get lost during
retrieval.

### "How does similarity search actually work?"
We use pgvector's cosine distance operator `<=>`. Cosine distance is
`1 - cosine_similarity`. Smaller distance = more similar. The embeddings are
points in a 768-dimensional space where semantically similar texts cluster
together. The query: find the 4 chunks (filtered to this document) whose
embedding has the smallest cosine distance to the question's embedding.

### "Why is the LLM grounded? How do you prevent hallucinations?"
Two reinforcing techniques:
1. **Prompt engineering** — the system prompt explicitly says "Base every
   claim on the provided context. If the context does not contain the answer,
   say 'The document does not appear to discuss this.'"
2. **Context-only retrieval** — we never give the LLM the full document, only
   the top-4 chunks. So even if it tried to use general knowledge, the
   context is the obvious source.
We also return the source chunks to the user so they can verify any answer.

### "What would you do differently at scale?"
- Move PDF storage to S3 with signed URLs.
- Move PDF parsing to a background job queue (Bull/SQS) so uploads return immediately.
- Add an ANN index (`ivfflat` or `hnsw`) on the `chunks.embedding` column once we exceed ~100k rows — pgvector supports both.
- Cache embeddings of common questions.
- Add evaluation metrics (recall@k on a held-out QA set) and observability.

### "Why local disk for files? Won't that break in production?"
For Phase 1 demo, local disk + Render's persistent disk is sufficient and
removes the S3 dependency. The `pdfParser` already accepts a `Buffer`, so
swapping to S3 is just changing the read source in `aiController.uploadDocument`.

### "What's the tradeoff of using pgvector vs a dedicated vector DB?"
**Pros**: one DB to operate, one backup story, transactional consistency with the rest of the app, no extra deployment.
**Cons**: less specialized features than purpose-built vector DBs (no built-in
re-ranking, less aggressive indexing modes), and you pay for the same DB
resources for both transactional and vector queries.
For a project at our scale, the simplicity wins.

---

## 9. Common pitfalls and how I avoided them

1. **pgvector extension not enabled** → migration explicitly runs `CREATE EXTENSION IF NOT EXISTS vector` at the top.
2. **Prisma can't model the `vector` type** → I use `Unsupported("vector(768)")` in the schema and write raw SQL for inserts and similarity queries. Everything else stays Prisma-managed.
3. **Vector literal formatting** → pgvector expects `'[0.1,0.2,...]'::vector`. I built a `toVectorLiteral()` helper to avoid format bugs.
4. **Rate limits on embeddings** → `embedMany` uses a concurrency cap (5 parallel calls) to stay under Gemini's per-minute limits.
5. **PDFs with no extractable text (scanned images)** → caught in `ragPipeline.ingestDocument` and surfaced with a clear error.
6. **Access control on chat** → `answerQuestion` verifies `document.userId === requestingUserId` before retrieval.

---

## 10. What this feature adds to the project pitch

> *"StockTrader started as a virtual trading platform. I extended it into an
> AI-powered financial research tool: users upload SEC filings or earnings
> reports and ask grounded questions about them. I built the full RAG
> pipeline myself — PDF parsing, chunking with overlap, embedding generation
> via Gemini, vector storage in Postgres with the pgvector extension, and
> citation-grounded answer generation. The architecture is intentionally
> simple: one database, one model provider, no framework. Every component
> can be explained in one sentence."*
