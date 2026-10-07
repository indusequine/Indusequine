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
  - marks a product that is fully out of stock on their site with OOS_TAG,
    and clears the tag once they restock

Out of stock is marked, not hidden. A rider searching for a stirrup we carry
should find it and see that it is out of stock, rather than be told we have
no such thing. Products this script hid for stock in earlier runs are
brought back live and carry the tag instead.

It never touches a product that is DRAFT for any other reason -- the merge
fragments, or the discontinued lines retired by --retire-discontinued -- so
a sync can't resurrect something hidden on purpose.

Nothing is deleted. If their API returns far fewer products than usual, the
marking step is skipped entirely, so a broken fetch can't flag the catalogue
as sold out.

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
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from feeds import FeedUnavailable, read_json  # noqa: E402
from migrate_to_shopify import ShopifyClient, load_env  # noqa: E402
from snapshot import take  # noqa: E402

API = "https://www.tackshop.in/storefront/api/v1/products"
IMAGE_BASE = "https://www.tackshop.in"
IMAGE_SIZE = "1200x1200"
SUPPLIER_TAG = "supplier:the-tack-shop"
OOS_TAG = "sync:tack-shop-out-of-stock"           # marked out of stock; stays on the site
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

# Creating, not upserting: productSet replaces a variant list wholesale and has
# destroyed data here twice. A product that does not exist yet cannot be
# clobbered, but the convention holds.
CREATE = """
mutation($input: ProductCreateInput!, $media: [CreateMediaInput!]) {
  productCreate(product: $input, media: $media) {
    product { id handle variants(first: 1) { nodes { id } } }
    userErrors { field message }
  }
}
"""

