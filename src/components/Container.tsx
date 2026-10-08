import { ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
  className?: string;
  size?: "narrow" | "default" | "wide" | "fluid";
};

/**
 * `narrow`, `default` and `wide` stop at a fixed width, which is what running
 * text wants: a line that keeps growing stops being readable.
 *
 * `fluid` has no ceiling. It is for the shop - rows of tiles and grids of
 * products, which have no reading width to protect and which looked stranded
 * in a 1,200px column on a large monitor, with more than half the screen
 * empty. Its gutter grows with the screen instead, so the edges stay generous
 * at any size rather than being the same 40px on a laptop and a 32-inch
 * display.
 */
const GUTTER = "md:[padding-inline:max(2.5rem,4.5vw)]";

export function Container({ children, className = "", size = "default" }: ContainerProps) {
  const sizes = {
    narrow: "max-w-3xl",
    default: "max-w-6xl",
    wide: "max-w-7xl",
    fluid: GUTTER,
  };
  return (
    <div className={`mx-auto w-full px-6 md:px-10 ${sizes[size]} ${className}`}>
      {children}
    </div>
  );
}
