import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://indusequine.com"),
  title: {
    default: "Indusequine — India's First Equestrian Marketplace",
    template: "%s · Indusequine",
  },
  description:
    "India's first dedicated equestrian marketplace. Premium products for riders, horses and stables. Trusted coaches, vets and farriers. Launching soon.",
  keywords: [
    "equestrian India",
    "horse riding equipment India",
    "riding gear India",
    "horse tack India",
    "saddlery India",
    "equestrian marketplace",
    "stable supplies India",
    "horse vet India",
    "riding coach India",
    "farrier India",
  ],
  openGraph: {
    title: "Indusequine — India's First Equestrian Marketplace",
    description:
      "A curated home for riders, horses, stables, and the professionals who serve them. Organizing India's equestrian community for the first time.",
    type: "website",
    locale: "en_IN",
    siteName: "Indusequine",
  },
  twitter: {
    card: "summary_large_image",
    title: "Indusequine — India's First Equestrian Marketplace",
    description:
      "A curated home for riders, horses, stables, and the professionals who serve them.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream-soft text-ink">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
