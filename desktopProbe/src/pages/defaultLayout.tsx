/**
 * Default layout for all pages
 */
export function DefaultLayout({ children }: { children: React.ReactNode }) {
  return <main className="container min-h-screen">{children}</main>;
}
