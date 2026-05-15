import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { LogoMarkPattern } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "Why we're building Indusequine — India's first dedicated equestrian marketplace. Organising one of the world's oldest equestrian traditions into one trusted modern home.",
};

export default function StoryPage() {
  return (
    <>
      <PageHero />
      <Problem />
      <Mission />
      <Why />
      <Promise />
      <FoundersNote />
      <CTA />
    </>
  );
}

function PageHero() {
  return (
    <section className="bg-forest-deep text-cream-soft py-24 md:py-32 relative overflow-hidden border-b border-brass/20">
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none text-brass-light">
        <LogoMarkPattern />
      </div>
      <Container className="relative">
        <p className="eyebrow text-brass-light">
          Our Story
        </p>
        <h1 className="font-display text-5xl md:text-7xl mt-6 leading-[1.05] max-w-4xl italic">
          One of the world&rsquo;s oldest equestrian traditions.
          <br />
          <span className="text-brass-light not-italic">One of its most fragmented modern markets.</span>
        </h1>
        <p className="mt-8 text-lg md:text-xl text-cream-soft/80 leading-relaxed max-w-2xl">
          Indusequine exists to bridge them.
        </p>
      </Container>
    </section>
  );
}

function Problem() {
  return (
    <section className="py-24 md:py-32 bg-cream-soft">
      <Container size="narrow">
        <p className="eyebrow text-brass-deep">
          The Problem
        </p>
        <h2 className="font-display text-4xl md:text-5xl mt-4 text-forest leading-tight">
          A market that moves through WhatsApp.
        </h2>
        <div className="mt-8 space-y-6 text-charcoal leading-relaxed text-lg">
          <p>
            India has cavalry regiments older than the Republic. Polo grounds
            in Jaipur, Calcutta, and Delhi that have hosted the sport for
            generations. Stud farms in Punjab, riding schools in every metro,
            and indigenous breeds — the Marwari, the Kathiawari — that are
            woven into the country&rsquo;s history.
          </p>
          <p>
            And yet, in 2026, buying a well-fitting saddle in India still
            often means a flight to Europe, a customs bill, and a fitter
            willing to travel. Finding a vet who specialises in lameness
            means asking three stable owners, who ask three more. Hiring a
            coach for your child means relying on whoever your school
            happens to employ.
          </p>
          <p>
            The market is real. The expertise is real. The demand is
            growing. But it lives in WhatsApp groups, stable noticeboards,
            and the personal address books of a few well-connected riders.
            It is the textbook definition of an unorganised market.
          </p>
        </div>
      </Container>
    </section>
  );
}

function Mission() {
  return (
    <section className="py-24 md:py-32 bg-forest text-cream-soft">
      <Container size="narrow">
        <p className="eyebrow text-brass-light">
          Our Mission
        </p>
        <h2 className="font-display text-4xl md:text-5xl mt-4 leading-tight">
          To organise the unorganised — without losing what makes it good.
        </h2>
        <div className="mt-8 space-y-6 text-cream-soft/85 leading-relaxed text-lg">
          <p>
            Indusequine is India&rsquo;s first dedicated equestrian
            marketplace. One trusted home for the products, professionals,
            and stables that India&rsquo;s riders rely on — built with the
            community that already knows the territory.
          </p>
          <p>
            Two halves, working together. A <em className="text-brass-light not-italic font-medium">marketplace</em>{" "}
            of considered, curated products for riders, horses, and
            stables. A <em className="text-brass-light not-italic font-medium">services directory</em> of verified
            coaches, vets, and farriers — the people who keep the whole
            thing standing.
          </p>
          <p>
            What we won&rsquo;t do is reduce a craft community to a
            commodity feed. The best of India&rsquo;s equestrian world
            depends on relationships, knowledge, and trust. We&rsquo;re
            building a platform that respects all three.
          </p>
        </div>
      </Container>
    </section>
  );
}

