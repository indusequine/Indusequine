import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { WaitlistForm } from "@/components/WaitlistForm";

export const metadata: Metadata = {
  title: "Join the Waitlist",
  description:
    "Be among the first to step into Indusequine — India's first equestrian marketplace. Early access, founder updates, and a curated welcome.",
};

export default function WaitlistPage() {
  return (
    <>
      <section className="bg-forest-deep text-cream-soft py-20 md:py-28 border-b border-brass/20">
        <Container size="narrow" className="text-center">
          <p className="eyebrow text-brass-light">
            <span className="rule"></span>Launching Soon
          </p>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl mt-6 leading-[1.05]">
            Be the first in the saddle.
          </h1>
          <p className="mt-8 text-lg md:text-xl text-cream-soft/80 leading-relaxed">
            Early access. Founder updates. A hand-picked welcome when we
            open the gates.
          </p>
        </Container>
      </section>

      <section className="py-20 md:py-28 bg-cream-soft">
        <Container size="narrow">
          <WaitlistForm />
        </Container>
      </section>

      <section className="py-20 md:py-28 bg-cream">
        <Container size="narrow">
          <p className="eyebrow text-brass-deep text-center">
            <span className="rule"></span>What Happens Next
          </p>
          <h2 className="font-display text-3xl md:text-4xl mt-4 text-forest text-center leading-tight">
            A few small things, well done.
          </h2>
          <ol className="mt-12 space-y-8">
            <Step
              n="01"
              title="A real welcome email"
              body="No marketing blast. A short note from the founders, with a way to reply if you'd like to share more about how you ride."
            />
            <Step
              n="02"
              title="The occasional considered update"
              body="When we add a brand worth meeting, list a professional worth knowing, or reach a milestone worth marking. Roughly once a month."
            />
            <Step
              n="03"
              title="First access, when we open"
              body="Waitlist members get the gates opened to them first — with founder pricing on the products that matter most."
            />
          </ol>
        </Container>
      </section>
    </>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="grid grid-cols-12 gap-6 items-start border-t border-forest/15 pt-8">
      <div className="col-span-2 md:col-span-1">
        <p className="font-display text-2xl md:text-3xl text-brass-deep">{n}</p>
      </div>
      <div className="col-span-10 md:col-span-11">
        <h3 className="font-display text-2xl text-forest leading-tight">{title}</h3>
        <p className="mt-2 text-charcoal leading-relaxed">{body}</p>
      </div>
    </li>
  );
}
