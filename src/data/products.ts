export type CategorySlug =
  | "saddles-tack"
  | "bridles-halters"
  | "rugs-blankets"
  | "rider-apparel"
  | "grooming-accessories";

export type Category = {
  slug: CategorySlug;
  eyebrow: string;
  title: string;
  description: string;
  tileClassName: string;
};

export type Product = {
  slug: string;
  category: CategorySlug;
  name: string;
  shortDescription: string;
  description: string;
  specs: { label: string; value: string }[];
  priceLabel: string;
  origin?: string;
  isPlaceholder: true;
};

export const categories: Category[] = [
  {
    slug: "saddles-tack",
    eyebrow: "Saddles & Tack",
    title: "Saddles and tack, built to last a season.",
    description:
      "Hand-cut leather saddles and everyday tack from saddlers who've worked one craft for generations.",
    tileClassName: "bg-forest-deep text-cream-soft",
  },
  {
    slug: "bridles-halters",
    eyebrow: "Bridles & Halters",
    title: "Bridles and halters, for the ring and the yard.",
    description:
      "Fine leatherwork for the show ring, and rope halters built for the daily handling that keeps a yard running.",
    tileClassName: "bg-oxblood text-cream-soft",
  },
  {
    slug: "rugs-blankets",
    eyebrow: "Rugs & Blankets",
    title: "Rugs and blankets, suited to our climate.",
    description:
      "Turnout and cooler rugs cut for Indian conditions — from hill-station winters to the walk back after a wash.",
    tileClassName: "bg-brass-deep text-cream-soft",
  },
  {
    slug: "rider-apparel",
    eyebrow: "Rider Apparel",
    title: "What you wear, in and out of the saddle.",
    description:
      "Technical breeches and show apparel built for long days riding and the occasional long day in the ring.",
    tileClassName: "bg-forest-soft text-cream-soft",
  },
  {
    slug: "grooming-accessories",
    eyebrow: "Grooming & Accessories",
    title: "The kit that makes a good groom faster.",
    description:
      "Brush sets and grooming bags built to live in the tack room for years, not seasons.",
    tileClassName: "bg-oxblood-deep text-cream-soft",
  },
];

