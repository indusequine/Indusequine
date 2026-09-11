#!/usr/bin/env python3
"""Sync Delhi Tack Shop's scraped catalogue into Shopify.

Reads output/scraped.json (from scrape.py) and mapping.json, and brings
Shopify in line with his site -- reusing the original catalogue migration's
Shopify client and variant builder. Runs unattended on a schedule
(.github/workflows/sync-delhi-tack-shop.yml), and by hand the same way.

Each run:
  - creates products new on his site, and updates prices/variants/names of existing ones
  - hides (status DRAFT) products that are fully out of stock, and shows them
    again once he restocks -- made-to-order items always stay visible
  - hides products he has removed from his site, or that mapping.json skips
  - skips and reports a product it can't place (e.g. a new category not yet
    in mapping.json) instead of failing the whole run

Nothing is ever deleted -- hiding is reversible. If the scrape looks broken
(any failed pages, or far fewer products than are live), the hiding step is
skipped entirely so a bad scrape can't empty the marketplace.

Every product is tagged `supplier:delhi-tack-shop` and `supplier-code:<code>`,
so an enquiry can be routed back to him. Existing products are matched by that
code tag, so a product renamed on his site updates in place.

Usage:
    python3 scripts/delhi_tack_shop/import_to_shopify.py --dry-run
    python3 scripts/delhi_tack_shop/import_to_shopify.py
    python3 scripts/delhi_tack_shop/import_to_shopify.py --only-code "470451,PO-TMP"
    python3 scripts/delhi_tack_shop/import_to_shopify.py --refresh-images   # re-send photos too

Credentials come from .env, or the environment in CI.
"""
from __future__ import annotations

import argparse
import html
import json
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from migrate_to_shopify import (  # noqa: E402
    CATALOGUE_PATH,
    PRODUCT_SET_MUTATION,
    PUBLISH_MUTATION,
    ShopifyClient,
    build_options_and_variants,
    load_env,
    slugify,
)

SCRAPED_PATH = HERE / "output" / "scraped.json"
MAPPING_PATH = HERE / "mapping.json"
LOG_PATH = HERE / "output" / "import_log.json"
SUPPLIER_TAG = "supplier:delhi-tack-shop"

KEEP_UPPER = {
    "XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "2XL", "3XL", "CC", "CM", "MM", "KG",
    "MCL", "DF", "PU", "SS", "EQ", "FISE", "CT", "USA", "UK", "CO2", "NF", "ASTM", "SEI",
    "YKK", "LED", "PVC", "EVA", "HD", "3D", "II", "III", "IV", "EGO7", "EGO", "PP", "TPU", "UV",
    "MIPS", "EZ",
}
SMALL_WORDS = {"a", "an", "and", "or", "of", "with", "for", "the", "in", "on", "to", "by", "at"}

PRODUCTS_BY_TAG_QUERY = """
query($cursor: String, $q: String!) {
  products(first: 250, after: $cursor, query: $q) {
    edges { node { id handle status tags } }
    pageInfo { hasNextPage endCursor }
  }
}
"""

PRODUCT_STATUS_MUTATION = """
mutation($product: ProductUpdateInput!) {
  productUpdate(product: $product) {
    product { id status }
    userErrors { field message }
  }
}
"""

COLLECTION_BY_HANDLE_QUERY = "query($handle: String!) { collectionByHandle(handle: $handle) { id } }"

# Below this share of currently-synced products, a scrape is treated as broken
# and nothing gets hidden -- better a stale product than an empty marketplace.
MIN_HEALTHY_SCRAPE_RATIO = 0.8


def case_part(part: str) -> str:
    core = re.sub(r"[^A-Za-z0-9]", "", part)
    if not core or core in KEEP_UPPER or any(c.isdigit() for c in core):
        return part
    if len(core) <= 3 and not re.search(r"[AEIOUY]", core):
        return part  # vowel-less short codes like WCG, MCL, PU read as acronyms
    chars, seen_alpha = [], False
    for c in part:
        if c.isalpha():
            chars.append(c.upper() if not seen_alpha else c.lower())
            seen_alpha = True
        else:
            chars.append(c)
    return "".join(chars)


def case_word(word: str, first: bool) -> str:
    if not word.isupper():
        return word  # already mixed/lower case on his site (e.g. "KLJannie", "oneK") -- leave it
    core = re.sub(r"[^A-Za-z0-9]", "", word)
    if not first and core.lower() in SMALL_WORDS:
        return word.lower()
    return "".join(case_part(p) for p in re.split(r"([-/])", word))


