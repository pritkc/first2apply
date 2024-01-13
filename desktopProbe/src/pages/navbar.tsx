import { Link, useLocation } from "react-router-dom";

const navItems = [
  { name: "Jobs", path: "/" },
  { name: "Searches", path: "/links" },
  { name: "Settings", path: "/settings" },
];

export function Navbar({ isHidden = false }: { isHidden?: boolean }) {
  const location = useLocation(); // Hook to get the current location

  return (
    <header
      className={`h-14 border-b border-muted-foreground/20 ${
        isHidden ? "hidden" : ""
      }`}
    >
      <nav className="h-full max-w-7xl mx-auto px-6 md:px-10 xl:px-0 flex justify-between items-center">
        {/* Needs improvement */}
        <p className="text-lg text-primary font-medium">First 2 Apply</p>
        <div className="flex gap-4 md:gap-6 items-center">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`hover:text-primary relative after:content-[''] after:block after:absolute after:w-0 after:h-0.5 after:bg-primary after:transition-all hover:after:w-full after:right-0 after:bottom-0 after:transition-width duration-200 p-1 ${
                location.pathname === item.path && "text-primary"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
