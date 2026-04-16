"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useBusiness } from "@/lib/hooks/useBusiness";
import type { Lead } from "@/lib/types";

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

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "Zojuist";
  if (diffMinutes < 60) return `${diffMinutes} min geleden`;
  if (diffHours < 24) return `${diffHours} uur geleden`;
  if (diffDays === 1) return "Gisteren";
  if (diffDays < 7) return `${diffDays} dagen geleden`;
  return date.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

export default function LeadsPage() {
  const { business, loading: businessLoading } = useBusiness();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "responded" | "waiting" | "flagged">("all");
  const isSales = business?.prompt_mode === "sales";

  useEffect(() => {
    async function fetchLeads() {
      try {
        const res = await fetch("/api/portal/leads");
        if (res.ok) {
          const data = await res.json();
          setLeads(data);
        }
      } catch {
        setError("Kon leads niet laden");
      } finally {
        setLoading(false);
      }
    }

    fetchLeads();
  }, []);

  if (businessLoading || loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-surface-200 rounded w-32" />
        <div className="h-5 bg-surface-100 rounded w-64" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-surface-200 p-5"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-surface-200 rounded w-40" />
                  <div className="h-4 bg-surface-100 rounded w-64" />
                </div>
                <div className="flex gap-2">
                  <div className="h-6 bg-surface-100 rounded-full w-16" />
                  <div className="h-6 bg-surface-100 rounded-full w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Gesprekken</h1>
          <p className="text-surface-500 mt-1">
            Alle gesprekken die clŷniq voor je heeft opgevangen.
          </p>
        </div>
      </div>

      {isSales && leads.length > 0 && (
        <div className="mt-4 flex items-center gap-2">
          {(["all", "responded", "waiting", "flagged"] as const).map((f) => {
            const counts = {
              all: leads.length,
              responded: leads.filter((l) => (l as unknown as Record<string, unknown>).has_customer_response).length,
              waiting: leads.filter((l) => !(l as unknown as Record<string, unknown>).has_customer_response && l.status === "active").length,
              flagged: leads.filter((l) => l.flagged).length,
            };
            const labels = { all: "Alle", responded: "Gereageerd", waiting: "Wacht", flagged: "Gemarkeerd" };
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  filter === f
                    ? "bg-brand-500 text-white"
                    : "bg-surface-100 text-surface-500 hover:bg-surface-200"
                }`}
              >
                {labels[f]} ({counts[f]})
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {leads.length === 0 && !error ? (
        /* Empty state */
        <div className="mt-6 bg-white rounded-xl border border-surface-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-5">
            <svg
              className="w-8 h-8 text-brand-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-surface-900">
            {!business?.forwarding_confirmed ? "Bijna klaar!" : "Nog geen gesprekken"}
          </h3>
          <p className="text-sm text-surface-500 mt-2 max-w-sm mx-auto leading-relaxed">
            {!business?.forwarding_confirmed
              ? "Nu ontbreekt alleen nog de laatste stap: stel doorschakelen in en begin met het opvangen van klanten."
              : "Zodra iemand je belt en je neemt niet op, vangt clŷniq de klant op via WhatsApp. Het gesprek verschijnt dan hier."}
          </p>

          {!business?.forwarding_confirmed && (
            <div className="mt-6">
              <Link
                href="/portal/onboarding"
                className="btn-primary text-sm px-8 py-3 inline-block"
              >
                Activeer je nummer om gesprekken te ontvangen
              </Link>
            </div>
          )}

          {business?.forwarding_confirmed && (
            <div className="mt-6">
              {business?.twilio_number && (
                <div className="bg-surface-50 rounded-xl p-4 inline-block mb-4">
                  <p className="text-xs text-surface-400 mb-1">Je clŷniq nummer</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-mono font-semibold text-surface-900">{business.twilio_number}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(business.twilio_number!)}
                      className="text-xs text-brand-600 hover:text-brand-700"
                    >
                      Kopieer
                    </button>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                <p className="text-sm font-medium text-brand-700">
                  clŷniq is actief en wacht op je eerste gemiste oproep
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Leads list */
        <div className="mt-6 space-y-3">
          {leads.filter((l) => {
            if (!isSales || filter === "all") return true;
            if (filter === "responded") return (l as unknown as Record<string, unknown>).has_customer_response;
            if (filter === "waiting") return !(l as unknown as Record<string, unknown>).has_customer_response && l.status === "active";
            if (filter === "flagged") return l.flagged;
            return true;
          }).map((lead) => (
            <div key={lead.id} className="flex items-center gap-2">
              {isSales && (
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    const newFlagged = !lead.flagged;
                    const res = await fetch(`/api/portal/leads/${lead.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ flagged: newFlagged }),
                    });
                    if (res.ok) {
                      setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, flagged: newFlagged } : l));
                    }
                  }}
                  className={`shrink-0 p-1.5 rounded-lg transition-colors ${
                    lead.flagged
                      ? "text-yellow-500 hover:text-yellow-600"
                      : "text-surface-300 hover:text-yellow-400"
                  }`}
                  title={lead.flagged ? "Markering verwijderen" : "Markeren als interessant"}
                >
                  <svg className="w-5 h-5" fill={lead.flagged ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
              )}
            <Link
              href={`/portal/leads/${lead.id}`}
              className="block flex-1 bg-white rounded-xl border border-surface-200 p-5 hover:border-surface-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-surface-900 truncate">
                      {lead.customer_name || lead.customer_phone}
                    </h3>
                    {lead.conversation_mode === "ai" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        AI
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full font-medium shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                        Handmatig
                      </span>
                    )}
                    {(lead as unknown as Record<string, unknown>).has_customer_response ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium shrink-0">
                        Gereageerd
                      </span>
                    ) : lead.status === "active" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full font-medium shrink-0">
                        Wacht op reactie
                      </span>
                    ) : null}
                  </div>
                  {lead.customer_name && (
                    <p className="text-xs text-surface-400 mt-0.5">
                      {lead.customer_phone}
                    </p>
                  )}
                  {lead.problem_summary && (
                    <p className="text-sm text-surface-500 mt-1.5 truncate">
                      {lead.problem_summary.length > 100
                        ? lead.problem_summary.slice(0, 100) + "..."
                        : lead.problem_summary}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs text-surface-400">
                      {getRelativeTime(lead.created_at)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${statusColors[lead.status]}`}
                      >
                        {statusLabels[lead.status]}
                      </span>
                      {lead.urgency && (
                        <span
                          className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${urgencyColors[lead.urgency]}`}
                        >
                          {urgencyLabels[lead.urgency]}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <a
                      href={`https://wa.me/${lead.customer_phone.replace("+", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-9 h-9 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors"
                      title="WhatsApp"
                    >
                      <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </a>
                    <a
                      href={`tel:${lead.customer_phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-9 h-9 rounded-lg bg-surface-100 hover:bg-surface-200 flex items-center justify-center transition-colors"
                      title="Bellen"
                    >
                      <svg className="w-5 h-5 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