def display_case(text: str | None) -> str | None:
    if not text:
        return text
    text = re.sub(r",(?=\S)", ", ", text)
    text = re.sub(r"\s-(?=[A-Za-z])", " - ", text)
    words = text.split()
    return " ".join(case_word(w, i == 0) for i, w in enumerate(words))


def resolve_brand(p: dict, m: dict) -> str | None:
    if p["code"] in m["brandFromCode"]:
        return m["brandFromCode"][p["code"]]
    if p.get("brand"):
        brand = html.unescape(p["brand"])
        return m["brandAliases"].get(brand, brand)
    if p.get("model") and p["model"].upper() in m["modelIsBrand"]:
        return m["modelIsBrand"][p["model"].upper()]
    name = p["name"].upper()
    for prefix, brand in m["brandFromNamePrefix"].items():
        if name.startswith(prefix):
            return brand
    return None


def resolve_name(p: dict, m: dict) -> str:
    if p["code"] in m["nameOverrides"]:
        return m["nameOverrides"][p["code"]]
    name = p["name"]
    model = p.get("model")
    if model and model.upper() not in m["modelIsBrand"]:
        have = {w.lower() for w in re.findall(r"[A-Za-z0-9]+", name)}
        extra = [w for w in model.split() if re.sub(r"[^A-Za-z0-9]", "", w).lower() not in have]
        if extra:
            name = f"{name} {' '.join(extra)}"
    return display_case(name)


def resolve_category(p: dict, m: dict) -> str | None:
    if p["code"] in m["productCategoryOverrides"]:
        return m["productCategoryOverrides"][p["code"]]
    for crumb in reversed(p["categoryPath"]):
        if crumb["slug"] in m["categoryDefaults"]:
            return m["categoryDefaults"][crumb["slug"]]
    return None


def unit_price(p: dict, color: str | None) -> float:
    """The single-unit price his own customers see for this colour."""
    if p.get("priceTiers"):
        base = min(p["priceTiers"], key=lambda t: t["min"])["price"]
    elif color and color in p["colorPrices"]:
        base = p["colorPrices"][color]
    else:
        base = p["price"]
    if p.get("discount"):
        base = round(base * (1 - p["discount"] / 100))
    return float(base)


def clean_description(desc: str | None, p: dict, brand: str | None) -> str | None:
    """Drop his leading "Product Name - " prefix -- the name is already the page heading."""
    if not desc:
        return None
    i = desc.find(" - ")
    if 0 < i <= 100:
        prefix = set(re.findall(r"[a-z0-9]+", desc[:i].lower()))
        known = set(re.findall(r"[a-z0-9]+", f"{p['name']} {p.get('model') or ''} {brand or ''}".lower()))
        if prefix and len(prefix & known) / len(prefix) >= 0.5:
            desc = desc[i + 3:].strip()
            desc = desc[:1].upper() + desc[1:]
    return desc or None


def image_urls(p: dict) -> list[str]:
    urls = list(p["images"])
    for v in p["colorImages"].values():
        urls.extend(v if isinstance(v, list) else [v])
    seen, out = set(), []
    for u in urls:
        if u and u not in seen:
            seen.add(u)
            out.append(u)
    return out


def build(p: dict, m: dict, valid_categories: set[str]) -> dict:
    category = resolve_category(p, m)
    if not category:
        raise ValueError(f"no category mapping for {[c['slug'] for c in p['categoryPath']]} -- add it to mapping.json")
    if category not in valid_categories:
        raise ValueError(f"mapped to unknown Indusequine category {category!r}")

    brand = resolve_brand(p, m)
    variants = []
    for v in p["variants"]:
        size, color = display_case(v["size"]), display_case(v["color"])
        sku = "-".join(x for x in [p["code"], v["size"], v["color"]] if x)
        variants.append({
            "sku": re.sub(r"[^A-Z0-9.]+", "-", sku.upper()).strip("-"),
            "size": size,
            "color": color,
            "price": unit_price(p, v["color"]),
        })

    tags = [f"category:{category}", SUPPLIER_TAG, f"supplier-code:{p['code']}"]
    if p.get("madeToOrder"):
        tags.append("made-to-order")

    in_stock = any((v.get("quantity") or 0) > 0 for v in p["variants"])
    return {
        "code": p["code"],
        "name": resolve_name(p, m),
        "brand": brand,
        "category": category,
        "description": clean_description(p["description"], p, brand),
        "images": image_urls(p),
        "variants": variants,
        "tags": tags,
        "visible": in_stock or bool(p.get("madeToOrder")),
    }


