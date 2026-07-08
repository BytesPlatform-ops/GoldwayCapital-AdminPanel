// Public-site content model. Mirrors the Service Line Map — labels are exact.

export const BRAND = {
  name: "Goldway Capital",
  tagline: "A Senior Solutions Company",
  headline: "Helping Seniors Navigate Important Life Decisions",
  subheadline:
    "Whether you're turning 65, planning for retirement, exploring home financing options, or considering your next move, Goldway Capital provides guidance tailored to your unique situation.",
  primaryCta: { label: "Schedule a Medicare Consultation", href: "/contact?interest=medicare" },
  secondaryCta: { label: "Schedule a Senior Solutions Consultation", href: "/contact?interest=senior-solutions" },
  phone: "(000) 000-0000",
  email: "leads@goldwaycapital.com",
};

export const NAV = [
  { label: "Home", href: "/" },
  { label: "Medicare Solutions", href: "/medicare-solutions" },
  { label: "Reverse Mortgage Solutions", href: "/reverse-mortgage-solutions" },
  { label: "Senior Real Estate & Probate Solutions", href: "/senior-real-estate-probate-solutions" },
  { label: "Resource Center", href: "/resource-center" },
  { label: "Medicare Agent Opportunities", href: "/medicare-agent-opportunities" },
  { label: "Contact", href: "/contact" },
];

// life-event framing, not product framing
export const LIFE_EVENTS = [
  { q: "Turning 65?", body: "Understand your Medicare options with unbiased, patient guidance — before your enrollment window.", href: "/medicare-solutions" },
  { q: "Planning Retirement?", body: "Weigh your choices around coverage, income, and home equity with a trusted resource.", href: "/reverse-mortgage-solutions" },
  { q: "Need More Financial Flexibility?", body: "Explore whether a reverse mortgage fits your goals for aging in place.", href: "/reverse-mortgage-solutions" },
  { q: "Thinking About Downsizing?", body: "Get help navigating a senior move, probate sale, or transition to your next chapter.", href: "/senior-real-estate-probate-solutions" },
];

export interface ServicePage {
  key: string;
  slug: string;
  formSource: "medicare" | "final-expense" | "reverse-mortgage" | "probate" | "recruiting";
  title: string;
  intro: string;
  bullets: string[];
  // disclosure key on the API (seeded DisclosureBlock)
  disclosureKey: string;
  cta: string;
}

export const SERVICE_PAGES: Record<string, ServicePage> = {
  "medicare-solutions": {
    key: "medicare",
    slug: "medicare-solutions",
    formSource: "medicare",
    title: "Medicare Solutions",
    intro:
      "We help you understand Medicare Advantage, Part D, Supplement, and Final Expense options — patiently and without pressure. Goldway Capital performs these services directly as a licensed insurance agency.",
    bullets: [
      "Medicare Advantage (Part C) guidance",
      "Prescription drug (Part D) options",
      "Medicare Supplement (Medigap) education",
      "Final Expense planning",
    ],
    disclosureKey: "medicare",
    cta: "Schedule a Medicare Consultation",
  },
  "reverse-mortgage-solutions": {
    key: "reverse-mortgage",
    slug: "reverse-mortgage-solutions",
    formSource: "reverse-mortgage",
    title: "Reverse Mortgage Solutions",
    intro:
      "A reverse mortgage can help eligible homeowners 62+ access their home equity while continuing to live in their home. This is Goldway Capital's specialty, delivered by our licensed specialist.",
    bullets: [
      "Understand if a reverse mortgage fits your goals",
      "Aging-in-place and cash-flow considerations",
      "Clear, unhurried education first — no pressure",
      "For purchase/refinance (forward) mortgages, we can connect you with a trusted lender partner",
    ],
    disclosureKey: "reverse-mortgage",
    cta: "Schedule a Reverse Mortgage Consultation",
  },
  "senior-real-estate-probate-solutions": {
    key: "probate",
    slug: "senior-real-estate-probate-solutions",
    formSource: "probate",
    title: "Senior Real Estate & Probate Solutions",
    intro:
      "We help families navigate senior real estate transitions and probate sales with care and clarity. Goldway Capital performs these services directly through our licensed brokerage relationship.",
    bullets: [
      "Probate property sales guidance",
      "Senior downsizing and transition support",
      "Compassionate, family-centered process",
      "For other real estate needs, we can refer you to a licensed professional partner",
    ],
    disclosureKey: "probate",
    cta: "Schedule a Senior Solutions Consultation",
  },
};

export const RECRUITING_PAGE = {
  slug: "medicare-agent-opportunities",
  title: "Medicare Agent Opportunities",
  intro:
    "Interested in building a career helping seniors? Goldway Capital works with motivated agents. Submit your interest and our owner will review inquiries during the weekly review.",
  formSource: "recruiting" as const,
};
