"use client";

import { useState, useEffect, useRef } from "react";

const STEPS = [
  {
    label: "Gemiste oproep",
    icon: "phone",
    messages: [],
  },
  {
    label: "WhatsApp binnen 5 sec",
    icon: "whatsapp",
    messages: [
      {
        sender: "ai",
        text: "Hoi! Je belde net met Bakker Loodgieters. We zijn even op een klus. Waarmee kan ik je helpen?",
      },
    ],
  },
  {
    label: "AI kwalificeert de lead",
    icon: "chat",
    messages: [
      {
        sender: "ai",
        text: "Hoi! Je belde net met Bakker Loodgieters. We zijn even op een klus. Waarmee kan ik je helpen?",
      },
      {
        sender: "customer",
        text: "Lekkage in de badkamer, best dringend",
      },
      {
        sender: "ai",
        text: "Vervelend! Wat is je adres? Dan kijken we wanneer we langs kunnen komen.",
      },
      {
        sender: "customer",
        text: "Kerkstraat 12, Amsterdam",
      },
    ],
  },
  {
    label: "Afspraak ingepland",
    icon: "calendar",
    messages: [
      {
        sender: "ai",
        text: "Hoi! Je belde net met Bakker Loodgieters. We zijn even op een klus. Waarmee kan ik je helpen?",
      },
      {
        sender: "customer",
        text: "Lekkage in de badkamer, best dringend",
      },
      {
        sender: "ai",
        text: "Vervelend! Wat is je adres? Dan kijken we wanneer we langs kunnen komen.",
      },
      {
        sender: "customer",
        text: "Kerkstraat 12, Amsterdam",
      },
      {
        sender: "ai",
        text: "Top! Ik heb morgen 10:00 beschikbaar. Past dat?",
      },
      {
        sender: "customer",
        text: "Ja perfect!",
      },
      {
        sender: "ai",
        text: "Afspraak ingepland! Morgen 10:00 — Kerkstraat 12. Tot dan! ✅",
      },
    ],
  },
  {
    label: "Herinnering verstuurd",
    icon: "bell",
    messages: [
      {
        sender: "ai",
        text: "Goedenavond! Even een herinnering: morgen om 10:00 komt Bakker Loodgieters langs op Kerkstraat 12. Tot morgen! 🔔",
      },
      {
        sender: "customer",
        text: "Dankjewel, ik ben er klaar voor!",
      },
    ],
  },
  {
    label: "Review gevraagd",
    icon: "star",
    messages: [
      {
        sender: "ai",
        text: "Bedankt voor je vertrouwen in Bakker Loodgieters! Was je tevreden over de service? Een review helpt ons enorm 🙏",
      },
      {
        sender: "customer",
        text: "Ja, super snel en netjes! ⭐⭐⭐⭐⭐",
      },
      {
        sender: "ai",
        text: "Top! Klik hier om je review achter te laten: g.co/r/bakker 🎉 Bedankt!",
      },
    ],
  },
];

