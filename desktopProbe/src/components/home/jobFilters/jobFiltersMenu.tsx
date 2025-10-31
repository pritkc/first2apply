import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLinks } from '@/hooks/links';
import { useSites } from '@/hooks/sites';
import { LABEL_COLOR_CLASSES } from '@/lib/labels';
import { FilterIcon, DownloadIcon, UploadIcon, HeartIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

import { JOB_LABELS } from '../../../../../supabase/functions/_shared/types';
import { getAdvancedMatchingConfig, exportAdvancedMatchingConfig, importAdvancedMatchingConfig } from '@/lib/electronMainSdk';
import { toast } from '@/components/ui/use-toast';

export type JobFiltersType = {
  sites: number[];
  links: number[];
  labels: string[];
  hideLinkedInReposts?: boolean;
};

const ALL_LABELS = Object.values(JOB_LABELS);

/**
 * Job filters menu component.
 */
export function JobFiltersMenu({
  selectedSites,
  selectedLinks,
  selectedLabels,
  onApplyFilters,
}: {
  selectedSites: number[];
  selectedLinks: number[];
  selectedLabels: string[];
  onApplyFilters: (filters: JobFiltersType) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [favoriteCompanies, setFavoriteCompanies] = useState<string[]>([]);

  const { siteLogos, sites } = useSites();
  const { links } = useLinks();

  // Load favorite companies on mount
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const config = await getAdvancedMatchingConfig();
        setFavoriteCompanies(config?.favorite_companies || []);
      } catch (error) {
        console.error('Failed to load favorite companies:', error);
      }
    };
    loadFavorites();
  }, []);

  // Sort sites alphabetically and filter out sites that don't have any links
  const sortedSites = sites
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((site) => links.some((link) => link.site_id === site.id));

  const onSelectSite = (siteId: number) => {
    if (selectedSites.includes(siteId)) {
      onApplyFilters({
        sites: selectedSites.filter((id) => id !== siteId),
        links: selectedLinks,
        labels: selectedLabels,
      });
    } else {
      onApplyFilters({ sites: [...selectedSites, siteId], links: selectedLinks, labels: selectedLabels });
    }
  };

  const onSelectLink = (linkId: number) => {
    if (selectedLinks.includes(linkId)) {
      onApplyFilters({
        sites: selectedSites,
        links: selectedLinks.filter((id) => id !== linkId),
        labels: selectedLabels,
      });
    } else {
      onApplyFilters({ sites: selectedSites, links: [...selectedLinks, linkId], labels: selectedLabels });
    }
  };

  const onSelectLabel = (label: string) => {
    if (selectedLabels.includes(label)) {
      onApplyFilters({
        sites: selectedSites,
        links: selectedLinks,
        labels: selectedLabels.filter((l) => l !== label),
      });
    } else {
      onApplyFilters({ sites: selectedSites, links: selectedLinks, labels: [...selectedLabels, label] });
    }
  };

  const clearSites = () => {
    onApplyFilters({ sites: [], links: selectedLinks, labels: selectedLabels });
  };
  const clearLinks = () => {
    onApplyFilters({ sites: selectedSites, links: [], labels: selectedLabels });
  };
  const clearLabels = () => {
    onApplyFilters({ sites: selectedSites, links: selectedLinks, labels: [] });
  };
  const clearAll = () => {
    onApplyFilters({ sites: [], links: [], labels: [] });
  };

  // Export AI filters configuration
  const handleExportConfig = async () => {
    try {
      await exportAdvancedMatchingConfig();
      toast({
        title: 'AI Filters Exported',
        description: 'Your AI filters configuration has been exported successfully.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export AI filters configuration.',
        variant: 'destructive',
      });
    }
  };

  // Import AI filters configuration
  const handleImportConfig = async () => {
    try {
      const result = await importAdvancedMatchingConfig();
      if ('favorite_companies' in result) {
        setFavoriteCompanies(result.favorite_companies || []);
        toast({
          title: 'AI Filters Imported',
          description: 'Your AI filters configuration has been imported successfully.',
          variant: 'success',
        });
      }
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: 'Failed to import AI filters configuration.',
        variant: 'destructive',
      });
    }
  };

  const activeFilterCount = selectedSites.length + selectedLinks.length + selectedLabels.length;

  return (
    <DropdownMenu open={isOpen} onOpenChange={(opened) => setIsOpen(opened)}>
      <DropdownMenuTrigger
        className={`relative flex h-12 w-12 items-center justify-center rounded-md bg-transparent transition-colors duration-200 ease-in-out hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-0 ${isOpen && 'bg-foreground/10'}`}
        onClick={(evt) => {
          evt.preventDefault();
          evt.stopPropagation();
        }}
      >
        <FilterIcon className="h-auto w-6 text-foreground/90" />
        {activeFilterCount > 0 && (
          <div className="absolute bottom-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-foreground p-0 text-[10px] text-background dark:font-bold">
            {activeFilterCount}
          </div>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" side="right" sideOffset={8} align="start">
        {/* Job Boards */}
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Job Boards</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent sideOffset={8} alignOffset={-5}>
                {sortedSites.map((site) => (
                  <DropdownMenuCheckboxItem
                    key={site.id}
                    checked={selectedSites.includes(site.id)}
                    onSelect={(evt) => {
                      evt.preventDefault();
                      onSelectSite(site.id);
                    }}
                    className="pr-8"
                  >
                    <img src={siteLogos[site.id]} alt={site.name} className="mr-2 h-4 w-4 rounded-full" />
                    <p>{site.name}</p>
                  </DropdownMenuCheckboxItem>
                ))}

                <DropdownMenuSeparator />
                {/* Reset filter button */}
                <DropdownMenuItem
                  onSelect={(evt) => {
                    evt.preventDefault();
                    clearSites();
                  }}
                  disabled={selectedSites.length === 0}
                  className="px-8 text-destructive"
                >
                  Reset Board Selection
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        {/* Links */}
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Searches</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent sideOffset={8} alignOffset={-37}>
                {links.map((link) => (
                  <DropdownMenuCheckboxItem
                    key={link.id}
                    checked={selectedLinks.includes(link.id)}
                    onSelect={(evt) => {
                      evt.preventDefault();
                      onSelectLink(link.id);
                    }}
                    className="pr-8"
                  >
                    <img src={siteLogos[link.site_id]} alt={link.title} className="mr-2 h-4 w-4 rounded-full" />
                    <p>{link.title}</p>
                  </DropdownMenuCheckboxItem>
                ))}

                <DropdownMenuSeparator />
                {/* Reset filter button */}
                <DropdownMenuItem
                  onSelect={(evt) => {
                    evt.preventDefault();
                    clearLinks();
                  }}
                  disabled={selectedLinks.length === 0}
                  className="px-8 text-destructive"
                >
                  Reset Search Selection
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        {/* Labels */}
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Labels</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent sideOffset={8} alignOffset={-37}>
                {ALL_LABELS.map((label) => {
                  const colorClass = LABEL_COLOR_CLASSES[label];

                  return (
                    <DropdownMenuCheckboxItem
                      key={label}
                      checked={selectedLabels.includes(label)}
                      onSelect={(evt) => {
                        evt.preventDefault();
                        onSelectLabel(label);
                      }}
                      className="pr-8"
                    >
                      <div className={`h-4 w-4 rounded-full ${colorClass}`}></div>
                      <p className="ml-2">{label}</p>
                    </DropdownMenuCheckboxItem>
                  );
                })}

                <DropdownMenuSeparator />
                {/* Reset filter button */}
                <DropdownMenuItem
                  onSelect={(evt) => {
                    evt.preventDefault();
                    clearLabels();
                  }}
                  disabled={selectedLabels.length === 0}
                  className="px-8 text-destructive"
                >
                  Reset Labels
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        {/* AI Filters */}
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>AI Filters</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent sideOffset={8} alignOffset={-37} className="w-64">
                {/* Favorites Only Toggle */}
                <DropdownMenuCheckboxItem
                  checked={selectedLabels.includes('FAVORITES_ONLY')}
                  onSelect={(evt) => {
                    evt.preventDefault();
                    onSelectLabel('FAVORITES_ONLY');
                  }}
                  className="pr-8"
                >
                  <div className="h-4 w-4 rounded-full bg-yellow-500"></div>
                  <p className="ml-2">Favorite Companies Only</p>
                </DropdownMenuCheckboxItem>

                <DropdownMenuSeparator />

                {/* Whitelisted Companies List */}
                <div className="px-2 py-1">
                  <div className="flex items-center gap-2 mb-2">
                    <HeartIcon className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Whitelisted Companies ({favoriteCompanies.length})</span>
                  </div>
                  
                  {favoriteCompanies.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-2 py-1">
                      No favorite companies yet. Use the heart button on jobs to add companies.
                    </p>
                  ) : (
                    <div className="max-h-32 overflow-y-auto">
                      {favoriteCompanies.slice(0, 5).map((company, index) => (
                        <div key={index} className="flex items-center gap-2 px-2 py-1 text-xs">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          <span className="truncate">{company}</span>
                        </div>
                      ))}
                      {favoriteCompanies.length > 5 && (
                        <p className="text-xs text-muted-foreground px-2 py-1">
                          +{favoriteCompanies.length - 5} more companies
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <DropdownMenuSeparator />

                {/* Export/Import Actions */}
                <DropdownMenuItem
                  onSelect={(evt) => {
                    evt.preventDefault();
                    handleExportConfig();
                  }}
                  className="px-2"
                >
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export AI Filters
                </DropdownMenuItem>

                <DropdownMenuItem
                  onSelect={(evt) => {
                    evt.preventDefault();
                    handleImportConfig();
                  }}
                  className="px-2"
                >
                  <UploadIcon className="h-4 w-4 mr-2" />
                  Import AI Filters
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Hide LinkedIn reposts */}
        <DropdownMenuCheckboxItem
          checked={selectedLabels.includes('HIDE_LINKEDIN_REPOSTS')}
          onSelect={(evt) => {
            evt.preventDefault();
            onSelectLabel('HIDE_LINKEDIN_REPOSTS');
          }}
          className="pr-8"
        >
          Hide LinkedIn reposts
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />

        {/* Reset all filters button */}
        <DropdownMenuItem
          onSelect={() => {
            clearAll();
          }}
          disabled={selectedSites.length === 0 && selectedLinks.length === 0 && selectedLabels.length === 0}
          className="text-destructive"
        >
          Remove Filters
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
