export const PRODUCT_FIELDS_FRAGMENT = /* GraphQL */ `
  fragment ProductFields on Product {
    handle
    title
    vendor
    tags
    featuredImage {
      url
      altText
    }
    variants(first: 250) {
      edges {
        node {
          sku
          price {
            amount
          }
          selectedOptions {
            name
            value
          }
        }
      }
    }
  }
`;

export const PRODUCT_BY_HANDLE_QUERY = /* GraphQL */ `
  ${PRODUCT_FIELDS_FRAGMENT}
  query ProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      ...ProductFields
      description
      # Only the detail page shows a gallery, so this sits here rather than in
      # the shared fragment, which every listing query also pays for.
      images(first: 24) {
        edges {
          node {
            url
            altText
          }
        }
      }
      # Aliased so it does not collide with the fragment's own variants, and
      # kept out of the fragment because a listing would then fetch a photo
      # for every variant of every product it shows.
      variantPhotos: variants(first: 250) {
        nodes {
          image {
            url
          }
          selectedOptions {
            name
            value
          }
        }
      }
    }
  }
`;

export const COLLECTION_BY_HANDLE_QUERY = /* GraphQL */ `
  query CollectionByHandle($handle: String!) {
    collectionByHandle(handle: $handle) {
      handle
      title
    }
  }
`;

export const COLLECTION_PRODUCTS_QUERY = /* GraphQL */ `
  ${PRODUCT_FIELDS_FRAGMENT}
  query CollectionProducts($handle: String!, $first: Int!, $after: String) {
    collectionByHandle(handle: $handle) {
      title
      products(first: $first, after: $after) {
        edges {
          node {
            ...ProductFields
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

export const COLLECTIONS_QUERY = /* GraphQL */ `
  query Collections($first: Int!, $after: String) {
    collections(first: $first, after: $after) {
      edges {
        node {
          handle
          title
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// Every product from one brand. Shopify's vendor: filter wants the value in
// single quotes so multi-word brands ("Kep Italia") match as one term rather
// than as two loose words.
export const PRODUCTS_BY_VENDOR_QUERY = /* GraphQL */ `
  ${PRODUCT_FIELDS_FRAGMENT}
  query ProductsByVendor($query: String!, $first: Int!, $after: String) {
    products(first: $first, after: $after, query: $query) {
      edges {
        node {
          ...ProductFields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// The most recently added products, straight from Shopify's own ordering, so
// "New in" means what it says rather than whichever products happen to come
// back first. Same node shape as the vendor query, because the cards on the
// homepage need prices and variants like any other.
export const NEW_PRODUCTS_QUERY = /* GraphQL */ `
  ${PRODUCT_FIELDS_FRAGMENT}
  query NewProducts($first: Int!) {
    products(first: $first, sortKey: CREATED_AT, reverse: true) {
      edges {
        node {
          ...ProductFields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// Lean pass over the full catalogue — handle + tags only, no variants/images.
// Backs both getAllProductSlugs() (reads .handle) and getTopCategories() (reads .tags),
// since a shared query lets identical page fetches hit Next's fetch cache for both callers.
export const PRODUCTS_LEAN_QUERY = /* GraphQL */ `
  query ProductsLean($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      edges {
        node {
          handle
          title
          tags
          vendor
          featuredImage {
            url
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;
