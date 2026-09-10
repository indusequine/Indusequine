import type { Metadata } from "next";
import { Container } from "@/components/Container";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Indusequine collects, uses, and protects your information.",
};

const EFFECTIVE_DATE = "September 2026";

export default function PrivacyPage() {
  return (
    <>
      <section className="bg-forest-deep text-cream-soft py-20 md:py-28 border-b border-brass/20">
        <Container size="narrow" className="text-center">
          <p className="eyebrow text-brass-light">Legal</p>
          <h1 className="font-display text-5xl md:text-6xl mt-6 leading-[1.05]">
            Privacy Policy
          </h1>
          <p className="mt-6 text-cream-soft/70">Effective {EFFECTIVE_DATE}</p>
        </Container>
      </section>

      <section className="py-20 md:py-28 bg-cream-soft">
        <Container size="narrow">
          <div className="space-y-14">
            <Section title="Who we are">
              <p>
                Indusequine (&ldquo;Indusequine&rdquo;, &ldquo;we&rdquo;,
                &ldquo;us&rdquo;) operates indusequine.com, a marketplace and
                directory for India&rsquo;s equestrian community. This policy
                explains what information we collect when you use the site,
                why we collect it, and what we do with it.
              </p>
            </Section>

            <Section title="What we collect">
              <p>We collect information only when you choose to give it to us, through one of three forms on the site:</p>
              <ul>
                <li>
                  <strong>Product enquiries</strong> — your name, email,
                  optional phone number, and message, along with the product
                  you enquired about.
                </li>
                <li>
                  <strong>Contact form</strong> — your name, email, optional
                  organisation, the nature of your enquiry, and your message.
                </li>
                <li>
                  <strong>Updates signup</strong> — your name, email, how you
                  ride with us, and an optional city and phone number.
                </li>
              </ul>
              <p>
                We also use Vercel Analytics, a cookieless, privacy-first
                analytics tool that reports aggregated traffic patterns —
                which pages are visited, roughly how much traffic, from
                which country — without identifying you personally or
                tracking you across other websites.
              </p>
              <p>
                We do not use advertising cookies, third-party trackers, or
                sell any data to ad networks. We do not collect payment card
                details — the site does not process payments.
              </p>
            </Section>

            <Section title="How we use it">
              <p>We use the information you share to:</p>
              <ul>
                <li>Respond to your enquiry or message</li>
                <li>Connect you with the relevant brand, stable, or professional</li>
                <li>
                  Send you occasional updates, only if you&rsquo;ve signed up
                  to receive them — you can ask to stop at any time
                </li>
                <li>Understand, in aggregate, how people use the site, so we can improve it</li>
              </ul>
            </Section>

            <Section title="Where it's stored">
              <p>
                Form submissions are stored in a private Google Sheet,
                accessible only to the Indusequine team. Analytics data is
                aggregated and stored by Vercel, our hosting provider. We do
                not share the information you submit with any other third
                party, except where necessary to fulfil your specific request
                — for example, passing your enquiry to the brand or
                professional you asked about.
              </p>
            </Section>

            <Section title="Your rights">
              <p>
                You can ask us to show you what information we hold about
                you, correct it, or delete it, at any time — just email{" "}
                <a href="mailto:hello@indusequine.com" className="text-forest underline underline-offset-4">
                  hello@indusequine.com
                </a>
                . We&rsquo;ll act on it promptly. This is consistent with
                your rights under India&rsquo;s Digital Personal Data
                Protection Act, 2023.
              </p>
            </Section>

            <Section title="Third-party services we use">
              <ul>
                <li><strong>Google</strong> — form submissions are stored via Google Sheets</li>
                <li><strong>Vercel</strong> — hosting and cookieless analytics</li>
                <li><strong>Shopify</strong> — powers our product catalogue; no personal information you submit is shared with Shopify</li>
              </ul>
            </Section>

            <Section title="Changes to this policy">
              <p>
                If this policy changes in a meaningful way, we&rsquo;ll
                update this page and revise the effective date above.
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
