#!/usr/bin/env python3
"""Keep The Tack Shop's listings in line with tackshop.in.

Their store runs on Zoho Commerce, which serves its whole catalogue as JSON at
/storefront/api/v1/products -- brand, description, photos, per-variant SKU,
price and stock. We match on SKU, which lines up with our catalogue exactly.

Each run, for our ACTIVE Tack Shop products that appear on their site:
  - adds a photograph where we have none
  - fills in the brand where we have none
  - fills in the description where we have none
  - sets each variant's price to their live selling_price
  - hides a product that is fully out of stock on their site, and shows it
    again once they restock

It never touches a product that is DRAFT for any other reason -- the merge
fragments, or the discontinued lines retired by --retire-discontinued. Only
products this script hid for being out of stock (tag OOS_TAG) are ever shown
again, so a sync can't resurrect something hidden on purpose.

Nothing is deleted. If their API returns far fewer products than usual, the
hide step is skipped entirely, so a broken fetch can't empty the catalogue.

Lessons carried over from earlier sessions, deliberately:
  - never productSet. It upserts by handle and replaces the variant list
    wholesale; it destroyed two variants during the merge. Field-level
    mutations only.
  - tags go through tagsAdd / tagsRemove, never productUpdate(tags:...), which
    would overwrite the category: and supplier: tags the site navigates by.
  - their "Label Price" is MRP. What a rider pays is selling_price.
  - their featured image is sometimes a stock filler ("Pastel Modern Fashion
    ... Pinterest Pin Post") that their own is_placeholder_image flag misses.
  - their API ignores `page`; it paginates on `page_number`, and will happily
    return page 1 forever if asked wrong. Hard page cap plus a repeat guard.

Usage:
    python3 scripts/tack_shop/sync.py --dry-run
    python3 scripts/tack_shop/sync.py
    python3 scripts/tack_shop/sync.py --retire-discontinued --dry-run   # one-off
    python3 scripts/tack_shop/sync.py --retire-discontinued
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from migrate_to_shopify import ShopifyClient, load_env  # noqa: E402

API = "https://www.tackshop.in/storefront/api/v1/products"
IMAGE_BASE = "https://www.tackshop.in"
IMAGE_SIZE = "1200x1200"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124 Safari/537.36")

SUPPLIER_TAG = "supplier:the-tack-shop"
OOS_TAG = "sync:tack-shop-out-of-stock"           # hidden by this script; may come back
RETIRED_TAG = "sync:tack-shop-discontinued"        # retired once; never auto-shown
SENTINEL_VENDOR = "Indusequine"                    # the migration's "no brand" marker
FILLER = ("Pastel+Modern+Fashion", "no-preview-image")

MAX_PAGES = 30          # their catalogue is ~340; hitting this means pagination broke
MIN_HEALTHY = 250       # fewer than this and we don't trust the fetch enough to hide
XLSX = Path.home() / "Downloads" / "Item_Desc_Tack-Shop.xlsx"
STATE = HERE / "retired_state.json"

OURS_QUERY = """
query($n: Int!, $a: String) {
  products(first: $n, after: $a) {
    edges { node { id handle title vendor status tags descriptionHtml
      media(first: 1) { edges { node { id } } }
      variants(first: 100) { edges { node { id sku price } } } } }
    pageInfo { hasNextPage endCursor }
  }
}
"""
UPDATE = """
mutation($input: ProductInput!) {
  productUpdate(input: $input) { product { id } userErrors { field message } }
}
"""
PRICES = """
mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $productId, variants: $variants) {
    userErrors { field message }
  }
}
"""
MEDIA = """
mutation($productId: ID!, $media: [CreateMediaInput!]!) {
  productCreateMedia(productId: $productId, media: $media) {
    mediaUserErrors { field message }
  }
}
"""
TAGS_ADD = "mutation($id: ID!, $tags: [String!]!) { tagsAdd(id: $id, tags: $tags) { userErrors { message } } }"
TAGS_REMOVE = "mutation($id: ID!, $tags: [String!]!) { tagsRemove(id: $id, tags: $tags) { userErrors { message } } }"


def clean(x) -> str:
    s = "" if x is None else str(x).strip()
    return "" if s.lower() in ("", "none", "nan") else s


# ---------------------------------------------------------------- their side

def fetch_site() -> list[dict]:
    seen, out = set(), []
    for page in range(1, MAX_PAGES + 1):
        req = urllib.request.Request(f"{API}?page_number={page}",
                                     headers={"User-Agent": UA, "Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=120) as r:
            payload = json.load(r)["payload"]
        batch = payload.get("products") or []
        new = [p for p in batch if p["product_id"] not in seen]
        if not new:
            break          # a repeated page means the API stopped honouring page_number
        for p in new:
            seen.add(p["product_id"])
            out.append(p)
        if not payload.get("pagination", {}).get("has_more_page"):
            break
        time.sleep(1.5)
    else:
        raise SystemExit(f"hit the {MAX_PAGES}-page cap -- pagination is broken, refusing to trust this fetch")
    return out


def real_image(im: dict) -> bool:
    url = im.get("url") or ""
    return (not im.get("is_placeholder_image") and url.startswith("/product-images/")
            and not any(f in url for f in FILLER))


def index_site(site: list[dict]) -> dict[str, dict]:
    """SKU -> everything we might copy for the product that SKU belongs to."""
    out = {}
    for p in site:
        pimgs = [i for i in (p.get("images") or []) if real_image(i)]
        oos = bool(p.get("variants")) and all(v.get("is_out_of_stock") for v in p["variants"])
        for v in p.get("variants") or []:
            sku = clean(v.get("sku")).upper()
            if not sku:
                continue
            vimgs = [i for i in (v.get("images") or []) if real_image(i)]
            out[sku] = {
                "product_id": p["product_id"],
                "price": v.get("selling_price"),
                "brand": clean(p.get("brand")),
                "description": clean(p.get("description")),
                "images": vimgs or pimgs,
                "name": clean(p.get("name")),
                "product_oos": oos,
            }
    return out


# ---------------------------------------------------------------- our side

def fetch_ours(client: ShopifyClient) -> list[dict]:
    got, cursor = [], None
    while True:
        res = client.query(OURS_QUERY, {"n": 60, "a": cursor})
        if res.get("errors"):
            raise RuntimeError(res["errors"])
        data = res["data"]["products"]
        for e in data["edges"]:
            n = e["node"]
            if SUPPLIER_TAG not in n["tags"]:
                continue
            got.append({
                "id": n["id"], "handle": n["handle"], "title": n["title"],
                "vendor": n["vendor"], "status": n["status"], "tags": n["tags"],
                "has_desc": bool(clean(n["descriptionHtml"])),
                "has_image": bool(n["media"]["edges"]),
                "variants": [{"id": v["node"]["id"], "sku": clean(v["node"]["sku"]).upper(),
                              "price": float(v["node"]["price"])}
                             for v in n["variants"]["edges"]],
            })
        if not data["pageInfo"]["hasNextPage"]:
            return got
        cursor = data["pageInfo"]["endCursor"]


def errors(res: dict, key: str, field: str = "userErrors") -> list:
    return res.get("errors") or ((res.get("data") or {}).get(key) or {}).get(field) or []


# ---------------------------------------------------------------- the sync

def sync(client: ShopifyClient, dry: bool) -> int:
    site = fetch_site()
    by_sku = index_site(site)
    print(f"their site: {len(site)} products, {len(by_sku)} SKUs")
    healthy = len(site) >= MIN_HEALTHY
    if not healthy:
        print(f"  !! only {len(site)} products fetched (expected >= {MIN_HEALTHY}) -- "
              "skipping ALL hiding this run")

    ours = fetch_ours(client)
    n = dict(photo=0, brand=0, desc=0, price=0, hide=0, show=0, fail=0)

    for p in ours:
        hits = [by_sku[v["sku"]] for v in p["variants"] if v["sku"] in by_sku]
        oos_hidden = OOS_TAG in p["tags"]
        # Only products that are live, or that WE hid for stock, are ours to touch.
        if not hits or (p["status"] != "ACTIVE" and not oos_hidden):
            continue
        h = hits[0]
        acts = []

        if not p["has_image"]:
            imgs = next((x["images"] for x in hits if x["images"]), [])
            if imgs:
                acts.append(("photo", MEDIA, "productCreateMedia", "mediaUserErrors", {
                    "productId": p["id"],
                    "media": [{"originalSource": f"{IMAGE_BASE}{i['url']}/{IMAGE_SIZE}",
                               "mediaContentType": "IMAGE",
                               "alt": clean(i.get("alternate_text")) or p["title"]}
                              for i in imgs[:4]]}))

        if p["vendor"] == SENTINEL_VENDOR and h["brand"]:
            acts.append(("brand", UPDATE, "productUpdate", "userErrors",
                         {"input": {"id": p["id"], "vendor": h["brand"]}}))

        if not p["has_desc"] and len(h["description"]) >= 40:
            acts.append(("desc", UPDATE, "productUpdate", "userErrors",
                         {"input": {"id": p["id"], "descriptionHtml": h["description"]}}))

        moved = [{"id": v["id"], "price": str(by_sku[v["sku"]]["price"])}
                 for v in p["variants"]
                 if v["sku"] in by_sku and by_sku[v["sku"]]["price"] is not None
                 and abs(float(by_sku[v["sku"]]["price"]) - v["price"]) > 0.5]
        if moved:
            acts.append(("price", PRICES, "productVariantsBulkUpdate", "userErrors",
                         {"productId": p["id"], "variants": moved}))

        all_oos = all(x["product_oos"] for x in hits)
        if healthy and all_oos and p["status"] == "ACTIVE":
            acts.append(("hide", UPDATE, "productUpdate", "userErrors",
                         {"input": {"id": p["id"], "status": "DRAFT"}}))
        elif oos_hidden and not all_oos:
            acts.append(("show", UPDATE, "productUpdate", "userErrors",
                         {"input": {"id": p["id"], "status": "ACTIVE"}}))

        for kind, q, key, field, variables in acts:
            n[kind] += 1
            if dry:
                continue
            e = errors(client.query(q, variables), key, field)
            if e:
                n["fail"] += 1
                print(f"  FAILED {kind} {p['handle']}: {str(e)[:140]}")
                continue
            if kind == "hide":
                client.query(TAGS_ADD, {"id": p["id"], "tags": [OOS_TAG]})
            elif kind == "show":
                client.query(TAGS_REMOVE, {"id": p["id"], "tags": [OOS_TAG]})

    verb = "would" if dry else "did"
    print(f"\n{verb}: +{n['photo']} photos, +{n['brand']} brands, +{n['desc']} descriptions, "
          f"{n['price']} price updates, hide {n['hide']} (out of stock), show {n['show']} (restocked)"
          + (f", {n['fail']} failures" if n["fail"] else ""))
    return 1 if n["fail"] else 0


# ------------------------------------------------- one-off: discontinued lines

def retire(client: ShopifyClient, dry: bool) -> int:
    """Hide our listings that are gone from their site AND show zero stock in
    their export. Lines that are off the site but still in stock are kept --
    they hold them, they just don't list them online."""
    import openpyxl
    wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
    rows = wb["ProductGroup"].iter_rows(values_only=True)
    hdr = [clean(h) for h in next(rows)]
    si, st = hdr.index("SKU"), hdr.index("Stock On Hand")
    stock = {}
    for r in rows:
        s = clean(r[si]).upper()
        if s:
            try:
                stock[s] = float(r[st] or 0)
            except (TypeError, ValueError):
                stock[s] = 0.0

    site = fetch_site()
    if len(site) < MIN_HEALTHY:
        raise SystemExit(f"only {len(site)} products fetched -- refusing to retire anything")
    on_site = set(index_site(site))

    ours = [p for p in fetch_ours(client) if p["status"] == "ACTIVE"]
    targets = [p for p in ours
               if not any(v["sku"] in on_site for v in p["variants"])
               and sum(stock.get(v["sku"], 0) for v in p["variants"]) <= 0]
    kept = sum(1 for p in ours if not any(v["sku"] in on_site for v in p["variants"])) - len(targets)
    print(f"off their site: {len(targets) + kept}  ->  retire {len(targets)} (zero stock), "
          f"keep {kept} (still in stock)")
    if dry:
        for p in targets[:8]:
            print(f"   would retire: {p['title'][:60]}")
        return 0

    done = []
    for p in targets:
        e = errors(client.query(UPDATE, {"input": {"id": p["id"], "status": "DRAFT"}}), "productUpdate")
        if e:
            print(f"  FAILED {p['handle']}: {str(e)[:120]}")
            continue
        client.query(TAGS_ADD, {"id": p["id"], "tags": [RETIRED_TAG]})
        done.append(p["id"])
    STATE.write_text(json.dumps({"retired": done}, indent=1))
    print(f"retired {len(done)}; ids saved to {STATE.name} (--undo-retire republishes them)")
    return 0


def undo_retire(client: ShopifyClient) -> int:
    ids = json.loads(STATE.read_text())["retired"]
    for gid in ids:
        client.query(UPDATE, {"input": {"id": gid, "status": "ACTIVE"}})
        client.query(TAGS_REMOVE, {"id": gid, "tags": [RETIRED_TAG]})
    print(f"republished {len(ids)}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--retire-discontinued", action="store_true")
    ap.add_argument("--undo-retire", action="store_true")
    args = ap.parse_args()
    client = ShopifyClient(load_env())
    if args.undo_retire:
        return undo_retire(client)
    if args.retire_discontinued:
        return retire(client, args.dry_run)
    return sync(client, args.dry_run)


if __name__ == "__main__":
    raise SystemExit(main())
