#!/usr/bin/env python3
"""Fuzzy-match our Samshield catalogue products against scraped site listings.

Deliberately conservative: rejects matches where a product/component word
(liner, cover, spare, etc.) appears on only one side, and penalizes matches
where the site listing's bare name doesn't account for most of the words
in our (usually more descriptive) product name.
"""
from __future__ import annotations
import json
import re

STOPWORDS = {"samshield", "women", "men", "unisex", "the", "and", "with", "for"}
COMPONENT_WORDS = {
    "liner", "cover", "spare", "refill", "insert", "cushion", "strap",
    "buckle", "lace", "visor", "chinstrap", "pad",
}
MATCH_THRESHOLD = 0.60


def normalize_words(name: str) -> set[str]:
    n = name.lower()
    n = re.sub(r"[^a-z0-9\s]", " ", n)
    return {w for w in n.split() if w not in STOPWORDS}


def score(a: str, b: str) -> float:
    wa, wb = normalize_words(a), normalize_words(b)
    if not wa or not wb:
        return 0.0
    if (wa & COMPONENT_WORDS) != (wb & COMPONENT_WORDS):
        return 0.0
    shorter, longer = (wa, wb) if len(wa) <= len(wb) else (wb, wa)
    coverage = len(shorter & longer) / len(shorter)
    extra_in_longer = len(longer - shorter)
    return max(0.0, coverage - extra_in_longer * 0.12)


def main():
    catalogue = json.load(open("/Users/mith1x/Projects/indusequine/src/data/catalogue.json"))
    scraped = json.load(open("samshield_products.json"))

    listings = []
    seen_ids = set()
    for _bucket, items in scraped.items():
        for it in items:
            if it["id_product"] in seen_ids:
                continue
            seen_ids.add(it["id_product"])
            listings.append(it)

    our_products = [p for p in catalogue["products"] if p.get("brand") == "Samshield"]

    matches = []
    for p in our_products:
        best, best_score = None, 0.0
        for listing in listings:
            s = score(p["name"], listing["name"])
            if s > best_score:
                best_score, best = s, listing
        matches.append({"product": p, "best": best, "score": best_score})

    matches.sort(key=lambda m: -m["score"])
    trustworthy = [m for m in matches if m["score"] >= MATCH_THRESHOLD]
    rejected = [m for m in matches if m["score"] < MATCH_THRESHOLD]

    print(f"Total our products: {len(our_products)}")
    print(f"Trustworthy matches (>= {MATCH_THRESHOLD}): {len(trustworthy)}")
    print(f"No trustworthy match: {len(rejected)}")
    print()
    print("=== ALL trustworthy matches (full review) ===")
    for m in trustworthy:
        print(f"  [{m['score']:.2f}] {m['product']['name']!r} <- {m['best']['name']!r}")

    out = [
        {
            "slug": m["product"]["slug"],
            "name": m["product"]["name"],
            "match_name": m["best"]["name"],
            "match_image": m["best"]["image"],
            "score": round(m["score"], 3),
        }
        for m in trustworthy
    ]
    with open("samshield_trustworthy_matches.json", "w") as f:
        json.dump(out, f, indent=2)
    print(f"\nwrote {len(out)} trustworthy matches to samshield_trustworthy_matches.json")


if __name__ == "__main__":
    main()
