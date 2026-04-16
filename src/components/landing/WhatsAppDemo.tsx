"use client";

import Link from "next/link";
import { nl } from "@/content/nl";
import { events } from "@/lib/analytics";

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
            ? "bg-[#d9fdd3] rounded-lg rounded-tr-none"
            : "bg-white rounded-lg rounded-tl-none"
        }`}
      >
        <p className="text-[13px] text-surface-900 leading-relaxed">{text}</p>
        <div className="flex items-center justify-end gap-0.5 mt-0.5">
          <span className="text-[10px] text-surface-400">{time}</span>
          {isCustomer && (
            <svg className="w-3.5 h-3.5 text-[#53bdeb]" viewBox="0 0 16 11" fill="currentColor">
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
          <div className="w-6 h-6 rounded-full bg-surface-900 flex items-center justify-center">
            <span className="text-white text-[8px] font-bold">SC</span>
          </div>
          <span className="text-sm font-semibold text-accent-800">
            Nieuwe patiënt via Speed Clinics
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
          {/* WhatsApp conversation — phone mockup */}
          <div className="flex justify-center">
            <div className="w-[270px] sm:w-[300px]">
              <div className="bg-[#1a1a1a] rounded-[3rem] p-[10px] shadow-2xl shadow-black/30">
                <div className="bg-black rounded-[2.2rem] overflow-hidden relative">
                  {/* Status bar */}
                  <div className="relative bg-[#075e54] px-5 pt-3 pb-0">
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[90px] h-[25px] bg-black rounded-full z-10" />
                    <div className="flex items-center justify-between pt-0.5 pb-2">
                      <span className="text-white/90 text-[11px] font-semibold">09:41</span>
                      <div className="flex items-center gap-1">
                        <svg className="w-[15px] h-[11px]" viewBox="0 0 17 12" fill="white" fillOpacity="0.9">
                          <rect x="0" y="9" width="3" height="3" rx="0.5" />
                          <rect x="4.5" y="6" width="3" height="6" rx="0.5" />
                          <rect x="9" y="3" width="3" height="9" rx="0.5" />
                          <rect x="13.5" y="0" width="3" height="12" rx="0.5" />
                        </svg>
                        <svg className="w-[15px] h-[11px]" viewBox="0 0 16 12" fill="none" stroke="white" strokeOpacity="0.9" strokeWidth="1.5">
                          <path d="M1 4.5C3.5 1.5 12.5 1.5 15 4.5" strokeLinecap="round" />
                          <path d="M3.5 7C5.5 5 10.5 5 12.5 7" strokeLinecap="round" />
                          <circle cx="8" cy="10" r="1" fill="white" fillOpacity="0.9" stroke="none" />
                        </svg>
                        <svg className="w-[22px] h-[11px]" viewBox="0 0 27 13" fill="none">
                          <rect x="0.5" y="0.5" width="22" height="12" rx="3" stroke="white" strokeOpacity="0.5" />
                          <rect x="2" y="2" width="17" height="9" rx="1.5" fill="white" fillOpacity="0.9" />
                          <rect x="23.5" y="4" width="2" height="5" rx="1" fill="white" fillOpacity="0.4" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp header */}
                  <div className="bg-[#075e54] px-3 pb-2.5 flex items-center gap-2.5">
                    <svg className="w-5 h-5 text-white/90 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <div className="w-9 h-9 rounded-full bg-[#128c7e] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">KE</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-[13px] font-medium leading-tight truncate">Kliniek Esthétique</p>
                      <p className="text-white/60 text-[10px] leading-tight">online</p>
                    </div>
                    <div className="flex items-center gap-3.5">
                      <svg className="w-[18px] h-[18px] text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <svg className="w-[18px] h-[18px] text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                  </div>

                  {/* Chat area */}
                  <div
                    className="p-2.5 space-y-1 bg-[#efeae2] max-h-[380px] overflow-y-auto"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cfc6' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
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

                  {/* Message input bar */}
                  <div className="bg-[#efeae2] px-2 pb-2 pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 bg-white rounded-full px-3 py-1.5 flex items-center gap-2">
                        <svg className="w-5 h-5 text-surface-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-[13px] text-surface-400 flex-1">Bericht</span>
                        <svg className="w-5 h-5 text-surface-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <svg className="w-5 h-5 text-surface-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="w-9 h-9 rounded-full bg-[#00a884] flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
                          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Bottom home indicator */}
                  <div className="bg-[#efeae2] pb-2 flex justify-center">
                    <div className="w-[120px] h-[4px] bg-black/20 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div>
            <p className="text-sm font-semibold text-brand-600 uppercase tracking-wide mb-2">
              {whatsappDemo.sectionLabel}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 mb-3">
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
