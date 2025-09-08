import { Job, JobStatus } from './types';

export interface DateGroup {
  date: string; // YYYY-MM-DD format
  jobs: Job[];
  count: number;
  status: JobStatus;
}

/**
 * Groups jobs by their creation date for efficient organization
 * @param jobs Array of jobs to group
 * @param status Current job status for the group
 * @param favoriteCompanies Optional array of favorite company names to prioritize
 * @returns Array of date groups sorted by newest first, with favorite companies at top of each group
 */
export function groupJobsByDate(jobs: Job[], status: JobStatus, favoriteCompanies: string[] = []): DateGroup[] {
  const groups = new Map<string, Job[]>();
  console.debug('[groupJobsByDate] input', { count: jobs.length, status, favoriteCompaniesCount: favoriteCompanies.length });
  
  jobs.forEach(job => {
    const date = formatDate(job.created_at);
    if (!groups.has(date)) {
      groups.set(date, []);
    }
    groups.get(date)!.push(job);
  });
  
  const result = Array.from(groups.entries())
    .map(([date, jobs]) => {
      // Sort jobs within each date group to prioritize favorite companies
      const sortedJobs = jobs.sort((a, b) => {
        const aIsFavorite = favoriteCompanies.some(fav => 
          a.companyName?.toLowerCase().trim() === fav.toLowerCase().trim()
        );
        const bIsFavorite = favoriteCompanies.some(fav => 
          b.companyName?.toLowerCase().trim() === fav.toLowerCase().trim()
        );
        
        // If one is favorite and other isn't, favorite comes first
        if (aIsFavorite && !bIsFavorite) return -1;
        if (!aIsFavorite && bIsFavorite) return 1;
        
        // If both are favorites or both are not favorites, maintain original order
        return 0;
      });
      
      return {
        date,
        jobs: sortedJobs,
        count: sortedJobs.length,
        status
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  console.debug('[groupJobsByDate] output groups', { dates: result.map(g => g.date), counts: result.map(g => g.count) });
  return result;
}

/**
 * Formats a date to YYYY-MM-DD format for grouping
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a date for display (e.g., "Today", "Yesterday", "Jan 15")
 * @param date Date to format
 * @returns Human-readable date string
 */
export function formatDisplayDate(date: string): string {
  const today = new Date();
  const targetDate = new Date(date + 'T00:00:00'); // Add time to ensure proper comparison
  
  // Reset both dates to start of day for accurate comparison
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const targetStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  
  const diffTime = todayStart.getTime() - targetStart.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  
  // For dates older than yesterday, use mm/dd/yyyy format
  return targetDate.toLocaleDateString('en-US', { 
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
}

/**
 * Gets the total count of jobs across all date groups
 * @param dateGroups Array of date groups
 * @returns Total job count
 */
export function getTotalJobCount(dateGroups: DateGroup[]): number {
  return dateGroups.reduce((total, group) => total + group.count, 0);
}

/**
 * Filters date groups by search term
 * @param dateGroups Array of date groups
 * @param searchTerm Search term to filter by
 * @returns Filtered date groups
 */
export function filterDateGroupsBySearch(dateGroups: DateGroup[], searchTerm: string): DateGroup[] {
  if (!searchTerm.trim()) return dateGroups;
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  return dateGroups
    .map(group => ({
      ...group,
      jobs: group.jobs.filter(job => 
        job.title.toLowerCase().includes(lowerSearchTerm) ||
        job.companyName.toLowerCase().includes(lowerSearchTerm) ||
        job.location?.toLowerCase().includes(lowerSearchTerm) ||
        job.tags?.some((tag: string) => tag.toLowerCase().includes(lowerSearchTerm))
      )
    }))
    .filter(group => group.jobs.length > 0);
}