function Why() {
  const pillars = [
    {
      title: "Why now",
      body: "A new generation is entering the sport — through schools, polo, and the leisure riding boom. They expect to discover, evaluate, and book online. The infrastructure simply isn't there yet.",
    },
    {
      title: "Why India",
      body: "No one has built this yet. There is no trusted home for the category — no name a rider, a stable, or a brand already turns to. The early mover with the right standards — vetted brands, verified professionals, fair fees — sets the bar for the next decade.",
    },
    {
      title: "Why us",
      body: "We grew up between the saddle and the spreadsheet. We know the riders, the stables, the federations, and what's actually broken — because we've lived with it.",
    },
  ];

  return (
    <section className="py-24 md:py-32 bg-cream">
      <Container>
        <p className="eyebrow text-brass-deep">
          The Wedge
        </p>
        <h2 className="font-display text-4xl md:text-5xl mt-4 text-forest leading-tight max-w-3xl">
          The right idea, in the right country, at the right time.
        </h2>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((p) => (
            <div key={p.title} className="border-t-2 border-brass pt-6">
              <h3 className="font-display text-2xl text-forest">{p.title}</h3>
              <p className="mt-4 text-charcoal leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Promise() {
  return (
    <section className="py-24 md:py-32 bg-cream-soft">
      <Container size="narrow">
        <p className="eyebrow text-brass-deep">
          Our Promise
        </p>
        <h2 className="font-display text-4xl md:text-5xl mt-4 text-forest leading-tight">
          To the rider, to the brand, to the professional.
        </h2>
        <div className="mt-12 space-y-8">
          <Pact
            to="To the rider"
            text="You will find products you can trust, professionals you can verify, and prices you can read up front. We will never sell you something we wouldn't put on our own horse."
          />
          <Pact
            to="To the brand"
            text="We will not list everything. We will list the best. Your work will be presented as it deserves, alongside peers who care as much as you do."
          />
          <Pact
            to="To the professional"
            text="Your reputation is your livelihood. We will protect it as if it were our own — verified credentials, honest reviews, real recourse."
          />
        </div>
      </Container>
    </section>
  );
}

function Pact({ to, text }: { to: string; text: string }) {
  return (
    <div className="border-l-2 border-brass pl-6">
      <p className="eyebrow text-forest">{to}</p>
      <p className="mt-3 text-charcoal leading-relaxed text-lg">{text}</p>
    </div>
  );
}

function FoundersNote() {
  return (
    <section className="bg-forest-deep text-cream-soft py-24 md:py-32">
      <Container size="narrow">
        <p className="eyebrow text-brass-light text-center">A Note From The Founders</p>
        <blockquote className="mt-8 font-display text-2xl md:text-3xl leading-snug italic text-cream-soft">
          <p>
            &ldquo;Every Indian rider has the same conversation, on loop.
            Where did you get your saddle? Who does your shoeing? Who&rsquo;s
            your coach? Where do you find a decent vet in the city? The
            answer is always &lsquo;let me ask someone&rsquo;.&rdquo;
          </p>
          <p className="mt-6">
            &ldquo;Indusequine is the version of that conversation that
            scales. The same trust, the same standards, the same hand-picked
            quality — built for everyone in the country to share, not just
            the dozen of us who already know each other.&rdquo;
          </p>
          <p className="mt-6 text-brass-light">
            &ldquo;That&rsquo;s the company we&rsquo;re building. Welcome to it.&rdquo;
          </p>
        </blockquote>
        <p className="mt-10 text-center eyebrow text-brass-light">
          — The Founders, Indusequine
        </p>
      </Container>
    </section>
  );
}

function CTA() {
  return (
    <section className="bg-oxblood text-cream-soft">
      <Container className="py-20 md:py-24 text-center">
        <h2 className="font-display text-4xl md:text-5xl leading-tight">
          Ride with us from the beginning.
        </h2>
        <p className="mt-6 text-cream-soft/80 max-w-xl mx-auto leading-relaxed">
          Join the waitlist for early access and founder updates. The first
          riders shape the platform.
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
