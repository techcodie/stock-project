/**
 * Prompt Templates for RAG
 *
 * Keeping prompts in one file makes them easy to tune without touching the
 * pipeline logic. Treat prompts as configuration — small wording changes
 * meaningfully affect answer quality.
 */

/**
 * The system prompt sets the model's role and rules.
 * Three rules matter most:
 *  1. Stay grounded — answer only from the provided context.
 *  2. Admit ignorance — don't hallucinate when context is insufficient.
 *  3. Cite — reference which chunk(s) supported the answer.
 */
const SYSTEM_PROMPT = `You are a careful financial-report analyst. You answer questions about a single financial document (e.g., an annual report, 10-K, or earnings release) using ONLY the context excerpts provided below.

Rules:
- Base every claim on the provided context. Do not use outside knowledge.
- If the context does not contain the answer, say: "The document does not appear to discuss this." Do not guess.
- Quote numbers and figures exactly as they appear in the context.
- When helpful, refer to the source excerpts by their number (e.g., "[Source 2]") so the user can verify.
- Keep answers concise (3–6 sentences) unless the user asks for a longer summary.`;

/**
 * Build the full user-side prompt that bundles the retrieved chunks
 * and the user's question. The model sees [SYSTEM_PROMPT] then this string.
 */
function buildRagPrompt(question, chunks) {
  const contextBlock = chunks
    .map(
      (c, i) =>
        `[Source ${i + 1}] (chunk #${c.chunkIndex})\n${c.content}`,
    )
    .join('\n\n---\n\n');

  return `Context excerpts from the document:
${contextBlock}

---

User question: ${question}

Answer:`;
}

module.exports = {
  SYSTEM_PROMPT,
  buildRagPrompt,
};
