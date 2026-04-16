"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";

interface Contact {
  phone: string;
  name?: string;
}

interface SendResult {
  phone: string;
  name: string | null;
  status: "sent" | "skipped" | "failed";
  leadId?: string;
}

interface OutreachLead {
  id: string;
  customer_phone: string;
  customer_name: string | null;
  status: string;
  created_at: string;
  delivery_status: string;
  has_response: boolean;
}

const deliveryLabels: Record<string, string> = {
  sent: "Verzonden",
  delivered: "Afgeleverd",
  read: "Gelezen",
  failed: "Mislukt",
  undelivered: "Niet afgeleverd",
  unknown: "Wacht...",
};

const deliveryColors: Record<string, string> = {
  sent: "bg-blue-50 text-blue-700",
  delivered: "bg-green-50 text-green-700",
  read: "bg-blue-50 text-blue-700",
  failed: "bg-red-50 text-red-700",
  undelivered: "bg-red-50 text-red-700",
  unknown: "bg-surface-100 text-surface-600",
};

function parseContacts(text: string): Contact[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[,\t]/).map((p) => p.trim());
      if (parts.length >= 2) {
        // Check which part is the phone
        const last = parts[parts.length - 1];
        if (/\d{8,}/.test(last.replace(/[\s+\-]/g, ""))) {
          return { name: parts.slice(0, -1).join(" "), phone: last };
        }
        return { phone: parts[0], name: parts.slice(1).join(" ") };
      }
      return { phone: line };
    })
    .filter((c) => c.phone.replace(/\D/g, "").length >= 9);
}

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

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim());
  const rows = lines.slice(1).map((line) => {
    const row: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === "," && !inQuotes) { row.push(current.trim()); current = ""; continue; }
      current += char;
    }
    row.push(current.trim());
    return row;
  });
  return { headers, rows };
}

