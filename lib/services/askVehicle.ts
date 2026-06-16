import { z } from "zod";
import { chat, isLLMAvailable } from "@/lib/llm/client";
import { retrieve } from "@/lib/rag";
import { type Vehicle, vehicleLabel } from "./types";

export const CitationSchema = z.object({
  n: z.number().int(),
  label: z.string(),
  url: z.string().nullable(),
  snippet: z.string(),
  similarity: z.number(),
});

export const AskResultSchema = z.object({
  answer: z.string(),
  citations: z.array(CitationSchema),
  grounded: z.boolean(),
  llmUsed: z.boolean(),
});
export type AskResult = z.infer<typeof AskResultSchema>;

/**
 * askVehicle — grounded Q&A over the car's retrieved context (curated schedules,
 * cached recall/safety data, the owner's uploaded docs). Answers MUST cite
 * retrieved chunks; if nothing relevant retrieves, it says so rather than invent.
 */
export async function askVehicle(input: {
  question: string;
  vehicle: Vehicle & { id: string };
  history?: { role: "user" | "assistant"; content: string }[];
}): Promise<AskResult> {
  const chunks = await retrieve(input.vehicle.id, input.question, 6);

  const citations = chunks.map((c, i) => ({
    n: i + 1,
    label: c.sourceLabel,
    url: c.sourceUrl,
    snippet: c.content.slice(0, 320),
    similarity: Math.round(c.similarity * 100) / 100,
  }));

  // Nothing retrieved → decline to invent.
  if (chunks.length === 0) {
    return AskResultSchema.parse({
      answer:
        `I don't have anything in your ${vehicleLabel(input.vehicle)}'s context that answers that yet. ` +
        `Try adding documents (owner's manual, insurance, registration) on the vehicle page, or check the Recalls and Maintenance tabs — I only answer from your car's own data, not guesses.`,
      citations: [],
      grounded: false,
      llmUsed: false,
    });
  }

  // No LLM → return the grounded context directly (honest, still cited).
  if (!isLLMAvailable()) {
    const body = citations
      .map((c) => `• [${c.n}] ${c.label}: ${c.snippet}${c.snippet.length >= 320 ? "…" : ""}`)
      .join("\n");
    return AskResultSchema.parse({
      answer:
        `Here's the most relevant information from your car's context (full conversational answers need an ANTHROPIC_API_KEY):\n\n${body}`,
      citations,
      grounded: true,
      llmUsed: false,
    });
  }

  const context = chunks
    .map((c, i) => `[${i + 1}] (${c.sourceLabel})\n${c.content}`)
    .join("\n\n");

  const answer = await chat({
    system:
      "You are GloveBox's assistant, answering ONLY from the provided context about the owner's specific car. " +
      "Cite the sources you use with bracketed numbers like [1], [2] that match the context blocks. " +
      "If the context doesn't contain the answer, say so plainly — do NOT use outside knowledge or invent specifics, " +
      "especially prices, recall campaign numbers, or torque/fluid specs. Keep it plain-English and practical. " +
      "Always remind the owner that this is informational, not a guarantee, when it matters.",
    messages: [
      ...(input.history ?? []),
      {
        role: "user",
        content: `Car: ${vehicleLabel(input.vehicle)}\n\nContext:\n${context}\n\nQuestion: ${input.question}`,
      },
    ],
    maxTokens: 800,
  });

  // Keep only citations actually referenced in the answer (penalize none-cited).
  const used = citations.filter((c) => answer.includes(`[${c.n}]`));
  return AskResultSchema.parse({
    answer,
    citations: used.length ? used : citations,
    grounded: true,
    llmUsed: true,
  });
}
