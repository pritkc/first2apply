export function Navbar({ isHidden = false }: { isHidden?: boolean }) {
  return (
    <nav
      className={`h-12 xs:h-20 border-b border-muted-foreground/20 ${
        isHidden && "hidden"
      }`}
    />
  );
}
