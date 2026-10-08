import type { ReactNode } from "react";
import Link from "next/link";
import { Container } from "@/components/Container";

/**
 * A row you drag sideways, the way nike.in builds its homepage out of them.
 *
 * It replaces a stack of full-width blocks, where a banner and one product took
 * a screen each before a rider saw a single category. A rail shows a little
 * over two tiles on a phone: the third one cut off at the edge is what tells
 * somebody there is more, without a word of instruction or an arrow to press.
 *
 * The heading sits inside the page's container so it lines up with everything
 * else, while the row itself runs past the gutter to the edge of the screen.
 */
export function Rail({
  title,
  href,
  linkLabel = "See all",
  wide,
  desktopOnly,
  phoneOnly,
  children,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  /** Fewer, larger tiles -- for the four groups rather than sixty categories. */
  wide?: boolean;
  /** Kept off a phone, where the front page is meant to be short. */
  desktopOnly?: boolean;
  /** Kept off a laptop, where the header already does this job. */
  phoneOnly?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={`rail-section${desktopOnly ? " hidden md:block" : ""}${phoneOnly ? " md:hidden" : ""}`}
    >
      <Container size="fluid">
        <div className="home__head">
          <h2>{title}</h2>
          {href && <Link href={href}>{linkLabel}</Link>}
        </div>
      </Container>
      <div className={`rail${wide ? " rail--wide" : ""}`}>{children}</div>
    </section>
  );
}
