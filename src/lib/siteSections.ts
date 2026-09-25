/** The parts of Services and Discover a search can land on.
 *
 *  Neither is a catalogue, so there is nothing to index: they are a handful of
 *  sections on two pages. Listed here with the words a rider would actually
 *  type, so searching "farrier" or "shoeing" reaches the same place.
 */
export type SiteSection = {
  area: "Services" | "Discover";
  title: string;
  blurb: string;
  href: string;
  keywords: string[];
};

export const siteSections: SiteSection[] = [
  {
    area: "Services",
    title: "Riding coaches",
    blurb: "The right instructor for the rider you are now.",
    href: "/services#coaches",
    keywords: ["coach", "coaching", "instructor", "lesson", "training", "trainer", "school"],
  },
  {
    area: "Services",
    title: "Equine vets",
    blurb: "Care your horse can count on.",
    href: "/services#vets",
    keywords: ["vet", "veterinary", "doctor", "health", "medical", "injury", "lameness"],
  },
  {
    area: "Services",
    title: "Farriers",
    blurb: "Shoeing you and your horse can trust.",
    href: "/services#farriers",
    keywords: ["farrier", "shoeing", "shoe", "hoof", "trim", "blacksmith"],
  },
  {
    area: "Discover",
    title: "Equine therapy",
    blurb: "Recovery and conditioning, one session at a time.",
    href: "/discover#equine-therapy",
    keywords: ["therapy", "recovery", "rehab", "physio", "massage", "conditioning"],
  },
  {
    area: "Discover",
    title: "Clinics",
    blurb: "Veterinary care without the guesswork.",
    href: "/discover#clinics",
    keywords: ["clinic", "hospital", "care", "checkup", "treatment"],
  },
  {
    area: "Discover",
    title: "Training programmes",
    blurb: "Structured coaching, from your first seat upward.",
    href: "/discover#training-programmes",
    keywords: ["training", "programme", "program", "course", "learn", "beginner", "dressage", "jumping"],
  },
  {
    area: "Discover",
    title: "Shows",
    blurb: "Enter the ring. We handle the rest.",
    href: "/discover#shows",
    keywords: ["show", "competition", "event", "compete", "ring", "entry"],
  },
];

/** "farriers" and "farrier" have to reach the same place. */
function forms(word: string): string[] {
  const out = new Set([word, `${word}s`]);
  if (word.endsWith("ies") && word.length > 4) out.add(`${word.slice(0, -3)}y`);
  if (word.endsWith("es") && word.length > 3) out.add(word.slice(0, -2));
  if (word.endsWith("s") && word.length > 3) out.add(word.slice(0, -1));
  return [...out];
}

export function matchSections(query: string): SiteSection[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return siteSections.filter((section) => {
    const haystack = [section.title, section.blurb, ...section.keywords].join(" ").toLowerCase();
    // Any word is enough here: there are seven sections, so a near miss is
    // better than sending a rider away with nothing.
    return words.some((word) => forms(word).some((f) => haystack.includes(f)));
  });
}
