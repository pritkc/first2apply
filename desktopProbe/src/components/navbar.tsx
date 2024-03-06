import { Link, useLocation } from "react-router-dom";
import { Icons } from "@/components/icons";
import {
  HomeIcon,
  MagnifyingGlassIcon,
  GearIcon,
  QuestionMarkCircledIcon,
  SunIcon,
  MoonIcon,
} from "@radix-ui/react-icons";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "./ui/tooltip";
import { useTheme } from "next-themes";

const navItems = [
  { name: "Jobs", path: "/", icon: <HomeIcon className="w-7 h-7" /> },
  {
    name: "Searches",
    path: "/links",
    icon: <MagnifyingGlassIcon className="w-7 h-7" />,
  },
  {
    name: "Settings",
    path: "/settings",
    icon: <GearIcon className="w-7 h-7" />,
  },
  {
    name: "Help",
    path: "/help",
    icon: <QuestionMarkCircledIcon className="w-7 h-7" />,
  },
];

export function Navbar() {
  // Hook to get the current location
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  return (
    <nav className="z-50 fixed h-screen flex flex-col items-center 2xl:items-start border-r border-muted-foreground/20 w-16 2xl:w-56 py-6 md:p-10 justify-between">
      <div className="flex flex-col gap-6 items-center 2xl:items-start">
        <Link to="/" className="flex gap-3 mb-16 md:mb-20">
          <Icons.logo className="w-7 h-7"></Icons.logo>
          <span className="hidden 2xl:inline-block text-lg">First 2 Apply</span>
        </Link>

        {navItems.map((item) => (
          <TooltipProvider delayDuration={500} key={item.name}>
            <Tooltip>
              <TooltipTrigger>
                <Link
                  key={item.name}
                  to={item.path}
                  className={`hover:text-primary relative flex items-center gap-3 after:content-[''] after:block after:absolute after:w-0 after:h-0.5 after:bg-primary after:transition-all hover:after:w-full after:right-0 after:bottom-0 after:transition-width duration-200 p-1 ${
                    location.pathname === item.path && "text-primary"
                  }`}
                >
                  {item.icon}
                  <span className="hidden 2xl:inline-block text-lg">
                    {item.name}
                  </span>
                </Link>
              </TooltipTrigger>

              <TooltipContent side="right" className="2xl:hidden text-base">
                {item.name}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>

      {/* theme toggle */}
      <TooltipProvider delayDuration={500}>
        <Tooltip>
          <TooltipTrigger>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hover:text-primary flex items-center gap-3 p-1"
            >
              {theme === "dark" ? (
                <SunIcon className="w-7 h-7" />
              ) : (
                <MoonIcon className="w-7 h-7" />
              )}
              <span className="hidden 2xl:inline-block text-lg">
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </span>
            </button>
          </TooltipTrigger>

          <TooltipContent side="right" className="2xl:hidden text-base">
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </nav>
  );
}
