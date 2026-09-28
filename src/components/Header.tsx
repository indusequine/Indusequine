"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

// Shopping and the two other areas sit on the bar. Rider, Horse, Horse Care
// and Stable are the four tiles on Shop All, one click in, rather than a menu
// hanging off it.
const barLinks = [
  { href: "/marketplace", label: "Shop All" },
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

// Behind the menu button: the pages a rider needs least often.
const moreLinks = [
  { href: "/story", label: "Our Story" },
  { href: "/contact", label: "Partner With Us" },
  { href: "/waitlist", label: "Get Updates" },
];

export function Header() {
  // On the homepage the bar sits over the campaign photograph in white. Every
  // other page starts with white, so it takes its solid form instead.
  const overlay = usePathname() === "/";
  const [menu, setMenu] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  // Closing waits a moment, so a cursor that clips a corner on its way to an
  // item does not shut the panel under it.
  const closing = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMenu = (label: string) => {
    if (closing.current) clearTimeout(closing.current);
    setMenu(label);
  };
  const closeMenu = () => {
    if (closing.current) clearTimeout(closing.current);
    closing.current = setTimeout(() => setMenu(null), 150);
  };

  return (
    <header
      className={
        overlay
          ? "site-header site-header--overlay absolute inset-x-0 top-0 z-40"
          : "site-header sticky top-0 z-40"
      }
    >
      <div className={overlay ? "border-b border-white/20" : "bg-white border-b border-black/10"}>
        <div className="site-header__bar">
          <div className="flex items-center h-16 min-[1100px]:h-[4.5rem]">
            {/* left end: the logo and the four places to go */}
            <div className="flex items-center gap-7">
              <Logo size="md" variant={overlay ? "white" : "forest"} />

              <nav className="hidden min-[1100px]:flex items-center gap-7" aria-label="Main">
                {barLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="site-header__link">
                    {link.label}
                  </Link>
                ))}

                {menus.map((item) => (
                  <div
                    key={item.label}
                    className="site-header__menu"
                    onMouseEnter={() => openMenu(item.label)}
                    onMouseLeave={closeMenu}
                    onFocus={() => openMenu(item.label)}
                    onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node)) closeMenu();
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
                    <div className="site-header__panel" hidden={menu !== item.label}>
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
            </div>

            {/* right end: a small search and the menu button, nothing else */}
            <div className="ml-auto flex items-center gap-3">
              <form action="/search" className="site-header__search hidden sm:flex" role="search">
                <SearchGlyph />
                <input type="search" name="q" placeholder="Search" aria-label="Search the site" />
              </form>

              <div
                className="site-header__menu"
                onMouseEnter={() => openMenu("more")}
                onMouseLeave={closeMenu}
                onFocus={() => openMenu("more")}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node)) closeMenu();
                }}
              >
                <button
                  type="button"
                  className="site-header__more"
                  aria-label={open ? "Close menu" : "Open menu"}
                  aria-expanded={menu === "more" || open}
                  onClick={() => {
                    // Wide screens open the small panel; narrow ones open the
                    // full menu underneath, which carries everything.
                    if (window.matchMedia("(min-width: 1100px)").matches) {
                      setMenu(menu === "more" ? null : "more");
                    } else {
                      setOpen(!open);
                    }
                  }}
                >
                  <span />
                  <span />
                  <span />
                </button>
                <div
                  className="site-header__panel site-header__panel--right hidden min-[1100px]:block"
                  hidden={menu !== "more"}
                >
                  <p className="site-header__panel-heading">Indusequine</p>
                  {moreLinks.map((link) => (
                    <Link key={link.href} href={link.href} className="site-header__panel-link">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {open && (
        <div className="min-[1100px]:hidden bg-white border-b border-black/10">
          <div className="site-header__bar">
            <form action="/search" className="site-header__search my-4 w-full" role="search">
              <SearchGlyph />
              <input
                type="search"
                name="q"
                placeholder="Search the site"
                aria-label="Search the site"
              />
            </form>
            <nav className="pb-4 flex flex-col" aria-label="Main">
              {[
                ...barLinks,
                ...menus.map((m) => ({ href: m.href, label: m.label })),
                ...moreLinks,
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="py-2.5 text-sm text-ink"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
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

function SearchGlyph() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20 L16.2 16.2" strokeLinecap="round" />
    </svg>
  );
}
