import Link from "next/link";
import { Container } from "@/components/Container";

const HERO_PHOTO = "/images/hero-wide.jpg";
const MARKETPLACE_PHOTO = "/images/horse-portrait.jpg";
const SERVICES_PHOTO = "/images/rider-medal-bw.jpg";
const CLOSER_PHOTO = "/images/rider-walking.jpg";

export default function HomePage() {
  return (
    <>
      <CinematicHero />
      <Whisper />
      <MarketplaceSplit />
      <SectionDivider />
      <ServicesSplit />
      <FoundersQuote />
      <LaunchingSoon />
    </>
  );
}

function SectionDivider() {
  return (
    <div className="bg-cream py-12 md:py-16">
      <div className="flex items-center justify-center gap-6">
        <span className="h-px w-24 md:w-40 bg-brass/50"></span>
        <svg
          width="28"
          height="28"
          viewBox="0 0 32 32"
          fill="none"
          className="text-brass shrink-0"
          aria-hidden="true"
        >
          <path
            d="M8 6 Q 8 4 10 4 L 12 4 L 12 16 Q 12 22 16 22 Q 20 22 20 16 L 20 4 L 22 4 Q 24 4 24 6 L 24 18 Q 24 28 16 28 Q 8 28 8 18 Z"
            stroke="currentColor"
            strokeWidth="1.4"
            fill="none"
          />
          <circle cx="10.5" cy="9" r="0.8" fill="currentColor" />
          <circle cx="13" cy="6.5" r="0.8" fill="currentColor" />
          <circle cx="19" cy="6.5" r="0.8" fill="currentColor" />
          <circle cx="21.5" cy="9" r="0.8" fill="currentColor" />
        </svg>
        <span className="h-px w-24 md:w-40 bg-brass/50"></span>
      </div>
    </div>
  );
}

