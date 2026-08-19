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

// Lean pass over the full catalogue — handle + tags only, no variants/images.
// Backs both getAllProductSlugs() (reads .handle) and getTopCategories() (reads .tags),
// since a shared query lets identical page fetches hit Next's fetch cache for both callers.
export const PRODUCTS_LEAN_QUERY = /* GraphQL */ `
  query ProductsLean($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      edges {
        node {
          handle
          tags
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;
