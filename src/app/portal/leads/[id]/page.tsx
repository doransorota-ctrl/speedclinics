"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import type { Lead, Message } from "@/lib/types";

const statusLabels: Record<Lead["status"], string> = {
  active: "Actief",
  qualified: "Gekwalificeerd",
  appointment_set: "Afspraak",
  converted: "Geconverteerd",
  lost: "Verloren",
  archived: "Gearchiveerd",
};

const statusColors: Record<Lead["status"], string> = {
  active: "bg-blue-50 text-blue-700",
  qualified: "bg-green-50 text-green-700",
  appointment_set: "bg-brand-50 text-brand-700",
  converted: "bg-green-50 text-green-700",
  lost: "bg-red-50 text-red-700",
  archived: "bg-surface-100 text-surface-600",
};

const urgencyLabels: Record<NonNullable<Lead["urgency"]>, string> = {
  low: "Laag",
  medium: "Gemiddeld",
  high: "Hoog",
  emergency: "Spoed",
};

const urgencyColors: Record<NonNullable<Lead["urgency"]>, string> = {
  low: "bg-surface-100 text-surface-600",
  medium: "bg-yellow-50 text-yellow-700",
  high: "bg-orange-50 text-orange-700",
  emergency: "bg-red-50 text-red-700",
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LeadDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [togglingMode, setTogglingMode] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const isNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    return container.scrollHeight - container.scrollTop - container.clientHeight < 100;
  }, []);

  const scrollToBottom = useCallback(() => {
    if (isNearBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isNearBottom]);

  const fetchLeadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/portal/leads/${id}`);
      if (res.ok) {
        const data = await res.json();
        setLead(data.lead);
        setMessages(data.messages);
      }
    } catch {
      setError("Kon lead niet laden");
    }
  }, [id]);

  // Initial fetch
  useEffect(() => {
    async function initialFetch() {
      await fetchLeadData();
      setLoading(false);
    }
    initialFetch();
  }, [fetchLeadData]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-poll every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeadData();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchLeadData]);

  async function handleToggleMode() {
    if (!lead || togglingMode) return;

    const newMode = lead.conversation_mode === "ai" ? "manual" : "ai";
    setTogglingMode(true);

    try {
      const res = await fetch(`/api/portal/leads/${id}/mode`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: newMode }),
      });

      if (res.ok) {
        setLead({ ...lead, conversation_mode: newMode });
      } else {
        setError("Kon modus niet wijzigen");
        setTimeout(() => setError(""), 3000);
      }
    } catch {
      setError("Kon modus niet wijzigen");
      setTimeout(() => setError(""), 3000);
    } finally {
      setTogglingMode(false);
    }
  }

  async function handleCancelAppointment() {
    if (!lead || cancelling) return;
    if (!confirm("Weet je zeker dat je deze afspraak wilt annuleren? Dit verwijdert ook het Google Calendar event.")) return;

    setCancelling(true);
    try {
      const res = await fetch(`/api/portal/leads/${id}/cancel`, {
        method: "POST",
      });

      if (res.ok) {
        setLead({ ...lead, status: "lost", appointment_start: null, appointment_end: null });
      } else {
        setError("Kon afspraak niet annuleren");
        setTimeout(() => setError(""), 3000);
      }
    } catch {
      setError("Kon afspraak niet annuleren");
      setTimeout(() => setError(""), 3000);
    } finally {
      setCancelling(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const body = newMessage.trim();

    try {
      const res = await fetch(`/api/portal/leads/${id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });

      if (res.ok) {
        const message = await res.json();
        setMessages((prev) => [...prev, message]);
        setNewMessage("");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Kon bericht niet versturen");
        setTimeout(() => setError(""), 4000);
      }
    } catch {
      setError("Kon bericht niet versturen");
      setTimeout(() => setError(""), 4000);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 bg-surface-200 rounded" />
          <div className="h-6 bg-surface-200 rounded w-48" />
        </div>
        <div className="bg-white rounded-xl border border-surface-200 p-5 space-y-3">
          <div className="h-5 bg-surface-200 rounded w-40" />
          <div className="h-4 bg-surface-100 rounded w-64" />
          <div className="h-4 bg-surface-100 rounded w-52" />
        </div>
        <div className="bg-white rounded-xl border border-surface-200 p-5 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
            >
              <div className="h-12 bg-surface-100 rounded-xl w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-semibold text-surface-900">
          Lead niet gevonden
        </h2>
        <p className="text-sm text-surface-500 mt-2">
          Deze lead bestaat niet of je hebt geen toegang.
        </p>
        <Link
          href="/portal/leads"
          className="btn-primary text-sm px-5 py-2.5 mt-4 inline-block"
        >
          Terug naar leads
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header with lead info */}
      <div className="shrink-0">
        {/* Back navigation */}
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/portal/leads"
            className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-900 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Terug naar leads
          </Link>
        </div>

        {/* Lead info card */}
        <div className="bg-white rounded-xl border border-surface-200 mb-4">
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-semibold text-surface-900">
                  {lead.customer_name || lead.customer_phone}
                </h1>
                {lead.customer_name && (
                  <p className="text-sm text-surface-400 mt-0.5">
                    {lead.customer_phone}
                  </p>
                )}
                {lead.problem_summary && (
                  <p className="text-sm text-surface-500 mt-2">
                    {lead.problem_summary}
                  </p>
                )}
                {lead.address && (
                  <p className="text-xs text-surface-400 mt-1.5 flex items-center gap-1">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {lead.address}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {lead.urgency && (
                  <span
                    className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${urgencyColors[lead.urgency]}`}
                  >
                    {urgencyLabels[lead.urgency]}
                  </span>
                )}
                <span
                  className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${statusColors[lead.status]}`}
                >
                  {statusLabels[lead.status]}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons — bottom of card */}
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-surface-100">
            <button
              onClick={handleToggleMode}
              disabled={togglingMode}
              className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-colors ${
                lead.conversation_mode === "ai"
                  ? "border-brand-300 bg-brand-500 text-white hover:bg-brand-600"
                  : "border-green-300 bg-green-500 text-white hover:bg-green-600"
              } disabled:opacity-50`}
            >
              {togglingMode
                ? "Wisselen..."
                : lead.conversation_mode === "ai"
                  ? "Neem over"
                  : "AI hervatten"}
            </button>

            {lead.status === "appointment_set" && (
              <button
                onClick={handleCancelAppointment}
                disabled={cancelling}
                className="text-xs font-semibold px-4 py-2 rounded-lg border border-red-300 bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {cancelling ? "Annuleren..." : "Afspraak annuleren"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="shrink-0 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        role="log"
        aria-label="Gespreksgeschiedenis"
        aria-live="polite"
        className="flex-1 overflow-y-auto bg-white rounded-xl border border-surface-200 p-5"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-surface-400">
              Nog geen berichten in dit gesprek.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "owner" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-xl px-4 py-2.5 ${
                    message.sender === "customer"
                      ? "bg-white border border-surface-200"
                      : message.sender === "ai"
                        ? "bg-green-50 border border-green-100"
                        : "bg-brand-500 text-white"
                  }`}
                >
                  {message.sender === "ai" && (
                    <p className="text-[10px] font-medium text-green-600 mb-0.5">
                      AI
                    </p>
                  )}
                  <p
                    className={`text-sm whitespace-pre-wrap ${
                      message.sender === "owner"
                        ? "text-white"
                        : "text-surface-900"
                    }`}
                  >
                    {message.body}
                  </p>
                  <p
                    className={`text-[10px] mt-1 text-right flex items-center justify-end gap-1 ${
                      message.sender === "owner"
                        ? "text-white/70"
                        : "text-surface-400"
                    }`}
                  >
                    {formatTime(message.created_at)}
                    {(() => {
                      const status = (message as unknown as Record<string, unknown>).twilio_status as string | null;
                      if (message.sender === "customer" || !status) return null;
                      const icon = status === "read" ? "✓✓" : status === "delivered" ? "✓✓" : status === "sent" ? "✓" : status === "failed" ? "✗" : "";
                      const color = status === "read" ? "!text-blue-500" : status === "failed" ? "!text-red-500" : "";
                      return <span className={color} title={status}>{icon}</span>;
                    })()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message input (only in manual mode) */}
      {lead.conversation_mode === "manual" && (
        <div className="shrink-0 mt-4">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Typ een bericht..."
              className="input-field flex-1"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50"
            >
              {sending ? (
                <svg
                  className="w-5 h-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                "Verstuur"
              )}
            </button>
          </form>
        </div>
      )}

      {/* AI mode indicator */}
      {lead.conversation_mode === "ai" && (
        <div className="shrink-0 mt-4 bg-green-50 border border-green-100 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-sm text-green-700">
              AI voert het gesprek. Klik op &ldquo;Neem over&rdquo; om zelf te
              reageren.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
