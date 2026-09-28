// Shopify's CDN resizes on request. Without a width it serves the original --
// product shots in this catalogue run to 2161x3797, which the browser then has
// to decode at full size and scale down into a 377px box. That decode happens
// on the main thread, so a grid of them is what makes scrolling stutter.
//
// Ask for roughly twice the displayed width, which covers 2x screens.
export function shopifyImage(url: string, width: number): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}width=${width}`;
}
