import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { LogoMarkPattern } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Find verified equestrian professionals across India — riding coaches, equine vets, and farriers. Credentials, disciplines, reviews, and direct contact.",
};

const services = [
  {
    id: "coaches",
    eyebrow: "Coaches",
    title: "The right instructor for the ride you want.",
    intro:
      "India has world-class coaches, but they live in stables and WhatsApp groups, not on the open web. We're bringing them together — discipline, qualification, experience, fees, and student reviews — so finding the right teacher feels less like a treasure hunt.",
    bullets: [
      "Disciplines: dressage, show jumping, eventing, polo, endurance, vaulting, hacking",
      "Levels: from first-lesson learners to international competitors",
      "Filters: by city, stable, age group, fee range, language",
      "Profiles include credentials (BHS, FEI, IEF, federation licences) and verified student reviews",
    ],
    promiseEyebrow: "What we verify",
    promiseItems: [
      "Identity & teaching credentials",
      "Stable / school affiliation",
      "Insurance & safeguarding",
      "Active student references",
    ],
  },
  {
    id: "vets",
    eyebrow: "Equine Vets",
    title: "Care your horse can count on.",
    intro:
      "Equine medicine is a specialism — and a small one in India. We're mapping every qualified equine vet in the country, so whether it's a routine vaccination, a pre-purchase exam, or an emergency at midnight, you know exactly who to call.",
    bullets: [
      "Routine care: vaccinations, deworming, dentistry, nutrition",
      "Performance work: lameness, gait analysis, joint injections, pre-purchase exams",
      "Surgical & specialist referrals",
      "Emergency contacts mapped by region",
    ],
    promiseEyebrow: "What we verify",
    promiseItems: [
      "MVSc / equine specialisation",
      "Veterinary Council registration",
      "Stable & federation references",
      "Service radius & response time",
    ],
  },
  {
    id: "farriers",
    eyebrow: "Farriers",
    title: "Shoeing you — and your horse — can trust.",
    intro:
      "Good farriery keeps a horse sound. Poor farriery breaks one. The farrier community in India is tight, talented, and largely invisible outside the stables where each works. We're putting their work — and your stable's experience of it — into the open.",
    bullets: [
      "Disciplines: hot shoeing, cold shoeing, corrective work, barefoot trims",
      "Specialisms: sport horses, polo ponies, Marwari & indigenous breeds, foals",
      "Travel radius, fees, and booking lead times shown up front",
      "Verified by the stables they shoe at",
    ],
    promiseEyebrow: "What we verify",
    promiseItems: [
      "Apprenticeship / formal training",
      "Stable references (minimum two)",
      "Tooling & technique evidence",
      "Active client roster",
    ],
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHero />
      {services.map((s) => (
        <ServiceSection key={s.id} service={s} />
      ))}
      <ProviderCTA />
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
          The Services Directory
        </p>
        <h1 className="font-display text-5xl md:text-7xl mt-6 leading-[1.05] max-w-4xl">
          The professionals you trust, brought into the light.
        </h1>
        <p className="mt-8 text-lg md:text-xl text-cream-soft/80 leading-relaxed max-w-2xl">
          Coaches, vets, and farriers across India — verified, rated, and
          reachable. Built from the ground up with the stables, federations,
          and riders who already know each other.
        </p>
        <div className="mt-12 flex flex-wrap gap-3">
          {services.map((s) => (
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

function ServiceSection({ service }: { service: (typeof services)[number] }) {
  return (
    <section id={service.id} className="py-24 md:py-32 scroll-mt-24 bg-cream-soft odd:bg-cream">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-7">
            <p className="eyebrow text-brass-deep">{service.eyebrow}</p>
            <h2 className="font-display text-4xl md:text-5xl mt-4 text-forest leading-tight">
              {service.title}
            </h2>
            <p className="mt-6 text-charcoal leading-relaxed text-lg">
              {service.intro}
            </p>
            <ul className="mt-8 space-y-3">
              {service.bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-charcoal leading-relaxed">
                  <span className="mt-2.5 w-1.5 h-1.5 bg-brass shrink-0 rounded-full"></span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-5">
            <div className="border border-forest/15 bg-cream-soft p-8 sticky top-32">
              <p className="eyebrow text-brass-deep">{service.promiseEyebrow}</p>
              <ul className="mt-5 space-y-3">
                {service.promiseItems.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-ink">
                    <Checkmark />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 pt-6 border-t border-forest/15 text-sm text-stone leading-relaxed">
                Every listing is reviewed before it goes live. Riders can
                report issues; bad actors are removed.
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

function ProviderCTA() {
  return (
    <section className="bg-oxblood text-cream-soft py-24 md:py-28">
      <Container size="narrow" className="text-center">
        <p className="eyebrow text-brass-light">
          For Coaches, Vets & Farriers
        </p>
        <h2 className="font-display text-4xl md:text-5xl mt-4 leading-tight">
          Be listed where India&rsquo;s riders are already looking.
        </h2>
        <p className="mt-6 text-cream-soft/80 leading-relaxed">
          A profile on Indusequine is free for verified professionals — and
          built to bring you the clients you actually want. Tell us about your
          practice and we&rsquo;ll be in touch when we begin onboarding.
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
