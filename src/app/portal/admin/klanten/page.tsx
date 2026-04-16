"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface Customer {
  id: string;
  name: string;
  trade: string;
  phone: string;
  email: string;
  status: string;
  plan: string;
  speed_leads_active: boolean;
  calendarConnected: boolean;
  forwarding_confirmed: boolean;
  website_url: string | null;
  created_at: string;
}

const statusLabels: Record<string, string> = {
  pending_payment: "Wacht op betaling",
  trialing: "Proefperiode",
  active: "Actief",
  past_due: "Achterstallig",
  cancelled: "Geannuleerd",
  paused: "Gepauzeerd",
};

const statusColors: Record<string, string> = {
  pending_payment: "bg-yellow-50 text-yellow-700",
  trialing: "bg-blue-50 text-blue-700",
  active: "bg-green-50 text-green-700",
  past_due: "bg-red-50 text-red-700",
  cancelled: "bg-surface-100 text-surface-600",
  paused: "bg-orange-50 text-orange-700",
};

export default function KlantenPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await fetch("/api/admin/klanten");
        if (!res.ok) throw new Error("Fout bij ophalen");
        const data = await res.json();
        setCustomers(data);
      } catch {
        setError("Kon klanten niet laden");
      } finally {
        setLoading(false);
      }
    }
    fetchCustomers();
  }, []);

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.trade?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      (statusLabels[c.status] || c.status)?.toLowerCase().includes(q)
    );
  });

  const setupProgress = (c: Customer) => {
    const hasSpeedLeads = c.plan === "speed-leads" || c.plan === "compleet";
    const hasWebsite = c.plan === "website" || c.plan === "compleet";
    let total = 1; // payment always counts
    let done = 0;
    if (c.status !== "pending_payment") done++;
    if (hasSpeedLeads) {
      total += 2;
      if (c.calendarConnected) done++;
      if (c.forwarding_confirmed) done++;
    }
    if (hasWebsite) {
      total += 1;
      if (c.website_url) done++;
    }
    return { done, total };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-surface-900">Klanten</h1>
        <Link
          href="/portal/admin/klanten/nieuw"
          className="btn-primary text-sm px-4 py-2"
        >
          + Nieuwe klant
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 rounded-lg p-4 mb-4">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoek op naam, vak, telefoon, email..."
          className="input-field max-w-md"
        />
      </div>

      <div className="bg-white rounded-xl border border-surface-200 p-5">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 bg-surface-200 rounded w-32" />
                <div className="h-4 bg-surface-200 rounded w-24" />
                <div className="h-4 bg-surface-200 rounded w-28" />
                <div className="h-4 bg-surface-200 rounded w-20" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-surface-500 text-sm text-center py-8">
            {search ? "Geen klanten gevonden" : "Nog geen klanten. Maak je eerste klant aan."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-surface-500 border-b border-surface-100">
                  <th className="pb-3 font-medium">Naam</th>
                  <th className="pb-3 font-medium">Vakgebied</th>
                  <th className="pb-3 font-medium">Telefoon</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Setup</th>
                  <th className="pb-3 font-medium">Actief</th>
                  <th className="pb-3 font-medium">Datum</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-surface-50 last:border-0 hover:bg-surface-50 transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <Link
                        href={`/portal/admin/klanten/${c.id}`}
                        className="font-semibold text-surface-900 hover:text-brand-600"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-surface-600">{c.trade}</td>
                    <td className="py-3 pr-4 text-surface-600">{c.phone}</td>
                    <td className="py-3 pr-4 text-surface-600 truncate max-w-[160px]">{c.email}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[c.status] || "bg-surface-100 text-surface-600"
                        }`}
                      >
                        {statusLabels[c.status] || c.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {(() => { const p = setupProgress(c); return (
                        <span className={`text-xs font-medium ${p.done === p.total ? "text-green-600" : "text-surface-500"}`}>
                          {p.done}/{p.total}
                        </span>
                      ); })()}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`w-2 h-2 rounded-full inline-block ${c.speed_leads_active ? "bg-green-500" : "bg-red-400"}`} />
                    </td>
                    <td className="py-3 text-surface-500">
                      {new Date(c.created_at).toLocaleDateString("nl-NL", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
