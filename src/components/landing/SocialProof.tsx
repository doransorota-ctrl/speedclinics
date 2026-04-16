import { nl } from "@/content/nl";

function TestimonialCard({ t }: { t: typeof nl.proof.testimonials[number] }) {
  return (
    <div className="w-[280px] sm:w-[320px] shrink-0 bg-white border border-surface-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
          {t.trade}
        </span>
        <span className="text-xs text-surface-400">{t.city}</span>
      </div>
      <p className="text-base font-bold text-surface-900 mb-2">{t.result}</p>
      <blockquote className="text-sm text-surface-600 leading-relaxed">
        &ldquo;{t.text}&rdquo;
      </blockquote>
      <p className="mt-4 text-sm font-semibold text-surface-900">— {t.name}</p>
    </div>
  );
}

export function SocialProof() {
  const { proof } = nl;
  // Triple for a seamless loop: translate -33.33% returns to identical start
  const looped = [...proof.testimonials, ...proof.testimonials, ...proof.testimonials];

  return (
    <section className="section bg-surface-50 overflow-hidden">
      <div className="section-inner">
        <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 text-center">
          {proof.headline}
        </h2>

        <p className="mt-3 text-center text-sm text-surface-400">
          {proof.statsFraming}
        </p>

        <div className="mt-6 grid grid-cols-3 gap-4 max-w-lg mx-auto">
          {proof.stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-brand-600">
                {stat.value}
              </p>
              <p className="text-xs text-surface-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Auto-scrolling carousel — full bleed */}
      <div className="testimonials-wrapper mt-10 overflow-hidden">
        <div className="testimonials-track flex gap-4 sm:gap-6 px-4 sm:px-6">
          {looped.map((t, i) => (
            <TestimonialCard key={i} t={t} />
          ))}
        </div>
      </div>

      <div className="section-inner">
        <p className="mt-6 text-center text-xs text-surface-400">{proof.note}</p>
      </div>

      <style>{`
        .testimonials-track {
          width: max-content;
          animation: testimonials-scroll 18s linear infinite;
        }
        .testimonials-wrapper:hover .testimonials-track {
          animation-play-state: paused;
        }
        @keyframes testimonials-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </section>
  );
}
