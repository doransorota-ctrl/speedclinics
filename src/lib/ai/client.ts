import OpenAI from "openai";

/**
 * AI Client — uses OpenAI Responses API for GPT-5.4 family.
 * Supports tool calling for the clinic assistant.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
}

interface ToolCallResult {
  name: string;
  callId: string;
  arguments: string;
}

export interface ChatWithToolsResult {
  reply: string;
  toolCalls: ToolCallResult[];
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

function useResponsesAPI(): boolean {
  return provider === "openai" && model.startsWith("gpt-5");
}

/** Simple chat without tools */
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

/** Chat with tool calling support (Responses API only) */
export async function chatWithTools(
  messages: ChatMessage[],
  tools: unknown[],
  toolExecutor: (name: string, args: string) => Promise<string>,
  options: ChatOptions = {}
): Promise<string> {
  const { maxTokens = 500 } = options;

  if (!useResponsesAPI()) {
    // Fallback: no tool support, just regular chat
    return chat(messages, options);
  }

  // Build input
  const input: Array<Record<string, unknown>> = [];
  const systemMsg = messages.find((m) => m.role === "system");
  if (systemMsg) {
    input.push({ role: "developer", content: systemMsg.content });
  }
  for (const msg of messages) {
    if (msg.role === "system") continue;
    input.push({ role: msg.role, content: msg.content });
  }

  // First call — model may call tools or respond directly
  let response = await (client() as any).responses.create({
    model,
    input,
    tools,
    reasoning: { effort: "low" },
    text: { verbosity: "low" },
    max_output_tokens: maxTokens,
  });

  // Tool call loop — max 3 iterations to prevent infinite loops
  let iterations = 0;
  while (iterations < 3) {
    const toolCalls = (response.output || []).filter(
      (item: any) => item.type === "function_call"
    );

    if (toolCalls.length === 0) break;

    // Execute each tool call and add results to input
    const newInput = [...input, ...response.output];
    for (const toolCall of toolCalls) {
      console.log(`[AI] Tool call: ${toolCall.name}(${toolCall.arguments})`);
      const result = await toolExecutor(toolCall.name, toolCall.arguments);
      console.log(`[AI] Tool result: ${result.slice(0, 200)}...`);
      newInput.push({
        type: "function_call_output",
        call_id: toolCall.call_id,
        output: result,
      });
    }

    // Call model again with tool results
    response = await (client() as any).responses.create({
      model,
      input: newInput,
      tools,
      reasoning: { effort: "low" },
      text: { verbosity: "low" },
      max_output_tokens: maxTokens,
    });

    iterations++;
  }

  // Extract text response
  const textOutput = response.output_text;
  if (!textOutput || textOutput.trim() === "") {
    console.error("[AI] Empty response after tool calling");
    return "Sorry, er ging iets mis. Probeer het nog een keer.";
  }

  return textOutput;
}

/** GPT-5.x via Responses API */
async function chatResponses(
  messages: ChatMessage[],
  maxTokens: number
): Promise<string> {
  const input: Array<{ role: string; content: string }> = [];

  const systemMsg = messages.find((m) => m.role === "system");
  if (systemMsg) {
    input.push({ role: "developer", content: systemMsg.content });
  }

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

/** Legacy Chat Completions API */
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
