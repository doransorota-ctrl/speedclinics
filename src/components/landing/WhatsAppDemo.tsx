"use client";

import Link from "next/link";
import { nl } from "@/content/nl";
import { events } from "@/lib/analytics";
import { Iphone17Pro } from "@/components/ui/iphone-17-pro";

function ChatBubble({
  sender,
  text,
  time,
}: {
  sender: "ai" | "customer";
  text: string;
  time: string;
}) {
  const isCustomer = sender === "customer";

  return (
    <div className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] px-2.5 py-1.5 ${
          isCustomer
            ? "bg-brand-100 rounded-2xl rounded-tr-sm"
            : "bg-white rounded-2xl rounded-tl-sm shadow-sm shadow-black/[0.03]"
        }`}
      >
        <p className="text-[11px] text-surface-900 leading-relaxed">{text}</p>
        <div className="flex items-center justify-end gap-0.5 mt-0.5">
          <span className="text-[9px] text-surface-400">{time}</span>
          {isCustomer && (
            <svg className="w-3 h-3 text-brand-400" viewBox="0 0 16 11" fill="currentColor">
              <path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.011-2.095a.46.46 0 0 0-.327-.147.458.458 0 0 0-.33.15.52.52 0 0 0-.146.374c0 .136.05.263.14.36l2.36 2.46a.458.458 0 0 0 .312.152.478.478 0 0 0 .367-.163l6.54-8.076a.477.477 0 0 0 .107-.253.508.508 0 0 0-.137-.474z" />
              <path d="M14.757.653a.457.457 0 0 0-.305-.102.493.493 0 0 0-.38.178l-6.19 7.636-1.166-1.215-.36.445 1.198 1.25a.458.458 0 0 0 .312.151.478.478 0 0 0 .367-.163l6.54-8.076a.477.477 0 0 0 .108-.253.508.508 0 0 0-.124-.851z" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

function OwnerNotification() {
  const { whatsappDemo } = nl;

  return (
    <div>
      <h3 className="text-lg font-bold text-surface-900 mb-3">
        {whatsappDemo.ownerHeadline}
      </h3>

      <div className="bg-white border border-surface-100 shadow-sm shadow-black/5 rounded-2xl overflow-hidden">
        <div className="bg-accent-50 border-b border-accent-100 px-4 py-2.5 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center">
            <span className="text-white text-[7px] font-logo font-light">cŷ</span>
          </div>
          <span className="text-sm font-semibold text-accent-800">
            Nieuwe patiënt via clŷniq
          </span>
        </div>

        <div className="divide-y divide-surface-100">
          {whatsappDemo.ownerDetails.map((detail) => (
            <div key={detail.label} className="px-4 py-2.5 flex items-start gap-3">
              <span className="text-sm text-surface-500 w-20 flex-shrink-0">
                {detail.label}
              </span>
              <span className="text-sm font-medium text-surface-900">
                {detail.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs text-surface-500">
        U ontvangt dit als WhatsApp-melding op uw telefoon.
      </p>

      <div className="mt-5">
        <Link
          href="/demo"
          onClick={() => events.ctaClick("speed-leads-demo", "primary")}
          className="btn-primary text-sm text-center block w-full sm:w-auto sm:inline-block"
        >
          Boek een demo
        </Link>
      </div>
      <p className="mt-2 text-xs text-surface-400">
        {whatsappDemo.ctaMicro}
      </p>
    </div>
  );
}

export function WhatsAppDemo() {
  const { whatsappDemo } = nl;

  return (
    <section id="speed-leads" className="section">
      <div className="section-inner">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* WhatsApp conversation — iPhone 17 Pro mockup */}
          <div className="flex justify-center">
            <div className="relative" style={{ width: 280, height: 560 }}>
              {/* SVG phone frame */}
              <Iphone17Pro
                width={280}
                height={560}
                className="absolute inset-0 w-full h-full z-10 pointer-events-none text-surface-50"
              />

              {/* Live content inside frame */}
              <div
                className="absolute overflow-hidden flex flex-col"
                style={{
                  left: 20,
                  top: 18,
                  width: 240,
                  height: 524,
                  borderRadius: 34,
                }}
              >
                {/* Status bar */}
                <div className="relative bg-surface-50 px-5 pt-2.5 pb-0 shrink-0">
                  <div className="h-[26px]" />
                  <div className="flex items-center justify-between pb-1.5">
                    <span className="text-surface-900 text-[10px] font-semibold">09:41</span>
                    <div className="flex items-center gap-1">
                      <svg className="w-[13px] h-[10px]" viewBox="0 0 17 12" fill="#1A1816" fillOpacity="0.8">
                        <rect x="0" y="9" width="3" height="3" rx="0.5" />
                        <rect x="4.5" y="6" width="3" height="6" rx="0.5" />
                        <rect x="9" y="3" width="3" height="9" rx="0.5" />
                        <rect x="13.5" y="0" width="3" height="12" rx="0.5" />
                      </svg>
                      <svg className="w-[13px] h-[10px]" viewBox="0 0 16 12" fill="none" stroke="#1A1816" strokeOpacity="0.8" strokeWidth="1.5">
                        <path d="M1 4.5C3.5 1.5 12.5 1.5 15 4.5" strokeLinecap="round" />
                        <path d="M3.5 7C5.5 5 10.5 5 12.5 7" strokeLinecap="round" />
                        <circle cx="8" cy="10" r="1" fill="#1A1816" fillOpacity="0.8" stroke="none" />
                      </svg>
                      <svg className="w-[19px] h-[10px]" viewBox="0 0 27 13" fill="none">
                        <rect x="0.5" y="0.5" width="22" height="12" rx="3" stroke="#1A1816" strokeOpacity="0.3" />
                        <rect x="2" y="2" width="17" height="9" rx="1.5" fill="#1A1816" fillOpacity="0.8" />
                        <rect x="23.5" y="4" width="2" height="5" rx="1" fill="#1A1816" fillOpacity="0.25" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Chat header */}
                <div className="bg-surface-50 px-3 pb-2.5 flex items-center gap-2.5 border-b border-surface-200 shrink-0">
                  <svg className="w-4 h-4 text-surface-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-700 text-[9px] font-bold">KE</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-surface-900 text-[12px] font-semibold leading-tight truncate">Kliniek Esthétique</p>
                    <p className="text-brand-500 text-[9px] leading-tight font-medium">online</p>
                  </div>
                </div>

                {/* Chat messages */}
                <div
                  className="bg-[#F5F5F0] flex-1 min-h-0 px-2.5 py-2 space-y-1.5 overflow-y-auto"
                >
                  {whatsappDemo.messages.map((msg, i) => (
                    <ChatBubble
                      key={i}
                      sender={msg.sender as "ai" | "customer"}
                      text={msg.text}
                      time={msg.time}
                    />
                  ))}
                </div>

                {/* Input bar */}
                <div className="bg-[#F5F5F0] px-2.5 pb-2 pt-1 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 bg-white rounded-full px-3 py-1.5 flex items-center border border-surface-200">
                      <span className="text-[11px] text-surface-400 flex-1">Bericht</span>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Home indicator */}
                <div className="bg-[#F5F5F0] pb-1.5 flex justify-center shrink-0">
                  <div className="w-[80px] h-[3px] bg-surface-900/15 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div>
            <p className="text-sm font-semibold text-brand-600 uppercase tracking-wide mb-2">
              {whatsappDemo.sectionLabel}
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif italic text-surface-900 mb-3">
              {whatsappDemo.headline}
            </h2>
            <p className="text-lg text-surface-500 mb-8">
              {whatsappDemo.subheadline}
            </p>
            <OwnerNotification />
          </div>
        </div>
      </div>
    </section>
  );
}
