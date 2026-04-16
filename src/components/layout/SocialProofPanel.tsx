"use client";

type Step = "auth" | "identity" | "phone" | "package";

interface SocialProofPanelProps {
  step: Step;
}

interface TestimonialData {
  stat: string;
  statSubtitle: string;
  quote: string;
  authorName: string;
  authorDetail: string;
  resultBadge: string;
}

const testimonials: Record<Exclude<Step, "package">, TestimonialData> = {
  auth: {
    stat: "10 sec",
    statSubtitle: "reactietijd op een aanvraag buiten openingstijden",
    quote:
      "Veel patiënten oriënteren zich 's avonds op behandelingen. Voorheen misten we die aanvragen. Nu krijgen ze direct antwoord en staan er de volgende ochtend al consulten in de agenda.",
    authorName: "Dr. Lisa van der Berg",
    authorDetail: "Cosmetisch arts, Amsterdam",
    resultBadge: "+8 consulten per week",
  },
  identity: {
    stat: "100%",
    statSubtitle: "van aanvragen buiten openingstijden wordt direct beantwoord",
    quote:
      "Patiënten zeggen steeds: jullie waren de enige kliniek die meteen reageerde. De rest belt pas de volgende ochtend terug.",
    authorName: "Mark de Vries",
    authorDetail: "LaserCenter, Rotterdam",
    resultBadge: "Altijd als eerste",
  },
  phone: {
    stat: "0 min",
    statSubtitle: "eigen tijd kwijt aan nabellen",
    quote:
      "Ik zat elke avond nog een uur patiënten terug te bellen. Nu regelt het zichzelf. Als ik klaar ben staan de consulten er gewoon.",
    authorName: "Dr. Sarah Hendriks",
    authorDetail: "Cosmetische tandarts, Utrecht",
    resultBadge: "Nooit meer nabellen",
  },
};

const trustBadges = [
  "Werkt met uw huidige nummer",
  "Live binnen een week",
  "Maandelijks opzegbaar",
];

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4 text-accent-500 flex-shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function TrustBadges() {
  return (
    <div className="flex flex-wrap gap-4 mt-6">
      {trustBadges.map((badge) => (
        <div key={badge} className="flex items-center gap-1.5 text-sm text-surface-600">
          <CheckIcon />
          <span>{badge}</span>
        </div>
      ))}
    </div>
  );
}

function TestimonialCard({ data }: { data: TestimonialData }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm shadow-black/5 border border-surface-100">
      <p className="text-base text-surface-700 leading-relaxed italic">
        &ldquo;{data.quote}&rdquo;
      </p>
      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-surface-900">{data.authorName}</p>
          <p className="text-surface-500 text-sm">{data.authorDetail}</p>
        </div>
        <span className="inline-flex bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1 rounded-full">
          {data.resultBadge}
        </span>
      </div>
    </div>
  );
}

function StatBlock({ stat, subtitle }: { stat: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <p className="text-5xl font-bold text-surface-900">{stat}</p>
      <p className="text-sm text-surface-500 mt-1">{subtitle}</p>
    </div>
  );
}

export function SocialProofPanel({ step }: SocialProofPanelProps) {
  if (step === "package") {
    return (
      <div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-surface-900">Uw gegevens</h3>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm shadow-black/5 border border-surface-100">
          <p className="text-sm text-surface-500">Uw gegevens worden hier samengevat.</p>
        </div>
        <TrustBadges />
      </div>
    );
  }

  const data = testimonials[step];

  return (
    <div>
      <StatBlock stat={data.stat} subtitle={data.statSubtitle} />
      <TestimonialCard data={data} />
      {step === "auth" && <TrustBadges />}
    </div>
  );
}
