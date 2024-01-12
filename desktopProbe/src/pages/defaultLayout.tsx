import { cn } from "@/lib/utils";

/**
 * Default layout for all pages
 */
export function DefaultLayout({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <main className={cn("min-h-screen", className)}>{children}</main>;
}
