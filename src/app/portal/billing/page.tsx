"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useBusiness } from "@/lib/hooks/useBusiness";

type Invoice = {
  id: string;
  date: number;
  amount: number;
  currency: string;
  status: string | null;
  pdfUrl: string | null;
  hostedUrl: string | null;
};

const PLAN_NAMES: Record<string, string> = {
  "speed-leads": "Clŷniq",
  website: "Clŷniq",
  compleet: "Clŷniq",
};

const PLAN_PRICES: Record<string, string> = {
  "speed-leads": "Op maat",
  website: "Op maat",
  compleet: "Op maat",
};

export default function BillingPage() {
  return (
    <Suspense>
      <BillingContent />
    </Suspense>
  );
}

function BillingContent() {
  const { business, loading } = useBusiness();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/billing/invoices")
      .then((res) => res.json())
      .then((data) => setInvoices(data.invoices || []))
      .catch(() => {})
      .finally(() => setInvoicesLoading(false));
  }, []);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/portal/billing/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Kon checkout niet starten");
        setCheckoutLoading(false);
      }
    } catch {
      setError("Er ging iets mis");
      setCheckoutLoading(false);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    setError("");
    try {
      const res = await fetch("/api/portal/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Kon portaal niet openen");
        setPortalLoading(false);
      }
    } catch {
      setError("Er ging iets mis");
      setPortalLoading(false);
    }
  };

  const trialDaysLeft = () => {
    if (!business?.subscription_ends_at) return 0;
    const diff = new Date(business.subscription_ends_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const trialProgress = () => {
    if (!business?.trial_starts_at || !business?.subscription_ends_at) return 0;
    const start = new Date(business.trial_starts_at).getTime();
    const end = new Date(business.subscription_ends_at).getTime();
    const now = Date.now();
    return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-surface-200 rounded w-48" />
        <div className="bg-white rounded-xl border border-surface-200 p-6 h-48" />
        <div className="bg-white rounded-xl border border-surface-200 p-6 h-32" />
      </div>
    );
  }

  const planName = PLAN_NAMES[business?.plan || "speed-leads"] || "Clŷniq";
  const planPrice = PLAN_PRICES[business?.plan || "speed-leads"] || "Op maat";
  const daysLeft = trialDaysLeft();
  const progress = trialProgress();

  return (
    <div>
      <h1 className="text-2xl font-bold text-surface-900">Facturatie</h1>
      <p className="text-surface-500 mt-1">
        Beheer uw abonnement en bekijk facturen.
      </p>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {isSuccess && (
        <div className="mt-4 p-3 bg-brand-50 border border-brand-200 rounded-lg flex items-center gap-2">
          <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm font-medium text-brand-700">Abonnement geactiveerd! Bedankt voor uw vertrouwen.</p>
        </div>
      )}

      <div className="mt-6 space-y-6">
        {/* Current plan */}
        <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-surface-900">Huidig abonnement</h2>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              business?.status === "active"
                ? "bg-brand-50 text-brand-700"
                : business?.status === "trialing"
                  ? "bg-blue-50 text-blue-700"
                  : business?.status === "past_due"
                    ? "bg-red-50 text-red-700"
                    : "bg-surface-100 text-surface-600"
            }`}>
              {business?.status === "active" && "Actief"}
              {business?.status === "trialing" && "Proefperiode"}
              {business?.status === "past_due" && "Betaling mislukt"}
              {business?.status === "cancelled" && "Opgezegd"}
              {business?.status === "paused" && "Gepauzeerd"}
            </span>
          </div>
          <div className="p-6">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-surface-900">{planPrice}</span>
              <span className="text-surface-500">/maand excl. BTW</span>
            </div>
            <p className="text-sm text-surface-600 mt-1">{planName}</p>

            {/* Trial progress bar */}
            {business?.status === "trialing" && daysLeft > 0 && (
              <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-blue-800">Proefperiode</p>
                  <p className="text-sm font-semibold text-blue-900">
                    {daysLeft} {daysLeft === 1 ? "dag" : "dagen"} resterend
                  </p>
                </div>
                <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  Uw proefperiode loopt tot{" "}
                  {business.subscription_ends_at
                    ? new Date(business.subscription_ends_at).toLocaleDateString("nl-NL", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "het einde van de proefperiode"}
                  . Daarna wordt {planPrice}/maand excl. BTW automatisch in rekening gebracht.
                  Opzeggen kan op elk moment via &quot;Beheer abonnement&quot;.
                </p>
              </div>
            )}
            {business?.status === "trialing" && daysLeft === 0 && (
              <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm font-medium text-amber-800">Uw proefperiode is verlopen.</p>
                <p className="text-xs text-amber-700 mt-1">
                  Activeer uw abonnement om Clŷniq te blijven gebruiken.
                </p>
              </div>
            )}

            {/* Payment failed warning */}
            {business?.status === "past_due" && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">Betaling mislukt</p>
                  <p className="text-xs text-red-700 mt-0.5">
                    Werk uw betaalmethode bij om uw abonnement actief te houden.
                  </p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={handlePortal}
                disabled={portalLoading}
                className="btn-primary text-sm px-5 py-2.5"
              >
                {portalLoading ? "Even geduld..." : "Beheer abonnement"}
              </button>
            </div>
          </div>
        </div>

        {/* Invoices */}
        <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100">
            <h2 className="text-base font-semibold text-surface-900">Facturen</h2>
          </div>
          <div className="p-6">
            {invoicesLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-10 bg-surface-100 rounded" />
                <div className="h-10 bg-surface-100 rounded" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-4">
                <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm text-surface-500">Nog geen facturen.</p>
                <p className="text-xs text-surface-400 mt-1">Facturen verschijnen hier na je eerste betaling.</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-100">
                {invoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-surface-900">
                          {new Date(inv.date * 1000).toLocaleDateString("nl-NL", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-surface-500">
                          {(inv.amount / 100).toLocaleString("nl-NL", {
                            style: "currency",
                            currency: inv.currency,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        inv.status === "paid"
                          ? "bg-brand-50 text-brand-700"
                          : inv.status === "open"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-surface-100 text-surface-600"
                      }`}>
                        {inv.status === "paid" && "Betaald"}
                        {inv.status === "open" && "Open"}
                        {inv.status === "draft" && "Concept"}
                        {inv.status === "void" && "Geannuleerd"}
                        {inv.status === "uncollectible" && "Oninbaar"}
                      </span>
                      {inv.pdfUrl && (
                        <a
                          href={inv.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-brand-600 hover:text-brand-700"
                        >
                          PDF
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
