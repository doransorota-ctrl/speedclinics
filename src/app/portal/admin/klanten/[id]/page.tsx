"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface Lead {
  id: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  urgency: string;
  problem_summary: string;
  appointment_start: string | null;
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

const leadStatusLabels: Record<string, string> = {
  new: "Nieuw",
  contacted: "Gecontacteerd",
  qualified: "Gekwalificeerd",
  appointment_scheduled: "Afspraak",
  converted: "Geconverteerd",
  lost: "Verloren",
};

export default function KlantDetailPage() {
  const params = useParams();
  const id = params.id as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [customer, setCustomer] = useState<any>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit state
  const [editing, setEditing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Send links state
  const [sending, setSending] = useState<Record<string, boolean>>({});
  const [sent, setSent] = useState<Record<string, boolean>>({});

  // WhatsApp state
  const [waMessage, setWaMessage] = useState("");
  const [waSending, setWaSending] = useState(false);
  const [waSent, setWaSent] = useState(false);

  // Website state
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [savingUrl, setSavingUrl] = useState(false);
  const [urlSaved, setUrlSaved] = useState(false);

  // Number management
  const [assigningNumber, setAssigningNumber] = useState(false);
  const [releasingNumber, setReleasingNumber] = useState(false);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [custRes, leadsRes] = await Promise.all([
          fetch(`/api/admin/klanten/${id}`),
          fetch(`/api/admin/klanten/${id}/leads`),
        ]);
        if (!custRes.ok) throw new Error("Niet gevonden");
        const custData = await custRes.json();
        setCustomer(custData);
        setEditForm({
          name: custData.name || "",
          trade: custData.trade || "",
          phone: custData.phone || "",
          email: custData.email || "",
          service_area: custData.service_area || "",
          plan: custData.plan || "speed-leads",
          status: custData.status || "active",
        });
        setWebsiteUrl(custData.website_url || "");
        if (leadsRes.ok) {
          setLeads(await leadsRes.json());
        }
      } catch {
        setError("Kon klantgegevens niet laden");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch(`/api/admin/klanten/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveMsg(data.error || "Opslaan mislukt");
        return;
      }
      const updated = await res.json();
      setCustomer({ ...customer, ...updated });
      setEditing(false);
      setSaveMsg("Opgeslagen!");
      setTimeout(() => setSaveMsg(""), 2000);
    } catch {
      setSaveMsg("Netwerkfout");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(field: string) {
    const newValue = !customer[field];
    try {
      const res = await fetch(`/api/admin/klanten/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: newValue }),
      });
      if (res.ok) {
        setCustomer({ ...customer, [field]: newValue });
      }
    } catch {
      // silent
    }
  }

  async function sendLink(type: string) {
    setSending((s) => ({ ...s, [type]: true }));
    try {
      const res = await fetch(`/api/admin/klanten/${id}/send-links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (res.ok) {
        setSent((s) => ({ ...s, [type]: true }));
        setTimeout(() => setSent((s) => ({ ...s, [type]: false })), 3000);
      }
    } catch {
      // silent
    } finally {
      setSending((s) => ({ ...s, [type]: false }));
    }
  }

  async function sendWhatsApp() {
    if (!waMessage.trim()) return;
    setWaSending(true);
    try {
      const res = await fetch(`/api/admin/klanten/${id}/whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: waMessage.trim() }),
      });
      if (res.ok) {
        setWaSent(true);
        setWaMessage("");
        setTimeout(() => setWaSent(false), 3000);
      }
    } catch {
      // silent
    } finally {
      setWaSending(false);
    }
  }

  async function assignNumber() {
    setAssigningNumber(true);
    try {
      const res = await fetch(`/api/admin/klanten/${id}/assign-number`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setCustomer({ ...customer, twilio_number: data.number });
      }
    } catch {
      // silent
    } finally {
      setAssigningNumber(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/admin/klanten/${id}/delete`, { method: "DELETE" });
      if (res.ok) {
        window.location.href = "/portal/admin/klanten";
      } else {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.error || "Verwijderen mislukt");
      }
    } catch {
      setDeleteError("Netwerkfout");
    } finally {
      setDeleting(false);
    }
  }

  async function releaseNumber() {
    setReleasingNumber(true);
    try {
      const res = await fetch(`/api/admin/klanten/${id}/release-number`, { method: "POST" });
      if (res.ok) {
        setCustomer({ ...customer, twilio_number: null });
      }
    } catch {
      // silent
    } finally {
      setReleasingNumber(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-4 bg-surface-200 rounded w-32" />
        <div className="h-8 bg-surface-200 rounded w-48" />
        <div className="bg-white rounded-xl border border-surface-200 p-5 h-48" />
        <div className="bg-white rounded-xl border border-surface-200 p-5 h-40" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div>
        <Link href="/portal/admin/klanten" className="text-sm text-surface-500 hover:text-surface-700 mb-4 inline-block">
          &larr; Terug naar klanten
        </Link>
        <div className="bg-red-50 text-red-700 rounded-lg p-4">{error || "Klant niet gevonden"}</div>
      </div>
    );
  }

  const hasSpeedLeads = customer.plan === "speed-leads" || customer.plan === "compleet";
  const hasWebsite = customer.plan === "website" || customer.plan === "compleet";
  const paymentDone = customer.status !== "pending_payment";
  const calendarDone = customer.calendarConnected;
  const forwardingDone = customer.forwarding_confirmed;

  return (
    <div>
      <Link href="/portal/admin/klanten" className="text-sm text-surface-500 hover:text-surface-700 mb-4 inline-block">
        &larr; Terug naar klanten
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-surface-900">{customer.name}</h1>
          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[customer.status] || "bg-surface-100 text-surface-600"}`}>
            {statusLabels[customer.status] || customer.status}
          </span>
          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-700">
            {customer.plan}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-surface-500">Clŷniq</span>
            <button
              onClick={() => handleToggle("speed_leads_active")}
              className={`relative w-10 h-5 rounded-full transition-colors ${customer.speed_leads_active ? "bg-green-500" : "bg-surface-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${customer.speed_leads_active ? "translate-x-5" : ""}`} />
            </button>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-surface-500">Actief</span>
            <button
              onClick={() => handleToggle("is_active")}
              className={`relative w-10 h-5 rounded-full transition-colors ${customer.is_active ? "bg-green-500" : "bg-surface-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${customer.is_active ? "translate-x-5" : ""}`} />
            </button>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Business Info */}
          <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
              <h2 className="font-semibold text-surface-900">Bedrijfsinfo</h2>
              {!editing ? (
                <button onClick={() => setEditing(true)} className="text-sm text-brand-600 hover:text-brand-700">
                  Bewerken
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="text-sm text-surface-500 hover:text-surface-700">
                    Annuleren
                  </button>
                  <button onClick={handleSave} disabled={saving} className="text-sm text-brand-600 hover:text-brand-700 font-medium disabled:opacity-50">
                    {saving ? "Opslaan..." : "Opslaan"}
                  </button>
                </div>
              )}
            </div>
            <div className="p-5">
              {saveMsg && (
                <div className={`text-sm mb-3 ${saveMsg === "Opgeslagen!" ? "text-green-600" : "text-red-600"}`}>
                  {saveMsg}
                </div>
              )}
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <label className="input-label">Naam</label>
                    <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="input-label">Vakgebied</label>
                    <input type="text" value={editForm.trade} onChange={(e) => setEditForm({ ...editForm, trade: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="input-label">Telefoon</label>
                    <input type="tel" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="input-label">Email</label>
                    <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="input-label">Regio</label>
                    <input type="text" value={editForm.service_area} onChange={(e) => setEditForm({ ...editForm, service_area: e.target.value })} className="input-field" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="input-label">Plan</label>
                      <select value={editForm.plan} onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })} className="input-field">
                        <option value="speed-leads">Clŷniq</option>
                        <option value="website">Website</option>
                        <option value="compleet">Compleet</option>
                      </select>
                    </div>
                    <div>
                      <label className="input-label">Status</label>
                      <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="input-field">
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-surface-500">Vakgebied</span>
                    <p className="text-surface-900">{customer.trade}</p>
                  </div>
                  <div>
                    <span className="text-surface-500">Telefoon</span>
                    <p className="text-surface-900">{customer.phone}</p>
                  </div>
                  <div>
                    <span className="text-surface-500">Email</span>
                    <p className="text-surface-900">{customer.email}</p>
                  </div>
                  <div>
                    <span className="text-surface-500">Regio</span>
                    <p className="text-surface-900">{customer.service_area || "-"}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Setup Checklist */}
          <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-100">
              <h2 className="font-semibold text-surface-900">Setup checklist</h2>
            </div>
            <div className="p-5 space-y-3">
              {[
                { key: "checkout", label: "Betaling", done: paymentDone },
                ...(hasSpeedLeads ? [
                  { key: "calendar", label: "Google Agenda", done: calendarDone },
                  { key: "forwarding", label: "Doorschakelen", done: forwardingDone },
                ] : []),
                ...(hasWebsite ? [
                  { key: "website", label: "Website opgeleverd", done: !!customer.website_url },
                ] : []),
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2 border-b border-surface-50 last:border-0">
                  <div className="flex items-center gap-3">
                    {item.done ? (
                      <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm">&#10003;</span>
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-sm">&#10007;</span>
                    )}
                    <span className="text-sm text-surface-900">{item.label}</span>
                  </div>
                  {item.key !== "website" && (
                    <button
                      onClick={() => sendLink(item.key)}
                      disabled={sending[item.key] || sent[item.key]}
                      className="text-sm px-3 py-1.5 rounded-lg border border-surface-200 text-surface-700 hover:bg-surface-50 transition-colors disabled:opacity-50"
                    >
                      {sent[item.key] ? "Verstuurd!" : sending[item.key] ? "Versturen..." : "Stuur link"}
                    </button>
                  )}
                </div>
              ))}

              <button
                onClick={() => sendLink("all")}
                disabled={sending.all || sent.all}
                className="btn-primary w-full py-2.5 text-sm mt-2 disabled:opacity-50"
              >
                {sent.all ? "Alle links verstuurd!" : sending.all ? "Versturen..." : "Stuur alle links via WhatsApp"}
              </button>
            </div>
          </div>

          {/* Website (only for website/compleet plans) */}
          {hasWebsite && (
            <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
                <h2 className="font-semibold text-surface-900">Website</h2>
                {customer.website_url && (
                  <a href={customer.website_url} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 hover:text-brand-700">
                    Bekijk site &rarr;
                  </a>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2 h-2 rounded-full ${customer.website_url ? "bg-green-500" : "bg-yellow-500"}`} />
                  <span className="text-sm text-surface-600">
                    {customer.website_url ? "Website opgeleverd" : "Website in aanbouw"}
                  </span>
                </div>
                <label className="input-label">Website URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://klant-website.nl"
                    className="input-field flex-1"
                  />
                  <button
                    onClick={async () => {
                      setSavingUrl(true);
                      try {
                        const res = await fetch(`/api/admin/klanten/${id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ website_url: websiteUrl || null, has_website: !!websiteUrl }),
                        });
                        if (res.ok) {
                          setCustomer({ ...customer, website_url: websiteUrl || null, has_website: !!websiteUrl });
                          setUrlSaved(true);
                          setTimeout(() => setUrlSaved(false), 2000);
                        }
                      } catch { /* silent */ } finally {
                        setSavingUrl(false);
                      }
                    }}
                    disabled={savingUrl}
                    className="btn-primary text-sm px-4 py-2 disabled:opacity-50 whitespace-nowrap"
                  >
                    {urlSaved ? "Opgeslagen!" : savingUrl ? "Opslaan..." : "Opslaan"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick WhatsApp */}
          <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-100">
              <h2 className="font-semibold text-surface-900">WhatsApp bericht sturen</h2>
            </div>
            <div className="p-5">
              <textarea
                value={waMessage}
                onChange={(e) => setWaMessage(e.target.value)}
                placeholder="Typ een bericht..."
                rows={3}
                className="input-field resize-none mb-3"
              />
              <button
                onClick={sendWhatsApp}
                disabled={waSending || !waMessage.trim()}
                className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
              >
                {waSent ? "Verstuurd!" : waSending ? "Versturen..." : "Verstuur via WhatsApp"}
              </button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Technical */}
          <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-100">
              <h2 className="font-semibold text-surface-900">Technisch</h2>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-surface-500">Twilio nummer</span>
                  <p className="text-surface-900 font-mono">{customer.twilio_number || "Geen"}</p>
                </div>
                {customer.twilio_number ? (
                  <button
                    onClick={releaseNumber}
                    disabled={releasingNumber}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {releasingNumber ? "Vrijgeven..." : "Vrijgeven"}
                  </button>
                ) : (
                  <button
                    onClick={assignNumber}
                    disabled={assigningNumber}
                    className="text-xs px-3 py-1.5 rounded-lg border border-surface-200 text-surface-700 hover:bg-surface-50 transition-colors disabled:opacity-50"
                  >
                    {assigningNumber ? "Toewijzen..." : "Nummer toewijzen"}
                  </button>
                )}
              </div>
              <div>
                <span className="text-surface-500">Stripe klant</span>
                {customer.stripe_customer_id ? (
                  <a
                    href={`https://dashboard.stripe.com/customers/${customer.stripe_customer_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:text-brand-700 block font-mono text-xs"
                  >
                    {customer.stripe_customer_id}
                  </a>
                ) : (
                  <p className="text-surface-400">Geen</p>
                )}
              </div>
              {customer.stripe_subscription_id && (
                <div>
                  <span className="text-surface-500">Stripe abonnement</span>
                  <a
                    href={`https://dashboard.stripe.com/subscriptions/${customer.stripe_subscription_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:text-brand-700 block font-mono text-xs"
                  >
                    {customer.stripe_subscription_id}
                  </a>
                </div>
              )}
              {customer.subscription_ends_at && (
                <div>
                  <span className="text-surface-500">Abonnement tot</span>
                  <p className="text-surface-900">
                    {new Date(customer.subscription_ends_at).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              )}
              <div>
                <span className="text-surface-500">Aangemaakt</span>
                <p className="text-surface-900">
                  {new Date(customer.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Contacts */}
          <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-100">
              <h2 className="font-semibold text-surface-900">Recente contacten ({leads.length})</h2>
            </div>
            {leads.length === 0 ? (
              <div className="p-5">
                <p className="text-sm text-surface-500 text-center py-4">Nog geen contacten</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-50">
                {leads.map((lead) => (
                  <div key={lead.id} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-surface-900">
                        {lead.customer_name || lead.customer_phone}
                      </span>
                      <span className="text-xs text-surface-500">
                        {new Date(lead.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-surface-500">{lead.customer_phone}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-surface-100 text-surface-600">
                        {leadStatusLabels[lead.status] || lead.status}
                      </span>
                      {lead.urgency && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          lead.urgency === "urgent" ? "bg-red-50 text-red-600" : "bg-surface-100 text-surface-600"
                        }`}>
                          {lead.urgency}
                        </span>
                      )}
                    </div>
                    {lead.problem_summary && (
                      <p className="text-xs text-surface-500 mt-1 line-clamp-1">{lead.problem_summary}</p>
                    )}
                    {lead.appointment_start && (
                      <p className="text-xs text-brand-600 mt-1">
                        Afspraak: {new Date(lead.appointment_start).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Danger Zone — Delete */}
          <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-red-100">
              <h2 className="font-semibold text-red-700">Klant verwijderen</h2>
            </div>
            <div className="p-5">
              {!showDeleteConfirm ? (
                <div>
                  <p className="text-sm text-surface-600 mb-3">
                    Verwijdert de klant, alle leads, berichten en geeft het Twilio nummer vrij. Dit kan niet ongedaan worden.
                  </p>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-sm px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Klant verwijderen
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-red-600 font-medium mb-3">
                    Weet je zeker dat je {customer.name} wilt verwijderen? Alle data wordt permanent verwijderd en het nummer wordt vrijgegeven.
                  </p>
                  {deleteError && (
                    <p className="text-sm text-red-600 mb-3">{deleteError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="text-sm px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {deleting ? "Verwijderen..." : "Ja, definitief verwijderen"}
                    </button>
                    <button
                      onClick={() => { setShowDeleteConfirm(false); setDeleteError(""); }}
                      className="text-sm px-4 py-2 rounded-lg border border-surface-200 text-surface-700 hover:bg-surface-50 transition-colors"
                    >
                      Annuleren
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
