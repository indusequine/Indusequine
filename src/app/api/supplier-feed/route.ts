/**
 * Fetch a supplier's public product feed from here, rather than from CI.
 *
 * Shopify rate limits by client address. The syncs run on GitHub runners, whose
 * addresses are shared with every other project on the platform, so the budget
 * is spent before our one request per six hours arrives: Vonamor's feed answers
 * 429 on every attempt and EQUESTRIANS' on most. Nothing is wrong with the
 * request, and retrying cannot help, because a job keeps its address for its
 * whole life.
 *
 * This deployment has an address of its own. So a sync that is refused asks
 * here instead, and the Shopify request leaves from Vercel.
 *
 *     curl -X POST https://<site>/api/supplier-feed/ \
 *       -H "content-type: application/json" \
 *       -d '{"secret": "...", "url": "https://vonamor.in/products.json?limit=250"}'
 *
 * Two things keep this from being an open door. It takes the same secret as
 * revalidation, so it is not reachable by guessing the URL. And it will only
 * fetch from the hosts below: with a secret but no allowlist, anything that
 * came by the secret could read addresses reachable from inside Vercel, which
 * is a far worse thing to hand out than a product feed.
 */

// Exactly the suppliers whose feeds we read. A new supplier is a line here.
const ALLOWED_HOSTS = new Set([
  "vonamor.in",
  "www.vonamor.in",
  "equestrians.in",
  "www.equestrians.in",
  "jlnequestrian.com",
  "www.jlnequestrian.com",
]);

// Their own storefronts serve this; a bare script agent is what Shopify refuses.
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36 " +
  "(Indusequine catalogue sync; +https://indusequine.com)";

const TIMEOUT_MS = 25_000;

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return Response.json({ error: "feed reading is not configured" }, { status: 503 });
  }

  let body: { secret?: string; url?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "expected a JSON body" }, { status: 400 });
  }

  if (body.secret !== secret) {
    return Response.json({ error: "wrong secret" }, { status: 401 });
  }

  let target: URL;
  try {
    target = new URL(body.url ?? "");
  } catch {
    return Response.json({ error: "expected a url" }, { status: 400 });
  }

  if (target.protocol !== "https:") {
    return Response.json({ error: "https only" }, { status: 400 });
  }
  if (!ALLOWED_HOSTS.has(target.hostname)) {
    return Response.json(
      { error: `${target.hostname} is not a supplier this will fetch` },
      { status: 403 },
    );
  }

  const cancel = AbortSignal.timeout(TIMEOUT_MS);
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json, */*" },
      signal: cancel,
      // their feed changes on their schedule, and the sync wants it as it is now
      cache: "no-store",
    });
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    return Response.json({ error: `could not reach ${target.hostname}: ${reason}` },
                         { status: 502 });
  }

  const text = await upstream.text();
  // The upstream status is passed back as data rather than as our own status,
  // so the sync can tell "their feed said 429" from "this route said no".
  return Response.json(
    {
      status: upstream.status,
      contentType: upstream.headers.get("content-type"),
      body: text,
    },
    { status: 200 },
  );
}
