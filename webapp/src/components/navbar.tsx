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
    { name: 'Jobs', path: '/', icon: <HomeIcon className="h-6 w-6 md:h-7 md:w-7" />, isMobile: true },
    {
      name: 'Searches',
      path: '/links',
      icon: <MagnifyingGlassIcon className="h-6 w-6 md:h-7 md:w-7" />,
      isMobile: true,
    },
    {
      name: 'Filters',
      path: '/filters',
      icon: <Crosshair2Icon className="h-6 w-6 md:h-7 md:w-7" />,
      isMobile: true,
    },
    {
      name: 'Feedback',
      path: '/feedback',
      icon: <ChatBubbleIcon className="h-6 w-6 md:h-7 md:w-7" />,
      isMobile: false,
    },
    {
      name: 'Settings',
      path: '/settings',

      icon: (
        <div className="relative">
          <GearIcon className="h-6 w-6 md:h-7 md:w-7" />
          {hasUpdate && <div className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full bg-destructive"></div>}
        </div>
      ),
      isMobile: true,
    },
    {
      name: 'Help',
      path: '/help',
      icon: <QuestionMarkCircledIcon className="h-6 w-6 md:h-7 md:w-7" />,
      isMobile: false,
    },
  ];

  const Logo = () =>
    isScanning ? <RefreshCw className="h-7 w-7 animate-spin" /> : <Icons.logo className="h-7 w-7"></Icons.logo>;

  return (
    <header className="fixed bottom-0 z-50 h-14 w-full border-t border-muted-foreground/10 bg-background md:sticky md:top-0 md:border-b md:bg-gradient-to-b md:from-background md:to-background/80 md:backdrop-blur-sm">
      <nav className="mx-auto flex h-full w-full max-w-md items-center justify-between md:max-w-[1536px] md:p-5">
        <div className="flex flex-1 items-center justify-between gap-2 px-2 xxs:gap-4 xxs:px-8 md:flex-none md:gap-6 md:px-0">
          <Link href={isScanning ? '/links' : '/'} className="hidden items-center gap-2 md:flex">
            <Logo />
            <span className="text-lg font-bold tracking-tight">{isScanning ? 'scanning ...' : 'first 2 apply'}</span>
          </Link>

          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.path}
              className={`relative flex flex-1 flex-col items-center gap-0.5 md:flex-none md:flex-row md:gap-3 md:p-1 md:duration-200 md:after:absolute md:after:bottom-0 md:after:right-0 md:after:block md:after:h-0.5 md:after:w-0 md:after:bg-primary md:after:transition-all md:after:content-[''] md:hover:text-primary md:hover:after:w-full ${
                pathname === item.path && 'text-primary'
              } ${!item.isMobile && 'hidden md:block'}`}
            >
              <div className="md:hidden">{item.icon}</div>
              <p className="text-[10px] md:text-base">{item.name}</p>
            </Link>
          ))}
        </div>

        {/* theme toggle */}
        <TooltipProvider delayDuration={500}>
          <Tooltip>
            <TooltipTrigger className="hidden md:block">
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
  );
}
