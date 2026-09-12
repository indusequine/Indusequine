// Scopes the Emmers palette experiment to the marketplace. Every page under
// /marketplace inherits it; the header and footer sit outside this layout, in
// the root, so they keep the site palette.
export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="theme-emmers">{children}</div>;
}
