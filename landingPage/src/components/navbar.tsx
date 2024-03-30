import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { scrollToSection } from "@/utils/scrollToSection";
import { Button } from "./ui/button";
import Image from "next/image";
import logoBlack from "../../public/assets/logo-black.png";

const menuItems = [
  { name: "Product", id: "product" },
  { name: "Help", id: "help" },
  { name: "Pricing", id: "pricing" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setHasScrolled(offset > 10);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleMenuItemClick = (id: string, onNavigate?: () => void) => {
    if (router.pathname === "/") {
      scrollToSection(id);
      if (onNavigate) {
        onNavigate();
      }
    } else {
      router.push(`/#${id}`);
    }
  };

  return (
    <>
      {/* Mobile menu */}
      <nav
        className={`fixed z-[100] top-0 left-0 right-0 md:hidden w-full h-14 px-4 flex justify-between items-center ${
          hasScrolled && "border-b dark:border-background"
        } backdrop-blur-md backdrop-filter transition-all duration-100 bg-gradient-to-b from-background to-background/60 dark:to-background/90`}
      >
        <button
          className="flex items-center gap-3"
          onClick={() => handleMenuItemClick("product")}
        >
          <Image
            src={logoBlack}
            alt="logo"
            className="w-auto h-7 dark:hidden"
          />
          {/* <Image
              src={logoWhite}
              alt="logo"
              className="w-auto h-7 hidden dark:block"
            /> */}
          <span className="text-lg font-medium">First 2 Apply</span>
        </button>

        {/* Burger menu */}
        <div
          className={`z-[99999] w-10 h-10 relative flex flex-col justify-center items-center md:hidden focus-visible:outline-none ${
            isOpen ? "gap-0.5" : "gap-2"
          }`}
          onClick={() => setIsOpen(!isOpen)}
        >
          {/* Line 1 */}
          <div
            className={`h-0.5 w-7 bg-foreground transform transition-all duration-300 ease-in-out ${
              isOpen && "rotate-45 translate-y-1"
            }`}
          ></div>

          {/* Line 2 */}
          <div
            className={`h-0.5 w-7 bg-foreground transform transition-all duration-300 ease-in-out ${
              isOpen && "translate-x-full opacity-0"
            }`}
          ></div>

          {/* Line 3 */}
          <div
            className={`h-0.5 w-7 bg-foreground transform transition-all duration-300 ease-in-out ${
              isOpen && "-rotate-45 -translate-y-1"
            }`}
          ></div>
        </div>

        <dialog
          className={`fixed z-[9999] top-0 bg-background flex flex-col items-start gap-6 w-full h-full pl-12 pt-24 md:hidden ${
            !isOpen && "hidden"
          }`}
          open={isOpen}
        >
          {menuItems.map((item) => (
            <button
              key={item.id}
              className="text-xl font-medium"
              onClick={() =>
                handleMenuItemClick(item.id, () => setIsOpen(false))
              }
            >
              {item.name}
            </button>
          ))}
          <Link href="/download" passHref>
            <Button className="h-10 px-3 -ml-3 -mt-2 text-xl">Download</Button>
          </Link>
        </dialog>
      </nav>

      {/* Desktop menu */}
      <nav
        className={`fixed z-[100] hidden md:block w-full h-16 ${
          hasScrolled && "border-b dark:border-background"
        } backdrop-blur-md backdrop-filter transition-all duration-100 bg-background/60 dark:bg-background/90`}
      >
        <div className="flex items-center justify-between w-full max-w-7xl h-full mx-auto px-10">
          <button
            className="flex items-center gap-3"
            onClick={() => handleMenuItemClick("product")}
          >
            <Image
              src={logoBlack}
              alt="logo"
              className="w-auto h-7 dark:hidden"
            />
            {/* <Image
              src={logoWhite}
              alt="logo"
              className="w-auto h-7 hidden dark:block"
            /> */}
            <span className="text-lg font-medium">First 2 Apply</span>
          </button>

          <div className="flex items-center gap-10">
            {menuItems.map((item) => (
              <button
                key={item.id}
                className="relative text-[17px] font-medium tracking-wide hover:text-primary after:content-[''] after:block after:absolute after:w-0 after:h-0.5 after:bg-primary after:transition-all hover:after:w-full after:right-0 after:bottom-0 after:transition-width duration-200 p-1"
                onClick={() => handleMenuItemClick(item.id)}
              >
                {item.name}
              </button>
            ))}
            <Link href="/download" passHref>
              <Button className="h-10 px-3">Download</Button>
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
