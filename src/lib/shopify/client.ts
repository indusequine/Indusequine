import "server-only";

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_STOREFRONT_API_TOKEN;
const API_VERSION = "2026-01";

if (!DOMAIN || !TOKEN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_STOREFRONT_API_TOKEN");
}

const ENDPOINT = `https://${DOMAIN}/api/${API_VERSION}/graphql.json`;

export const REVALIDATE_SECONDS = 3600;

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

export async function shopifyFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
  revalidate: number = REVALIDATE_SECONDS,
): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Shopify-Storefront-Private-Token": TOKEN!,
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error(`Shopify Storefront API ${res.status}: ${res.statusText}`);
  }

  const json = (await res.json()) as GraphQLResponse<T>;
  if (json.errors?.length) {
    throw new Error(`Shopify GraphQL error: ${json.errors.map((e) => e.message).join("; ")}`);
  }
  if (!json.data) {
    throw new Error("Shopify GraphQL response had no data");
  }
  return json.data;
}

type Page<TNode> = { nodes: TNode[]; hasNextPage: boolean; endCursor: string | null };

export async function fetchAllPages<TNode>(
  fetchPage: (cursor: string | null) => Promise<Page<TNode>>,
): Promise<TNode[]> {
  const all: TNode[] = [];
  let cursor: string | null = null;
  do {
    const page: Page<TNode> = await fetchPage(cursor);
    all.push(...page.nodes);
    cursor = page.hasNextPage ? page.endCursor : null;
  } while (cursor);
  return all;
}
