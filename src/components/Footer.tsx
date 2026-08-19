import Link from "next/link";
import { Logo } from "./Logo";
import { Container } from "./Container";
import { getTopCategories } from "@/data/products";

export function Footer() {
  const topCategories = getTopCategories(4);

  return (
    <footer className="bg-forest-deep text-cream-soft/80 mt-24">
      <Container size="wide" className="py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-4">
            <Logo variant="cream" size="md" />
            <p className="mt-6 text-cream-soft/70 max-w-md leading-relaxed">
              India&rsquo;s first dedicated equestrian marketplace. A curated home for
              riders, horses, stables, and the professionals who serve them.
            </p>
            <p className="mt-6 eyebrow text-brass-light">
              Launching Soon
            </p>
          </div>

          <div className="md:col-span-2">
            <p className="eyebrow text-cream-soft/50 mb-4">Marketplace</p>
            <ul className="space-y-3 text-sm">
              <li><Link href="/marketplace" className="hover:text-brass-light">All Categories</Link></li>
              {topCategories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/marketplace/category/${c.slug}`} className="hover:text-brass-light">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="eyebrow text-cream-soft/50 mb-4">Discover</p>
            <ul className="space-y-3 text-sm">
              <li><Link href="/discover#equine-therapy" className="hover:text-brass-light">Equine Therapy</Link></li>
              <li><Link href="/discover#clinics" className="hover:text-brass-light">Clinics</Link></li>
              <li><Link href="/discover#training-programmes" className="hover:text-brass-light">Training Programmes</Link></li>
              <li><Link href="/discover#shows" className="hover:text-brass-light">Shows</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="eyebrow text-cream-soft/50 mb-4">Services</p>
            <ul className="space-y-3 text-sm">
              <li><Link href="/services#coaches" className="hover:text-brass-light">Coaches</Link></li>
              <li><Link href="/services#vets" className="hover:text-brass-light">Vets</Link></li>
              <li><Link href="/services#farriers" className="hover:text-brass-light">Farriers</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="eyebrow text-cream-soft/50 mb-4">Company</p>
            <ul className="space-y-3 text-sm">
              <li><Link href="/story" className="hover:text-brass-light">Our Story</Link></li>
              <li><Link href="/waitlist" className="hover:text-brass-light">Join the Waitlist</Link></li>
              <li><Link href="/contact" className="hover:text-brass-light">Partner With Us</Link></li>
              <li>
                <a href="mailto:hello@indusequine.com" className="hover:text-brass-light">
                  hello@indusequine.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-cream-soft/10 flex flex-col md:flex-row justify-between gap-4 text-xs text-cream-soft/50">
          <p>© {new Date().getFullYear()} Indusequine. All rights reserved.</p>
          <p className="tracking-wider uppercase">Made in India · For India&rsquo;s Riders</p>
        </div>
      </Container>
    </footer>
  );
}
