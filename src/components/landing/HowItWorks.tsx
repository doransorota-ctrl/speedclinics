import { nl } from "@/content/nl";

const stepIcons = [
  // Globe / find
  <svg key="find" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
  </svg>,
  // Phone
  <svg key="phone" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>,
  // WhatsApp
  <svg key="whatsapp" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>,
  // Calendar
  <svg key="calendar" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>,
  // Bell (reminder)
  <svg key="bell" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>,
  // Star (review)
  <svg key="star" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>,
];

export function HowItWorks() {
  const { flow } = nl;
  const mainSteps = flow.steps.slice(0, 4);
  const extraSteps = flow.steps.slice(4);

  return (
    <section id="hoe-het-werkt" className="section">
      <div className="section-inner">
        <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 text-center">
          {flow.headline}
        </h2>

        {/* Main 4-step flow */}
        <div className="mt-8 sm:mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {mainSteps.map((step, i) => (
            <div key={i} className="relative flex flex-col items-center text-center">
              {/* Connector arrow (tablet+, not on last) */}
              {i < mainSteps.length - 1 && (
                <div className="hidden sm:block absolute top-7 -right-3 z-10">
                  <svg className="w-6 h-6 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}

              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white border-2 border-surface-200 flex items-center justify-center text-brand-600 mb-2 sm:mb-3 [&_svg]:w-5 [&_svg]:h-5 sm:[&_svg]:w-6 sm:[&_svg]:h-6">
                {stepIcons[i]}
              </div>

              <span className="text-[10px] sm:text-xs font-semibold text-brand-600 uppercase tracking-wide mb-0.5 sm:mb-1">
                Stap {i + 1}
              </span>

              <h3 className="text-sm sm:text-base font-bold text-surface-900">
                {step.title}
              </h3>

              <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-surface-600 max-w-[220px]">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Extra automated steps (reminder + review) */}
        {extraSteps.length > 0 && (
          <div className="mt-10">
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide text-center mb-4">
              Daarna regelt Speed Leads automatisch:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
              {extraSteps.map((step, i) => (
                <div key={i} className="bg-surface-50 border border-surface-200 rounded-xl p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-white border border-surface-200 flex items-center justify-center text-brand-600 flex-shrink-0 [&_svg]:w-4 [&_svg]:h-4">
                    {stepIcons[4 + i]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-surface-900">{step.title}</p>
                    <p className="mt-0.5 text-xs text-surface-500 leading-snug">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
