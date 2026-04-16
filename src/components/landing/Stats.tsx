import { nl } from "@/content/nl";

export function Stats() {
  const { stats } = nl;

  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        <h2 className="text-2xl sm:text-4xl font-bold text-surface-900 text-center">
          {stats.headline}
        </h2>

        <div className="mt-8 sm:mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.items.map((item) => (
            <div
              key={item.value}
              className="bg-white rounded-2xl shadow-sm shadow-black/5 border border-surface-100 p-5 sm:p-6 text-center"
            >
              <p className="text-2xl sm:text-4xl font-bold text-accent-500">
                {item.value}
              </p>
              <p className="mt-2 text-xs sm:text-sm text-surface-500 leading-snug">
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-8 sm:mt-10 text-center text-base sm:text-xl font-semibold text-surface-900 px-2">
          {stats.bottomLine}
        </p>

        {"bottomLineHighlight" in stats && stats.bottomLineHighlight && (
          <p className="mt-2 text-center text-2xl sm:text-3xl font-bold text-brand-500 px-2">
            {stats.bottomLineHighlight}
          </p>
        )}

        {stats.source && (
          <p className="mt-2 text-center text-xs text-surface-400">
            {stats.source}
          </p>
        )}
      </div>
    </section>
  );
}
