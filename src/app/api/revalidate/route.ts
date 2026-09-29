import { revalidatePath } from "next/cache";

/**
 * Refresh the catalogue pages on demand, so a change in Shopify shows at once.
 *
 * Every page that reads Shopify is cached for an hour, which is right for
 * traffic but wrong for editing: merging a product or fixing a price left the
 * old version on the site until the hour was up. The scripts that change
 * Shopify call this when they finish instead.
 *
 * Called with a secret, because anything that can clear the cache of 800 pages
 * should not be reachable by anyone who guesses the URL.
 *
 *     curl -X POST https://<site>/api/revalidate \
 *       -H "content-type: application/json" \
 *       -d '{"secret": "...", "paths": ["/marketplace/product/some-handle"]}'
 *
 * With no paths it refreshes everything the catalogue touches, which is what a
 * merge or a recategorisation needs: those move products between pages, so the
 * pages they left are as stale as the ones they arrived on.
 */

// Route patterns need their type; a literal path must not have one.
const CATALOGUE: [string, ("page" | "layout")?][] = [
  ["/"],
  ["/marketplace"],
  ["/marketplace/brands"],
  ["/search"],
  ["/marketplace/product/[slug]", "page"],
  ["/marketplace/category/[slug]", "page"],
  ["/marketplace/brand/[slug]", "page"],
  ["/marketplace/brand/[slug]/[category]", "page"],
  ["/marketplace/group/[slug]", "page"],
];

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return Response.json({ error: "revalidation is not configured" }, { status: 503 });
  }

  let body: { secret?: string; paths?: string[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "expected a JSON body" }, { status: 400 });
  }

  if (body.secret !== secret) {
    return Response.json({ error: "wrong secret" }, { status: 401 });
  }

  const paths = body.paths?.length
    ? body.paths.map((p): [string, ("page" | "layout")?] => [p])
    : CATALOGUE;

  for (const [path, type] of paths) {
    revalidatePath(path, type);
  }

  return Response.json({ revalidated: paths.map(([p]) => p), at: Date.now() });
}
