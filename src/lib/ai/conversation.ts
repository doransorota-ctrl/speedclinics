import { chat, chatWithTools, type ChatMessage } from "./client";
import { conversationPrompt, greetingPrompt, salesConversationPrompt, salesGreetingPrompt } from "./prompts";
import { CLINIC_TOOLS } from "./tools";
import { executeTool } from "./tool-executor";

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
  needsHumanEscalation?: boolean;
}

interface BusinessContext {
  businessName: string;
  trade: string;
  serviceArea?: string;
  ownerName?: string;
}

interface ConversationContext {
  business: BusinessContext;
  businessId: string;
  state: ConversationState;
  messages: ChatMessage[];
  gatheredInfo: GatheredInfo;
  availableSlots?: string[];
  promptMode?: "service" | "sales";
  treatmentContext?: string;
  customerPhone?: string;
  conversationSummary?: string;
}

/**
 * Generate the next AI response using tool calling.
 */
export async function generateResponse(
  ctx: ConversationContext,
  customerMessage: string
): Promise<{ reply: string; newState: ConversationState; info: GatheredInfo }> {
  const messages: ChatMessage[] = [
    ...ctx.messages,
    { role: "user", content: customerMessage },
  ];

  // Inject conversation summary if available
  if (ctx.conversationSummary && messages.length > 2) {
    messages.unshift({
      role: "assistant",
      content: `[Samenvatting eerdere berichten: ${ctx.conversationSummary}]`,
    });
  }

  const isSales = ctx.promptMode === "sales";

  const systemPrompt = isSales
    ? salesConversationPrompt(ctx.availableSlots, ctx.gatheredInfo)
    : conversationPrompt(ctx.business, ctx.availableSlots, ctx.gatheredInfo, ctx.treatmentContext);

  const aiMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  let rawReply: string;

  if (isSales) {
    // Sales mode: no tools, just regular chat
    rawReply = await chat(aiMessages, { temperature: 0.4, maxTokens: 400 });
  } else {
    // Clinic mode: use tool calling
    rawReply = await chatWithTools(
      aiMessages,
      CLINIC_TOOLS,
      async (name: string, argsJson: string) => {
        const args = JSON.parse(argsJson);
        return executeTool(name, args, ctx.businessId, ctx.customerPhone);
      },
      { temperature: 0.4, maxTokens: 400 },
    );
  }

  // Parse reply and info
  let { reply, info } = parseReplyAndInfo(rawReply, ctx.gatheredInfo);

  // ─── Medical guardrail: block dosage/diagnosis in AI output ───
  if (!isSales) {
    reply = applyMedicalGuardrail(reply);
  }

  // State tracking
  let newState: ConversationState = ctx.state;

  const hasEnoughToSchedule = isSales
    ? !!(info.problem && info.address)
    : !!info.problem;

  if (ctx.state === "greeting") {
    newState = "qualifying";
  } else if (ctx.state === "qualifying" && hasEnoughToSchedule) {
    newState = "scheduling";
  }

  if (
    info.appointmentStart &&
    info.appointmentEnd &&
    (ctx.state === "scheduling" || ctx.state === "qualifying")
  ) {
    newState = "confirmed";
  }

  if (newState !== "confirmed") {
    if (info.conversationEnded === true) {
      newState = "ended";
    }
  }

  // ─── Human escalation: frustration or 20+ messages ───
  const totalMessages = ctx.messages.length + 1; // +1 for current message
  const escalationNeeded = detectEscalation(customerMessage, totalMessages);
  if (escalationNeeded && newState !== "confirmed") {
    info.needsHumanEscalation = true;
  }

  return { reply, newState, info };
}

/**
 * Parse the AI response to extract the WhatsApp reply and structured info.
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

      if (parsed.customerName) info.customerName = cap(parsed.customerName, 100);
      if (parsed.problem) info.problem = cap(parsed.problem, 500);
      if (parsed.problemDetails) info.problemDetails = parsed.problemDetails;
      if (parsed.address) info.address = cap(parsed.address, 300);
      if (parsed.urgency && ["laag", "gemiddeld", "hoog", "spoed"].includes(parsed.urgency)) {
        info.urgency = parsed.urgency;
      }
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

function stripTimezone(dt: string): string {
  return dt.replace(/(\.\d+)?([Zz]|[+-]\d{2}:\d{2})$/, "");
}

/** Generate the initial greeting message */
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
          "[De patiënt heeft contact opgenomen. Stuur een eerste WhatsApp-bericht.]",
      },
    ],
    { temperature: 0.3, maxTokens: 200 }
  );

  return reply.split("###INFO###")[0].trim().replace(/^[""\u201C\u201D]|[""\u201C\u201D]$/g, "");
}

/** Summarize a conversation to save tokens */
export async function summarizeConversation(messages: ChatMessage[]): Promise<string> {
  if (messages.length < 8) return "";

  const conversationText = messages
    .slice(0, -6) // Keep last 6 messages intact
    .map((m) => `${m.role === "user" ? "Patiënt" : "Receptie"}: ${m.content}`)
    .join("\n");

  const summary = await chat(
    [
      {
        role: "system",
        content: "Vat dit gesprek samen in max 3 zinnen. Bewaar: naam patiënt, behandelinteresse, afspraakstatus, en belangrijke vragen.",
      },
      { role: "user", content: conversationText },
    ],
    { temperature: 0.2, maxTokens: 150 },
  );

  return summary.trim();
}

/** Medical guardrail: replace reply if AI gives medical advice */
const MEDICAL_PATTERNS = [
  /\b\d+\s*mg\b/i,
  /\b\d+\s*ml\b/i,
  /\bdosering\b/i,
  /\bdiagnose\b/i,
  /\bdiagnostiek\b/i,
  /\bvoorschrijven\b/i,
  /\bmedicijn(en)?\b/i,
  /\bbijwerking(en)?\b/i,
  /\bcontra[\s-]?indicatie/i,
  /\ballergische reactie\b/i,
  /\bbloed(onderzoek|test|waarden)\b/i,
  /\brecept\b/i,
];

function applyMedicalGuardrail(reply: string): string {
  const matched = MEDICAL_PATTERNS.some((p) => p.test(reply));
  if (matched) {
    console.warn("[Guardrail] Medical content detected in AI reply, replacing");
    return "Dat is een vraag die de arts graag met u bespreekt tijdens het consult. Zal ik een afspraak voor u inplannen?";
  }
  return reply;
}

/** Detect if human escalation is needed */
const FRUSTRATION_PATTERNS = [
  /\b(mens|medewerker|iemand|persoon)\b.*\b(spreken|praten|bellen)\b/i,
  /\becht\s+iemand\b/i,
  /\bgeen\s+(robot|bot|ai|computer)\b/i,
  /\bkut\b/i,
  /\bklacht(en)?\b/i,
  /\bonzin\b/i,
  /\bwaardeloos\b/i,
  /\bbelachelijk\b/i,
  /\bschandalig\b/i,
];

function detectEscalation(message: string, totalMessages: number): boolean {
  // Explicit request for human
  if (FRUSTRATION_PATTERNS.some((p) => p.test(message))) return true;
  // 20+ messages without resolution
  if (totalMessages >= 20) return true;
  return false;
}
