#!/usr/bin/env python3
"""Match our catalogue products against tackshop.in's own storefront listings.

Since tackshop.in is the same shop whose inventory we imported, names line up
closely: their listing name is almost always a clean "base model" that our
catalogue name embeds as a leading prefix, followed by whatever variant/size/
tree-code garbage the source spreadsheet tacked on
("CWD Saddle Dynamick 2Gs X-Tend" vs. our "...-FC BL-17-2C"). So the primary
signal is a word-level prefix match, not fuzzy word-overlap scoring — per
direction, size/tree-code tails are deliberately ignored, and one matched
listing is applied to every catalogue product sharing that prefix.
"""
from __future__ import annotations
import json
import re
import sys
from collections import defaultdict

STOPWORDS = {"unisex", "the", "and", "with", "for"}


def words(name: str) -> list[str]:
    n = re.sub(r"[^a-z0-9]+", " ", name.lower())
    return [w for w in n.split() if w not in STOPWORDS]


def is_prefix(short: list[str], long: list[str]) -> bool:
    return len(short) > 0 and long[: len(short)] == short


def jaccard(a: list[str], b: list[str]) -> float:
    sa, sb = set(a), set(b)
    if not sa or not sb:
        return 0.0
    shorter, longer = (sa, sb) if len(sa) <= len(sb) else (sb, sa)
    coverage = len(shorter & longer) / len(shorter)
    extra = len(longer - shorter)
    return max(0.0, coverage - extra * 0.12)


def main():
    brand = sys.argv[1] if len(sys.argv) > 1 else None
    catalogue = json.load(open("../../src/data/catalogue.json"))
    scraped = json.load(open("tackshop_products.json"))

    listings = []
    seen = set()
    for _bucket, items in scraped.items():
        for it in items:
            if not it.get("image"):
                continue
            key = (it.get("brand") or "").lower(), it["name"].lower()
            if key in seen:
                continue
            seen.add(key)
            listings.append(it)

    our = [p for p in catalogue["products"] if (p.get("brand") or "") == brand] if brand else catalogue["products"]
    imgs_existing = json.load(open("../../src/data/product-images.json"))
    our = [p for p in our if p["slug"] not in imgs_existing]

    prefix_matches = []
    fuzzy_matches = []
    no_match = []

    for p in our:
        pw = words(p["name"])
        best_prefix = None
        best_prefix_score = 0.0
        for l in listings:
            lw = words(l["name"])
            # Either direction: our name may carry extra size/tree-code tail
            # ("...-FC BL-17-2C") past their clean model name, or their listing
            # may carry extra descriptive tail ("...Full/Black&Red") past our
            # generic catalogue name ("CWD Saddle Pad"). Either way the shared
            # prefix length relative to the shorter side is the confidence.
            if is_prefix(lw, pw):
                score = len(lw) / len(pw)
            elif is_prefix(pw, lw):
                score = len(pw) / len(lw)
            else:
                continue
            if score > best_prefix_score:
                best_prefix = l
                best_prefix_score = score
        if best_prefix:
            prefix_matches.append((p, best_prefix, best_prefix_score))
            continue

        best, best_score = None, 0.0
        for l in listings:
            s = jaccard(pw, words(l["name"]))
            if s > best_score:
                best_score, best = s, l
        if best_score >= 0.6:
            fuzzy_matches.append((p, best, best_score))
        else:
            no_match.append(p)

    print(f"scope: {brand or 'ALL'} ({len(our)} products without an image yet)")
    print(f"prefix matches: {len(prefix_matches)}")
    print(f"fuzzy matches (>=0.6, no prefix): {len(fuzzy_matches)}")
    print(f"no match: {len(no_match)}")
    print()
    print("=== PREFIX MATCHES ===")
    for p, l, cov in sorted(prefix_matches, key=lambda x: -x[2]):
        print(f"  [{cov:.2f}] {p['name']!r:60s} <- {l['name']!r} ({l['brand']})")
    print()
    print("=== FUZZY MATCHES (review carefully) ===")
    for p, l, s in sorted(fuzzy_matches, key=lambda x: -x[2]):
        print(f"  [{s:.2f}] {p['name']!r:60s} <- {l['name']!r} ({l['brand']})")
    print()
    print("=== NO MATCH ===")
    for p in no_match:
        print(f"  {p['name']!r}")

    out = {
        "prefix": [
            {"slug": p["slug"], "name": p["name"], "match_name": l["name"], "match_image": l["image"], "coverage": round(cov, 3)}
            for p, l, cov in prefix_matches
        ],
        "fuzzy": [
            {"slug": p["slug"], "name": p["name"], "match_name": l["name"], "match_image": l["image"], "score": round(s, 3)}
            for p, l, s in fuzzy_matches
        ],
    }
    fname = f"tackshop_matches_{brand.lower().replace(' ', '_') if brand else 'all'}.json"
    json.dump(out, open(fname, "w"), indent=2)
    print(f"\nwrote {fname}")


if __name__ == "__main__":
    main()
