#!/usr/bin/env python3
"""Tag riding clothes with who they are cut for, so a rider can filter by it.

Only clothes. A girth or a bridle has no gender, and most of this catalogue is
horse equipment, so the tag exists on apparel categories alone and the filter
only appears where something carries it.

Evidence is the product's own title: "Kingsland Mens Breeches Klkarlos" says
what it is. A title like "Samshield Breeches Raphael" does not, because Raphael
is a model name, and those are left untagged rather than guessed at. Of 140
clothes, 65 say and 75 do not. An untagged product simply does not appear under
a gender, which is better than appearing under the wrong one.

    python3 scripts/tag_gender.py            # dry run, prints every call
    python3 scripts/tag_gender.py --apply
    python3 scripts/tag_gender.py --untagged # list what still needs a human
"""
from __future__ import annotations

import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from migrate_to_shopify import ShopifyClient, load_env  # noqa: E402
from revalidate import ping  # noqa: E402

CLOTHES = [
    "breeches-and-leggings", "show-shirt", "show-jacket",
    "t-shirt", "hoodies", "softshell-jacket", "downvest",
]

# Checked in this order, because a child's title often also names the parent
# audience: "Aubrion Arene Riding Gloves - Child" is a child's whatever it is.
PATTERNS = [
    ("kids", r"\b(kids?|child|children|junior|youth|teens?|boys?|girls?)\b"),
    ("women", r"\b(women|womens|women's|ladies|lady|female|donna|femme)\b"),
    ("men", r"\b(men|mens|men's|male|gents|uomo|homme)\b"),
]
UNISEX = r"\b(unisex)\b"

COLLECTION_QUERY = """
query($h: String!, $cursor: String) {
  collectionByHandle(handle: $h) {
    products(first: 250, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes { id handle title tags status }
    }
  }
}
"""

TAGS_ADD = "mutation($id: ID!, $tags: [String!]!) { tagsAdd(id: $id, tags: $tags) { userErrors { message } } }"


def gender_of(title: str) -> str | None:
    t = title.lower()
    if re.search(UNISEX, t):
        return "unisex"
    for name, pattern in PATTERNS:
        if re.search(pattern, t):
            return name
    return None


def main() -> int:
    apply = "--apply" in sys.argv
    show_untagged = "--untagged" in sys.argv
    client = ShopifyClient(load_env())

    plan, untagged, already = [], [], 0
    for handle in CLOTHES:
        cursor = None
        while True:
            data = client.query(COLLECTION_QUERY, {"h": handle, "cursor": cursor})
            node = data["data"]["collectionByHandle"]
            if not node:
                print(f"  no collection {handle}")
                break
            for p in node["products"]["nodes"]:
                # The Admin API returns drafts, which the site never shows. Of
                # 247 products in these collections 107 are hidden, mostly the
                # listings absorbed by the variant merge, and tagging them
                # would make the counts here disagree with the site.
                if p["status"] != "ACTIVE":
                    continue
                if any(t.startswith("gender:") for t in p["tags"]):
                    already += 1
                    continue
                g = gender_of(p["title"])
                if g:
                    plan.append({"id": p["id"], "title": p["title"], "gender": g,
                                 "category": handle})
                else:
                    untagged.append((handle, p["title"]))
            if not node["products"]["pageInfo"]["hasNextPage"]:
                break
            cursor = node["products"]["pageInfo"]["endCursor"]

    if show_untagged:
        print(f"{len(untagged)} clothes whose title does not say who they are for.\n"
              "Add them to the catalogue by hand, or ask the brand.\n")
        for cat, title in sorted(untagged):
            print(f"  [{cat}] {title}")
        return 0

    by_gender: dict[str, int] = {}
    for p in plan:
        by_gender[p["gender"]] = by_gender.get(p["gender"], 0) + 1
    print(f"{len(plan)} to tag, {already} already tagged, {len(untagged)} with no evidence")
    print("  " + ", ".join(f"{g}: {n}" for g, n in sorted(by_gender.items())) + "\n")
    for p in sorted(plan, key=lambda x: (x["gender"], x["title"]))[:40]:
        print(f"  gender:{p['gender']:7s} {p['title'][:58]}")
    if len(plan) > 40:
        print(f"  ... and {len(plan) - 40} more")

    if not apply:
        print("\nDry run. Nothing written. Re-run with --apply, "
              "or --untagged to see what needs a human.")
        return 0

    for i, p in enumerate(plan, 1):
        r = client.query(TAGS_ADD, {"id": p["id"], "tags": [f"gender:{p['gender']}"]})
        errs = r.get("errors") or ((r.get("data") or {}).get("tagsAdd") or {}).get("userErrors")
        if errs:
            print(f"FAILED {p['title'][:40]}: {str(errs)[:120]}")
        elif i % 20 == 0 or i == len(plan):
            print(f"  tagged {i}/{len(plan)}")

    print(f"\n{len(plan)} tagged. {len(untagged)} still have none; "
          f"run --untagged to see them.")
    ping()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
