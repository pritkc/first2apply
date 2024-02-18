import { cn } from "@/lib/utils";
import { Navbar } from "../components/navbar";

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
      <main className="ml-16 md:ml-20 xl:ml-56">
        <div className={cn("min-h-screen mx-auto max-w-[1536px]", className)}>
          {children}
        </div>
      </main>
    </>
  );
}
