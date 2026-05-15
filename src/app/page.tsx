import Link from "next/link";
import { Container } from "@/components/Container";
import { HorseSilhouette, HorseshoePattern, HoofPattern } from "@/components/Illustrations";

export default function HomePage() {
  return (
    <>
      <Hero />
      <BrandPromise />
      <MarketplacePreview />
      <ServicesPreview />
      <FoundersNote />
      <WaitlistCTA />
    </>
  );
}

function Hero() {
  return (
    <section className="relative bg-forest-deep text-cream-soft overflow-hidden">
      <div className="absolute inset-0 opacity-[0.07]">
        <HorseshoePattern />
      </div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2/3 max-w-3xl opacity-[0.12] pointer-events-none hidden md:block">
        <HorseSilhouette />
      </div>

      <Container size="wide" className="relative py-28 md:py-40">
        <div className="max-w-3xl">
          <p className="eyebrow text-brass-light fade-in-up" style={{ animationDelay: "0.1s" }}>
            <span className="rule"></span>India&rsquo;s First Equestrian Marketplace
          </p>
          <h1 className="font-display text-5xl md:text-7xl lg:text-[5.5rem] leading-[1.05] mt-6 fade-in-up" style={{ animationDelay: "0.25s" }}>
            For the rider.
            <br />
            For the horse.
            <br />
            <span className="text-brass-light italic">For the stable.</span>
          </h1>
          <p className="mt-8 text-lg md:text-xl text-cream-soft/80 leading-relaxed max-w-2xl fade-in-up" style={{ animationDelay: "0.4s" }}>
            A curated home for India&rsquo;s equestrian community. Premium gear,
            trusted professionals, and considered service — gathered in one
            place for the first time.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 fade-in-up" style={{ animationDelay: "0.55s" }}>
            <Link
              href="/waitlist"
              className="inline-flex items-center justify-center px-8 py-4 bg-brass text-forest-deep hover:bg-brass-light transition-colors text-sm tracking-[0.18em] uppercase"
            >
              Join the Waitlist
            </Link>
            <Link
              href="/story"
              className="inline-flex items-center justify-center px-8 py-4 border border-cream-soft/30 text-cream-soft hover:border-cream-soft/60 transition-colors text-sm tracking-[0.18em] uppercase"
            >
              Our Story
            </Link>
          </div>
        </div>
      </Container>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brass/40 to-transparent"></div>
    </section>
  );
}

