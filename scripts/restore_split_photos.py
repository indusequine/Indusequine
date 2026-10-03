#!/usr/bin/env python3
"""Put back the photographs the colour split destroyed.

Splitting a product into one listing per colour meant telling Shopify which
photographs each colour has. Done with productSet, that is not "label these
two" but "this product has exactly these two", so the first call stripped
every other colour's photograph off the original and deleted it. The listings
written a moment later were handed URLs that had just stopped existing.

36 listings lost their photograph. Piquant's are recoverable because their
originals are still in scripts/piquant/images. The rest came from suppliers,
and this fetches them again from the source that supplied them.

    python3 scripts/restore_split_photos.py            # dry run
    python3 scripts/restore_split_photos.py --apply
    python3 scripts/restore_split_photos.py --apply --only piquant
"""
from __future__ import annotations

import argparse
import json
import mimetypes
import os
import re
import sys
import urllib.request
import uuid
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from migrate_to_shopify import ShopifyClient, load_env  # noqa: E402
from revalidate import ping  # noqa: E402

PIQUANT_IMAGES = HERE / "piquant" / "images"

BROKEN_QUERY = """
query($q: String!) {
  products(first: 5, query: $q) {
    nodes {
      id handle title vendor
      media(first: 20) { nodes { ... on MediaImage { status } } }
    }
  }
}
"""

STAGED_UPLOADS = """
mutation($input: [StagedUploadInput!]!) {
  stagedUploadsCreate(input: $input) {
    stagedTargets { url resourceUrl parameters { name value } }
    userErrors { field message }
  }
}
"""

DELETE_MEDIA = """
mutation($productId: ID!, $mediaIds: [ID!]!) {
  productDeleteMedia(productId: $productId, mediaIds: $mediaIds) {
    deletedMediaIds
    mediaUserErrors { field message }
  }
}
"""

CREATE_MEDIA = """
mutation($productId: ID!, $media: [CreateMediaInput!]!) {
  productCreateMedia(productId: $productId, media: $media) {
    media { ... on MediaImage { id } }
    mediaUserErrors { field message }
  }
}
"""

MEDIA_IDS = """
query($q: String!) {
  products(first: 5, query: $q) {
    nodes { handle media(first: 30) { nodes { id } } }
  }
}
"""


def slug(s: str) -> str:
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", s.lower())).strip("-")


# handle -> the local files that belong on it. Piquant's split listings are
# named <product>-<colour>, and their photographs <style>-<colour>[-back].
PIQUANT_STYLES = {
    "piquant-girls-high-collar-lace-t-shirt": "lace",
    "piquant-full-sleeve-normal-collar-t-shirt": "fs-normal",
    "piquant-full-sleeve-high-collar-t-shirt": "fs-high",
    "piquant-half-sleeve-normal-collar-t-shirt": "hs-normal",
}


def piquant_files(handle: str) -> list[Path]:
    for base, style in PIQUANT_STYLES.items():
        if handle == base:
            colour = None
        elif handle.startswith(base + "-"):
            colour = handle[len(base) + 1:]
        else:
            continue
        if colour is None:
            return []
        front = PIQUANT_IMAGES / f"{style}-{colour}.jpg"
        back = PIQUANT_IMAGES / f"{style}-{colour}-back.jpg"
        return [p for p in (front, back) if p.exists()]
    return []


def multipart(fields, content: bytes, filename: str):
    boundary = uuid.uuid4().hex
    sep = f"--{boundary}".encode()
    parts = []
    for name, value in fields:
        parts += [sep, f'Content-Disposition: form-data; name="{name}"'.encode(), b"", value.encode()]
    parts += [
        sep,
        f'Content-Disposition: form-data; name="file"; filename="{filename}"'.encode(),
        b"Content-Type: image/jpeg", b"", content,
        f"--{boundary}--".encode(), b"",
    ]
    return b"\r\n".join(parts), f"multipart/form-data; boundary={boundary}"


def upload(client: ShopifyClient, paths: list[Path]) -> list[str]:
    res = client.query(STAGED_UPLOADS, {"input": [
        {"filename": p.name, "mimeType": mimetypes.guess_type(p.name)[0] or "image/jpeg",
         "httpMethod": "POST", "resource": "IMAGE"} for p in paths]})
    payload = (res.get("data") or {}).get("stagedUploadsCreate") or {}
    if res.get("errors") or payload.get("userErrors"):
        raise SystemExit(f"staged upload failed: {res.get('errors') or payload['userErrors']}")
    urls = []
    for path, target in zip(paths, payload["stagedTargets"]):
        body, ctype = multipart([(p["name"], p["value"]) for p in target["parameters"]],
                                path.read_bytes(), path.name)
        req = urllib.request.Request(target["url"], data=body,
                                     headers={"Content-Type": ctype}, method="POST")
        with urllib.request.urlopen(req, timeout=60) as resp:
            if resp.status not in (200, 201, 204):
                raise SystemExit(f"upload of {path.name} failed: HTTP {resp.status}")
        urls.append(target["resourceUrl"])
    return urls


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--only", help="restrict to a vendor, e.g. piquant")
    args = ap.parse_args()
    client = ShopifyClient(load_env())

    broken = json.load(open(HERE / "split_colours_state.json"))
    handles = [m["handle"] for row in broken["split"] for m in row["made"]]

    plan, no_source = [], []
    for h in handles:
        nodes = client.query(BROKEN_QUERY, {"q": f"handle:{h}"})["data"]["products"]["nodes"]
        node = next((n for n in nodes if n["handle"] == h), None)
        if not node:
            continue
        if any(m.get("status") == "READY" for m in node["media"]["nodes"]):
            continue  # already has a working photograph
        if args.only and args.only.lower() not in node["vendor"].lower():
            continue
        files = piquant_files(h)
        (plan if files else no_source).append(
            {"id": node["id"], "handle": h, "title": node["title"],
             "vendor": node["vendor"], "files": files})

    print(f"{len(plan)} listings can be restored from files on disk")
    for p in plan:
        print(f"   {p['title'][:52]:52s} {[f.name for f in p['files']]}")
    if no_source:
        print(f"\n{len(no_source)} have no local source and need their supplier:")
        for p in no_source:
            print(f"   {p['vendor'][:14]:14s} {p['title'][:56]}")

    if not args.apply:
        print("\nDry run. Nothing written. Re-run with --apply.")
        return 0

    done = 0
    for i, p in enumerate(plan, 1):
        # Clear the failed placeholders first, or the product keeps them
        # alongside the good ones.
        got = client.query(MEDIA_IDS, {"q": f"handle:{p['handle']}"})["data"]["products"]["nodes"]
        old = [m["id"] for n in got if n["handle"] == p["handle"] for m in n["media"]["nodes"]]
        if old:
            client.query(DELETE_MEDIA, {"productId": p["id"], "mediaIds": old})

        urls = upload(client, p["files"])
        r = client.query(CREATE_MEDIA, {
            "productId": p["id"],
            "media": [{"originalSource": u, "mediaContentType": "IMAGE", "alt": p["title"]}
                      for u in urls],
        })
        payload = (r.get("data") or {}).get("productCreateMedia") or {}
        errs = r.get("errors") or payload.get("mediaUserErrors")
        if errs:
            print(f"[{i}/{len(plan)}] FAILED {p['handle']}: {str(errs)[:140]}")
            continue
        done += 1
        print(f"[{i}/{len(plan)}] {p['handle']}: {len(urls)} photographs")

    print(f"\n{done} restored.")
    ping()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
