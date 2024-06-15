import { Icons } from '@/components/icons';
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
import { useTheme } from 'next-themes';
import { Link, useLocation } from 'react-router-dom';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

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
    icon: <GearIcon className="h-7 w-7" />,
  },
  {
    name: 'Help',
    path: '/help',
    icon: <QuestionMarkCircledIcon className="h-7 w-7" />,
  },
];

export function Navbar() {
  // Hook to get the current location
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  return (
    <nav className="fixed z-50 flex h-screen w-16 flex-col items-center justify-between border-r border-muted-foreground/20 py-6 md:p-10 2xl:w-56 2xl:items-start">
      <div className="flex flex-col items-center gap-6 2xl:items-start">
        <Link to="/" className="mb-16 flex gap-3 md:mb-20">
          <Icons.logo className="h-7 w-7"></Icons.logo>
          <span className="hidden text-lg 2xl:inline-block">First 2 Apply</span>
        </Link>

        {navItems.map((item) => (
          <TooltipProvider delayDuration={500} key={item.name}>
            <Tooltip>
              <TooltipTrigger>
                <Link
                  key={item.name}
                  to={item.path}
                  className={`after:transition-width relative flex items-center gap-3 p-1 duration-200 after:absolute after:bottom-0 after:right-0 after:block after:h-0.5 after:w-0 after:bg-primary after:transition-all after:content-[''] hover:text-primary hover:after:w-full ${
                    location.pathname === item.path && 'text-primary'
                  }`}
                >
                  {item.icon}
                  <span className="hidden text-lg 2xl:inline-block">{item.name}</span>
                </Link>
              </TooltipTrigger>

              <TooltipContent side="right" className="text-base 2xl:hidden">
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
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-3 p-1 hover:text-primary"
            >
              {theme === 'dark' ? <SunIcon className="h-7 w-7" /> : <MoonIcon className="h-7 w-7" />}
              <span className="hidden text-lg 2xl:inline-block">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </TooltipTrigger>

          <TooltipContent side="right" className="text-base 2xl:hidden">
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </nav>
  );
}
