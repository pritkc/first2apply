'use client';

import { Icons } from '@/components/icons';
import { useAppState } from '@/hooks/appState';
import {
  ChatBubbleIcon,
  Crosshair2Icon,
  GearIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  QuestionMarkCircledIcon,
  SunIcon,
} from '@radix-ui/react-icons';
import { RefreshCw } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

export function Navbar() {
  // Hook to get the current location
  const { theme, setTheme } = useTheme();
  const { isScanning, newUpdate } = useAppState();
  const pathname = usePathname();

  const hasUpdate = !!newUpdate;

  const navItems = [
    { name: 'Jobs', path: '/', icon: <HomeIcon className="h-7 w-7" /> },
    {
      name: 'Searches',
      path: '/links',
      icon: <MagnifyingGlassIcon className="h-7 w-7" />,
    },
    {
      name: 'Filters',
      path: '/filters',
      icon: <Crosshair2Icon className="h-7 w-7" />,
    },
    {
      name: 'Feedback',
      path: '/feedback',
      icon: <ChatBubbleIcon className="h-7 w-7" />,
    },
    {
      name: 'Settings',
      path: '/settings',

      icon: (
        <div className="relative">
          <GearIcon className="h-7 w-7" />
          {hasUpdate && <div className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full bg-destructive"></div>}
        </div>
      ),
    },
    {
      name: 'Help',
      path: '/help',
      icon: <QuestionMarkCircledIcon className="h-7 w-7" />,
    },
  ];

  const navItemsMobile = [
    { name: 'Jobs', path: '/', icon: <HomeIcon className="h-6 w-6" /> },
    {
      name: 'Searches',
      path: '/links',
      icon: <MagnifyingGlassIcon className="h-6 w-6" />,
    },
    {
      name: 'Filters',
      path: '/filters',
      icon: <Crosshair2Icon className="h-6 w-6" />,
    },
    {
      name: 'Settings',
      path: '/settings',

      icon: (
        <div className="relative">
          <GearIcon className="h-6 w-6" />
          {hasUpdate && <div className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full bg-destructive"></div>}
        </div>
      ),
    },
  ];

  const Logo = () =>
    isScanning ? <RefreshCw className="h-7 w-7 animate-spin" /> : <Icons.logo className="h-7 w-7"></Icons.logo>;

  return (
    <>
      {/* Navbar for screens larger than md */}
      <header className="sticky top-0 z-50 hidden h-14 w-full border-b border-muted-foreground/10 bg-gradient-to-b from-background to-background/80 backdrop-blur-sm md:block">
        <nav className="mx-auto flex h-full w-full max-w-[1536px] items-center justify-between p-5">
          <div className="flex items-center gap-6">
            <Link href={isScanning ? '/links' : '/'} className="flex items-center gap-2">
              <Logo />
              <span className="text-lg font-bold tracking-tight">{isScanning ? 'scanning ...' : 'first 2 apply'}</span>
            </Link>

            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className={`after:transition-width relative flex items-center gap-3 p-1 duration-200 after:absolute after:bottom-0 after:right-0 after:block after:h-0.5 after:w-0 after:bg-primary after:transition-all after:content-[''] hover:text-primary hover:after:w-full ${
                  pathname === item.path && 'text-primary'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* theme toggle */}
          <TooltipProvider delayDuration={500}>
            <Tooltip>
              <TooltipTrigger>
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="flex items-center gap-3 p-1 hover:text-primary"
                >
                  {theme === 'dark' ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
                </button>
              </TooltipTrigger>

              <TooltipContent side="right" className="text-base">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </nav>
      </header>

      {/* Navbar for screens smaller than md */}
      <nav className="fixed bottom-0 z-50 h-14 w-full border-t border-muted-foreground/10 bg-background md:hidden">
        <div className="mx-auto flex h-full w-full max-w-md items-center justify-between gap-2 px-2 xxs:gap-4 xxs:px-8">
          {navItemsMobile.map((item) => (
            <Link
              key={item.name}
              href={item.path}
              className={`relative flex flex-1 flex-col items-center gap-0.5 ${pathname === item.path && 'text-primary'}`}
            >
              {item.icon}
              <p className="text-[10px]">{item.name}</p>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