function BrandPromise() {
  const pillars = [
    {
      eyebrow: "Curated",
      title: "Hand-picked, not endless.",
      body: "Every brand, every product, every professional vetted by riders who know. No noise. Only what we'd recommend to a friend.",
    },
    {
      eyebrow: "Trusted",
      title: "Verified, rated, reviewed.",
      body: "Coaches with credentials. Vets with track records. Farriers your stable has worked with. Real reputations, transparent reviews.",
    },
    {
      eyebrow: "Organized",
      title: "One home for it all.",
      body: "India's equestrian world has lived in WhatsApp groups and word of mouth. We're bringing it into the light — without losing the soul.",
    },
  ];

  return (
    <section className="bg-cream-soft py-24 md:py-32">
      <Container>
        <p className="eyebrow text-brass-deep">
          <span className="rule"></span>The Indusequine Promise
        </p>
        <h2 className="font-display text-4xl md:text-5xl mt-4 max-w-2xl text-forest leading-tight">
          A market this discerning deserves a home this considered.
        </h2>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {pillars.map((p) => (
            <div key={p.eyebrow} className="md:border-l md:border-forest/15 md:pl-8 first:md:border-l-0 first:md:pl-0">
              <p className="eyebrow text-brass-deep">{p.eyebrow}</p>
              <h3 className="font-display text-2xl md:text-3xl mt-3 text-forest leading-snug">
                {p.title}
              </h3>
              <p className="mt-4 text-charcoal leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function MarketplacePreview() {
  const categories = [
    {
      eyebrow: "For Riders",
      title: "What you wear in the saddle.",
      items: ["Helmets & headwear", "Boots & half chaps", "Breeches & jodhpurs", "Show jackets & shirts", "Gloves & accessories", "Body protectors"],
      photo: "https://images.unsplash.com/photo-1550785330-003a9afa3bd9?w=800&fit=crop&q=80",
      href: "/marketplace#riders",
    },
    {
      eyebrow: "For Horses",
      title: "What your horse needs to thrive.",
      items: ["Saddles & saddlery", "Bridles & bits", "Rugs & blankets", "Feed & supplements", "Grooming & care", "Health essentials"],
      photo: "https://images.unsplash.com/photo-1544467251-2184f386011f?w=800&fit=crop&q=80",
      href: "/marketplace#horses",
    },
    {
      eyebrow: "For Stables",
      title: "What it takes to run one well.",
      items: ["Stable equipment", "Arena & footing", "Fencing & paddocks", "Yard supplies", "Hay & bedding", "Safety & first aid"],
      photo: "https://images.unsplash.com/photo-1576692192914-9abed71b3ef9?w=800&fit=crop&q=80",
      href: "/marketplace#stables",
    },
  ];

  return (
    <section className="bg-cream py-24 md:py-32">
      <Container size="wide">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div>
            <p className="eyebrow text-brass-deep">
              <span className="rule"></span>The Marketplace
            </p>
            <h2 className="font-display text-4xl md:text-5xl mt-4 max-w-2xl text-forest leading-tight">
              Every product, for every kind of ride.
            </h2>
          </div>
          <Link href="/marketplace" className="eyebrow text-forest hover:text-oxblood whitespace-nowrap">
            Explore the marketplace →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-forest/15">
          {categories.map((c) => (
            <Link
              key={c.eyebrow}
              href={c.href}
              className="group bg-cream hover:bg-cream-warm transition-colors p-8 md:p-10 flex flex-col"
            >
              <div className="aspect-[4/3] mb-8 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.photo} alt={c.eyebrow} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <p className="eyebrow text-brass-deep">{c.eyebrow}</p>
              <h3 className="font-display text-2xl md:text-3xl mt-3 text-forest leading-snug">
                {c.title}
              </h3>
              <ul className="mt-5 space-y-1.5 text-sm text-charcoal flex-1">
                {c.items.map((i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-brass rounded-full"></span>
                    {i}
                  </li>
                ))}
              </ul>
              <span className="mt-6 eyebrow text-forest group-hover:text-oxblood transition-colors">
                Preview →
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

function ServicesPreview() {
  const services = [
    {
      eyebrow: "Coaches",
      title: "Find the right instructor.",
      body: "From first lessons to competitive show jumping. Discover certified coaches across India, with disciplines, fees, and reviews up front.",
    },
    {
      eyebrow: "Vets",
      title: "Equine care, when it matters.",
      body: "A directory of qualified equine vets — for routine wellness, lameness work, dentistry, and emergencies. Verified and accessible.",
    },
    {
      eyebrow: "Farriers",
      title: "Shoeing your horse can trust.",
      body: "From corrective work to barefoot trims. Connect with farriers who travel to your stable and stand behind their work.",
    },
  ];

  return (
    <section className="bg-forest text-cream-soft py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.05]">
        <HoofPattern />
      </div>
      <Container className="relative">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div>
            <p className="eyebrow text-brass-light">
              <span className="rule"></span>The Services
            </p>
            <h2 className="font-display text-4xl md:text-5xl mt-4 max-w-2xl leading-tight">
              The professionals you trust, brought into the light.
            </h2>
          </div>
          <Link href="/services" className="eyebrow text-brass-light hover:text-cream-soft whitespace-nowrap">
            Browse the directory →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {services.map((s) => (
            <div key={s.eyebrow} className="border-t border-cream-soft/20 pt-6">
              <p className="eyebrow text-brass-light">{s.eyebrow}</p>
              <h3 className="font-display text-2xl md:text-3xl mt-3 leading-snug">
                {s.title}
              </h3>
              <p className="mt-4 text-cream-soft/75 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function FoundersNote() {
  return (
    <section className="bg-cream-soft py-24 md:py-32">
      <Container size="narrow">
        <p className="eyebrow text-brass-deep text-center">
          A Note From The Founders
        </p>
        <blockquote className="mt-8 font-display text-3xl md:text-4xl lg:text-5xl text-forest text-center leading-tight italic">
          &ldquo;India has one of the world&rsquo;s oldest equestrian
          traditions — and one of its most fragmented modern markets. We grew
          up between the two. Indusequine is our attempt to bridge them.&rdquo;
        </blockquote>
        <div className="mt-10 text-center">
          <Link href="/story" className="eyebrow text-forest hover:text-oxblood">
            Read our story →
          </Link>
        </div>
      </Container>
    </section>
  );
}

function WaitlistCTA() {
  return (
    <section className="bg-oxblood text-cream-soft">
      <Container className="py-20 md:py-24 text-center">
        <p className="eyebrow text-brass-light">
          <span className="rule"></span>Launching Soon
        </p>
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mt-6 leading-tight">
          Be the first in the saddle.
        </h2>
        <p className="mt-6 text-cream-soft/80 max-w-xl mx-auto leading-relaxed">
          Join the waitlist for early access, founder updates, and a hand-picked
          welcome when we open the gates.
        </p>
        <Link
          href="/waitlist"
          className="mt-10 inline-flex items-center justify-center px-10 py-4 bg-cream-soft text-oxblood hover:bg-cream transition-colors text-sm tracking-[0.18em] uppercase"
        >
          Join the Waitlist
        </Link>
      </Container>
    </section>
  );
}
