import { chat, type ChatMessage } from "./client";
import { conversationPrompt, greetingPrompt, salesConversationPrompt, salesGreetingPrompt } from "./prompts";

export type ConversationState =
  | "greeting"
  | "qualifying"
  | "scheduling"
  | "confirmed"
  | "ended";

export interface GatheredInfo {
  customerName?: string;
  problem?: string;
  problemDetails?: string;
  address?: string;
  urgency?: "laag" | "gemiddeld" | "hoog" | "spoed";
  appointmentStart?: string;
  appointmentEnd?: string;
  conversationEnded?: boolean;
}

interface BusinessContext {
  businessName: string;
  trade: string;
  serviceArea?: string;
  ownerName?: string;
}

interface ConversationContext {
  business: BusinessContext;
  state: ConversationState;
  messages: ChatMessage[];
  gatheredInfo: GatheredInfo;
  availableSlots?: string[];
  promptMode?: "service" | "sales";
}

/**
 * Generate the next AI response.
 * Single AI call returns both the WhatsApp reply and extracted info.
 */
export async function generateResponse(
  ctx: ConversationContext,
  customerMessage: string
): Promise<{ reply: string; newState: ConversationState; info: GatheredInfo }> {
  // Add customer message to history
  const messages: ChatMessage[] = [
    ...ctx.messages,
    { role: "user", content: customerMessage },
  ];

  const systemPrompt = ctx.promptMode === "sales"
    ? salesConversationPrompt(ctx.availableSlots, ctx.gatheredInfo)
    : conversationPrompt(ctx.business, ctx.availableSlots, ctx.gatheredInfo);

  const aiMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  const rawReply = await chat(aiMessages, {
    temperature: 0.4,
    maxTokens: 400,
  });

  // Parse reply and info from the single response
  const { reply, info } = parseReplyAndInfo(rawReply, ctx.gatheredInfo);

  // State tracking based on gathered info
  let newState: ConversationState = ctx.state;
  // Sales mode doesn't use urgency — only needs trade (problem) and missed calls (address)
  const hasEnoughToSchedule = ctx.promptMode === "sales"
    ? !!(info.problem && info.address)
    : !!(info.problem && info.address && info.urgency);

  if (ctx.state === "greeting") {
    newState = "qualifying";
  } else if (ctx.state === "qualifying" && hasEnoughToSchedule) {
    newState = "scheduling";
  }

  // Confirmed: ONLY when AI explicitly set appointment times in the JSON
  if (
    info.appointmentStart &&
    info.appointmentEnd &&
    (ctx.state === "scheduling" || ctx.state === "qualifying")
  ) {
    newState = "confirmed";
  }

  // Ended: check structured field first, text pattern as fallback
  // Never override "confirmed" — a fresh appointment booking takes priority
  if (newState !== "confirmed") {
    const replyLower = reply.toLowerCase();
    if (info.conversationEnded === true) {
      newState = "ended";
    } else if (
      replyLower.includes("buiten wat wij doen") ||
      replyLower.includes("kunnen we je helaas niet") ||
      replyLower.includes("geen probleem. mocht je later") ||
      replyLower.includes("snap ik. mocht het ooit")
    ) {
      newState = "ended";
    }
  }

  return { reply, newState, info };
}

/**
 * Parse the AI response to extract the WhatsApp reply and structured info.
 * Expected format:
 *   Some WhatsApp message here
 *   ###INFO###
 *   {"customerName":"...","problem":"...","address":"...","urgency":"..."}
 */
function parseReplyAndInfo(
  rawReply: string,
  existingInfo: GatheredInfo
): { reply: string; info: GatheredInfo } {
  const cap = (val: unknown, max: number): string | undefined => {
    if (typeof val !== "string" || val.trim() === "") return undefined;
    return val.trim().slice(0, max);
  };

  const info = { ...existingInfo };

  const parts = rawReply.split("###INFO###");
  // Remove surrounding quotes that the AI sometimes adds (any combo of quote types)
  let reply = parts[0].trim();
  const quoteChars = ['"', '\u201c', '\u201d', "'", '\u2018', '\u2019', '`'];
  while (reply.length > 2 && quoteChars.includes(reply[0]) && quoteChars.includes(reply[reply.length - 1])) {
    reply = reply.slice(1, -1).trim();
  }

  if (parts.length > 1) {
    try {
      const jsonStr = parts[1]
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();

      const parsed = JSON.parse(jsonStr);

      // Only update fields that have actual values (non-empty strings)
      if (parsed.customerName) info.customerName = cap(parsed.customerName, 100);
      if (parsed.problem) info.problem = cap(parsed.problem, 500);
      if (parsed.problemDetails) info.problemDetails = parsed.problemDetails;
      if (parsed.address) info.address = cap(parsed.address, 300);
      if (parsed.urgency && ["laag", "gemiddeld", "hoog", "spoed"].includes(parsed.urgency)) {
        info.urgency = parsed.urgency;
      }
      // Strip Z/timezone suffix — times must be local (Europe/Amsterdam)
      const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
      if (parsed.appointmentStart) {
        const stripped = stripTimezone(String(parsed.appointmentStart));
        if (ISO_RE.test(stripped)) info.appointmentStart = stripped;
      }
      if (parsed.appointmentEnd) {
        const stripped = stripTimezone(String(parsed.appointmentEnd));
        if (ISO_RE.test(stripped)) info.appointmentEnd = stripped;
      }
      if (parsed.conversation_ended === true) {
        info.conversationEnded = true;
      }
    } catch (err) {
      console.error("[AI] Failed to parse ###INFO### JSON:", err);
    }
  }

  return { reply, info };
}

/** Strip Z suffix or timezone offset from ISO datetime strings.
 * "2026-03-23T10:00:00Z" → "2026-03-23T10:00:00"
 * "2026-03-23T10:00:00+01:00" → "2026-03-23T10:00:00"
 * "2026-03-23T10:00:00.000Z" → "2026-03-23T10:00:00"
 */
function stripTimezone(dt: string): string {
  return dt.replace(/(\.\d+)?([Zz]|[+-]\d{2}:\d{2})$/, "");
}

/** Generate the initial greeting message (no customer input yet). */
export async function generateGreeting(
  business: BusinessContext,
  promptMode?: "service" | "sales"
): Promise<string> {
  const systemPrompt = promptMode === "sales"
    ? salesGreetingPrompt()
    : greetingPrompt(business);

  const reply = await chat(
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content:
          "[De klant heeft gebeld maar kreeg geen gehoor. Stuur een eerste WhatsApp-bericht.]",
      },
    ],
    { temperature: 0.3, maxTokens: 200 }
  );

  return reply.split("###INFO###")[0].trim().replace(/^[""\u201C\u201D]|[""\u201C\u201D]$/g, "");
}
