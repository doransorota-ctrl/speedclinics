import { nl } from "@/content/nl";

export function Stats() {
  const { stats } = nl;

  return (
    <section className="py-12 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-4xl font-extrabold text-surface-900 text-center">
          {stats.headline}
        </h2>

        <div className="mt-6 sm:mt-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {stats.items.map((item) => (
            <div
              key={item.value}
              className="bg-surface-50 rounded-xl p-4 sm:p-6 text-center"
            >
              <p className="text-2xl sm:text-4xl font-extrabold text-brand-500">
                {item.value}
              </p>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-surface-600 leading-snug">
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-6 sm:mt-8 text-center text-base sm:text-xl font-semibold text-surface-900 px-2">
          {stats.bottomLine}
        </p>

        {"bottomLineHighlight" in stats && stats.bottomLineHighlight && (
          <p className="mt-2 text-center text-2xl sm:text-3xl font-extrabold text-brand-500 px-2">
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
