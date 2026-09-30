#!/usr/bin/env python3
"""Sync EQUESTRIANS (equestrians.in) into Shopify.

They run a Shopify store, so their catalogue and their live stock come from
the public products.json rather than from parsing pages. That means this stays
correct when they restyle their site, and it picks up anything they add without
being told.

Their range is three products: an airbag vest, the CO2 cartridges it runs on,
and safety stirrups. All under their own name.

Descriptions are ours, not theirs. Their copy leads with "India's first
equestrian airbag vest" and "India's first ultra-safety stirrups", and
repeating a superlative we cannot check would make it our claim. The specs are
kept; the boasting is not. Their CO2 cartridge has no description at all on
their site, so ours is written from what the product plainly is.

Stock is per variant on their side and per product on ours, so a product is
marked out of stock only when every variant is. Out of stock is shown and said,
never hidden.

    python3 scripts/equestrians/sync.py            # dry run, prints the plan
    python3 scripts/equestrians/sync.py --apply
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))

from migrate_to_shopify import ShopifyClient, load_env  # noqa: E402
from revalidate import ping  # noqa: E402

FEED = "https://equestrians.in/products.json?limit=250"
VENDOR = "EQUESTRIANS"
SUPPLIER_TAG = "supplier:equestrians"
OOS_TAG = "sync:out-of-stock"
STATE = os.path.join(HERE, "sync_state.json")

# Their handle -> what it is on our side. Written out rather than guessed,
# because three products do not need a mapping table that can be wrong.
PRODUCTS = {
    "airbag-equestrians-vest": {
        "handle": "equestrians-airbag-vest",
        "title": "EQUESTRIANS Airbag Vest",
        "category": "protective-vests",
        "code": "EQ-VEST",
        "description": (
            "<p>An airbag vest worn over your riding clothes. In a fall the system "
            "fires and an air cushion inflates around the spine, chest, neck and "
            "torso, reaching full inflation in 98 milliseconds.</p>\n"
            "<p>Built for riding in heat: breathable through the body, light "
            "enough for a long session, and cut from a stretch fabric that moves "
            "with you rather than holding you straight. Worn for training, "
            "competition and everyday riding.</p>\n"
            "<p>Comes with one cartridge fitted. Replacements are sold separately.</p>"
        ),
    },
    "ultra-safety-stirrups": {
        "handle": "equestrians-ultra-safety-stirrups",
        "title": "EQUESTRIANS Ultra Safety Stirrups",
        "category": "stirrup-and-stirrup-leathers",
        "code": "EQ-STIRRUP",
        "description": (
            "<p>Safety stirrups with a pressure-activated release. The catch sits "
            "between the lower end of the outer pivoting arm and the footplate, and "
            "in a fall the arm opens so the foot cannot be dragged, then resets "
            "afterwards. It is set to release only under the load a fall puts "
            "through it, so ordinary riding does not trip it.</p>\n"
            "<p>The bow is high-tensile aluminium, the opening arm and pad are "
            "heavy-duty polyamide, and the tread is stainless steel drilled with "
            "horizontal holes for grip in the wet. The steel does not corrode.</p>"
        ),
    },
    "untitled-may29_15-32-53": {
        "handle": "equestrians-co2-cartridge",
        "title": "EQUESTRIANS CO2 Cartridge",
        "category": "protective-vests-accessories",
        "code": "EQ-CO2",
        "description": (
            "<p>A replacement CO2 cartridge for the EQUESTRIANS airbag vest. A new "
            "vest arrives with one fitted; this is what you put in after the vest "
            "has gone off, and what you keep spare.</p>\n"
            "<p>Available in 50cc and 60cc. Check which your vest takes before "
            "ordering.</p>"
        ),
    },
}

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


def fetch_feed() -> list[dict]:
    req = urllib.request.Request(FEED, headers={"User-Agent": "Indusequine catalogue sync"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())["products"]


def plan_for(theirs: dict, ours: dict) -> dict:
    """One product of theirs as one product of ours."""
    option_names = [o["name"] for o in theirs.get("options", []) if o["values"] != ["Default Title"]]
    variants = []
    for v in theirs["variants"]:
        values = [v.get("option1"), v.get("option2"), v.get("option3")]
        chosen = [x for x in values if x and x != "Default Title"]
        variants.append({
            # They carry no SKUs at all, so ours are built from the product code
            # and the variant, which is what an enquiry email has to quote.
            "sku": f"{ours['code']}-{slug(chosen[0])}" if chosen else ours["code"],
            "price": v["price"],
            "optionValues": [
                {"optionName": option_names[i], "name": val}
                for i, val in enumerate(chosen)
            ],
        })

    in_stock = any(v["available"] for v in theirs["variants"])
    tags = [f"category:{ours['category']}", SUPPLIER_TAG, f"supplier-code:{ours['code']}"]
    if not in_stock:
        tags.append(OOS_TAG)

    return {
        "handle": ours["handle"],
        "title": ours["title"],
        "category": ours["category"],
        "description": ours["description"],
        "tags": tags,
        "in_stock": in_stock,
        "options": [
            {"name": name, "values": [{"name": val} for val in
                                      dict.fromkeys(o["name"] for v in variants
                                                    for o in v["optionValues"]
                                                    if o["optionName"] == name)]}
            for name in option_names
        ],
        "variants": variants,
        "images": [img["src"] for img in theirs.get("images", [])],
        "their_handle": theirs["handle"],
    }


def slug(s: str) -> str:
    return "".join(c if c.isalnum() else "-" for c in s.lower()).strip("-")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="write to Shopify")
    args = ap.parse_args()

    feed = {p["handle"]: p for p in fetch_feed()}
    missing = [h for h in PRODUCTS if h not in feed]
    extra = [h for h in feed if h not in PRODUCTS]

    plans = [plan_for(feed[h], PRODUCTS[h]) for h in PRODUCTS if h in feed]

    print(f"EQUESTRIANS: {len(feed)} products on their site, {len(plans)} mapped\n")
    for p in plans:
        stock = "in stock" if p["in_stock"] else "OUT OF STOCK, shown and marked"
        print(f"  {p['title']}")
        print(f"    {p['handle']}  ->  category:{p['category']}")
        print(f"    {len(p['variants'])} variants, {len(p['images'])} images, {stock}")
    for h in missing:
        print(f"  GONE from their site: {h} (left alone here)")
    for h in extra:
        print(f"  NEW on their site, not mapped: {h} — add it to PRODUCTS above")

    if not args.apply:
        print("\nDry run. Nothing written. Re-run with --apply.")
        return 0

    client = ShopifyClient(load_env())

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
        # Refuse a handle that belongs to somebody else. productSet upserts by
        # handle and replaces the variant list, so writing over another
        # supplier's product would destroy it silently.
        found = client.query(EXISTING_QUERY, {"q": f"handle:{p['handle']}"})["data"]["products"]["nodes"]
        holder = next((n for n in found if n["handle"] == p["handle"]), None)
        if holder and SUPPLIER_TAG not in holder["tags"]:
            print(f"[{i}/{len(plans)}] REFUSED {p['handle']}: handle held by "
                  f"'{holder['title'][:40]}', which is not ours")
            continue

        res = client.query(PRODUCT_SET, {
            "identifier": {"handle": p["handle"]},
            "input": {
                "handle": p["handle"],
                "title": p["title"],
                "vendor": VENDOR,
                "status": "ACTIVE",
                "tags": p["tags"],
                "descriptionHtml": p["description"],
                "productOptions": p["options"],
                "variants": p["variants"],
                "files": [{"originalSource": u, "contentType": "IMAGE", "alt": p["title"]}
                          for u in p["images"]],
            },
        })
        payload = (res.get("data") or {}).get("productSet") or {}
        errs = res.get("errors") or payload.get("userErrors")
        if errs:
            print(f"[{i}/{len(plans)}] FAILED {p['handle']}: {str(errs)[:200]}")
            continue

        gid = payload["product"]["id"]
        client.query(PUBLISH, {"id": gid,
                               "input": [{"publicationId": client.headless_publication_id()}]})
        if p["category"] in collections:
            client.query(ADD_TO_COLLECTION,
                         {"id": collections[p["category"]], "productIds": [gid]})
        else:
            print(f"    warning: no collection {p['category']}, product not filed")

        done.append({"handle": p["handle"], "id": gid, "in_stock": p["in_stock"]})
        print(f"[{i}/{len(plans)}] {p['handle']}: {len(p['variants'])} variants"
              + ("" if p["in_stock"] else ", marked out of stock"))

    with open(STATE, "w") as f:
        json.dump({"synced": done}, f, indent=1)
    print(f"\n{len(done)} synced.")
    ping()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
