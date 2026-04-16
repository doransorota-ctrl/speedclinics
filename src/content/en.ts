// English fallback — hero, CTAs, and form labels only
export const en = {
  hero: {
    badge: "Try free for 14 days",
    headline: "Never miss a customer",
    headlineAccent: "while you're on the job",
    subheadline:
      "AI answers your missed calls and WhatsApp messages within 10 seconds. Qualifies the lead. Books an appointment in your calendar. 24/7.",
    ctaPrimary: "Start 14-day free trial",
    ctaSecondary: "See how it works",
    trustLine: "No credit card required — live in 10 minutes",
  },

  signup: {
    headline: "Start your free trial",
    subheadline: "Fill in your details and we'll help you go live today.",
    fields: {
      firstName: { label: "First name", placeholder: "John" },
      businessName: {
        label: "Business name",
        placeholder: "Smith Plumbing",
      },
      email: {
        label: "Email address",
        placeholder: "john@smithplumbing.com",
      },
      phone: { label: "Phone number", placeholder: "+31 6 12345678" },
      trade: { label: "Trade", placeholder: "Select your trade" },
      employees: { label: "Number of employees" },
      hasWhatsApp: { label: "Do you use WhatsApp Business?" },
      hasWebsite: { label: "Do you have a website?" },
      consent: {
        label:
          "I agree to the privacy policy and consent to my data being processed.",
      },
    },
    cta: "Start free trial",
    submitting: "Signing up...",
    trustLines: [
      "No credit card needed",
      "14 days free",
      "Cancel anytime",
    ],
  },

  demo: {
    headline: "Book a demo",
    subheadline:
      "We'll show you how clŷniq works for your business in 15 minutes.",
    cta: "Book my demo",
  },
} as const;
