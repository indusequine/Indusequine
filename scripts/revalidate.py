#!/usr/bin/env python3
"""Tell the site a catalogue change has happened, so it stops serving the old one.

Every page that reads Shopify is cached for an hour. That is right for traffic
and wrong for editing: a merge or a price fix sat behind the old page until the
hour was up, which read as the change not having worked.

Import `ping` at the end of a script that writes to Shopify, or run this file
by hand.

    python3 scripts/revalidate.py
    python3 scripts/revalidate.py /marketplace/product/freejump-spur-one-disc

Reads SITE_URL and REVALIDATE_SECRET from .env, or the environment in CI. With
neither set it says so and does nothing, rather than failing the run that just
succeeded.
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SITE = "https://indusequine-indus9.vercel.app"


def config() -> tuple[str, str | None, str | None]:
    env = {}
    path = ROOT / ".env"
    if path.exists():
        for line in path.read_text().splitlines():
            line = line.strip()
            if line and "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    site = os.environ.get("SITE_URL") or env.get("SITE_URL") or DEFAULT_SITE
    secret = os.environ.get("REVALIDATE_SECRET") or env.get("REVALIDATE_SECRET")
    bypass = os.environ.get("VERCEL_BYPASS_SECRET") or env.get("VERCEL_BYPASS_SECRET")
    return site.rstrip("/"), secret, bypass


def ping(paths: list[str] | None = None) -> bool:
    """Refresh the catalogue pages, or just the ones given. True if it worked."""
    site, secret, bypass = config()
    if not secret:
        print("note: REVALIDATE_SECRET is not set, so the site still has its old "
              "pages for up to an hour. Add it to .env to refresh immediately.")
        return False

    headers = {"Content-Type": "application/json"}
    # The deployment sits behind Vercel's login wall, which answers a script
    # with a 401 of its own long before the request reaches the site. This is
    # the header Vercel provides to let automation through while people still
    # meet the wall.
    if bypass:
        headers["x-vercel-protection-bypass"] = bypass

    body = json.dumps({"secret": secret, **({"paths": paths} if paths else {})}).encode()
    req = urllib.request.Request(
        # The site sets trailingSlash, and a POST does not survive the
        # 308 it answers with, so ask for the slashed path directly.
        f"{site}/api/revalidate/", data=body,
        headers=headers, method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            done = json.loads(resp.read()).get("revalidated", [])
        print(f"refreshed {len(done)} path{'' if len(done) == 1 else 's'} on {site}")
        return True
    except urllib.error.HTTPError as e:
        detail = e.read().decode()[:200]
        if "vercel_auth_enabled" in detail:
            detail = ("blocked by Vercel's Deployment Protection. Set "
                      "VERCEL_BYPASS_SECRET in .env from Settings -> Deployment "
                      "Protection -> Protection Bypass for Automation.")
        print(f"could not refresh the site: HTTP {e.code} {detail}")
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        print(f"could not reach the site to refresh it: {e}")
    return False


if __name__ == "__main__":
    raise SystemExit(0 if ping(sys.argv[1:] or None) else 1)
