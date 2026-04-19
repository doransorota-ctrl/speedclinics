"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface Contact {
  customer_phone: string;
  customer_name: string | null;
  last_contact: string;
  total_conversations: number;
  last_status: string;
  last_problem: string | null;
}

const statusLabels: Record<string, string> = {
  active: "Actief",
  qualified: "Gekwalificeerd",
  appointment_set: "Afspraak",
  converted: "Geconverteerd",
  lost: "Verloren",
  archived: "Gearchiveerd",
};

function formatPhone(phone: string): string {
  if (phone.startsWith("+31")) {
    const local = "0" + phone.slice(3);
    return local.replace(/(\d{2})(\d{8})/, "$1 $2");
  }
  return phone;
}

export default function PatiëntenPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchContacts() {
      try {
        const res = await fetch("/api/portal/leads");
        if (!res.ok) return;
        const leads = await res.json();

        // Deduplicate by phone number, keep most recent
        const map = new Map<string, Contact>();
        for (const lead of leads) {
          const existing = map.get(lead.customer_phone);
          if (!existing || new Date(lead.created_at) > new Date(existing.last_contact)) {
            map.set(lead.customer_phone, {
              customer_phone: lead.customer_phone,
              customer_name: lead.customer_name || existing?.customer_name || null,
              last_contact: lead.created_at,
              total_conversations: (existing?.total_conversations || 0) + 1,
              last_status: lead.status,
              last_problem: lead.problem_summary || existing?.last_problem || null,
            });
          } else {
            existing.total_conversations += 1;
            if (lead.customer_name && !existing.customer_name) {
              existing.customer_name = lead.customer_name;
            }
          }
        }

        const sorted = Array.from(map.values()).sort(
          (a, b) => new Date(b.last_contact).getTime() - new Date(a.last_contact).getTime()
        );
        setContacts(sorted);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchContacts();
  }, []);

  const filtered = contacts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (c.customer_name?.toLowerCase().includes(q)) ||
      c.customer_phone.includes(q) ||
      (c.last_problem?.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-surface-200 rounded w-32" />
        <div className="h-10 bg-surface-100 rounded w-64" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-surface-200 p-4 h-16" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900">Patiënten</h1>
        <p className="text-surface-500 mt-1">
          Alle patiënten die contact hebben gehad.
        </p>
      </div>

      {contacts.length > 0 && (
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op naam of telefoon..."
            className="input-field max-w-md"
          />
        </div>
      )}

      {contacts.length === 0 ? (
        <div className="bg-white rounded-xl border border-surface-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-surface-900">Nog geen patiënten</h3>
          <p className="text-sm text-surface-500 mt-2">
            Patiënten verschijnen hier zodra patiënten contact opnemen.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-surface-500 border-b border-surface-100">
                <th className="px-5 py-3 font-medium">Naam</th>
                <th className="px-5 py-3 font-medium">Telefoon</th>
                <th className="px-5 py-3 font-medium hidden sm:table-cell">Gesprekken</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Laatst</th>
                <th className="px-5 py-3 font-medium">Acties</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((contact) => (
                <tr key={contact.customer_phone} className="border-b border-surface-50 last:border-0 hover:bg-surface-50 transition-colors cursor-pointer" onClick={() => window.location.href = `/portal/contacten/${encodeURIComponent(contact.customer_phone)}`}>
                  <td className="px-5 py-3">
                    <Link href={`/portal/contacten/${encodeURIComponent(contact.customer_phone)}`} className="font-medium text-surface-900 hover:text-brand-600">
                      {contact.customer_name || "Onbekend"}
                    </Link>
                    {contact.last_problem && (
                      <p className="text-xs text-surface-400 truncate max-w-[200px]">{contact.last_problem}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-surface-600 font-mono text-xs">
                    {formatPhone(contact.customer_phone)}
                  </td>
                  <td className="px-5 py-3 text-surface-500 hidden sm:table-cell">
                    {contact.total_conversations}x
                  </td>
                  <td className="px-5 py-3 text-surface-400 text-xs hidden md:table-cell">
                    {new Date(contact.last_contact).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/${contact.customer_phone.replace("+", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors"
                        title="WhatsApp"
                      >
                        <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                      </a>
                      <a
                        href={`tel:${contact.customer_phone}`}
                        className="w-8 h-8 rounded-lg bg-surface-100 hover:bg-surface-200 flex items-center justify-center transition-colors"
                        title="Bellen"
                      >
                        <svg className="w-4 h-4 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && search && (
            <p className="text-sm text-surface-500 text-center py-8">Geen patiënten gevonden</p>
          )}
        </div>
      )}
    </div>
  );
}
