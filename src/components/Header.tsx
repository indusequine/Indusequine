"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

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
  // On the homepage the bar sits over the campaign photograph in white, the way
  // the design has it. Everywhere else the page starts with white, so it takes
  // its solid form instead.
  const overlay = usePathname() === "/";
  // Which menu is down. Tracked rather than left to :hover so the same markup
  // works for a keyboard, where there is no pointer to hover with.
  const [menu, setMenu] = useState<string | null>(null);
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
        <div className={overlay ? "site-header__bar" : "site-header__bar site-header__bar--tight"}>
          <div className={`flex items-center gap-5 lg:gap-7 h-16 ${overlay ? "min-[1400px]:h-[6.375rem]" : ""}`}>
            <Logo size="md" variant={overlay ? "white" : "forest"} />

            <nav className="hidden min-[1400px]:flex items-center gap-6" aria-label="Main">
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

            <div className="ml-auto hidden min-[1400px]:flex items-center gap-5">
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
              className="ml-auto min-[1400px]:hidden p-2 -mr-2"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              <span className={`block w-6 h-px mb-1.5 ${overlay ? "bg-white" : "bg-ink"}`} />
              <span className={`block w-6 h-px mb-1.5 ${overlay ? "bg-white" : "bg-ink"}`} />
              <span className={`block w-6 h-px ${overlay ? "bg-white" : "bg-ink"}`} />
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="min-[1400px]:hidden bg-white border-b border-black/10">
          <div className="w-full px-6 md:px-10">
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
