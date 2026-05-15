import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Partner With Us",
  description:
    "Get in touch with Indusequine. For brands, importers, coaches, vets, farriers, stables, and the press. We'd like to talk to you.",
};

export default function ContactPage() {
  return (
    <>
      <section className="bg-forest text-cream-soft py-20 md:py-28 border-b border-brass/20">
        <Container size="narrow" className="text-center">
          <p className="eyebrow text-brass-light">
            Partner With Us
          </p>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl mt-6 leading-[1.05]">
            Let&rsquo;s talk.
          </h1>
          <p className="mt-8 text-lg md:text-xl text-cream-soft/80 leading-relaxed">
            We&rsquo;re especially keen to hear from brands, importers,
            stables, and equine professionals who&rsquo;d like to be part of
            the first chapter.
          </p>
        </Container>
      </section>

      <section className="py-20 md:py-28 bg-cream-soft">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-5">
              <p className="eyebrow text-brass-deep">
                Direct lines
              </p>
              <h2 className="font-display text-3xl md:text-4xl mt-4 text-forest leading-tight">
                Three ways to reach us.
              </h2>
              <div className="mt-10 space-y-8">
                <ContactBlock
                  eyebrow="For brands & importers"
                  title="Get your products into India's most considered equestrian marketplace."
                  email="partners@indusequine.com"
                />
                <ContactBlock
                  eyebrow="For coaches, vets & farriers"
                  title="List your practice — free for verified professionals."
                  email="professionals@indusequine.com"
                />
                <ContactBlock
                  eyebrow="Press, careers & everything else"
                  title="The general line. We read everything."
                  email="hello@indusequine.com"
                />
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-cream border border-forest/15 p-8 md:p-12">
                <p className="eyebrow text-brass-deep">Send a message</p>
                <h2 className="font-display text-3xl md:text-4xl mt-3 text-forest leading-tight">
                  Tell us about yourself.
                </h2>
                <p className="mt-3 text-charcoal leading-relaxed">
                  The more you share, the better we can reply.
                </p>
                <div className="mt-10">
                  <ContactForm />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

function ContactBlock({
  eyebrow,
  title,
  email,
}: {
  eyebrow: string;
  title: string;
  email: string;
}) {
  return (
    <div className="border-l-2 border-brass pl-6">
      <p className="eyebrow text-forest">{eyebrow}</p>
      <p className="mt-2 text-charcoal leading-relaxed">{title}</p>
      <a
        href={`mailto:${email}`}
        className="mt-3 inline-block text-forest hover:text-oxblood underline underline-offset-4"
      >
        {email}
      </a>
    </div>
  );
}
