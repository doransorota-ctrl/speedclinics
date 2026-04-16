import OpenAI from "openai";

/**
 * AI Client — uses OpenAI Responses API for GPT-5.4 family.
 * Falls back to Chat Completions for older models or Anthropic.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
}

const provider = process.env.AI_PROVIDER || "openai";
const model = process.env.AI_MODEL || "gpt-5.4-mini";

function getClient(): OpenAI {
  if (provider === "anthropic") {
    return new OpenAI({
      apiKey: process.env.AI_API_KEY,
      baseURL: "https://api.anthropic.com/v1/",
      timeout: 30_000,
    });
  }

  return new OpenAI({
    apiKey: process.env.AI_API_KEY,
    timeout: 30_000,
  });
}

let _client: OpenAI | null = null;
function client(): OpenAI {
  if (!_client) _client = getClient();
  return _client;
}

/** Check if model supports the Responses API (GPT-5.x family). */
function useResponsesAPI(): boolean {
  return provider === "openai" && model.startsWith("gpt-5");
}

/** Send a request to the AI provider. Uses Responses API for GPT-5.x, Chat Completions for others. */
export async function chat(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> {
  const { maxTokens = 500 } = options;

  if (useResponsesAPI()) {
    return chatResponses(messages, maxTokens);
  }
  return chatCompletions(messages, options);
}

/** GPT-5.x via Responses API — passes CoT, low verbosity for short WhatsApp messages. */
async function chatResponses(
  messages: ChatMessage[],
  maxTokens: number
): Promise<string> {
  // Convert messages to Responses API input format
  const input: Array<{ role: string; content: string }> = [];

  // System message becomes a developer instruction
  const systemMsg = messages.find((m) => m.role === "system");
  if (systemMsg) {
    input.push({ role: "developer", content: systemMsg.content });
  }

  // Add user/assistant messages
  for (const msg of messages) {
    if (msg.role === "system") continue;
    input.push({ role: msg.role, content: msg.content });
  }

  const response = await (client() as any).responses.create({
    model,
    input,
    reasoning: { effort: "low" },
    text: { verbosity: "low" },
    max_output_tokens: maxTokens,
  });

  const content = response.output_text;
  if (!content || content.trim() === "") {
    console.error("[AI] Empty response from model");
    return "Sorry, er ging iets mis. Probeer het nog een keer.";
  }
  return content;
}

/** Legacy Chat Completions API for older models / Anthropic. */
async function chatCompletions(
  messages: ChatMessage[],
  options: ChatOptions
): Promise<string> {
  const { temperature = 0.4, maxTokens = 500 } = options;

  const response = await client().chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  });

  const content = response.choices[0]?.message?.content;
  if (!content || content.trim() === "") {
    console.error("[AI] Empty response from model");
    return "Sorry, er ging iets mis. Probeer het nog een keer.";
  }
  return content;
}
