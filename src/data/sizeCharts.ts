/** Garment measurements, shown as a table on the product page.
 *
 *  Apparel is the one thing a rider cannot judge from a photograph, and our
 *  sizes are not letters anyone can map to a body: "Teens M" is a different
 *  garment from "Men M". So the numbers belong on the page, not in a link a
 *  supplier's copy happens to mention.
 *
 *  Keyed by product handle, because measurements come per garment rather than
 *  per category, and only the products that have them get a table. Piquant's
 *  are read off page 10 of their brand catalogue. Generated from
 *  scripts/piquant/catalogue.json, so the two cannot drift apart.
 */
export type SizeRow = {
  size: string;
  length: number;   // cm, collar seam to hem
  shoulder: number; // cm, seam to seam
};

const CHARTS: Record<string, SizeRow[]> = {
  "piquant-girls-high-collar-lace-t-shirt": [
      { size: "Kids M", length: 50, shoulder: 32 },
      { size: "Kids L", length: 52, shoulder: 34 },
      { size: "Kids XL", length: 54, shoulder: 36 },
      { size: "Teens XS", length: 63, shoulder: 36 },
      { size: "Teens S", length: 65, shoulder: 38 },
      { size: "Teens M", length: 67, shoulder: 40 },
      { size: "Teens L", length: 69, shoulder: 42 },
  ],
  "piquant-full-sleeve-normal-collar-t-shirt": [
      { size: "Kids M", length: 50, shoulder: 32 },
      { size: "Kids L", length: 52, shoulder: 34 },
      { size: "Kids XL", length: 54, shoulder: 36 },
      { size: "Teens S", length: 63, shoulder: 39 },
      { size: "Teens M", length: 65, shoulder: 41 },
      { size: "Men S", length: 65, shoulder: 38 },
      { size: "Men M", length: 67, shoulder: 40 },
      { size: "Men L", length: 69, shoulder: 42 },
      { size: "Men XL", length: 71, shoulder: 44 },
  ],
  "piquant-full-sleeve-high-collar-t-shirt": [
      { size: "Kids M", length: 50, shoulder: 32 },
      { size: "Kids L", length: 52, shoulder: 34 },
      { size: "Kids XL", length: 54, shoulder: 36 },
      { size: "Teens XS", length: 63, shoulder: 36 },
      { size: "Teens S", length: 65, shoulder: 38 },
      { size: "Teens M", length: 67, shoulder: 40 },
      { size: "Teens L", length: 69, shoulder: 42 },
  ],
  "piquant-half-sleeve-normal-collar-t-shirt": [
      { size: "Kids M", length: 50, shoulder: 32 },
      { size: "Kids L", length: 52, shoulder: 34 },
      { size: "Kids XL", length: 54, shoulder: 36 },
      { size: "Teens S", length: 63, shoulder: 39 },
      { size: "Teens M", length: 65, shoulder: 41 },
      { size: "Men S", length: 65, shoulder: 38 },
      { size: "Men M", length: 67, shoulder: 40 },
      { size: "Men L", length: 69, shoulder: 42 },
      { size: "Men XL", length: 71, shoulder: 44 },
  ],
};

export function sizeChartFor(handle: string): SizeRow[] | undefined {
  return CHARTS[handle];
}
