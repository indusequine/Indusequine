import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/Container";

export const metadata: Metadata = {
  title: "The Marketplace",
  description:
    "A curated equestrian marketplace for India — premium products for riders, horses, and stables. From helmets and boots to saddlery, feed, and stable supplies.",
};

const sections = [
  {
    id: "riders",
    eyebrow: "For Riders",
    title: "What you wear, in and out of the saddle.",
    intro:
      "Helmets engineered for safety. Boots built for the long ride. Apparel that performs in the school and reads well in the show ring. Hand-selected from brands trusted by riders worldwide, and made available in India for the first time under one roof.",
    photo: "https://images.unsplash.com/photo-1550785330-003a9afa3bd9?w=800&fit=crop&q=80",
    groups: [
      { title: "Headwear & Safety", items: ["Show helmets", "Schooling helmets", "Body protectors", "Air vests"] },
      { title: "Footwear", items: ["Tall boots", "Paddock & jodhpur boots", "Half chaps", "Mucker boots"] },
      { title: "Apparel", items: ["Breeches & jodhpurs", "Show jackets", "Show shirts", "Base layers", "Stocks & ties"] },
      { title: "Accessories", items: ["Gloves", "Crops & whips", "Spurs", "Belts & buckles", "Hair accessories"] },
    ],
  },
  {
    id: "horses",
    eyebrow: "For Horses",
    title: "What your horse needs to thrive.",
    intro:
      "From the saddlery on his back to the bedding under his feet. Indian and imported tack, feed and supplements suited to our climate, grooming essentials for show and home — and the health products every owner should have on hand.",
    photo: "https://images.unsplash.com/photo-1544467251-2184f386011f?w=800&fit=crop&q=80",
    groups: [
      { title: "Tack & Saddlery", items: ["Saddles (dressage, jumping, GP, polo)", "Bridles & nosebands", "Bits & accessories", "Girths & stirrups", "Numnahs & saddle pads"] },
      { title: "Rugs & Boots", items: ["Turnout rugs", "Stable rugs", "Coolers & fleeces", "Travel & exercise boots", "Bandages & wraps"] },
      { title: "Feed & Supplements", items: ["Concentrates & cubes", "Joint & hoof support", "Calmers", "Electrolytes", "Treats"] },
      { title: "Grooming & Health", items: ["Brushes & combs", "Shampoos & coat care", "Hoof care", "Fly & insect control", "First aid"] },
    ],
  },
  {
    id: "stables",
    eyebrow: "For Stables",
    title: "What it takes to run one well.",
    intro:
      "Whether you board ten horses or one hundred. Yard tools that last, arena equipment that performs, fencing that holds, and the operational kit — first aid stations, water systems, hay storage — that makes a stable feel professional from the moment someone drives in.",
    photo: "https://images.unsplash.com/photo-1576692192914-9abed71b3ef9?w=800&fit=crop&q=80",
    groups: [
      { title: "Stable & Yard", items: ["Stalls & dividers", "Stable mats & flooring", "Mucking tools", "Wheelbarrows", "Buckets & tubs"] },
      { title: "Arena & Training", items: ["Jumps & poles", "Footing & maintenance", "Mirrors", "Lunging gear", "Cones & markers"] },
      { title: "Paddocks & Fencing", items: ["Electric fencing", "Post & rail", "Gates", "Water troughs", "Field shelters"] },
      { title: "Feed Store & Bedding", items: ["Hay & haylage", "Bedding (shavings, straw, pellets)", "Feed bins & scoops", "Storage solutions"] },
    ],
  },
];

export default function MarketplacePage() {
  return (
    <>
      <PageHero />
      {sections.map((s, i) => (
        <CategorySection key={s.id} section={s} flip={i % 2 === 1} />
      ))}
      <BrandsCTA />
    </>
  );
}

function PageHero() {
  return (
    <section className="bg-forest-deep text-cream-soft py-24 md:py-32 border-b border-brass/20">
      <Container>
        <p className="eyebrow text-brass-light">
          <span className="rule"></span>The Marketplace
        </p>
        <h1 className="font-display text-5xl md:text-7xl mt-6 leading-[1.05] max-w-4xl">
          Every product, for every kind of ride.
        </h1>
        <p className="mt-8 text-lg md:text-xl text-cream-soft/80 leading-relaxed max-w-2xl">
          The brands you&rsquo;ve struggled to find in India — and the ones
          you&rsquo;ve only heard of from friends abroad. All under one
          well-tended roof.
        </p>
        <div className="mt-12 flex flex-wrap gap-3">
          {sections.map((s) => (
            <Link
              key={s.id}
              href={`#${s.id}`}
              className="px-5 py-2.5 border border-cream-soft/30 hover:border-brass-light hover:text-brass-light transition-colors text-sm tracking-wide"
            >
              {s.eyebrow}
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

function CategorySection({
  section,
  flip,
}: {
  section: (typeof sections)[number];
  flip: boolean;
}) {
  return (
    <section
      id={section.id}
      className={`py-24 md:py-32 scroll-mt-24 ${flip ? "bg-cream" : "bg-cream-soft"}`}
    >
      <Container size="wide">
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start ${flip ? "lg:flex-row-reverse" : ""}`}>
          <div className={`lg:col-span-5 ${flip ? "lg:order-2" : ""}`}>
            <div className="aspect-square sticky top-32 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={section.photo} alt={section.eyebrow} className="w-full h-full object-cover" />
            </div>
          </div>

          <div className={`lg:col-span-7 ${flip ? "lg:order-1" : ""}`}>
            <p className="eyebrow text-brass-deep">{section.eyebrow}</p>
            <h2 className="font-display text-4xl md:text-5xl mt-4 text-forest leading-tight">
              {section.title}
            </h2>
            <p className="mt-6 text-charcoal leading-relaxed text-lg">
              {section.intro}
            </p>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
              {section.groups.map((g) => (
                <div key={g.title}>
                  <h3 className="eyebrow text-forest mb-3 border-b border-forest/20 pb-2">
                    {g.title}
                  </h3>
                  <ul className="space-y-1.5 text-sm text-charcoal">
                    {g.items.map((i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-brass mt-1.5 w-1 h-1 bg-brass rounded-full shrink-0"></span>
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function BrandsCTA() {
  return (
    <section className="bg-forest text-cream-soft py-24 md:py-28">
      <Container size="narrow" className="text-center">
        <p className="eyebrow text-brass-light">
          <span className="rule"></span>For Brands & Importers
        </p>
        <h2 className="font-display text-4xl md:text-5xl mt-4 leading-tight">
          Bring your brand to India&rsquo;s riders.
        </h2>
        <p className="mt-6 text-cream-soft/80 leading-relaxed">
          Indian, regional, and global brands — if your work belongs alongside
          the best in the world, we&rsquo;d like to talk. We&rsquo;re building
          this marketplace with the makers who care, not the catalogues that
          don&rsquo;t.
        </p>
        <Link
          href="/contact"
          className="mt-10 inline-flex items-center justify-center px-10 py-4 bg-brass text-forest-deep hover:bg-brass-light transition-colors text-sm tracking-[0.18em] uppercase"
        >
          Partner With Us
        </Link>
      </Container>
    </section>
  );
}
