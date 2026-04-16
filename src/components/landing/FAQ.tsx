"use client";

import { useState } from "react";
import { nl } from "@/content/nl";
import { events } from "@/lib/analytics";

export function FAQ() {
  const { faq } = nl;
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggle = (key: string, question: string) => {
    const isOpening = openIndex !== key;
    setOpenIndex(isOpening ? key : null);
    if (isOpening) {
      events.faqExpand(question);
    }
  };

  return (
    <section className="section">
      <div className="section-inner max-w-2xl">
        <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 text-center">
          {faq.headline}
        </h2>

        <div className="mt-10 space-y-8">
          {faq.groups.map((group) => (
            <div key={group.label}>
              {/* Group label */}
              <h3 className="text-sm font-semibold text-surface-500 uppercase tracking-wide mb-3">
                {group.label}
              </h3>

              <div className="divide-y divide-surface-200 border-t border-b border-surface-200">
                {group.items.map((item, i) => {
                  const key = `${group.label}-${i}`;
                  return (
                    <div key={key}>
                      <button
                        className="w-full py-4 flex items-center justify-between text-left focus:outline-none"
                        onClick={() => toggle(key, item.question)}
                        aria-expanded={openIndex === key}
                      >
                        <span className="font-semibold text-surface-900 pr-4 text-sm sm:text-base">
                          {item.question}
                        </span>
                        <svg
                          className={`w-5 h-5 text-surface-400 flex-shrink-0 transition-transform duration-200 ${
                            openIndex === key ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {openIndex === key && (
                        <div className="pb-4">
                          <p className="text-sm text-surface-600 leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
