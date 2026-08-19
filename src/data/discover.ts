export type DiscoverScope = "national" | "international";

export type DiscoverCategory = {
  slug: string;
  name: string;
};

export type DiscoverEntry = {
  slug: string;
  category: string;
  name: string;
  scope: DiscoverScope;
  location: string;
  summary: string;
  description: string;
  focusAreas: string[];
  website?: string | null;
  image?: string;
};

export const categories: DiscoverCategory[] = [
  { slug: "equine-therapy", name: "Equine Therapy" },
  { slug: "clinics", name: "Clinics" },
  { slug: "training-programmes", name: "Training Programmes" },
  { slug: "shows-competitions", name: "Shows & Competitions" },
];

export const entries: DiscoverEntry[] = [
  // Equine Therapy
  {
    slug: "sample-equine-therapy-centre-coimbatore",
    category: "equine-therapy",
    name: "Sample Equine Therapy Centre — Coimbatore",
    scope: "national",
    location: "Coimbatore, Tamil Nadu",
    summary: "Rehabilitation and conditioning support for horses returning from injury or surgery.",
    description:
      "A dedicated rehabilitation facility offering structured recovery programmes for horses returning to work after injury, surgery, or prolonged rest. Illustrative listing — real centres will be verified and added here.",
    focusAreas: ["Post-injury rehabilitation", "Hydrotherapy", "Conditioning programmes"],
  },
  {
    slug: "sample-equine-therapy-centre-pune",
    category: "equine-therapy",
    name: "Sample Equine Therapy Centre — Pune",
    scope: "national",
    location: "Pune, Maharashtra",
    summary: "Soft-tissue therapy and long-term wellness plans for competition and leisure horses alike.",
    description:
      "Offers ongoing wellness care alongside injury recovery — massage, stretching, and movement assessments designed to keep horses performing comfortably over a full season. Illustrative listing — real centres will be verified and added here.",
    focusAreas: ["Soft-tissue therapy", "Movement assessment", "Wellness plans"],
  },
  {
    slug: "sample-equine-therapy-centre-wellington-fl",
    category: "equine-therapy",
    name: "Sample Equine Therapy Centre — Wellington, FL, USA",
    scope: "international",
    location: "Wellington, Florida, USA",
    summary: "A winter-circuit rehabilitation practice used by competition riders training abroad.",
    description:
      "Based near one of the world's busiest winter show circuits, offering advanced diagnostics and recovery protocols for horses in heavy competition schedules. Illustrative listing — real centres will be verified and added here.",
    focusAreas: ["Advanced diagnostics", "Competition recovery", "Sports medicine referrals"],
  },
  {
    slug: "sample-equine-therapy-centre-newmarket-uk",
    category: "equine-therapy",
    name: "Sample Equine Therapy Centre — Newmarket, UK",
    scope: "international",
    location: "Newmarket, United Kingdom",
    summary: "Specialist care for racehorses and sport horses in one of the sport's historic training hubs.",
    description:
      "Located in a town built around horses, offering specialist rehabilitation for both racing and sport-horse disciplines with decades of institutional expertise behind it. Illustrative listing — real centres will be verified and added here.",
    focusAreas: ["Racehorse rehabilitation", "Sport-horse care", "Long-term case management"],
  },

  // Clinics
  {
    slug: "sample-equine-clinic-gurugram",
    category: "clinics",
    name: "Sample Equine Clinic — Gurugram",
    scope: "national",
    location: "Gurugram, Haryana",
    summary: "General veterinary care, diagnostics, and routine health screening under one roof.",
    description:
      "A full-service veterinary clinic covering routine check-ups, diagnostic imaging, and preventive care for horses across the National Capital Region. Illustrative listing — real clinics will be verified and added here.",
    focusAreas: ["Diagnostic imaging", "Preventive care", "Routine screening"],
  },
  {
    slug: "sample-equine-clinic-bengaluru",
    category: "clinics",
    name: "Sample Equine Clinic — Bengaluru",
    scope: "national",
    location: "Bengaluru, Karnataka",
    summary: "Dental, farriery-adjacent, and general wellness visits for stables across South India.",
    description:
      "Serves stables across South India with scheduled visiting days for dental work, general wellness checks, and coordination with local farriers. Illustrative listing — real clinics will be verified and added here.",
    focusAreas: ["Dental care", "General wellness", "Stable-visit scheduling"],
  },
  {
    slug: "sample-equine-clinic-kentucky-usa",
    category: "clinics",
    name: "Sample Equine Clinic — Kentucky, USA",
    scope: "international",
    location: "Lexington, Kentucky, USA",
    summary: "A referral-level surgical and diagnostic clinic in one of the world's major horse regions.",
    description:
      "A referral hospital offering advanced surgical and diagnostic capability, located in a region with one of the highest concentrations of equine veterinary expertise anywhere. Illustrative listing — real clinics will be verified and added here.",
    focusAreas: ["Surgical referral", "Advanced diagnostics", "Second-opinion consults"],
  },
  {
    slug: "sample-equine-clinic-aachen-germany",
    category: "clinics",
    name: "Sample Equine Clinic — Aachen, Germany",
    scope: "international",
    location: "Aachen, Germany",
    summary: "European sport-horse clinic with strong ties to dressage and show-jumping circuits.",
    description:
      "A clinic embedded in one of European sport-horse breeding's key regions, with particular strength in soundness evaluation ahead of major competitions. Illustrative listing — real clinics will be verified and added here.",
    focusAreas: ["Soundness evaluation", "Pre-purchase exams", "Sport-horse specialism"],
  },

  // Training Programmes
  {
    slug: "sample-training-programme-show-jumping-pune",
    category: "training-programmes",
    name: "Sample Training Programme — Show Jumping, Pune",
    scope: "national",
    location: "Pune, Maharashtra",
    summary: "A structured, season-long show-jumping programme for junior and amateur riders.",
    description:
      "A season-long curriculum taking riders from foundational flatwork through to competition-ready jumping rounds, with structured progression checkpoints along the way. Illustrative listing — real programmes will be verified and added here.",
    focusAreas: ["Junior & amateur riders", "Season-long curriculum", "Competition preparation"],
  },
  {
    slug: "sample-training-programme-dressage-delhi-ncr",
    category: "training-programmes",
    name: "Sample Training Programme — Dressage, Delhi NCR",
    scope: "national",
    location: "Delhi NCR",
    summary: "Classical dressage instruction from introductory levels through to national test standards.",
    description:
      "Structured dressage instruction built around India's national test levels, with an emphasis on correct foundational training before competition-level work begins. Illustrative listing — real programmes will be verified and added here.",
    focusAreas: ["Classical foundations", "National test levels", "Progressive assessment"],
  },
  {
    slug: "sample-training-programme-eventing-kentucky-usa",
    category: "training-programmes",
    name: "Sample Training Programme — Eventing, Kentucky, USA",
    scope: "international",
    location: "Lexington, Kentucky, USA",
    summary: "An immersive eventing programme for riders training abroad ahead of international competition.",
    description:
      "An immersive, short-term programme for riders looking to train alongside international-level eventing horses and coaches ahead of a competitive season. Illustrative listing — real programmes will be verified and added here.",
    focusAreas: ["International exposure", "Cross-country schooling", "Short-term intensives"],
  },
  {
    slug: "sample-training-programme-show-jumping-wellington-fl",
    category: "training-programmes",
    name: "Sample Training Programme — Show Jumping, Wellington, FL, USA",
    scope: "international",
    location: "Wellington, Florida, USA",
    summary: "Winter-circuit show-jumping training for riders competing on the international calendar.",
    description:
      "A winter-season programme based at one of the sport's major show-jumping hubs, built for riders preparing for a full international competition calendar. Illustrative listing — real programmes will be verified and added here.",
    focusAreas: ["Winter circuit training", "International calendar prep", "Course-work intensives"],
  },

  // Shows & Competitions
  {
    slug: "sample-show-national-championships-delhi-ncr",
    category: "shows-competitions",
    name: "Sample Show — National Championships, Delhi NCR",
    scope: "national",
    location: "Delhi NCR",
    summary: "India's marquee annual show-jumping and dressage championship, open to riders nationwide.",
    description:
      "A season-culminating national championship drawing riders from across the country to compete for national titles across show-jumping and dressage divisions. Illustrative listing — real shows will be verified and added here.",
    focusAreas: ["Show jumping", "Dressage", "National title divisions"],
  },
  {
    slug: "sample-show-winter-classic-pune",
    category: "shows-competitions",
    name: "Sample Show — Winter Classic, Pune",
    scope: "national",
    location: "Pune, Maharashtra",
    summary: "A multi-day winter-season show for junior, amateur, and open divisions.",
    description:
      "A well-established fixture on the domestic calendar, running junior, amateur, and open divisions across several days each winter. Illustrative listing — real shows will be verified and added here.",
    focusAreas: ["Junior & amateur divisions", "Multi-day format", "Open jumping classes"],
  },
  {
    slug: "sample-show-winter-equestrian-festival-wellington-fl",
    category: "shows-competitions",
    name: "Sample Show — Winter Equestrian Festival, Wellington, FL, USA",
    scope: "international",
    location: "Wellington, Florida, USA",
    summary: "A twelve-week international show-jumping circuit drawing riders from around the world.",
    description:
      "One of the sport's longest-running winter circuits, hosting international show-jumping competition across grand prix and development divisions for twelve consecutive weeks. Illustrative listing — real shows will be verified and added here.",
    focusAreas: ["Grand Prix show jumping", "International field", "Development divisions"],
  },
  {
    slug: "sample-show-chio-aachen-germany",
    category: "shows-competitions",
    name: "Sample Show — CHIO, Aachen, Germany",
    scope: "international",
    location: "Aachen, Germany",
    summary: "One of the world's most prestigious international equestrian competitions.",
    description:
      "A historic five-star international competition spanning show-jumping, dressage, eventing, and driving, widely regarded as one of the sport's most prestigious annual fixtures. Illustrative listing — real shows will be verified and added here.",
    focusAreas: ["Five-star competition", "Multiple disciplines", "International field"],
  },
];

export function getCategory(slug: string): DiscoverCategory | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getEntriesByCategory(slug: string): DiscoverEntry[] {
  return entries.filter((e) => e.category === slug);
}

export function getEntryBySlug(slug: string): DiscoverEntry | undefined {
  return entries.find((e) => e.slug === slug);
}
