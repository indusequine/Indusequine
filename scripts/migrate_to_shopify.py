#!/usr/bin/env python3
"""One-time migration: src/data/catalogue.json -> Shopify products via Admin API.

Usage:
    python3 scripts/migrate_to_shopify.py --dry-run
    python3 scripts/migrate_to_shopify.py --limit 20
    python3 scripts/migrate_to_shopify.py --only-slug cwd-saddle-dynamick-2gs-x-tend-fc-bl-17-2c
    python3 scripts/migrate_to_shopify.py                # full run

Reads Shopify Admin API credentials from .env (gitignored, never committed):
    SHOPIFY_ADMIN_CLIENT_ID
    SHOPIFY_ADMIN_CLIENT_SECRET
    SHOPIFY_STORE_DOMAIN

Uses productSet (idempotent by handle) to create/update each product with its
variants, options, vendor, collections, and image, then publishes it to the
"Indusequine Headless" sales channel so it's visible via the Storefront API.

Images are attached by their already-live public URL (no staged upload needed)
-- Shopify fetches and stores its own copy. Set IMAGE_BASE_URL below to
wherever the images are currently served from.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.request
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOGUE_PATH = ROOT / "src" / "data" / "catalogue.json"
IMAGES_MAP_PATH = ROOT / "src" / "data" / "product-images.json"
IMAGE_BASE_URL = "https://indusequine.vercel.app"  # live source for image files today
API_VERSION = "2026-01"
HEADLESS_PUBLICATION_NAME = "Indusequine Headless"

SIZE_WORDS = {
    "xxs", "xs", "s", "m", "l", "xl", "xxl", "xxxl",
    "ss", "ls", "ms", "st", "lt", "mt", "xls",
    "cob", "full", "pony", "x-full", "xfull", "shetland", "yearling",
    "extra-full", "warmblood", "osfa", "os",
    "small", "medium", "large", "x-small", "x-large", "xx-large",
}


def load_env() -> dict:
    env = {}
    env_path = ROOT / ".env"
    if not env_path.exists():
        print("error: .env not found at", env_path, file=sys.stderr)
        sys.exit(1)
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    required = ["SHOPIFY_ADMIN_CLIENT_ID", "SHOPIFY_ADMIN_CLIENT_SECRET", "SHOPIFY_STORE_DOMAIN"]
    missing = [k for k in required if not env.get(k)]
    if missing:
        print("error: missing required .env keys:", missing, file=sys.stderr)
        sys.exit(1)
    return env


class ShopifyClient:
    def __init__(self, env: dict):
        self.domain = env["SHOPIFY_STORE_DOMAIN"]
        self.client_id = env["SHOPIFY_ADMIN_CLIENT_ID"]
        self.client_secret = env["SHOPIFY_ADMIN_CLIENT_SECRET"]
        self.gql_url = f"https://{self.domain}/admin/api/{API_VERSION}/graphql.json"
        self.token = self._get_token()
        self._headless_publication_id: str | None = None

    def _get_token(self) -> str:
        url = f"https://{self.domain}/admin/oauth/access_token"
        body = (
            f"grant_type=client_credentials&client_id={self.client_id}"
            f"&client_secret={self.client_secret}"
        ).encode()
        req = urllib.request.Request(
            url, data=body,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read())["access_token"]

    def query(self, query: str, variables: dict | None = None, retries: int = 5) -> dict:
        body = json.dumps({"query": query, "variables": variables or {}}).encode()
        for attempt in range(retries):
            req = urllib.request.Request(
                self.gql_url, data=body,
                headers={"Content-Type": "application/json", "X-Shopify-Access-Token": self.token},
                method="POST",
            )
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    result = json.loads(resp.read())
            except urllib.error.HTTPError as e:
                if e.code == 429 and attempt < retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                raise RuntimeError(f"HTTP {e.code}: {e.read().decode()[:500]}")
            except (urllib.error.URLError, TimeoutError, OSError) as e:
                # transient network issue (timeout, connection reset, DNS
                # hiccup, etc.) -- back off and retry rather than crash the
                # whole run over one flaky request
                if attempt < retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                raise RuntimeError(f"network error after {retries} attempts: {e}")

            errors = result.get("errors")
            if errors and any(err.get("extensions", {}).get("code") == "THROTTLED" for err in errors):
                cost = result.get("extensions", {}).get("cost", {})
                throttle = cost.get("throttleStatus", {})
                available = throttle.get("currentlyAvailable", 0)
                restore_rate = throttle.get("restoreRate", 50) or 50
                wait = max(1.0, (50 - available) / restore_rate)
                time.sleep(wait)
                continue

            throttle = result.get("extensions", {}).get("cost", {}).get("throttleStatus", {})
            if throttle.get("currentlyAvailable", 2000) < 100:
                time.sleep(1.0)

            return result
        raise RuntimeError("exceeded retries")

    def headless_publication_id(self) -> str:
        if self._headless_publication_id:
            return self._headless_publication_id
        result = self.query("{ publications(first: 20) { edges { node { id name } } } }")
        for edge in result["data"]["publications"]["edges"]:
            if edge["node"]["name"] == HEADLESS_PUBLICATION_NAME:
                self._headless_publication_id = edge["node"]["id"]
                return self._headless_publication_id
        raise RuntimeError(f"publication {HEADLESS_PUBLICATION_NAME!r} not found")


PRODUCT_SET_MUTATION = """
mutation($input: ProductSetInput!, $synchronous: Boolean!) {
  productSet(input: $input, synchronous: $synchronous) {
    product { id handle }
    userErrors { field message }
  }
}
"""

PUBLISH_MUTATION = """
mutation($id: ID!, $input: [PublicationInput!]!) {
  publishablePublish(id: $id, input: $input) {
    userErrors { field message }
  }
}
"""

COLLECTION_CREATE_MUTATION = """
mutation($input: CollectionInput!) {
  collectionCreate(input: $input) {
    collection { id handle }
    userErrors { field message }
  }
}
"""


def slugify(s: str) -> str:
    s = s.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def dedupe_variants(product: dict) -> tuple[list[dict], list[str]]:
    """Return (variants with guaranteed-unique size/color pairs, notes for exceptions report)."""
    notes = []
    seen: dict[tuple, list[dict]] = defaultdict(list)
    for v in product["variants"]:
        seen[(v.get("size"), v.get("color"))].append(v)

    out = []
    for key, group in seen.items():
        if len(group) == 1:
            out.append(group[0])
            continue
        # Real collision: keep original size/color but force uniqueness with a
        # SKU-derived suffix rather than guessing semantic meaning.
        notes.append(
            f"{len(group)} variants collided on size={key[0]!r} color={key[1]!r}: "
            + ", ".join(v["sku"] for v in group)
        )
        for i, v in enumerate(group, 1):
            v2 = dict(v)
            v2["_disambiguator"] = f"#{i}"
            out.append(v2)
    return out, notes


def build_options_and_variants(product: dict) -> tuple[list[dict], list[dict], list[str]]:
    variants, notes = dedupe_variants(product)
    has_size = any(v.get("size") for v in variants)
    has_color = any(v.get("color") for v in variants)
    has_disambiguator = any("_disambiguator" in v for v in variants)

    option_names = []
    if has_size:
        option_names.append("Size")
    if has_color:
        option_names.append("Color")
    if has_disambiguator:
        option_names.append("Variant")
    if not option_names:
        option_names = ["Title"]

    option_values: dict[str, set] = {name: set() for name in option_names}
    variant_inputs = []
    for v in variants:
        values = {}
        if "Size" in option_names:
            values["Size"] = v.get("size") or "One Size"
        if "Color" in option_names:
            values["Color"] = v.get("color") or "Standard"
        if "Variant" in option_names:
            values["Variant"] = v.get("_disambiguator", "#1")
        if option_names == ["Title"]:
            values["Title"] = "Default Title"

        for name, val in values.items():
            option_values[name].add(val)

        price = v["price"]
        variant_inputs.append({
            "optionValues": [{"optionName": n, "name": val} for n, val in values.items()],
            "price": f"{price:.2f}" if price is not None else "0.00",
            "sku": v["sku"],
            "inventoryPolicy": "CONTINUE",
            "inventoryItem": {"tracked": False},
        })

    product_options = [
        {"name": name, "values": [{"name": val} for val in sorted(option_values[name])]}
        for name in option_names
    ]
    return product_options, variant_inputs, notes


def build_product_input(product: dict, image_url: str | None, collection_gid: str | None) -> dict:
    product_options, variant_inputs, notes = build_options_and_variants(product)
    price_unknown = any(v["price"] is None for v in product["variants"])

    tags = [f"category:{product['category']}"]
    if price_unknown:
        tags.append("price-on-request")

    input_obj = {
        "handle": product["slug"],
        "title": product["name"],
        "vendor": product.get("brand") or "Indusequine",
        "status": "ACTIVE",
        "tags": tags,
        "productOptions": product_options,
        "variants": variant_inputs,
    }
    if collection_gid:
        input_obj["collections"] = [collection_gid]
    if image_url:
        input_obj["files"] = [{
            "originalSource": image_url,
            "contentType": "IMAGE",
            "alt": product["name"],
        }]
    return input_obj, notes


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dry-run", action="store_true", help="print planned mutations, execute nothing")
    parser.add_argument("--limit", type=int, default=None, help="only process the first N products")
    parser.add_argument("--only-slug", type=str, default=None, help="only process this one product slug")
    parser.add_argument("--skip-publish", action="store_true", help="create/update products but skip channel publish step")
    args = parser.parse_args()

    catalogue = json.loads(CATALOGUE_PATH.read_text())
    image_map = json.loads(IMAGES_MAP_PATH.read_text()) if IMAGES_MAP_PATH.exists() else {}

    products = catalogue["products"]
    if args.only_slug:
        products = [p for p in products if p["slug"] == args.only_slug]
        if not products:
            print(f"error: no product with slug {args.only_slug!r}", file=sys.stderr)
            sys.exit(1)
    if args.limit:
        products = products[: args.limit]

    print(f"processing {len(products)} product(s){' [DRY RUN]' if args.dry_run else ''}")

    client = None if args.dry_run else ShopifyClient(load_env())

    # --- collections: one per category, created up front so products can reference them inline ---
    category_by_slug = {c["slug"]: c["name"] for c in catalogue["categories"]}
    needed_categories = {p["category"] for p in products}
    collection_gid_by_category: dict[str, str] = {}

    if not args.dry_run:
        print(f"ensuring {len(needed_categories)} collection(s) exist...")
        for cat_slug in sorted(needed_categories):
            cat_name = category_by_slug.get(cat_slug, cat_slug)
            try:
                result = client.query(COLLECTION_CREATE_MUTATION, {
                    "input": {"title": cat_name, "handle": cat_slug}
                })
                payload = result.get("data", {}).get("collectionCreate", {})
                errors = payload.get("userErrors", [])
                collection = payload.get("collection")
                if collection:
                    collection_gid_by_category[cat_slug] = collection["id"]
                elif errors and "already been taken" in json.dumps(errors):
                    # collection exists from a previous run; look it up by handle
                    lookup = client.query(
                        'query($handle: String!) { collectionByHandle(handle: $handle) { id } }',
                        {"handle": cat_slug},
                    )
                    existing = lookup.get("data", {}).get("collectionByHandle")
                    if existing:
                        collection_gid_by_category[cat_slug] = existing["id"]
                    else:
                        print(f"  WARNING: could not create or find collection for {cat_slug}: {errors}")
                else:
                    print(f"  WARNING: collection create failed for {cat_slug}: {errors}")
            except Exception as e:
                # products in this category still get created below, just
                # without a collection assignment -- not worth aborting for
                print(f"  WARNING: collection setup failed for {cat_slug}: {e}")

    # --- unique image files: dedupe so identical bytes aren't referenced redundantly ---
    # (informational only for now -- Shopify dedupes on its own side by URL anyway)

    success_log = []
    exceptions_report = []

    for i, product in enumerate(products, 1):
        slug = product["slug"]
        image_path = image_map.get(slug)
        image_url = f"{IMAGE_BASE_URL}{image_path}" if image_path else None
        collection_gid = collection_gid_by_category.get(product["category"])

        try:
            input_obj, notes = build_product_input(product, image_url, collection_gid)
        except Exception as e:
            exceptions_report.append({"slug": slug, "error": f"build failed: {e}"})
            print(f"[{i}/{len(products)}] {slug}: BUILD FAILED - {e}")
            continue

        if notes:
            exceptions_report.append({"slug": slug, "name": product["name"], "collision_notes": notes})

        if args.dry_run:
            print(f"[{i}/{len(products)}] {slug}: {len(input_obj['variants'])} variant(s), "
                  f"image={'yes' if image_url else 'no'}, collection={'yes' if collection_gid else 'no'}")
            if notes:
                for n in notes:
                    print(f"    COLLISION: {n}")
            continue

        try:
            result = client.query(PRODUCT_SET_MUTATION, {"input": input_obj, "synchronous": True})
            payload = result.get("data", {}).get("productSet") if result.get("data") else None
            top_errors = result.get("errors")
            user_errors = payload.get("userErrors") if payload else None

            if top_errors or user_errors or not payload or not payload.get("product"):
                err_detail = top_errors or user_errors or "unknown error"
                exceptions_report.append({"slug": slug, "error": str(err_detail)})
                print(f"[{i}/{len(products)}] {slug}: FAILED - {err_detail}")
                continue

            product_gid = payload["product"]["id"]

            if not args.skip_publish:
                pub_result = client.query(PUBLISH_MUTATION, {
                    "id": product_gid,
                    "input": [{"publicationId": client.headless_publication_id()}],
                })
                pub_errors = pub_result.get("data", {}).get("publishablePublish", {}).get("userErrors")
                if pub_errors:
                    exceptions_report.append({"slug": slug, "error": f"publish failed: {pub_errors}"})

            success_log.append({"slug": slug, "shopify_id": product_gid})
            print(f"[{i}/{len(products)}] {slug}: OK ({product_gid})")
        except Exception as e:
            # A single product's unrecoverable failure (network error after
            # retries exhausted, unexpected API response shape, etc.) should
            # never take down the rest of a ~1200-product run.
            exceptions_report.append({"slug": slug, "error": f"unexpected failure: {e}"})
            print(f"[{i}/{len(products)}] {slug}: FAILED - {e}")
            continue

    if not args.dry_run:
        out_dir = ROOT / "scripts" / "migration_output"
        out_dir.mkdir(exist_ok=True)
        (out_dir / "success_log.json").write_text(json.dumps(success_log, indent=2))
        (out_dir / "exceptions_report.json").write_text(json.dumps(exceptions_report, indent=2))
        print(f"\n{len(success_log)} succeeded, {len(exceptions_report)} exceptions")
        print(f"wrote scripts/migration_output/success_log.json and exceptions_report.json")


if __name__ == "__main__":
    main()