ADD_VARIANTS = """
mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!, $strategy: ProductVariantsBulkCreateStrategy) {
  productVariantsBulkCreate(productId: $productId, variants: $variants, strategy: $strategy) {
    productVariants { id sku }
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

CATEGORY_MAP = HERE / "category_map.json"

# A listing that looks unfinished on their side goes up hidden rather than in
# front of a rider. These are the three things that actually go wrong.
PLACEHOLDER = ("test", "untitled", "sample", "dummy", "temp", "asdf", "xxx")


def clean(x) -> str:
    s = "" if x is None else str(x).strip()
    return "" if s.lower() in ("", "none", "nan") else s


# ---------------------------------------------------------------- their side

def fetch_site() -> list[dict]:
    seen, out = set(), []
    for page in range(1, MAX_PAGES + 1):
        # Seventeen requests to their API for one run, each one previously a
        # single try: one blip anywhere across them killed the whole sync with
        # a traceback and an exit code nobody could read. read_json retries
        # with backoff and, when it finally gives up, says which page of whose
        # API refused and with what code.
        payload = read_json(f"{API}?page_number={page}", "The Tack Shop",
                            timeout=120)["payload"]
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
    if not dry:
        take(client, label="tack-shop-sync", images=False)
    site = fetch_site()
    by_sku = index_site(site)
    print(f"their site: {len(site)} products, {len(by_sku)} SKUs")
    healthy = len(site) >= MIN_HEALTHY
    if not healthy:
        print(f"  !! only {len(site)} products fetched (expected >= {MIN_HEALTHY}) -- "
              "skipping ALL hiding this run")

    ours = fetch_ours(client)
    n = dict(photo=0, brand=0, desc=0, price=0, mark_oos=0, back_in_stock=0, show=0, fail=0)

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

        # Out of stock is shown, not hidden: a rider looking for a Freejump
        # stirrup should see that we carry it and that it is out of stock,
        # rather than be told the catalogue has no such thing. The tag is what
        # the site reads; the product stays live either way.
        all_oos = all(x["product_oos"] for x in hits)
        if healthy and all_oos and OOS_TAG not in p["tags"]:
            acts.append(("mark_oos", TAGS_ADD, "tagsAdd", "userErrors",
                         {"id": p["id"], "tags": [OOS_TAG]}))
        elif OOS_TAG in p["tags"] and not all_oos:
            acts.append(("back_in_stock", TAGS_REMOVE, "tagsRemove", "userErrors",
                         {"id": p["id"], "tags": [OOS_TAG]}))
        # Anything this script hid for stock in an earlier run comes back.
        if p["status"] != "ACTIVE" and oos_hidden:
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
            # The tag is applied by the action itself now, so nothing to
            # follow up with here.

    verb = "would" if dry else "did"
    print(f"\n{verb}: +{n['photo']} photos, +{n['brand']} brands, +{n['desc']} descriptions, "
          f"{n['price']} price updates, {n['mark_oos']} marked out of stock, "
          f"{n['back_in_stock']} back in stock, {n['show']} un-hidden"
          + (f", {n['fail']} failures" if n["fail"] else ""))
    # Anything on their site we do not carry yet. Last, so the updates above
    # have already run and `ours` reflects what we hold.
    print("\nnew on their site:")
    problems = create_new(client, site, ours, dry)

    return 1 if (n["fail"] or problems) else 0


# ------------------------------------------------- one-off: discontinued lines


# ------------------------------------------------------- products new to us

def options_of(variant: dict) -> dict:
    """Their Size and Colour for one variant, named the way we read them.

    They write "Colour" and products.ts matches on "Color". A British spelling
    reaches the site as no colour at all and the picker silently drops to sizes,
    which is how the Piquant import went wrong. Their values also carry stray
    leading spaces (" 40").
    """
    out = {}
    for o in variant.get("options") or []:
        name = clean(o.get("name"))
        value = clean(o.get("value"))
        if not name or not value:
            continue
        if name.lower() in ("colour", "color"):
            name = "Color"
        out[name] = value
    return out


def product_options(variants: list[dict]) -> list[dict]:
    """The option names and values a product needs before its variants exist."""
    seen: dict[str, list[str]] = {}
    for v in variants:
        for name, value in options_of(v).items():
            vals = seen.setdefault(name, [])
            if value not in vals:
                vals.append(value)
    if not seen:
        return [{"name": "Title", "values": [{"name": clean(v.get("sku"))} for v in variants]}]
    return [{"name": n, "values": [{"name": x} for x in vals]} for n, vals in seen.items()]


def looks_unfinished(prod: dict, images: list, price) -> str | None:
    """Why this listing should go up hidden, or None to publish it.

    Their catalogue occasionally carries a half-made listing. Those are worth
    having, but not worth a rider meeting before anyone has looked.
    """
    name = clean(prod.get("name")).lower()
    if not name:
        return "no name"
    if any(w in name.split() or name.startswith(w) for w in PLACEHOLDER):
        return "name looks like a placeholder"
    if not images:
        return "no photograph"
    if not price:
        return "no price"
    return None


def create_new(client: ShopifyClient, site: list[dict], ours: list[dict], dry: bool) -> int:
    """Add their products we do not carry. Returns the number of problems."""
    mapping = json.loads(CATEGORY_MAP.read_text())["categories"]
    have = {v["sku"] for o in ours for v in o["variants"] if v["sku"]}
    # SKUs live across the whole catalogue, not just our Tack Shop ones: a
    # product may have arrived from another supplier or the first migration.
    everyone = set()
    cursor = None
    while True:
        res = client.query(OURS_QUERY, {"n": 60, "a": cursor})
        data = res["data"]["products"]
        for e in data["edges"]:
            for v in e["node"]["variants"]["edges"]:
                sku = clean(v["node"]["sku"]).upper()
                if sku:
                    everyone.add(sku)
        if not data["pageInfo"]["hasNextPage"]:
            break
        cursor = data["pageInfo"]["endCursor"]
    have |= everyone

    fresh, unmapped = [], []
    for prod in site:
        skus = [clean(v.get("sku")).upper() for v in (prod.get("variants") or [])]
        skus = [x for x in skus if x]
        if not skus or any(x in have for x in skus):
            continue
        category = mapping.get(str(prod.get("category_id")))
        if not category:
            unmapped.append(prod)
            continue
        fresh.append((prod, category))

    if not fresh and not unmapped:
        print("  nothing new on their site")
        return 0

    for prod in unmapped:
        print(f"  UNFILED {clean(prod.get('name'))[:46]}: their category "
              f"{prod.get('category_id')} is not in category_map.json")

    collections = {}
    if fresh and not dry:
        cursor = None
        while True:
            page = client.query(COLLECTIONS_QUERY, {"cursor": cursor})["data"]["collections"]
            collections.update({n["handle"]: n["id"] for n in page["nodes"]})
            if not page["pageInfo"]["hasNextPage"]:
                break
            cursor = page["pageInfo"]["endCursor"]

    held = 0
    for prod, category in fresh:
        imgs = [i for i in (prod.get("images") or []) if real_image(i)]
        variants = [v for v in (prod.get("variants") or []) if clean(v.get("sku"))]
        price = next((v.get("selling_price") for v in variants if v.get("selling_price")), None)
        why = looks_unfinished(prod, imgs, price)
        name = clean(prod.get("name"))
        print(f"  NEW {name[:44]:44s} -> {category:26s} "
              f"{len(variants)}v {len(imgs)}img" + (f"  HELD: {why}" if why else ""))
        if why:
            held += 1
        if dry:
            continue

        tags = [f"category:{category}", SUPPLIER_TAG]
        if all(v.get("is_out_of_stock") for v in variants):
            tags.append(OOS_TAG)
        res = client.query(CREATE, {
            "input": {
                "title": name,
                "vendor": clean(prod.get("brand")) or SENTINEL_VENDOR,
                "status": "DRAFT" if why else "ACTIVE",
                "tags": tags,
                "descriptionHtml": clean(prod.get("description")),
                "productOptions": product_options(variants),
            },
            # their CDN needs the size segment; without it the fetch fails
            "media": [{"originalSource": f"{IMAGE_BASE}{i['url']}/{IMAGE_SIZE}",
                       "mediaContentType": "IMAGE", "alt": name} for i in imgs[:10]],
        })
        errs = errors(res, "productCreate")
        if errs:
            print(f"      FAILED: {str(errs)[:140]}")
            held += 1
            continue
        made = res["data"]["productCreate"]["product"]
        gid = made["id"]

        bulk = []
        for v in variants:
            vals = options_of(v)
            if not vals:
                vals = {"Title": clean(v.get("sku"))}
            bulk.append({
                "price": str(v.get("selling_price") or price or 0),
                "inventoryItem": {"sku": clean(v.get("sku"))},
                "optionValues": [{"optionName": k, "name": x} for k, x in vals.items()],
            })
        r = client.query(ADD_VARIANTS, {"productId": gid, "variants": bulk,
                                        "strategy": "REMOVE_STANDALONE_VARIANT"})
        verrs = errors(r, "productVariantsBulkCreate")
        if verrs:
            print(f"      variants not added: {str(verrs)[:120]}")
            held += 1

        client.query(PUBLISH, {"id": gid,
                               "input": [{"publicationId": client.headless_publication_id()}]})
        if category in collections:
            client.query(ADD_TO_COLLECTION, {"id": collections[category], "productIds": [gid]})

    print(f"\n  {len(fresh)} new, {held} held or failed, {len(unmapped)} unfiled")
    return len(unmapped) + held


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
    try:
        if args.undo_retire:
            return undo_retire(client)
        if args.retire_discontinued:
            return retire(client, args.dry_run)
        return sync(client, args.dry_run)
    except FeedUnavailable as e:
        # Their site, not our catalogue, and not the same thing as finding a
        # product we cannot file, which is what exit 1 means here.
        print(f"{e}\n  {e.url}\n\nNothing was written. Shopify is unchanged.")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
