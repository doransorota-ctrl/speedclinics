"use client";

import { useState } from "react";
import { nl } from "@/content/nl";

const icons: Record<string, React.ReactNode> = {
  check: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  phone: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  calendar: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  rocket: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
};

function ForwardingInstructions() {
  const [platform, setPlatform] = useState<"iphone" | "android">("iphone");
  const content = nl.thankYou.steps[1];
  if (!("expandContent" in content) || !content.expandContent) return null;

  return (
    <div className="mt-3 bg-surface-50 rounded-lg p-4">
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setPlatform("iphone")}
          className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
            platform === "iphone"
              ? "bg-surface-900 text-white"
              : "bg-white text-surface-600 border border-surface-200"
          }`}
        >
          iPhone
        </button>
        <button
          onClick={() => setPlatform("android")}
          className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
            platform === "android"
              ? "bg-surface-900 text-white"
              : "bg-white text-surface-600 border border-surface-200"
          }`}
        >
          Android
        </button>
      </div>
      <p className="text-sm text-surface-600 leading-relaxed">
        {platform === "iphone" ? content.expandContent.iphone : content.expandContent.android}
      </p>
      <p className="mt-2 text-xs text-surface-400">
        {content.expandContent.note}
      </p>
    </div>
  );
}

function CalendarTrustInfo() {
  const content = nl.thankYou.steps[2];
  if (!("calendarTrust" in content)) return null;

  return (
    <div className="mt-3 space-y-3 px-5 pb-5">
      {/* Trust points */}
      <ul className="space-y-1.5">
        {content.calendarTrust.map((item) => (
          <li key={item} className="flex items-center gap-2 text-xs text-surface-500">
            <svg className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {item}
          </li>
        ))}
      </ul>

      {/* Fallback note */}
      {"calendarFallback" in content && (
        <p className="text-xs text-surface-400 bg-surface-50 rounded-lg p-3">
          {content.calendarFallback}
        </p>
      )}
    </div>
  );
}

export default function BedanktPage() {
  const { thankYou } = nl;
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const calLink = process.env.NEXT_PUBLIC_CAL_LINK || "#";

  return (
    <div className="min-h-screen bg-surface-50 px-4 py-16">
      <div className="max-w-xl mx-auto">
        {/* Success icon */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-surface-900">{thankYou.headline}</h1>
          <p className="mt-3 text-lg text-surface-600">{thankYou.subheadline}</p>
        </div>

        {/* Onboarding steps */}
        <div className="space-y-3 mb-10">
          {thankYou.steps.map((step, i) => {
            const isExpandable = "expandable" in step && step.expandable;
            const hasCalendarTrust = "calendarTrust" in step;
            const canExpand = isExpandable || hasCalendarTrust;

            return (
              <div key={i} className="bg-white rounded-xl border border-surface-200 overflow-hidden">
                <div
                  className={`flex items-start gap-4 p-5 ${canExpand ? "cursor-pointer" : ""}`}
                  onClick={() => canExpand ? setExpandedStep(expandedStep === i ? null : i) : undefined}
                >
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                    "done" in step && step.done
                      ? "bg-brand-500 text-white"
                      : "bg-surface-100 text-surface-400"
                  }`}>
                    {icons[step.icon]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold ${"done" in step && step.done ? "text-surface-400 line-through" : "text-surface-900"}`}>
                        {step.title}
                      </h3>
                      {"done" in step && step.done && (
                        <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                          Klaar
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-surface-600 mt-0.5">{step.description}</p>
                  </div>
                  {canExpand && (
                    <svg
                      className={`w-5 h-5 text-surface-400 flex-shrink-0 mt-1 transition-transform ${expandedStep === i ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>

                {/* Expandable forwarding instructions */}
                {isExpandable && expandedStep === i && (
                  <div className="px-5 pb-5">
                    <ForwardingInstructions />
                  </div>
                )}

                {/* Calendar trust info */}
                {hasCalendarTrust && expandedStep === i && (
                  <CalendarTrustInfo />
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="space-y-3 mb-10">
          <a href={calLink} className="btn-primary text-center w-full block">
            {thankYou.bookOnboarding}
          </a>
          <p className="text-center text-xs text-surface-400">
            {thankYou.supportNote}
          </p>
        </div>

        {/* Referral */}
        <div className="bg-brand-50 rounded-2xl border border-brand-100 p-6 text-center">
          <h3 className="font-bold text-brand-800">{thankYou.referral.headline}</h3>
          <p className="text-sm text-brand-700 mt-1">{thankYou.referral.description}</p>
          <a
            href={`https://wa.me/?text=${encodeURIComponent("Hoi! Ik gebruik clŷniq om mijn klanten automatisch op te vangen via WhatsApp. Werkt top! Kijk even op speedleads.nl")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp mt-4 inline-flex"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {thankYou.referral.cta}
          </a>
        </div>
      </div>
    </div>
  );
}
