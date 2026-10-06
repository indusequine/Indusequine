"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The bar along the bottom of a phone, the way Nike and Nykaa carry one.
 *
 * Five destinations that all exist. There is no Bag tab, because there is no
 * basket yet and a tab that opens nothing is worse than no tab; it goes in
 * when checkout does. Services takes the fifth place instead, which is a real
 * page and the part of this marketplace nobody else has.
 *
 * Hidden from md up, so the desktop header is untouched.
 */
const TABS = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/marketplace", label: "Shop", icon: "grid" },
  { href: "/marketplace/brands", label: "Brands", icon: "tag" },
  { href: "/search", label: "Search", icon: "search" },
  { href: "/services", label: "Services", icon: "person" },
] as const;

function Icon({ name }: { name: (typeof TABS)[number]["icon"] }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M3.5 10.5 12 3.5l8.5 7" />
          <path d="M5.5 9.5v10h13v-10" />
        </svg>
      );
    case "grid":
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="7" height="7" />
          <rect x="13.5" y="3.5" width="7" height="7" />
          <rect x="3.5" y="13.5" width="7" height="7" />
          <rect x="13.5" y="13.5" width="7" height="7" />
        </svg>
      );
    case "tag":
      return (
        <svg {...common}>
          <path d="M3.5 11.2V4.5a1 1 0 0 1 1-1h6.7a1 1 0 0 1 .7.3l8 8a1 1 0 0 1 0 1.4l-6.7 6.7a1 1 0 0 1-1.4 0l-8-8a1 1 0 0 1-.3-.7Z" />
          <circle cx="7.9" cy="7.9" r="1.4" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="10.8" cy="10.8" r="6.3" />
          <path d="m15.4 15.4 4.1 4.1" />
        </svg>
      );
    case "person":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.6" />
          <path d="M4.8 20c0-3.6 3.2-5.8 7.2-5.8s7.2 2.2 7.2 5.8" />
        </svg>
      );
  }
}

function isCurrent(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  // /marketplace must not light up for /marketplace/brands, which has its own tab
  if (href === "/marketplace") {
    return pathname === "/marketplace" || pathname.startsWith("/marketplace/category")
      || pathname.startsWith("/marketplace/group") || pathname.startsWith("/marketplace/product");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileTabBar() {
  const pathname = usePathname() ?? "/";

  return (
    <nav className="mobile-tabs md:hidden" aria-label="Main">
      {TABS.map((tab) => {
        const current = isCurrent(pathname, tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="mobile-tabs__tab"
            aria-current={current ? "page" : undefined}
          >
            <Icon name={tab.icon} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
