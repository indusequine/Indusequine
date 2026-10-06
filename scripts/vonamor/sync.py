#!/usr/bin/env python3
"""Sync Vonamor Equestrian (vonamor.in) into Shopify.

They run a Shopify store, so the catalogue and the live stock come from their
public products.json rather than from parsing pages. Re-running picks up price
changes, stock, and anything they add.

Their range is nine products: breeches in four colours for men and four for
women, and a fly sheet. They already list each colour as its own product,
which is how this catalogue wants them, so nothing is split or merged.

Their descriptions are kept, unlike EQUESTRIANS'. Theirs are factual - fabric
percentages, "runs true to size", four pockets, full seat silicone grip - and
rewriting that would lose information rather than puffery. Only the fly
sheet's closing line goes, which is filler.

They tag their own products Men and Women, so the gender filter works on these
without anything being inferred.

    python3 scripts/vonamor/sync.py            # dry run, prints the plan
    python3 scripts/vonamor/sync.py --apply
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))

from feeds import FeedUnavailable, read_json  # noqa: E402
from migrate_to_shopify import ShopifyClient, load_env  # noqa: E402
from revalidate import ping  # noqa: E402
from snapshot import take  # noqa: E402

FEED = "https://vonamor.in/products.json?limit=250"
VENDOR = "Vonamor"          # their site is "Vonamor Equestrian"; the feed's
                            # "vonamorstore" is just their Shopify handle
SUPPLIER_TAG = "supplier:vonamor"
OOS_TAG = "sync:out-of-stock"
STATE = os.path.join(HERE, "sync_state.json")

# Their product_type -> our category. Only two, written out rather than mapped
# by guesswork.
CATEGORIES = {
    "Breeches": "breeches-and-leggings",
    "FlySheet": "fly-sheet",
}

# Their own Men/Women tags, which the gender filter reads.
GENDER = {"men": "men", "women": "women"}

# Marketing with no information in it. Everything else they write is kept.
DROP_LINES = [
    "Give your horse the gift of a peaceful, itch-free grazing season",
]

PRODUCT_SET = """
mutation($input: ProductSetInput!, $identifier: ProductSetIdentifiers!) {
  productSet(input: $input, synchronous: true, identifier: $identifier) {
    product { id handle }
    userErrors { field message }
  }
}
"""

PUBLISH = """
mutation($id: ID!, $input: [PublicationInput!]!) {
  publishablePublish(id: $id, input: $input) { userErrors { message } }
}
"""

ADD_TO_COLLECTION = """
mutation($id: ID!, $productIds: [ID!]!) {
  collectionAddProductsV2(id: $id, productIds: $productIds) { userErrors { message } }
}
"""

COLLECTIONS_QUERY = """
query($cursor: String) {
  collections(first: 250, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    nodes { id handle }
  }
}
"""

EXISTING_QUERY = """
query($q: String!) {
  products(first: 20, query: $q) { nodes { id handle title tags } }
}
"""


def slug(s: str) -> str:
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", s.lower())).strip("-")


def code_for(handle: str) -> str:
    """A stable supplier code, since they carry no SKUs at all.

    Built from the words that distinguish one of their products from another:
    "men-s-navy-blue-breeches" is VA-M-NAVYBLUE, not fourteen run-together
    characters nobody can read back over the phone.
    """
    words = [w for w in slug(handle).split("-") if w and w != "s"]
    who = ""
    if words and words[0] in ("men", "women"):
        who = words.pop(0)[0].upper() + "-"
    rest = "".join(w for w in words if w != "breeches").upper()[:10]
    return f"VA-{who}{rest or 'ITEM'}"


def description(html: str) -> str:
    for line in DROP_LINES:
        html = re.sub(rf"<[^>]*>\s*{re.escape(line)}[^<]*</[^>]*>", "", html)
        html = html.replace(line, "")
    # a heading left with nothing under it reads worse than no heading
    html = re.sub(r"<p>\s*(<[^>]+>)*\s*The Vonamor Advantage:\s*(</[^>]+>)*\s*</p>\s*$", "", html)
    return html.strip()


def fetch_feed() -> list[dict]:
    return read_json(FEED, "Vonamor")["products"]


def plan_for(p: dict) -> dict | None:
    category = CATEGORIES.get(p.get("product_type"))
    if not category:
        return None

    option_names = [o["name"] for o in p.get("options", []) if o["values"] != ["Default Title"]]
    code = code_for(p["handle"])
    variants = []
    for v in p["variants"]:
        chosen = [x for x in (v.get("option1"), v.get("option2"), v.get("option3"))
                  if x and x != "Default Title"]
        variants.append({
            "sku": f"{code}-{slug(chosen[0]).upper()}" if chosen else code,
            "price": v["price"],
            "optionValues": [{"optionName": option_names[i], "name": val}
                             for i, val in enumerate(chosen)],
        })

    tags = [f"category:{category}", SUPPLIER_TAG, f"supplier-code:{code}"]
    for t in p.get("tags", []):
        g = GENDER.get(t.strip().lower())
        if g:
            tags.append(f"gender:{g}")
    if not any(v["available"] for v in p["variants"]):
        tags.append(OOS_TAG)

    return {
        "handle": f"vonamor-{p['handle']}",
        "title": f"Vonamor {p['title']}".replace("’", "'"),
        "category": category,
        "description": description(p.get("body_html") or ""),
        "tags": tags,
        "in_stock": any(v["available"] for v in p["variants"]),
        "options": [
            {"name": n, "values": [{"name": val} for val in dict.fromkeys(
                o["name"] for v in variants for o in v["optionValues"] if o["optionName"] == n)]}
            for n in option_names
        ],
        "variants": variants,
        "images": [i["src"] for i in p.get("images", [])],
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="write to Shopify")
    args = ap.parse_args()

    try:
        feed = fetch_feed()
    except FeedUnavailable as e:
        # Their site, not our catalogue. Say so rather than dying on a
        # traceback that GitHub reports only as "exit code 1".
        print(f"{e}\n  {e.url}\n\nNothing was written. Shopify is unchanged.")
        return 2
    plans = [q for q in (plan_for(p) for p in feed) if q]
    skipped = [p["title"] for p in feed if not CATEGORIES.get(p.get("product_type"))]

    print(f"Vonamor: {len(feed)} products on their site, {len(plans)} mapped\n")
    for p in plans:
        gender = next((t.split(":")[1] for t in p["tags"] if t.startswith("gender:")), "-")
        print(f"  {p['title'][:46]:46s} {p['category']:22s} "
              f"{len(p['variants'])}v {len(p['images'])}img  {gender}"
              + ("" if p["in_stock"] else "  OUT OF STOCK"))
    for t in skipped:
        print(f"  SKIPPED (no category mapped): {t}")
    if skipped:
        print("\n  Vonamor have added something this does not know where to file.")
        print("  Add its product_type to CATEGORIES at the top of this file.")

    if not args.apply:
        print("\nDry run. Nothing written. Re-run with --apply.")
        return 1 if skipped else 0

    client = ShopifyClient(load_env())
    take(client, handles=[p["handle"] for p in plans], label="vonamor-sync")

    collections = {}
    cursor = None
    while True:
        page = client.query(COLLECTIONS_QUERY, {"cursor": cursor})["data"]["collections"]
        collections.update({n["handle"]: n["id"] for n in page["nodes"]})
        if not page["pageInfo"]["hasNextPage"]:
            break
        cursor = page["pageInfo"]["endCursor"]

    done = []
    for i, p in enumerate(plans, 1):
        found = client.query(EXISTING_QUERY, {"q": f"handle:{p['handle']}"})["data"]["products"]["nodes"]
        holder = next((n for n in found if n["handle"] == p["handle"]), None)
        if holder and SUPPLIER_TAG not in holder["tags"]:
            print(f"[{i}/{len(plans)}] REFUSED {p['handle']}: handle held by "
                  f"'{holder['title'][:40]}', which is not ours")
            continue

        res = client.query(PRODUCT_SET, {
            "identifier": {"handle": p["handle"]},
            "input": {
                "handle": p["handle"], "title": p["title"], "vendor": VENDOR,
                "status": "ACTIVE", "tags": p["tags"],
                "descriptionHtml": p["description"],
                "productOptions": p["options"], "variants": p["variants"],
                "files": [{"originalSource": u, "contentType": "IMAGE", "alt": p["title"]}
                          for u in p["images"]],
            },
        })
        payload = (res.get("data") or {}).get("productSet") or {}
        errs = res.get("errors") or payload.get("userErrors")
        if errs:
            print(f"[{i}/{len(plans)}] FAILED {p['handle']}: {str(errs)[:180]}")
            continue

        gid = payload["product"]["id"]
        client.query(PUBLISH, {"id": gid,
                               "input": [{"publicationId": client.headless_publication_id()}]})
        if p["category"] in collections:
            client.query(ADD_TO_COLLECTION, {"id": collections[p["category"]], "productIds": [gid]})
        else:
            print(f"    warning: no collection {p['category']}, not filed")

        done.append({"handle": p["handle"], "id": gid})
        print(f"[{i}/{len(plans)}] {p['handle']}: {len(p['variants'])} variants")

    with open(STATE, "w") as f:
        json.dump({"synced": done}, f, indent=1)
    print(f"\n{len(done)} synced.")
    ping()
    # Fail the run so the scheduled job emails rather than skipping in silence.
    # Everything mappable has already been written by this point.
    return 1 if skipped else 0


if __name__ == "__main__":
    raise SystemExit(main())
