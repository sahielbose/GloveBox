import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

/**
 * Provider-agnostic LLM client. Today it wraps Anthropic Claude; the surface
 * (complete / extract / chat) is deliberately model-neutral so a GPT-class
 * provider can be swapped behind it.
 *
 * The trust-critical verbs (pricing math, recall matching, DTC lookup, urgency
 * rules) are deterministic and DO NOT depend on this client. The LLM only adds
 * plain-English explanation and free-text extraction. When no ANTHROPIC_API_KEY
 * is set, complete()/extract() throw LLMUnavailableError and callers fall back to
 * a clearly-labeled deterministic path — the app stays fully usable offline.
 */

export class LLMUnavailableError extends Error {
  constructor() {
    super("LLM unavailable: ANTHROPIC_API_KEY is not set (offline mode).");
    this.name = "LLMUnavailableError";
  }
}

export function isLLMAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

const MODEL = () => process.env.LLM_MODEL ?? "claude-sonnet-4-6";

let _client: Anthropic | null = null;
function anthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new LLMUnavailableError();
  _client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type CompleteOptions = {
  system?: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  /** Returned verbatim when the LLM is unavailable, instead of throwing. */
  offline?: string;
};

/** Free-text completion. */
export async function complete(opts: CompleteOptions): Promise<string> {
  if (!isLLMAvailable()) {
    if (opts.offline !== undefined) return opts.offline;
    throw new LLMUnavailableError();
  }
  const resp = await anthropic().messages.create({
    model: MODEL(),
    max_tokens: opts.maxTokens ?? 1024,
    temperature: opts.temperature ?? 0.2,
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
  });
  return resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

/** Multi-turn chat (assistant). Returns assistant text. */
export async function chat(opts: {
  system?: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  if (!isLLMAvailable()) throw new LLMUnavailableError();
  const resp = await anthropic().messages.create({
    model: MODEL(),
    max_tokens: opts.maxTokens ?? 1024,
    temperature: opts.temperature ?? 0.3,
    system: opts.system,
    messages: opts.messages,
  });
  return resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

/**
 * Structured extraction. Forces a single tool call whose input is validated
 * against the provided zod schema, retrying once with the validation error fed
 * back if the model returns a malformed object.
 */
export async function extract<T>(opts: {
  system?: string;
  prompt: string;
  schema: z.ZodType<T>;
  schemaName?: string;
  description?: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<T> {
  if (!isLLMAvailable()) throw new LLMUnavailableError();

  const name = opts.schemaName ?? "result";
  const jsonSchema = toAnthropicSchema(opts.schema);
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: opts.prompt },
  ];

  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const resp = await anthropic().messages.create({
      model: MODEL(),
      max_tokens: opts.maxTokens ?? 1500,
      temperature: opts.temperature ?? 0,
      system: opts.system,
      tools: [
        {
          name,
          description: opts.description ?? "Return the structured result.",
          input_schema: jsonSchema as Anthropic.Tool.InputSchema,
        },
      ],
      tool_choice: { type: "tool", name },
      messages,
    });
    const block = resp.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );
    const parsed = opts.schema.safeParse(block?.input);
    if (parsed.success) return parsed.data;
    lastErr = parsed.error;
    // Feed the error back and retry once.
    messages.push({ role: "assistant", content: resp.content });
    messages.push({
      role: "user",
      content: `That did not match the required schema: ${parsed.error.message}. Call the ${name} tool again with corrected output.`,
    });
  }
  throw new Error(
    `extract(${name}) failed schema validation after retry: ${String(lastErr)}`,
  );
}

function toAnthropicSchema(schema: z.ZodType): Record<string, unknown> {
  const js = z.toJSONSchema(schema, { target: "draft-7" }) as Record<
    string,
    unknown
  >;
  delete js.$schema;
  if (js.type !== "object") {
    // Anthropic requires an object top-level input schema.
    return { type: "object", properties: { value: js }, required: ["value"] };
  }
  return js;
}
