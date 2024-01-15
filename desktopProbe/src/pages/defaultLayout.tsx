import { cn } from "@/lib/utils";
import { Navbar } from "./navbar";

/**
 * Default layout for all pages
 */
export function DefaultLayout({
  isNavbarHidden,
  className,
  children,
}: {
  isNavbarHidden?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar isHidden={isNavbarHidden} />
      <main className={cn("min-h-screen max-w-7xl mx-auto", className)}>
        {children}
      </main>
    </>
  );
}