function PhoneIcon() {
  return (
    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.05 5A5 5 0 0119 8.95M15.05 1A9 9 0 0123 8.94M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg className="w-8 h-8 text-green-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg className="w-8 h-8 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-8 h-8 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l2 2 4-4" className="text-green-500" stroke="currentColor" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

const ICONS = { phone: PhoneIcon, whatsapp: WhatsAppIcon, chat: ChatIcon, calendar: CalendarIcon, bell: BellIcon, star: StarIcon };

export function HeroAnimation() {
  const [activeStep, setActiveStep] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);

  // Auto-advance steps
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STEPS.length);
      setVisibleMessages(0);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Animate messages appearing one by one
  useEffect(() => {
    const step = STEPS[activeStep];
    if (step.messages.length === 0) return;

    setVisibleMessages(0);
    let count = 0;
    const msgTimer = setInterval(() => {
      count++;
      setVisibleMessages(count);
      if (count >= step.messages.length) clearInterval(msgTimer);
    }, 500);

    return () => clearInterval(msgTimer);
  }, [activeStep]);

  // Auto-scroll chat to bottom when new messages appear
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [visibleMessages, activeStep]);

  const currentStep = STEPS[activeStep];

  return (
    <div className="pt-2">
      {/* Phone mockup */}
      <div className="relative mx-auto w-[270px] sm:w-[300px]">
        {/* Outer phone shell — sleek dark frame */}
        <div className="bg-[#1a1a1a] rounded-[3rem] p-[10px] shadow-2xl shadow-black/30">
          {/* Inner screen */}
          <div className="bg-black rounded-[2.2rem] overflow-hidden relative">
            {/* Status bar */}
            <div className="relative bg-[#075e54] px-5 pt-3 pb-0">
              {/* Dynamic Island */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[90px] h-[25px] bg-black rounded-full z-10" />
              {/* Status bar content */}
              <div className="flex items-center justify-between pt-0.5 pb-2">
                <span className="text-white/90 text-[11px] font-semibold">09:41</span>
                <div className="flex items-center gap-1">
                  {/* Signal bars */}
                  <svg className="w-[15px] h-[11px]" viewBox="0 0 17 12" fill="white" fillOpacity="0.9">
                    <rect x="0" y="9" width="3" height="3" rx="0.5" />
                    <rect x="4.5" y="6" width="3" height="6" rx="0.5" />
                    <rect x="9" y="3" width="3" height="9" rx="0.5" />
                    <rect x="13.5" y="0" width="3" height="12" rx="0.5" />
                  </svg>
                  {/* WiFi */}
                  <svg className="w-[15px] h-[11px]" viewBox="0 0 16 12" fill="none" stroke="white" strokeOpacity="0.9" strokeWidth="1.5">
                    <path d="M1 4.5C3.5 1.5 12.5 1.5 15 4.5" strokeLinecap="round" />
                    <path d="M3.5 7C5.5 5 10.5 5 12.5 7" strokeLinecap="round" />
                    <circle cx="8" cy="10" r="1" fill="white" fillOpacity="0.9" stroke="none" />
                  </svg>
                  {/* Battery */}
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
              {/* Back arrow */}
              <svg className="w-5 h-5 text-white/90 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {/* Profile pic */}
              <div className="w-9 h-9 rounded-full bg-[#128c7e] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">BL</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-[13px] font-medium leading-tight truncate">Bakker Loodgieters</p>
                <p className="text-white/60 text-[10px] leading-tight">online</p>
              </div>
              {/* Action icons */}
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
              ref={chatRef}
              className="bg-[#efeae2] h-[300px] sm:h-[340px] px-2.5 py-3 flex flex-col justify-end overflow-hidden"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cfc6' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            >
              {/* Missed call indicator */}
              {activeStep === 0 && (
                <div className="flex flex-col items-center justify-center flex-1 animate-pulse">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-3 shadow-sm">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-red-600">Gemiste oproep</p>
                  <p className="text-xs text-surface-500 mt-0.5">+31 6 12 34 56 78</p>
                </div>
              )}

              {/* Messages */}
              {activeStep > 0 && (
                <div className="space-y-1">
                  {currentStep.messages.slice(0, visibleMessages).map((msg, i) => (
                    <div
                      key={`${activeStep}-${i}`}
                      className={`flex ${msg.sender === "customer" ? "justify-end" : "justify-start"} animate-[slideUp_0.3s_ease-out]`}
                    >
                      <div
                        className={`max-w-[85%] px-2.5 py-1.5 text-[12px] leading-relaxed shadow-sm ${
                          msg.sender === "customer"
                            ? "bg-[#d9fdd3] text-surface-900 rounded-lg rounded-tr-none"
                            : "bg-white text-surface-800 rounded-lg rounded-tl-none"
                        }`}
                      >
                        {msg.text}
                        <span className="text-[9px] text-surface-400 ml-2 float-right mt-1 flex items-center gap-0.5">
                          {msg.sender === "customer" ? "09:42" : "09:41"}
                          {msg.sender === "customer" && (
                            <svg className="w-3 h-3 text-[#53bdeb] inline-block" viewBox="0 0 16 11" fill="currentColor">
                              <path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.011-2.095a.46.46 0 0 0-.327-.147.458.458 0 0 0-.33.15.52.52 0 0 0-.146.374c0 .136.05.263.14.36l2.36 2.46a.458.458 0 0 0 .312.152.478.478 0 0 0 .367-.163l6.54-8.076a.477.477 0 0 0 .107-.253.508.508 0 0 0-.137-.474z" />
                              <path d="M14.757.653a.457.457 0 0 0-.305-.102.493.493 0 0 0-.38.178l-6.19 7.636-1.166-1.215-.36.445 1.198 1.25a.458.458 0 0 0 .312.151.478.478 0 0 0 .367-.163l6.54-8.076a.477.477 0 0 0 .108-.253.508.508 0 0 0-.124-.851z" />
                            </svg>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Message input bar */}
            <div className="bg-[#efeae2] px-2 pb-2 pt-0.5">
              <div className="flex items-center gap-1.5">
                <div className="flex-1 bg-white rounded-full px-3 py-1.5 flex items-center gap-2">
                  {/* Emoji icon */}
                  <svg className="w-5 h-5 text-surface-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-[13px] text-surface-400 flex-1">Bericht</span>
                  {/* Attachment */}
                  <svg className="w-5 h-5 text-surface-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {/* Camera */}
                  <svg className="w-5 h-5 text-surface-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                {/* Mic button */}
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

      {/* Step indicators — dots + active label */}
      <div className="mt-5 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => { setActiveStep(i); setVisibleMessages(0); }}
              aria-label={STEPS[i].label}
              className={`rounded-full transition-all duration-300 ${
                i === activeStep
                  ? "w-3 h-3 bg-brand-500"
                  : "w-2 h-2 bg-surface-300 hover:bg-surface-400"
              }`}
            />
          ))}
        </div>
        <p className="text-[11px] font-medium text-surface-500 text-center">
          {STEPS[activeStep].label}
        </p>
      </div>
    </div>
  );
}
