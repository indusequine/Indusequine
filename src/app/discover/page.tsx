import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/Container";

export const metadata: Metadata = {
  title: "Discover",
  description:
    "Equine therapy, clinics, training programmes, and shows across India — booked directly through Indusequine.",
};

const HERO_PHOTO = "/images/discover-hero.jpg";

const categories = [
  {
    id: "equine-therapy",
    eyebrow: "Equine Therapy",
    title: "Recovery and conditioning, one booked session at a time.",
    intro:
      "From post-injury rehabilitation to routine conditioning, equine therapy keeps horses sound and performing. India's therapy centres are real, but they live in stables and word of mouth, not on the open web. We're bringing them onto Indusequine so you can see what's on offer nearby and book a session directly.",
    bullets: [
      "Post-injury rehabilitation and hydrotherapy",
      "Soft-tissue therapy and massage",
      "Conditioning programmes for competition horses",
      "Movement assessments and long-term wellness plans",
    ],
    promiseEyebrow: "How booking will work",
    promiseItems: [
      "Browse centres by location and specialism",
      "See real availability before you travel",
      "Book directly through Indusequine",
      "Verified centres only — reviewed before listing",
    ],
  },
  {
    id: "clinics",
    eyebrow: "Clinics",
    title: "Veterinary care without the guesswork.",
    intro:
      "Whether it's a routine check-up or a second opinion before a big purchase, finding the right equine vet shouldn't mean working through your stable's group chat. We're mapping clinics across India so you know exactly who to call, and can book straight in.",
    bullets: [
      "Routine care: vaccinations, dental work, deworming",
      "Diagnostic imaging and lameness work-ups",
      "Pre-purchase exams and second opinions",
      "Emergency contacts mapped by region",
    ],
    promiseEyebrow: "How booking will work",
    promiseItems: [
      "Browse clinics by location and specialism",
      "See real availability before you travel",
      "Book directly through Indusequine",
      "Verified clinics only — reviewed before listing",
    ],
  },
  {
    id: "training-programmes",
    eyebrow: "Training Programmes",
    title: "Structured coaching, from your first lesson to your next show.",
    intro:
      "Good training is a season-long commitment, not a single lesson. We're bringing India's training programmes — junior, amateur, and professional — onto Indusequine, so you can find a curriculum built for where you actually are, and book straight in.",
    bullets: [
      "Season-long curricula with clear progression",
      "Junior, amateur, and professional tracks",
      "Discipline-specific programmes: dressage, jumping, eventing, and more",
      "Short-term intensives alongside full-season enrolment",
    ],
    promiseEyebrow: "How booking will work",
    promiseItems: [
      "Browse programmes by discipline and level",
      "See real availability before you commit",
      "Book directly through Indusequine",
      "Verified coaches only — reviewed before listing",
    ],
  },
  {
    id: "shows",
    eyebrow: "Shows",
    title: "Enter the ring. We'll handle the paperwork.",
    intro:
      "In this sport, a competition is a show — the two words mean the same thing. We're building a single place to see every show happening across India and abroad, and to register your entry directly through Indusequine instead of chasing down a form.",
    bullets: [
      "National and international show calendars",
      "Entry registration handled directly on Indusequine",
      "Categories from junior to open, across disciplines",
      "Results and standings, once shows go live",
    ],
    promiseEyebrow: "How entries will work",
    promiseItems: [
      "Browse shows by date, region, and discipline",
      "See entry requirements before you commit",
      "Register and pay directly through Indusequine",
      "Verified organisers only — reviewed before listing",
    ],
  },
];

export default function DiscoverPage() {
  return (
    <>
      <PageHero />
      {categories.map((c) => (
        <DiscoverSection key={c.id} category={c} />
      ))}
      <DiscoverCTA />
    </>
  );
}

function PageHero() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-forest-deep border-b border-brass/20">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={HERO_PHOTO}
        alt="Riders and horses warming up before a session"
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-forest-deep/60" />
      <Container className="relative">
        <p className="eyebrow text-brass-light">Discover</p>
        <h1 className="font-display text-5xl md:text-7xl mt-6 leading-[1.05] max-w-4xl text-cream-soft">
          Beyond the tack room.
        </h1>
        <p className="mt-8 text-lg md:text-xl text-cream-soft/80 leading-relaxed max-w-2xl">
          Equine therapy, clinics, training programmes, and shows — the care
          and coaching that keep horses and riders at their best. We&rsquo;re
          building the booking, one verified partner at a time.
        </p>
        <div className="mt-12 flex flex-wrap gap-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`#${c.id}`}
              className="px-5 py-2.5 border border-cream-soft/30 hover:border-brass-light hover:text-brass-light transition-colors text-sm tracking-wide text-cream-soft"
            >
              {c.eyebrow}
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

function DiscoverSection({ category }: { category: (typeof categories)[number] }) {
  return (
    <section id={category.id} className="py-24 md:py-32 scroll-mt-24 bg-cream-soft odd:bg-cream">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-7">
            <p className="eyebrow text-brass-deep">{category.eyebrow}</p>
            <h2 className="font-display text-4xl md:text-5xl mt-4 text-forest leading-tight">
              {category.title}
            </h2>
            <p className="mt-6 text-charcoal leading-relaxed text-lg">
              {category.intro}
            </p>
            <ul className="mt-8 space-y-3">
              {category.bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-charcoal leading-relaxed">
                  <span className="mt-2.5 w-1.5 h-1.5 bg-brass shrink-0 rounded-full"></span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-5">
            <div className="border border-forest/15 bg-cream-soft p-8 sticky top-32">
              <p className="eyebrow text-brass-deep">{category.promiseEyebrow}</p>
              <ul className="mt-5 space-y-3">
                {category.promiseItems.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-ink">
                    <Checkmark />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 pt-6 border-t border-forest/15 text-sm text-stone leading-relaxed">
                Booking isn&rsquo;t live yet — we&rsquo;re verifying partners
                first. Join the waitlist to hear the moment it opens.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Checkmark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mt-1 shrink-0 text-forest" aria-hidden="true">
      <path d="M4 10 L 8.5 14.5 L 16 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DiscoverCTA() {
  return (
    <section className="bg-oxblood text-cream-soft py-24 md:py-28">
      <Container size="narrow" className="text-center">
        <p className="eyebrow text-brass-light">
          For Centres, Coaches & Show Organisers
        </p>
        <h2 className="font-display text-4xl md:text-5xl mt-4 leading-tight">
          Be where India&rsquo;s riders are already looking.
        </h2>
        <p className="mt-6 text-cream-soft/80 leading-relaxed">
          A listing on Indusequine is free while we onboard our first
          partners — bookings and entries route straight through us. Tell us
          what you offer and we&rsquo;ll be in touch.
        </p>
        <Link
          href="/contact"
          className="mt-10 inline-flex items-center justify-center px-10 py-4 bg-cream-soft text-oxblood hover:bg-cream transition-colors text-sm tracking-[0.18em] uppercase"
        >
          Get Listed
        </Link>
      </Container>
    </section>
  );
}
