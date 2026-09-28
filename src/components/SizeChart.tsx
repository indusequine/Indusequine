import type { SizeRow } from "@/data/sizeCharts";

type SizeChartProps = {
  rows: SizeRow[];
};

/**
 * The garment's measurements, folded away until asked for.
 *
 * Most riders know their size and want the colour and the price; the numbers
 * only matter to the one deciding between Teens M and Men M. So it announces
 * itself and stays shut.
 *
 * Built on <details>, so it opens without any JavaScript, keeps this a server
 * component, and is already what a screen reader expects of a disclosure.
 */
export function SizeChart({ rows }: SizeChartProps) {
  return (
    <details className="group mt-8 border-t border-forest/10 pt-6">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 [&::-webkit-details-marker]:hidden">
        <span className="eyebrow text-brass-deep">Size guide</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className="shrink-0 text-forest transition-transform duration-300 ease-out group-open:rotate-180 motion-reduce:transition-none"
        >
          <path
            d="M3 6 L8 11 L13 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>

      <p className="mt-4 text-sm text-stone">
        Measured flat, in centimetres. Length runs from the collar seam to the hem,
        shoulder from seam to seam.
      </p>

      <table className="mt-4 w-full max-w-md border-collapse text-sm">
        <thead>
          <tr className="border-b border-forest/20 text-left">
            <th scope="col" className="py-2 pr-4 font-semibold text-forest-deep">
              Size
            </th>
            <th scope="col" className="py-2 pr-4 text-right font-semibold text-forest-deep">
              Length
            </th>
            <th scope="col" className="py-2 text-right font-semibold text-forest-deep">
              Shoulder
            </th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map((row) => (
            <tr key={row.size} className="border-b border-forest/10">
              <th scope="row" className="py-2 pr-4 text-left font-normal text-charcoal">
                {row.size}
              </th>
              <td className="py-2 pr-4 text-right text-charcoal">{row.length}</td>
              <td className="py-2 text-right text-charcoal">{row.shoulder}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
