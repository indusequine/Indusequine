"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "./Logo";
import { Container } from "./Container";

const navLinks = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/services", label: "Services" },
  { href: "/story", label: "Our Story" },
  { href: "/contact", label: "Partner With Us" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-cream-soft/85 backdrop-blur-md border-b border-forest/10">
      <Container size="wide">
        <div className="flex items-center justify-between h-20">
          <Logo size="md" />

          <nav className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm tracking-wide text-charcoal hover:text-forest transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center">
            <Link
              href="/waitlist"
              className="inline-flex items-center px-5 py-2.5 text-sm tracking-wide bg-forest text-cream-soft hover:bg-forest-deep transition-colors"
            >
              Join the Waitlist
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 -mr-2 text-forest"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              {open ? (
                <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="1.5" />
              ) : (
                <>
                  <line x1="4" y1="7" x2="20" y2="7" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="4" y1="17" x2="20" y2="17" stroke="currentColor" strokeWidth="1.5" />
                </>
              )}
            </svg>
          </button>
        </div>

        {open && (
          <div className="md:hidden pb-6 border-t border-forest/10 pt-4 -mx-6 md:-mx-10 px-6 md:px-10">
            <nav className="flex flex-col gap-5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-base text-charcoal hover:text-forest"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/waitlist"
                onClick={() => setOpen(false)}
                className="mt-2 inline-flex items-center justify-center px-5 py-3 text-sm tracking-wide bg-forest text-cream-soft"
              >
                Join the Waitlist
              </Link>
            </nav>
          </div>
        )}
      </Container>
    </header>
  );
}
