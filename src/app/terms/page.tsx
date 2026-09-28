import type { Metadata } from "next";
import { Container } from "@/components/Container";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Indusequine.",
};

const EFFECTIVE_DATE = "September 2026";

export default function TermsPage() {
  return (
    <>
      <section className="bg-forest-deep text-cream-soft py-20 md:py-28 border-b border-brass/20">
        <Container size="narrow" className="text-center">
          <p className="eyebrow text-brass-light">Legal</p>
          <h1 className="font-display text-5xl md:text-6xl mt-6 leading-[1.05]">
            Terms of Service
          </h1>
          <p className="mt-6 text-cream-soft/70">Effective {EFFECTIVE_DATE}</p>
        </Container>
      </section>

      <section className="py-20 md:py-28 bg-cream-soft">
        <Container size="narrow">
          <div className="space-y-14">
            <Section title="What Indusequine is">
              <p>
                Indusequine is a marketplace and directory connecting
                India&rsquo;s riders with equestrian products, brands, and
                verified professionals: coaches, vets and farriers. By using
                indusequine.com, you agree to these terms.
              </p>
            </Section>

            <Section title="How the marketplace works today">
              <p>
                Product listings on Indusequine show real products and real
                prices, sourced from our brand partners. Right now,
                Indusequine is <strong>enquiry-based, not transactional</strong>.
                When you enquire about a product, we pass your request to the
                relevant brand or partner, who handles the sale directly with
                you. Indusequine does not process payments and is not a
                party to the resulting sale.
              </p>
              <p>
                Prices and availability are supplied by our brand partners
                and may change. Where a listing says &ldquo;Price on
                request&rdquo;, pricing depends on your specific enquiry.
              </p>
            </Section>

            <Section title="The services directory">
              <p>
                Listings for coaches, vets, and farriers are informational.
                We make a reasonable effort to verify the professionals we
                list, but we don&rsquo;t control, and can&rsquo;t guarantee,
                the quality of services they provide. Any arrangement you
                make with a listed professional is between you and them.
              </p>
            </Section>

            <Section title="Discover">
              <p>
                Our Discover section is an informational directory of
                equine therapy centres, clinics, training programmes, and
                shows. It is not currently a booking or registration
                platform. Entries are for discovery, not transaction.
              </p>
            </Section>

            <Section title="Acceptable use">
              <p>Please don&rsquo;t:</p>
              <ul>
                <li>Scrape, copy, or republish our catalogue or content without permission</li>
                <li>Submit false information through our enquiry or contact forms</li>
                <li>Use the site to impersonate another person or organisation</li>
                <li>Attempt to disrupt or interfere with the site&rsquo;s normal operation</li>
              </ul>
            </Section>

            <Section title="Intellectual property">
              <p>
                The Indusequine name, logo, and site design belong to us.
                Product images, brand names, and trademarks shown on the
                site belong to their respective owners and are used with
                their permission or under fair use for identification
                purposes.
              </p>
            </Section>

            <Section title="No warranty, limited liability">
              <p>
                We work to keep listings accurate, but Indusequine is
                provided &ldquo;as is&rdquo;, without warranties of any
                kind. We&rsquo;re not liable for the products, services, or
                conduct of the brands, professionals, or organisations
                listed on the site, only for our own direct role in connecting
                you with them.
              </p>
            </Section>

            <Section title="Governing law">
              <p>
                These terms are governed by the laws of India. Any disputes
                will be handled in the courts of India.
              </p>
            </Section>

            <Section title="Changes to these terms">
              <p>
                We may update these terms as the platform grows, for example
                as we introduce direct checkout or booking. If we
                make a meaningful change, we&rsquo;ll update the effective
                date above.
              </p>
            </Section>

            <Section title="Questions">
              <p>
                Reach us any time at{" "}
                <a href="mailto:hello@indusequine.com" className="text-forest underline underline-offset-4">
                  hello@indusequine.com
                </a>
                .
              </p>
            </Section>
          </div>
        </Container>
      </section>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-forest/15 pt-10">
      <h2 className="font-display text-2xl md:text-3xl text-forest leading-tight">
        {title}
      </h2>
      <div className="mt-5 space-y-4 text-charcoal leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_li]:leading-relaxed">
        {children}
      </div>
    </div>
  );
}