def fetch_existing(client: ShopifyClient) -> dict[str, dict]:
    """supplier code -> {id, handle, status}, for products synced on a previous run."""
    out, cursor = {}, None
    while True:
        result = client.query(PRODUCTS_BY_TAG_QUERY, {"cursor": cursor, "q": f"tag:'{SUPPLIER_TAG}'"})
        conn = result["data"]["products"]
        for edge in conn["edges"]:
            node = edge["node"]
            for tag in node["tags"]:
                if tag.startswith("supplier-code:"):
                    out[tag[len("supplier-code:"):]] = {"id": node["id"], "handle": node["handle"], "status": node["status"]}
        if not conn["pageInfo"]["hasNextPage"]:
            return out
        cursor = conn["pageInfo"]["endCursor"]


def write_product(client: ShopifyClient, input_obj: dict, handle: str, publish: bool) -> str:
    result = client.query(PRODUCT_SET_MUTATION, {"input": input_obj, "synchronous": True, "identifier": {"handle": handle}})
    payload = (result.get("data") or {}).get("productSet") or {}
    errors = result.get("errors") or payload.get("userErrors")
    if errors or not payload.get("product"):
        raise RuntimeError(errors or "no product returned")
    gid = payload["product"]["id"]
    if publish:
        pub = client.query(PUBLISH_MUTATION, {"id": gid, "input": [{"publicationId": client.headless_publication_id()}]})
        pub_errors = (pub.get("data") or {}).get("publishablePublish", {}).get("userErrors")
        if pub_errors:
            raise RuntimeError(f"publish failed: {pub_errors}")
    return gid


def hide_product(client: ShopifyClient, gid: str) -> None:
    result = client.query(PRODUCT_STATUS_MUTATION, {"product": {"id": gid, "status": "DRAFT"}})
    payload = (result.get("data") or {}).get("productUpdate") or {}
    errors = result.get("errors") or payload.get("userErrors")
    if errors:
        raise RuntimeError(errors)