function CinematicHero() {
  return (
    <section className="relative h-[92vh] min-h-[640px] flex items-center justify-center overflow-hidden bg-forest-deep">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={HERO_PHOTO}
        alt="A rider with their horse"
        className="absolute inset-0 w-full h-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-forest-deep/50" />

      <Container size="wide" className="relative text-cream-soft text-center">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl leading-[1.02] tracking-tight fade-in-up">
            India&rsquo;s equestrian
            <br />
            <span className="italic text-brass-light">marketplace.</span>
          </h1>
          <p
            className="mt-8 text-lg md:text-xl text-cream-soft/60 tracking-wide fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            For the rider. For the horse. For the stable.
          </p>
          <div
            className="mt-12 fade-in-up"
            style={{ animationDelay: "0.35s" }}
          >
            <Link
              href="/story"
              className="inline-flex items-center justify-center px-8 py-4 bg-cream-soft text-forest-deep hover:bg-cream transition-colors text-sm tracking-[0.18em] uppercase"
            >
              Our Story
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Whisper() {
  return (
    <section className="bg-cream-soft py-32 md:py-48">
      <Container size="narrow" className="text-center">
        <p className="eyebrow text-brass-deep">
          What is Indusequine
        </p>
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mt-10 text-forest leading-[1.15]">
          A curated platform for India&rsquo;s equestrian community.
        </h2>
        <p className="mt-10 text-charcoal leading-relaxed text-lg max-w-2xl mx-auto">
          India&rsquo;s rich equestrian culture, finally with the home it
          deserves. Products for the rider, the horse, and the stable. A
          directory of verified coaches, vets, and farriers. Built with the
          community, for the community.
        </p>
      </Container>
    </section>
  );
}

function MarketplaceSplit() {
  return (
    <section className="bg-cream py-24 md:py-32">
      <Container size="wide">
        <p className="md:hidden eyebrow text-brass-deep text-center text-lg font-bold tracking-[0.32em] mb-10">
          The Marketplace
        </p>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 items-center">
          <div className="md:col-span-7">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={MARKETPLACE_PHOTO}
              alt="A portrait of a horse"
              className="w-full aspect-[4/5] object-cover"
            />
          </div>
          <div className="md:col-span-5">
            <p className="hidden md:block eyebrow text-brass-deep text-center text-lg md:text-xl font-bold tracking-[0.32em]">
              The Marketplace
            </p>
            <h2 className="font-display text-4xl md:text-5xl mt-6 text-forest-deep leading-[1.1]">
              Every product, for every kind of ride.
            </h2>
            <p className="mt-8 text-charcoal leading-relaxed text-lg">
              The brands you&rsquo;ve struggled to find in India — and the ones
              you&rsquo;ve only heard of from friends abroad. All under one
              well-tended roof.
            </p>
            <Link
              href="/marketplace"
              className="mt-10 inline-flex items-center gap-3 eyebrow text-forest hover:text-oxblood hover:gap-4 transition-all"
            >
              Explore the marketplace <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

function ServicesSplit() {
  return (
    <section className="bg-cream py-24 md:py-32">
      <Container size="wide">
        <p className="md:hidden eyebrow text-brass-deep text-center text-lg font-bold tracking-[0.32em] mb-10">
          The Services
        </p>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 items-center">
          <div className="md:col-span-5 md:order-1 order-2">
            <p className="hidden md:block eyebrow text-brass-deep text-center text-lg md:text-xl font-bold tracking-[0.32em]">
              The Services
            </p>
            <h2 className="font-display text-4xl md:text-5xl mt-6 text-forest-deep leading-[1.1]">
              The professionals you trust, brought into the light.
            </h2>
            <p className="mt-8 text-charcoal leading-relaxed text-lg">
              Coaches, vets, and farriers across India — verified credentials,
              transparent fees, honest reviews. A network you can actually find.
            </p>
            <Link
              href="/services"
              className="mt-10 inline-flex items-center gap-3 eyebrow text-forest hover:text-oxblood hover:gap-4 transition-all"
            >
              Browse the directory <span aria-hidden>→</span>
            </Link>
          </div>
          <div className="md:col-span-7 md:order-2 order-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={SERVICES_PHOTO}
              alt="A rider with her horse, a medal at her chest"
              className="w-full aspect-[4/5] object-cover"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}

function FoundersQuote() {
  return (
    <section className="bg-cream-soft py-32 md:py-48 border-t border-b border-forest/10">
      <Container size="narrow" className="text-center">
        <p className="eyebrow text-brass-deep">A Note From The Founders</p>
        <blockquote className="mt-14 font-display text-2xl md:text-3xl lg:text-4xl text-forest leading-[1.35] italic">
          &ldquo;India has one of the world&rsquo;s oldest equestrian
          traditions — and one of its most fragmented modern markets. We grew
          up between the two. Indusequine is our attempt to bridge them.&rdquo;
        </blockquote>
        <div className="mt-14">
          <Link
            href="/story"
            className="inline-flex items-center gap-3 eyebrow text-forest hover:text-oxblood hover:gap-4 transition-all"
          >
            Read our story <span aria-hidden>→</span>
          </Link>
        </div>
      </Container>
    </section>
  );
}

function LaunchingSoon() {
  return (
    <section className="relative h-[90vh] min-h-[640px] overflow-hidden bg-forest-deep">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={CLOSER_PHOTO}
        alt="A rider walking with their horse"
        className="absolute inset-0 w-full h-full object-cover opacity-55"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-forest-deep via-forest-deep/40 to-forest-deep/60" />

      <Container size="narrow" className="relative h-full flex items-center justify-center text-cream-soft text-center">
        <div>
          <p className="eyebrow text-brass-light">
            Launching Soon
          </p>
          <h2 className="font-display text-5xl md:text-7xl lg:text-8xl mt-8 leading-[1.02]">
            Be the first
            <br />
            <span className="italic text-brass-light">in the saddle.</span>
          </h2>
          <p className="mt-10 text-cream-soft/85 max-w-lg mx-auto leading-relaxed">
            Join the waitlist for early access, founder updates, and a hand-picked
            welcome when we open the gates.
          </p>
          <Link
            href="/waitlist"
            className="mt-12 inline-flex items-center justify-center px-12 py-4 bg-cream-soft text-forest-deep hover:bg-cream transition-colors text-sm tracking-[0.18em] uppercase"
          >
            Join the Waitlist
          </Link>
        </div>
      </Container>
    </section>
  );
}
