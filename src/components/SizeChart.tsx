import type { SizeRow } from "@/data/sizeCharts";

type SizeChartProps = {
  rows: SizeRow[];
};

/**
 * The garment's measurements, sitting open on the page.
 *
 * Not behind a link or a fold: a rider choosing between Teens M and Men M is
 * comparing two numbers, and hiding them behind a click is how a shirt comes
 * back. Digits are tabular so the columns line up down the table.
 */
export function SizeChart({ rows }: SizeChartProps) {
  return (
    <section className="mt-10" aria-labelledby="size-chart">
      <h2 id="size-chart" className="eyebrow text-brass-deep">
        Size guide
      </h2>
      <p className="mt-2 text-sm text-stone">
        Measured flat, in centimetres. Length runs from the collar seam to the hem,
        shoulder from seam to seam.
      </p>

      <table className="mt-4 w-full max-w-md border-collapse text-sm">
        <thead>
          <tr className="border-b border-forest/20 text-left">
            <th scope="col" className="py-2 pr-4 font-semibold text-forest-deep">
              Size
            </th>
            <th scope="col" className="py-2 pr-4 font-semibold text-forest-deep text-right">
              Length
            </th>
            <th scope="col" className="py-2 font-semibold text-forest-deep text-right">
              Shoulder
            </th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map((row) => (
            <tr key={row.size} className="border-b border-forest/10">
              <th scope="row" className="py-2 pr-4 font-normal text-charcoal text-left">
                {row.size}
              </th>
              <td className="py-2 pr-4 text-charcoal text-right">{row.length}</td>
              <td className="py-2 text-charcoal text-right">{row.shoulder}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
