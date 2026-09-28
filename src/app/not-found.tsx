import Link from "next/link";
import { Container } from "@/components/Container";
import { LogoMarkPattern } from "@/components/Logo";

export default function NotFound() {
  return (
    <section className="relative min-h-[70vh] flex items-center overflow-hidden bg-forest-deep text-cream-soft py-24">
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none text-brass-light">
        <LogoMarkPattern />
      </div>
      <Container size="narrow" className="relative text-center">
        <p className="eyebrow text-brass-light">404</p>
        <h1 className="font-display text-5xl md:text-6xl mt-6 leading-[1.05]">
          This trail doesn&rsquo;t lead anywhere.
        </h1>
        <p className="mt-6 text-lg text-cream-soft/80 leading-relaxed max-w-xl mx-auto">
          The page you&rsquo;re looking for may have moved, or never
          existed. Let&rsquo;s get you back on course.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 py-4 bg-cream-soft text-forest-deep hover:bg-cream transition-colors text-sm tracking-[0.18em] uppercase"
          >
            Back Home
          </Link>
          <Link
            href="/marketplace"
            className="inline-flex items-center justify-center px-8 py-4 border border-cream-soft/30 hover:border-brass-light hover:text-brass-light transition-colors text-sm tracking-[0.18em] uppercase"
          >
            Shop the Marketplace
          </Link>
        </div>
      </Container>
    </section>
  );
}
