export type ShopifyMoney = { amount: string };

export type ShopifySelectedOption = { name: string; value: string };

export type ShopifyVariantNode = {
  sku: string;
  price: ShopifyMoney;
  selectedOptions: ShopifySelectedOption[];
};

export type ShopifyProductNode = {
  handle: string;
  title: string;
  vendor: string;
  tags: string[];
  featuredImage: { url: string; altText: string | null } | null;
  variants: { edges: { node: ShopifyVariantNode }[] };
};

export type ShopifyProductLeanNode = {
  handle: string;
  tags: string[];
};

export type ShopifyCollectionNode = { handle: string; title: string };

export type ShopifyPageInfo = { hasNextPage: boolean; endCursor: string | null };

export type ShopifyConnection<TNode> = {
  edges: { node: TNode }[];
  pageInfo: ShopifyPageInfo;
};

export type ProductByHandleData = { productByHandle: ShopifyProductNode | null };

export type CollectionByHandleData = { collectionByHandle: ShopifyCollectionNode | null };

export type CollectionProductsData = {
  collectionByHandle: { title: string; products: ShopifyConnection<ShopifyProductNode> } | null;
};

export type CollectionsData = { collections: ShopifyConnection<ShopifyCollectionNode> };

export type ProductsLeanData = { products: ShopifyConnection<ShopifyProductLeanNode> };
