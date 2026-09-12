// Which product's photograph fronts each category tile.
//
// By default a category shows the first product in it that has a photograph,
// which is arbitrary -- fine for a tile, but not always the most flattering
// shot. Pin a better one here by product handle (the last part of its
// /marketplace/product/... URL) and the tile will use that instead.
//
// A handle that no longer exists, or a product whose photography hasn't landed
// yet, is ignored rather than breaking the tile.
export const categoryTileProduct: Record<string, string> = {
  // The first saddle in the catalogue is a saddle *cover* -- a red quilted bag,
  // which is a poor face for the category. Pin an actual saddle.
  saddle: "cwd-saddle-dynamick-2gs-x-tend-fc-bl-17-2c",
};

// Shopify's CDN resizes on request. Tiles are never rendered wider than about
// 600px, so asking for the full-size original wastes most of the download.
export function shopifyImage(url: string, width: number): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}width=${width}`;
}