def report(summary: dict, problems: list[str], dry_run: bool) -> None:
    lines = [f"## Delhi Tack Shop sync{' (dry run)' if dry_run else ''}", ""]
    lines += [f"- **{label}:** {len(items)}" + (f" — {', '.join(items[:12])}{' …' if len(items) > 12 else ''}" if items and label != "Updated" else "")
              for label, items in summary.items()]
    if problems:
        lines += ["", "### Needs attention", ""] + [f"- {p}" for p in problems]
    text = "\n".join(lines)
    print("\n" + text)
    step_summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if step_summary:
        with open(step_summary, "a") as f:
            f.write(text + "\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dry-run", action="store_true", help="validate against the live store, write nothing")
    parser.add_argument("--limit", type=int, default=None, help="only process the first N products (no hiding step)")
    parser.add_argument("--only-code", type=str, default=None, help="only process these supplier codes, comma-separated (no hiding step)")
    parser.add_argument("--refresh-images", action="store_true", help="re-send photos for products that already exist")
    args = parser.parse_args()
    partial_run = bool(args.limit or args.only_code)

    scraped = json.loads(SCRAPED_PATH.read_text())
    m = json.loads(MAPPING_PATH.read_text())
    catalogue = json.loads(CATALOGUE_PATH.read_text())
    valid_categories = {c["slug"] for c in catalogue["categories"]}
    original_handles = {p["slug"] for p in catalogue["products"]}

    products = scraped["products"]
    if args.only_code:
        wanted = set(args.only_code.split(","))
        products = [p for p in products if p["code"] in wanted]
    products = [p for p in products if p["code"] not in m["skip"]]
    if args.limit:
        products = products[: args.limit]

    problems: list[str] = []
    built = []
    for p in products:
        try:
            built.append(build(p, m, valid_categories))
        except Exception as e:
            problems.append(f"`{p['code']}` {p['name']}: {e}")

    by_name = defaultdict(list)
    for b in built:
        by_name[b["name"]].append(b["code"])
    for name, codes in by_name.items():
        if len(codes) > 1:
            problems.append(f"{len(codes)} products share the name {name!r} ({', '.join(codes)}) -- add nameOverrides in mapping.json")

    client = ShopifyClient(load_env())
    existing = fetch_existing(client)

    collection_gids: dict[str, str] = {}
    for cat in sorted({b["category"] for b in built}):
        found = (client.query(COLLECTION_BY_HANDLE_QUERY, {"handle": cat}).get("data") or {}).get("collectionByHandle")
        if found:
            collection_gids[cat] = found["id"]
        else:
            problems.append(f"no Shopify collection for category {cat!r} -- its products were skipped")
    built = [b for b in built if b["category"] in collection_gids]

    summary: dict[str, list[str]] = {
        "New": [], "Updated": [], "Hidden — out of stock": [], "Shown again — back in stock": [],
        "Hidden — removed from his site": [], "Hidden — skipped in mapping.json": [], "Failed": [],
    }

    for i, b in enumerate(built, 1):
        prior = existing.get(b["code"])
        name_slug, code_slug = slugify(b["name"]), slugify(b["code"])
        handle = prior["handle"] if prior else (name_slug if name_slug.endswith(code_slug) else f"{name_slug}-{code_slug}")
        if handle in original_handles:
            raise SystemExit(f"refusing to write {handle!r}: it belongs to an existing catalogue product")

        status = "ACTIVE" if b["visible"] else "DRAFT"
        product_options, variant_inputs, _ = build_options_and_variants(b)
        input_obj = {
            "handle": handle,
            "title": b["name"],
            "vendor": b["brand"] or "Indusequine",
            "status": status,
            "tags": b["tags"],
            "productOptions": product_options,
            "variants": variant_inputs,
            "collections": [collection_gids[b["category"]]],
        }
        if b["description"]:
            input_obj["descriptionHtml"] = f"<p>{html.escape(b['description'])}</p>"
        if b["images"] and (not prior or args.refresh_images):
            input_obj["files"] = [{"originalSource": u, "contentType": "IMAGE", "alt": b["name"]} for u in b["images"]]

        if not prior:
            outcome = "New"
        elif prior["status"] == "ACTIVE" and status == "DRAFT":
            outcome = "Hidden — out of stock"
        elif prior["status"] != "ACTIVE" and status == "ACTIVE":
            outcome = "Shown again — back in stock"
        else:
            outcome = "Updated"

        label = f"[{i}/{len(built)}] {b['code']} -> {handle}"
        if not args.dry_run:
            try:
                write_product(client, input_obj, handle, publish=(status == "ACTIVE"))
            except Exception as e:
                summary["Failed"].append(b["name"])
                problems.append(f"`{b['code']}` {b['name']}: write failed -- {e}")
                print(f"{label}: FAILED - {e}")
                continue
        summary[outcome].append(b["name"])
        print(f"{label}: {outcome}{' (planned)' if args.dry_run else ''}")

    # Hide what's no longer on his site (or newly skipped) -- full runs only, and
    # only when the scrape looks complete, so a broken scrape can't hide everything.
    if not partial_run:
        scraped_codes = {p["code"] for p in scraped["products"]}
        healthy = not scraped["failures"] and len(scraped_codes) >= MIN_HEALTHY_SCRAPE_RATIO * len(existing)
        to_hide = [
            (code, info, "Hidden — removed from his site" if code not in scraped_codes else "Hidden — skipped in mapping.json")
            for code, info in existing.items()
            if info["status"] == "ACTIVE" and (code not in scraped_codes or code in m["skip"])
        ]
        if to_hide and not healthy:
            problems.append(
                f"scrape looks incomplete ({len(scraped_codes)} products, {len(scraped['failures'])} failed pages, "
                f"{len(existing)} live) -- skipped hiding {len(to_hide)} product(s) to be safe"
            )
        elif to_hide:
            for code, info, bucket in to_hide:
                if not args.dry_run:
                    try:
                        hide_product(client, info["id"])
                    except Exception as e:
                        problems.append(f"`{code}` {info['handle']}: hide failed -- {e}")
                        continue
                summary[bucket].append(info["handle"])
                print(f"{code} -> {info['handle']}: {bucket}{' (planned)' if args.dry_run else ''}")

    if not args.dry_run:
        LOG_PATH.write_text(json.dumps({"summary": summary, "problems": problems}, indent=2, ensure_ascii=False))
    report(summary, problems, args.dry_run)
    if problems:
        sys.exit(1)


if __name__ == "__main__":
    main()
