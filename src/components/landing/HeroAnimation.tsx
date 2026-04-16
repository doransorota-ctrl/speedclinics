"use client";

import { useState, useEffect, useRef } from "react";
import { Iphone17Pro } from "@/components/ui/iphone-17-pro";

const STEPS = [
  {
    label: "Patiënt neemt contact op",
    messages: [
      {
        sender: "customer",
        text: "Hallo, ik heb interesse in lip fillers. Kunt u mij meer vertellen?",
      },
    ],
  },
  {
    label: "AI beantwoordt direct",
    messages: [
      {
        sender: "customer",
        text: "Hallo, ik heb interesse in lip fillers. Kunt u mij meer vertellen?",
      },
      {
        sender: "ai",
        text: "Goedemiddag! Bij Kliniek Esthétique bieden wij lip fillers aan met hyaluronzuur. De behandeling duurt 30 minuten, resultaat is direct zichtbaar.",
      },
      {
        sender: "customer",
        text: "Wat zijn de kosten?",
      },
      {
        sender: "ai",
        text: "Onze lip fillers beginnen vanaf €250. Tijdens het consult bespreekt de arts uw wensen en geeft een persoonlijk advies.",
      },
    ],
  },
  {
    label: "Consult geboekt",
    messages: [
      {
        sender: "customer",
        text: "Klinkt goed, kan ik een afspraak maken?",
      },
      {
        sender: "ai",
        text: "Zeker! Donderdag om 10:00 of vrijdag om 14:00 — wat past u beter?",
      },
      {
        sender: "customer",
        text: "Donderdag 10:00 graag",
      },
      {
        sender: "ai",
        text: "Ingepland! Donderdag 10:00 bij Kliniek Esthétique. U ontvangt morgenavond nog een herinnering. Tot dan!",
      },
    ],
  },
  {
    label: "Review verzameld",
    messages: [
      {
        sender: "ai",
        text: "Bedankt voor uw bezoek aan Kliniek Esthétique! Hoe heeft u de behandeling ervaren?",
      },
      {
        sender: "customer",
        text: "Heel tevreden, prachtig resultaat!",
      },
      {
        sender: "ai",
        text: "Wat fijn om te horen! Wilt u uw ervaring delen? Klik hier voor een Google review: g.co/r/esthetique",
      },
      {
        sender: "customer",
        text: "Zeker, gedaan! ⭐⭐⭐⭐⭐",
      },
    ],
  },
];

export function HeroAnimation() {
  const [activeStep, setActiveStep] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STEPS.length);
      setVisibleMessages(0);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const step = STEPS[activeStep];
    if (step.messages.length === 0) return;

    setVisibleMessages(0);
    let count = 0;
    const msgTimer = setInterval(() => {
      count++;
      setVisibleMessages(count);
      if (count >= step.messages.length) clearInterval(msgTimer);
    }, 600);

    return () => clearInterval(msgTimer);
  }, [activeStep]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [visibleMessages, activeStep]);

  const currentStep = STEPS[activeStep];

  return (
    <div className="pt-2">
      {/* iPhone 17 Pro frame with live chat content */}
      <div className="relative mx-auto w-full" style={{ aspectRatio: "200 / 400" }}>
        {/* SVG phone frame — sits on top, scales with container */}
        <Iphone17Pro
          width={200}
          height={400}
          className="absolute inset-0 w-full h-full z-10 pointer-events-none"
        />

        {/* Live content positioned inside the frame using percentages */}
        <div className="absolute inset-0">
          <div
            className="absolute overflow-hidden flex flex-col"
            style={{
              left: "7%",
              top: "3.2%",
              width: "86%",
              height: "93.6%",
              borderRadius: "12.3%",
            }}
          >
            {/* Status bar */}
            <div className="relative bg-surface-50 px-5 pt-2.5 pb-0 shrink-0">
              <div className="h-[26px]" /> {/* space for dynamic island */}
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
              ref={chatRef}
              className="bg-[#F5F5F0] flex-1 min-h-0 px-2.5 py-2.5 flex flex-col justify-end overflow-hidden"
            >
              <div className="space-y-1.5">
                {currentStep.messages.slice(0, visibleMessages).map((msg, i) => (
                  <div
                    key={`${activeStep}-${i}`}
                    className={`flex ${msg.sender === "customer" ? "justify-end" : "justify-start"} animate-[slideUp_0.3s_ease-out]`}
                  >
                    <div
                      className={`max-w-[82%] px-2.5 py-1.5 text-[11px] leading-relaxed ${
                        msg.sender === "customer"
                          ? "bg-brand-100 text-surface-900 rounded-2xl rounded-tr-sm"
                          : "bg-white text-surface-800 rounded-2xl rounded-tl-sm shadow-sm shadow-black/[0.03]"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
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

      {/* Step indicators */}
      <div className="mt-6 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => { setActiveStep(i); setVisibleMessages(0); }}
              aria-label={STEPS[i].label}
              className={`rounded-full transition-all duration-300 ${
                i === activeStep
                  ? "w-8 h-2 bg-brand-500"
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
