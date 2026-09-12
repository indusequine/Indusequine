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

  // These three defaulted to a photograph shot against a dark background, which
  // the tile's multiply blend turned into a dark block. Each of these is the
  // cleanest cut-out in its category, measured across every product in it.
  recovery: "equilibrium-heatsense-massage-pad-35864",
  "horse-shoe": "mustad-equilibrium-air-horse-shoes-horse-shoe",
  downvest: "samshield-avoriaz-downvest",
};

// Categories where every available photograph has its own background rather
// than being a cut-out on white. Blending those onto the warm ground turns them
// muddy, and letting them float leaves a dark rectangle in the middle of a
// cream well -- so they fill the frame edge to edge instead.
//
// Checked across all 46 categories that have photography: only these two have
// no clean cut-out anywhere in them.
export const categoryTileFill = new Set(["hoodies", "tack"]);
