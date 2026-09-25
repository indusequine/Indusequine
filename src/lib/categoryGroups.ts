export type CategoryGroup = {
  slug: string;
  name: string;
  tagline: string;
  image: string;
  categorySlugs: string[];
};

export const categoryGroups: CategoryGroup[] = [
  {
    slug: "rider",
    name: "Rider",
    tagline: "Apparel, protective gear, and everything you wear.",
    image: "/images/rider-walking.jpg",
    categorySlugs: [
      "bags",
      "belts",
      "bracelet",
      "boots-and-chaps",
      "breeches-and-leggings",
      "cap",
      "communication",
      "cufflinks",
      "downvest",
      "gloves",
      "hairnet",
      "helmet",
      "helmet-accessories",
      "hoodies",
      "key-chain",
      "necklace-and-chain",
      "protective-vests",
      "protective-vests-accessories",
      "ring",
      "show-jacket",
      "show-shirt",
      "socks-and-ties",
      "softshell-jacket",
      "spurs-and-spur-straps",
      "sunglasses",
      "t-shirt",
      "whips",
    ],
  },
  {
    slug: "horse",
    name: "Horse",
    tagline: "Tack, rugs, and everything your horse wears.",
    image: "/images/horse-portrait.jpg",
    categorySlugs: [
      "bell-boots",
      "bits-and-connectors",
      "breastplate-and-martingale",
      "bridle-and-reins",
      "ear-bonnet",
      "fetlock-boots",
      "fly-mask",
      "fly-sheet",
      "girth",
      "halter-and-lead-rope",
      "horse-shoe",
      "racks",
      "reins",
      "rugs-and-blankets",
      "saddle",
      "saddle-pads",
      "stable",
      "stirrup-and-stirrup-leathers",
      "tack",
      "tendon-boots",
      "traveling-boots-and-tail-guard",
      "training-aids",
      "wraps-and-bandages",
    ],
  },
  {
    slug: "horse-care",
    name: "Horse Care",
    tagline: "Grooming, supplements, and health essentials.",
    image: "/images/horse-arena.jpg",
    categorySlugs: [
      "chew-toy",
      "grooming",
      "herbal-spray",
      "horse-care",
      "leather-care",
      "recovery",
      "salt-lick",
      "shampoo-and-conditioner",
      "supplements",
      "treats",
    ],
  },
];

// Small tail — real categories, but too few products to warrant a big
// photo tile of their own. Shown as a text-link row instead.
// The three that belong to no group: a dog rug is not rider, horse or horse
// care, and gifts and toys are bought for people rather than for riding.
export const otherCategorySlugs: string[] = ["dog", "gifts", "toys"];

export function getGroupForCategorySlug(slug: string): CategoryGroup | undefined {
  return categoryGroups.find((g) => g.categorySlugs.includes(slug));
}

export function getGroupBySlug(slug: string): CategoryGroup | undefined {
  return categoryGroups.find((g) => g.slug === slug);
}
