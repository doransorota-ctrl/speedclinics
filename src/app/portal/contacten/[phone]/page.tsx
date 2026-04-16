"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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

function formatPhone(phone: string): string {
  if (phone.startsWith("+31")) {
    const local = "0" + phone.slice(3);
    return local.replace(/(\d{2})(\d{8})/, "$1 $2");
  }
  return phone;
}

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Vandaag";
  if (diffDays === 1) return "Gisteren";
  if (diffDays < 7) return `${diffDays} dagen geleden`;
  return date.toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}

export default function ContactDetailPage() {
  const params = useParams();
  const phone = decodeURIComponent(params.phone as string);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    async function fetchLeads() {
      try {
        const res = await fetch("/api/portal/leads");
        if (!res.ok) return;
        const allLeads = await res.json();
        const filtered = allLeads
          .filter((l: Lead) => l.customer_phone === phone)
          .sort((a: Lead, b: Lead) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setLeads(filtered);

        // Get best name from any lead
        const name = filtered.find((l: Lead) => l.customer_name)?.customer_name || "";
        setCustomerName(name);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchLeads();
  }, [phone]);

  async function saveName() {
    if (!leads.length) return;
    setSavingName(true);
    try {
      // Update name on all leads for this phone
      await Promise.all(
        leads.map((lead) =>
          fetch(`/api/portal/leads/${lead.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ customer_name: customerName.trim() }),
          })
        )
      );
      setEditingName(false);
    } catch {
      // silent
    } finally {
      setSavingName(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-4 bg-surface-200 rounded w-32" />
        <div className="h-8 bg-surface-200 rounded w-48" />
        <div className="bg-white rounded-xl border border-surface-200 p-5 h-32" />
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-surface-200 p-5 h-20" />
          <div className="bg-white rounded-xl border border-surface-200 p-5 h-20" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link href="/portal/contacten" className="text-sm text-surface-500 hover:text-surface-700 mb-4 inline-block">
        &larr; Terug naar contacten
      </Link>

      {/* Contact header */}
      <div className="bg-white rounded-xl border border-surface-200 p-5 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="input-field text-lg font-bold py-1 px-2"
                    autoFocus
                  />
                  <button onClick={saveName} disabled={savingName} className="text-sm text-brand-600 hover:text-brand-700 font-medium disabled:opacity-50">
                    {savingName ? "..." : "Opslaan"}
                  </button>
                  <button onClick={() => setEditingName(false)} className="text-sm text-surface-400 hover:text-surface-600">
                    Annuleer
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-surface-900">
                    {customerName || "Onbekend"}
                  </h1>
                  <button onClick={() => setEditingName(true)} className="text-surface-400 hover:text-surface-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              )}
              <p className="text-sm text-surface-500 font-mono">{formatPhone(phone)}</p>
              <p className="text-xs text-surface-400 mt-1">{leads.length} gesprek{leads.length !== 1 ? "ken" : ""}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/${phone.replace("+", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors"
              title="WhatsApp"
            >
              <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
            <a
              href={`tel:${phone}`}
              className="w-10 h-10 rounded-lg bg-surface-100 hover:bg-surface-200 flex items-center justify-center transition-colors"
              title="Bellen"
            >
              <svg className="w-5 h-5 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Conversations */}
      <h2 className="text-lg font-semibold text-surface-900 mb-3">Gesprekken</h2>

      {leads.length === 0 ? (
        <p className="text-sm text-surface-500">Geen gesprekken gevonden voor dit nummer.</p>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <Link
              key={lead.id}
              href={`/portal/leads/${lead.id}`}
              className="block bg-white rounded-xl border border-surface-200 p-5 hover:border-surface-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${statusColors[lead.status]}`}>
                      {statusLabels[lead.status]}
                    </span>
                    {lead.conversation_mode === "ai" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        AI
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                        Handmatig
                      </span>
                    )}
                  </div>
                  {lead.problem_summary && (
                    <p className="text-sm text-surface-700 truncate">{lead.problem_summary}</p>
                  )}
                  {lead.appointment_start && (
                    <p className="text-xs text-brand-600 mt-1">
                      Afspraak: {new Date(lead.appointment_start).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-surface-400">{getRelativeTime(lead.created_at)}</p>
                  <p className="text-xs text-surface-300 mt-1">{lead.source === "missed_call" ? "Gemiste oproep" : "WhatsApp"}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
