"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "./Logo";
import { Container } from "./Container";

// Shopping sits on the bar itself, because that is what riders come for.
// Services and Discover hang off it in menus: they matter, but not on the way
// to a girth.
const shopLinks = [
  { href: "/marketplace", label: "Shop All" },
  { href: "/marketplace/group/rider", label: "Rider" },
  { href: "/marketplace/group/horse", label: "Horse" },
  { href: "/marketplace/group/horse-care", label: "Horse Care" },
  { href: "/marketplace/brands", label: "Brands" },
];

const menus = [
  {
    label: "Services",
    href: "/services",
    heading: "Find a professional",
    links: [
      { href: "/services#coaches", label: "Riding coaches" },
      { href: "/services#vets", label: "Equine vets" },
      { href: "/services#farriers", label: "Farriers" },
    ],
  },
  {
    label: "Discover",
    href: "/discover",
    heading: "Beyond the tack room",
    links: [
      { href: "/discover#equine-therapy", label: "Equine therapy" },
      { href: "/discover#clinics", label: "Clinics" },
      { href: "/discover#training-programmes", label: "Training programmes" },
      { href: "/discover#shows", label: "Shows" },
    ],
  },
];

// Company links ride on the same bar as the shopping links, set quieter and to
// the right, rather than on a second row of their own.
const utilityLinks = [
  { href: "/story", label: "Our Story" },
  { href: "/contact", label: "Partner With Us" },
  { href: "/waitlist", label: "Get Updates" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  // Which menu is down. Tracked rather than left to :hover so the same markup
  // works for a keyboard, where there is no pointer to hover with.
  const [menu, setMenu] = useState<string | null>(null);

  return (
    <header className="site-header sticky top-0 z-40">
      <div className="bg-white border-b border-black/10">
        <Container size="wide">
          <div className="flex h-16 items-center gap-5 lg:gap-7">
            <Logo size="md" />

            <nav className="hidden xl:flex items-center gap-6" aria-label="Main">
              {shopLinks.map((link) => (
                <Link key={link.href} href={link.href} className="site-header__link">
                  {link.label}
                </Link>
              ))}

              <span className="h-5 w-px bg-black/10" aria-hidden="true" />

              {menus.map((item) => (
                <div
                  key={item.label}
                  className="site-header__menu"
                  onMouseEnter={() => setMenu(item.label)}
                  onMouseLeave={() => setMenu(null)}
                  onFocus={() => setMenu(item.label)}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node)) setMenu(null);
                  }}
                >
                  <Link
                    href={item.href}
                    className="site-header__link site-header__link--muted"
                    aria-expanded={menu === item.label}
                  >
                    {item.label}
                    <Caret />
                  </Link>
                  <div
                    className="site-header__panel"
                    data-open={menu === item.label ? "true" : "false"}
                    hidden={menu !== item.label}
                  >
                    <p className="site-header__panel-heading">{item.heading}</p>
                    {item.links.map((link) => (
                      <Link key={link.href} href={link.href} className="site-header__panel-link">
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className="ml-auto hidden xl:flex items-center gap-5">
              {utilityLinks.map((link) => (
                <Link key={link.href} href={link.href} className="site-header__utility">
                  {link.label}
                </Link>
              ))}
              <Link href="/contact" className="site-header__cta">
                Enquire
              </Link>
            </div>

            <button
              type="button"
              className="ml-auto xl:hidden p-2 -mr-2"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              <span className="block w-6 h-px bg-ink mb-1.5" />
              <span className="block w-6 h-px bg-ink mb-1.5" />
              <span className="block w-6 h-px bg-ink" />
            </button>
          </div>
        </Container>
      </div>

      {open && (
        <div className="xl:hidden bg-white border-b border-black/10">
          <Container size="wide">
            <nav className="py-4 flex flex-col" aria-label="Main">
              {[...shopLinks, ...menus.map((m) => ({ href: m.href, label: m.label })), ...utilityLinks].map(
                (link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="py-2.5 text-sm text-ink"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                ),
              )}
            </nav>
          </Container>
        </div>
      )}
    </header>
  );
}

function Caret() {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true" className="ml-1 inline-block">
      <path d="M2 4 L5 7 L8 4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