export const products: Product[] = [
  {
    slug: "full-grain-leather-dressage-saddle",
    category: "saddles-tack",
    name: "Full-Grain Leather Dressage Saddle",
    shortDescription: "Hand-cut leather, deep seat, wool-flocked panels.",
    description:
      "A traditional dressage saddle in full-grain leather, built by saddlers in one of India's oldest tack-making regions. Wool-flocked panels, an adjustable tree, and a deep, close-contact seat.",
    specs: [
      { label: "Material", value: "Full-grain leather" },
      { label: "Seat sizes", value: "16.5\" – 18\"" },
      { label: "Tree", value: "Adjustable, wool-flocked" },
    ],
    priceLabel: "Price on request",
    origin: "Kanpur, Uttar Pradesh",
    isPlaceholder: true,
  },
  {
    slug: "general-purpose-leather-saddle",
    category: "saddles-tack",
    name: "General Purpose Leather Saddle",
    shortDescription: "Balanced flap, forward seat, built for everyday schooling.",
    description:
      "A versatile general-purpose saddle suited to flatwork and fences alike. A moderate knee block, a balanced panel, and a seat built for long hours in the tack.",
    specs: [
      { label: "Material", value: "Full-grain leather" },
      { label: "Seat sizes", value: "16\" – 18\"" },
      { label: "Panel", value: "Wool-flocked, medium" },
    ],
    priceLabel: "Price on request",
    origin: "Kanpur, Uttar Pradesh",
    isPlaceholder: true,
  },
  {
    slug: "raised-leather-show-bridle",
    category: "bridles-halters",
    name: "Raised Leather Show Bridle",
    shortDescription: "Raised browband and noseband, brass buckles, fine stitching.",
    description:
      "A raised leather bridle finished for the show ring — fine edge-stitching, a raised browband and noseband, and solid brass hardware throughout.",
    specs: [
      { label: "Material", value: "Leather, raised construction" },
      { label: "Hardware", value: "Solid brass" },
      { label: "Sizes", value: "Cob, Full, Warmblood" },
    ],
    priceLabel: "Price on request",
    origin: "Kanpur, Uttar Pradesh",
    isPlaceholder: true,
  },
  {
    slug: "adjustable-rope-halter",
    category: "bridles-halters",
    name: "Adjustable Rope Halter",
    shortDescription: "Knotted rope halter, one size, adjustable poll and nose.",
    description:
      "A durable knotted rope halter for everyday handling and groundwork. Soft, marine-grade rope with an adjustable poll and nose for a secure, custom fit.",
    specs: [
      { label: "Material", value: "Marine-grade rope" },
      { label: "Fit", value: "Adjustable, one size" },
      { label: "Use", value: "Groundwork, handling, travel" },
    ],
    priceLabel: "Price on request",
    origin: "Kanpur, Uttar Pradesh",
    isPlaceholder: true,
  },
  {
    slug: "waterproof-turnout-rug",
    category: "rugs-blankets",
    name: "Waterproof Turnout Rug",
    shortDescription: "1200D outer, 200g fill, cross-surcingles.",
    description:
      "A heavyweight turnout rug built for Indian winters at altitude — a tough 1200-denier outer shell, 200g polyfill, and cross-surcingles for a secure, rub-free fit.",
    specs: [
      { label: "Outer", value: "1200D ripstop, waterproof" },
      { label: "Fill", value: "200g" },
      { label: "Closures", value: "Cross-surcingle, leg straps" },
    ],
    priceLabel: "Price on request",
    origin: "Punjab, India",
    isPlaceholder: true,
  },
  {
    slug: "fleece-cooler-rug",
    category: "rugs-blankets",
    name: "Fleece Cooler Rug",
    shortDescription: "Breathable fleece, wicks sweat after work or a wash.",
    description:
      "A lightweight fleece cooler for the walk back to the stable — breathable, quick-drying, and gentle enough for a freshly bathed coat.",
    specs: [
      { label: "Material", value: "Polyester fleece" },
      { label: "Fit", value: "Contoured, sizes S – XL" },
      { label: "Use", value: "Post-exercise, post-wash" },
    ],
    priceLabel: "Price on request",
    origin: "Punjab, India",
    isPlaceholder: true,
  },
  {
    slug: "technical-riding-breeches",
    category: "rider-apparel",
    name: "Technical Riding Breeches",
    shortDescription: "Four-way stretch, silicone grip, flat-seam construction.",
    description:
      "Technical breeches built for long days in the saddle — four-way stretch fabric, a silicone knee grip, and flat-seam construction to prevent chafing.",
    specs: [
      { label: "Fabric", value: "Four-way stretch technical knit" },
      { label: "Grip", value: "Silicone knee patch" },
      { label: "Sizes", value: "24 – 34" },
    ],
    priceLabel: "Price on request",
    origin: "Kanpur, Uttar Pradesh",
    isPlaceholder: true,
  },
  {
    slug: "competition-show-shirt",
    category: "rider-apparel",
    name: "Competition Show Shirt",
    shortDescription: "Moisture-wicking, stand collar, ring-ready white.",
    description:
      "A crisp, moisture-wicking show shirt with a traditional stand collar — built to stay sharp through a long class in the ring.",
    specs: [
      { label: "Fabric", value: "Moisture-wicking technical weave" },
      { label: "Collar", value: "Stand, removable stock loop" },
      { label: "Sizes", value: "XS – XXL" },
    ],
    priceLabel: "Price on request",
    origin: "Kanpur, Uttar Pradesh",
    isPlaceholder: true,
  },
  {
    slug: "complete-body-brush-set",
    category: "grooming-accessories",
    name: "Complete Body Brush Set",
    shortDescription: "Five-piece set — dandy, body, face brush, curry, hoof pick.",
    description:
      "A complete five-piece grooming set covering every stage of a full groom, from dandy brush through to a soft-bristle face brush — packed in a canvas roll.",
    specs: [
      { label: "Includes", value: "Dandy brush, body brush, face brush, curry comb, hoof pick" },
      { label: "Case", value: "Canvas roll" },
    ],
    priceLabel: "Price on request",
    origin: "Kanpur, Uttar Pradesh",
    isPlaceholder: true,
  },
  {
    slug: "leather-grooming-kit-bag",
    category: "grooming-accessories",
    name: "Leather Grooming Kit Bag",
    shortDescription: "Full-grain leather tote, brass fittings, room for a full kit.",
    description:
      "A full-grain leather grooming tote with brass fittings and enough room for a complete kit — built to live in the tack room for years, not seasons.",
    specs: [
      { label: "Material", value: "Full-grain leather" },
      { label: "Hardware", value: "Solid brass" },
      { label: "Dimensions", value: "40cm × 25cm × 20cm" },
    ],
    priceLabel: "Price on request",
    origin: "Kanpur, Uttar Pradesh",
    isPlaceholder: true,
  },
];

export function getCategory(slug: CategorySlug): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getProductsByCategory(slug: CategorySlug): Product[] {
  return products.filter((p) => p.category === slug);
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