export default function OutreachPage() {
  const [view, setView] = useState<"input" | "csv-map" | "preview" | "results">("input");
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<Contact[]>([]);
  const [sending, setSending] = useState(false);
  const [paused, setPaused] = useState(false);
  const [sendResults, setSendResults] = useState<SendResult[]>([]);
  const [outreachLeads, setOutreachLeads] = useState<OutreachLead[]>([]);
  const [error, setError] = useState("");
  const [batchSize, setBatchSize] = useState(25);
  const [sendIndex, setSendIndex] = useState(0);
  const sendIndexRef = useRef(0);
  const pausedRef = useRef(false);

  // CSV state
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [phoneCol, setPhoneCol] = useState<number>(-1);
  const [nameCol, setNameCol] = useState<number>(-1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [statusLoaded, setStatusLoaded] = useState(false);
  const [filter, setFilter] = useState<"all" | "responded" | "waiting">("all");
  const [campaignType, setCampaignType] = useState<"speed-leads" | "website">("speed-leads");

  // Fetch existing outreach leads on mount
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/outreach");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setOutreachLeads(data);
      }
    } catch {
      // ignore
    } finally {
      setStatusLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Poll for status updates when in results view
  useEffect(() => {
    if (view !== "results") return;
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [view, fetchStatus]);

  function normalizePhone(phone: string): string {
    const cleaned = phone.replace(/[^\d+]/g, "");
    if (cleaned.startsWith("+")) return cleaned;
    if (cleaned.startsWith("31") && cleaned.length >= 10) return `+${cleaned}`;
    if (cleaned.startsWith("0")) return `+31${cleaned.slice(1)}`;
    return `+31${cleaned}`;
  }

  function filterAlreadyContacted(contacts: Contact[]): { filtered: Contact[]; removed: number } {
    // Include all statuses — if we ever sent to this number, skip it
    const existingPhones = new Set(outreachLeads.map((l) => l.customer_phone));
    const filtered = contacts.filter((c) => !existingPhones.has(normalizePhone(c.phone)));
    return { filtered, removed: contacts.length - filtered.length };
  }

  function handleParse() {
    const contacts = parseContacts(rawText);
    if (contacts.length === 0) {
      setError("Geen geldige telefoonnummers gevonden");
      return;
    }
    const { filtered, removed } = filterAlreadyContacted(contacts);
    if (filtered.length === 0) {
      setError(`Alle ${removed} nummers zijn al gecontacteerd`);
      return;
    }
    setError("");
    if (removed > 0) setError(`${removed} nummers al gecontacteerd en verwijderd`);
    setParsed(filtered);
    setView("preview");
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers, rows } = parseCSV(text);
      if (headers.length === 0 || rows.length === 0) {
        setError("Kon CSV niet lezen. Zorg dat het komma-gescheiden is.");
        return;
      }
      setCsvHeaders(headers);
      setCsvRows(rows);
      // Auto-detect phone and name columns
      const phonIdx = headers.findIndex((h) => /telefoon|phone|tel|mobiel|nummer/i.test(h));
      const namIdx = headers.findIndex((h) => /naam|name|bedrijf|title/i.test(h));
      setPhoneCol(phonIdx >= 0 ? phonIdx : -1);
      setNameCol(namIdx >= 0 ? namIdx : -1);
      setView("csv-map");
    };
    reader.readAsText(file);
  }

  function handleCsvConfirm() {
    if (phoneCol < 0) {
      setError("Selecteer een kolom voor telefoonnummer");
      return;
    }
    const contacts: Contact[] = csvRows
      .map((row) => ({
        phone: row[phoneCol] || "",
        name: nameCol >= 0 ? row[nameCol] || undefined : undefined,
      }))
      .filter((c) => c.phone.replace(/\D/g, "").length >= 9);
    if (contacts.length === 0) {
      setError("Geen geldige telefoonnummers gevonden in de geselecteerde kolom");
      return;
    }
    const { filtered, removed } = filterAlreadyContacted(contacts);
    if (filtered.length === 0) {
      setError(`Alle ${removed} nummers zijn al gecontacteerd`);
      return;
    }
    setError("");
    if (removed > 0) setError(`${removed} nummers al gecontacteerd en verwijderd`);
    setParsed(filtered);
    setView("preview");
  }

  async function handleSend() {
    setSending(true);
    setPaused(false);
    pausedRef.current = false;
    setError("");
    setView("results");

    const startFrom = sendIndexRef.current;
    const toSend = parsed.slice(startFrom, startFrom + batchSize);
    const results = [...sendResults];

    for (let i = 0; i < toSend.length; i++) {
      if (pausedRef.current) {
        setSending(false);
        return;
      }

      const contact = toSend[i];
      try {
        const res = await fetch("/api/portal/outreach/send-one", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: contact.phone, name: contact.name, campaignType }),
        });
        const data = await res.json();
        results.push({
          phone: contact.phone,
          name: contact.name || null,
          status: data.status === "sent" ? "sent" : data.status === "skipped" ? "skipped" : "failed",
          leadId: data.leadId,
        });
      } catch {
        results.push({ phone: contact.phone, name: contact.name || null, status: "failed" });
      }

      const newIndex = startFrom + i + 1;
      sendIndexRef.current = newIndex;
      setSendIndex(newIndex);
      setSendResults([...results]);
      fetchStatus();

      await new Promise((r) => setTimeout(r, 1000));
    }

    setSending(false);
  }

  function handlePause() {
    pausedRef.current = true;
    setPaused(true);
  }

  function handleResume() {
    setPaused(false);
    pausedRef.current = false;
    handleSend();
  }

  // ─── Input View ───
  if (view === "input") {
    return (
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Outreach</h1>
            <p className="text-surface-500 mt-1">
              Verstuur WhatsApp-berichten naar nieuwe leads.
            </p>
          </div>
        </div>

        {/* Existing outreach leads */}
        {outreachLeads.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-surface-700">Recente outreach</h2>
              <div className="flex items-center gap-2">
                {(["all", "responded", "waiting"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                      filter === f
                        ? "bg-brand-500 text-white"
                        : "bg-surface-100 text-surface-500 hover:bg-surface-200"
                    }`}
                  >
                    {f === "all" ? `Alle (${outreachLeads.length})` : f === "responded" ? `Gereageerd (${outreachLeads.filter((l) => l.has_response).length})` : `Wacht (${outreachLeads.filter((l) => !l.has_response).length})`}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {outreachLeads.filter((l) => filter === "all" ? true : filter === "responded" ? l.has_response : !l.has_response).slice(0, 10).map((lead) => (
                <Link
                  key={lead.id}
                  href={`/portal/leads/${lead.id}`}
                  className="flex items-center justify-between bg-white rounded-lg border border-surface-200 px-4 py-3 hover:border-surface-300 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-surface-900">
                      {lead.customer_name || lead.customer_phone}
                    </p>
                    {lead.customer_name && (
                      <p className="text-xs text-surface-400">{lead.customer_phone}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {lead.has_response ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
                        Gereageerd
                      </span>
                    ) : (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${deliveryColors[lead.delivery_status] || deliveryColors.unknown}`}>
                        {deliveryLabels[lead.delivery_status] || "Wacht..."}
                      </span>
                    )}
                    <span className="text-xs text-surface-400">{getRelativeTime(lead.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
            {outreachLeads.filter((l) => filter === "all" ? true : filter === "responded" ? l.has_response : !l.has_response).length > 10 && (
              <button
                onClick={() => setView("results")}
                className="mt-2 text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                Bekijk alle {outreachLeads.filter((l) => filter === "all" ? true : filter === "responded" ? l.has_response : !l.has_response).length} contacten
              </button>
            )}
          </div>
        )}

        {/* CSV Upload */}
        <div className="mt-6 bg-white rounded-xl border border-surface-200 p-6">
          <label className="block text-sm font-medium text-surface-700 mb-2">
            Upload CSV
          </label>
          <p className="text-xs text-surface-400 mb-3">
            Upload een CSV-bestand uit Google Sheets of je scraper. Je kiest daarna welke kolom naam en telefoonnummer is.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="block w-full text-sm text-surface-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 file:cursor-pointer"
          />
        </div>

        {/* Or paste manually */}
        <div className="mt-4 bg-white rounded-xl border border-surface-200 p-6">
          <label className="block text-sm font-medium text-surface-700 mb-2">
            Of plak telefoonnummers
          </label>
          <p className="text-xs text-surface-400 mb-3">
            Format: <span className="font-mono">Naam, 0612345678</span> of gewoon <span className="font-mono">0612345678</span>
          </p>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={"Jan de Vries, 0612345678\nPiet Bakker, 0698765432\n0611223344"}
            className="w-full h-32 rounded-lg border border-surface-200 px-4 py-3 text-sm font-mono focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none"
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={handleParse}
              disabled={!rawText.trim() || !statusLoaded}
              className="btn-primary text-sm px-6 py-2.5 disabled:opacity-50"
            >
              {statusLoaded ? "Controleer nummers" : "Laden..."}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 mt-3">{error}</p>
        )}
      </div>
    );
  }

  // ─── CSV Column Mapping View ───
  if (view === "csv-map") {
    return (
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Kolommen koppelen</h1>
            <p className="text-surface-500 mt-1">
              Selecteer welke kolom het telefoonnummer en de naam bevat.
            </p>
          </div>
          <button onClick={() => setView("input")} className="text-sm text-surface-500 hover:text-surface-700">
            Terug
          </button>
        </div>

        <div className="mt-6 bg-white rounded-xl border border-surface-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Telefoonnummer *</label>
            <select
              value={phoneCol}
              onChange={(e) => setPhoneCol(Number(e.target.value))}
              className="input-field"
            >
              <option value={-1}>— Selecteer kolom —</option>
              {csvHeaders.map((h, i) => (
                <option key={i} value={i}>{h}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Naam (optioneel)</label>
            <select
              value={nameCol}
              onChange={(e) => setNameCol(Number(e.target.value))}
              className="input-field"
            >
              <option value={-1}>— Geen naam —</option>
              {csvHeaders.map((h, i) => (
                <option key={i} value={i}>{h}</option>
              ))}
            </select>
          </div>

          {/* Preview first 3 rows */}
          {phoneCol >= 0 && csvRows.length > 0 && (
            <div className="mt-4 border border-surface-100 rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-surface-50 text-xs font-medium text-surface-500">
                Preview ({csvRows.length} rijen)
              </div>
              <div className="divide-y divide-surface-100">
                {csvRows.slice(0, 3).map((row, i) => (
                  <div key={i} className="px-4 py-2 flex justify-between text-sm">
                    <span className="text-surface-900">{nameCol >= 0 ? row[nameCol] || "—" : "—"}</span>
                    <span className="text-surface-500 font-mono">{row[phoneCol] || "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleCsvConfirm}
              disabled={phoneCol < 0 || !statusLoaded}
              className="btn-primary text-sm px-6 py-2.5 disabled:opacity-50"
            >
              {statusLoaded ? `Controleer ${csvRows.length} nummers` : "Laden..."}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Preview View ───
  if (view === "preview") {
    return (
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Outreach</h1>
            <p className="text-surface-500 mt-1">
              Controleer de nummers en verstuur.
            </p>
          </div>
          <button
            onClick={() => setView("input")}
            className="text-sm text-surface-500 hover:text-surface-700"
          >
            Terug
          </button>
        </div>

        {/* Campaign type toggle */}
        <div className="mt-4 inline-flex bg-surface-100 rounded-lg p-1">
          <button
            onClick={() => setCampaignType("speed-leads")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              campaignType === "speed-leads"
                ? "bg-white text-surface-900 shadow-sm"
                : "text-surface-500 hover:text-surface-700"
            }`}
          >
            Speed Clinics
          </button>
          <button
            onClick={() => setCampaignType("website")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              campaignType === "website"
                ? "bg-white text-surface-900 shadow-sm"
                : "text-surface-500 hover:text-surface-700"
            }`}
          >
            Website
          </button>
        </div>

        <div className="mt-4 bg-white rounded-xl border border-surface-200">
          <div className="px-6 py-4 border-b border-surface-100">
            <p className="text-sm font-medium text-surface-700">
              {parsed.length} contacten gevonden
            </p>
          </div>

          <div className="divide-y divide-surface-100 max-h-96 overflow-y-auto">
            {parsed.map((contact, i) => (
              <div key={i} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-surface-900">
                    {contact.name || "Onbekend"}
                  </p>
                  <p className="text-xs text-surface-400">{contact.phone}</p>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  Nieuw
                </span>
              </div>
            ))}
          </div>

          {error && (
            <div className="px-6 py-3 border-t border-surface-100">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="px-6 py-4 border-t border-surface-100 space-y-3">
            <div className="flex items-center gap-4">
              <label className="text-xs text-surface-500 whitespace-nowrap">Aantal per batch:</label>
              <select
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="text-sm border border-surface-200 rounded-lg px-3 py-1.5"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
              <p className="text-xs text-surface-400 flex-1">
                {Math.min(batchSize, parsed.length)} van {parsed.length} worden verstuurd. Bestaande leads overgeslagen.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => { sendIndexRef.current = 0; setSendIndex(0); setSendResults([]); handleSend(); }}
                disabled={sending}
                className="btn-primary text-sm px-6 py-2.5 disabled:opacity-50"
              >
                Start ({Math.min(batchSize, parsed.length)} berichten)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Results View ───
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Outreach</h1>
          <p className="text-surface-500 mt-1">
            {sending ? `Versturen... ${sendResults.length} / ${Math.min(batchSize, parsed.length)}` : "Status van je verstuurde berichten."}
          </p>
        </div>
        <div className="flex gap-2">
          {sending ? (
            <button
              onClick={handlePause}
              className="text-sm px-5 py-2.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
            >
              Pauzeer
            </button>
          ) : paused && sendIndex < parsed.length ? (
            <button
              onClick={handleResume}
              className="btn-primary text-sm px-5 py-2.5"
            >
              Hervat ({parsed.length - sendIndex} over)
            </button>
          ) : null}
          <button
            onClick={() => {
              pausedRef.current = true;
              setSending(false);
              setPaused(false);
              setRawText("");
              setParsed([]);
              setSendResults([]);
              sendIndexRef.current = 0;
              setSendIndex(0);
              setView("input");
            }}
            className={`text-sm px-5 py-2.5 rounded-lg ${sending ? "border border-surface-200 text-surface-600 hover:bg-surface-50" : "btn-primary"}`}
          >
            Nieuwe batch
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {(sending || paused) && parsed.length > 0 && (
        <div className="mt-4 bg-surface-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-brand-500 h-full transition-all duration-300"
            style={{ width: `${(sendResults.length / Math.min(batchSize, parsed.length)) * 100}%` }}
          />
        </div>
      )}

      {/* Send results summary */}
      {sendResults.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-700">
              {sendResults.filter((r) => r.status === "sent").length}
            </p>
            <p className="text-xs text-green-600 mt-1">Verzonden</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-700">
              {sendResults.filter((r) => r.status === "skipped").length}
            </p>
            <p className="text-xs text-yellow-600 mt-1">Overgeslagen</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-700">
              {sendResults.filter((r) => r.status === "failed").length}
            </p>
            <p className="text-xs text-red-600 mt-1">Mislukt</p>
          </div>
        </div>
      )}

      {/* Lead status list */}
      <div className="mt-6 space-y-2">
        {outreachLeads.map((lead) => (
          <Link
            key={lead.id}
            href={`/portal/leads/${lead.id}`}
            className="flex items-center justify-between bg-white rounded-lg border border-surface-200 px-4 py-3 hover:border-surface-300 transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-surface-900">
                {lead.customer_name || lead.customer_phone}
              </p>
              {lead.customer_name && (
                <p className="text-xs text-surface-400">{lead.customer_phone}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {lead.has_response ? (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
                  Gereageerd
                </span>
              ) : (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${deliveryColors[lead.delivery_status] || deliveryColors.unknown}`}>
                  {deliveryLabels[lead.delivery_status] || "Wacht..."}
                </span>
              )}
              <span className="text-xs text-surface-400">{getRelativeTime(lead.created_at)}</span>
            </div>
          </Link>
        ))}

        {outreachLeads.length === 0 && sendResults.length === 0 && (
          <div className="bg-white rounded-xl border border-surface-200 p-12 text-center">
            <h3 className="text-lg font-semibold text-surface-900">Nog geen outreach</h3>
            <p className="text-sm text-surface-500 mt-2">
              Plak telefoonnummers en verstuur je eerste batch.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
