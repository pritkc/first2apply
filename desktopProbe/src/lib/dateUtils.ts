import { Job } from './types';

/**
 * Safely converts a date string or Date object to a Date object
 */
function ensureDate(date: Date | string | null | undefined): Date {
  if (date instanceof Date) {
    return date;
  }
  if (typeof date === 'string') {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      console.warn('Invalid date string:', date);
      return new Date(); // fallback to current date
    }
    return parsed;
  }
  console.warn('Invalid date value:', date);
  return new Date(); // fallback to current date
}

/**
 * Formats a date to relative time string (e.g., "2 days ago", "3 hours ago")
 */
export function getRelativeTimeString(date: Date | string | null | undefined, locale: string = 'en'): string {
  const dateObj = ensureDate(date);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const diffInSeconds = Math.floor((Date.now() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) return rtf.format(-diffInSeconds, 'second');
  if (diffInSeconds < 3600) return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  if (diffInSeconds < 86400) return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  if (diffInSeconds < 2592000) return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  if (diffInSeconds < 31536000) return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
  return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
}

/**
 * Extracts job posting date from job tags
 * Looks for time-related tags (e.g., "2 days ago", "1 week ago", etc.)
 */
export function getJobPostingDate(job: Job): string | null {
  if (!job.tags) return null;
  
  const timeTag = job.tags.find(tag => 
    /(second|minute|hour|day|week|month|year)s?\s+ago/i.test(tag)
  );
  
  return timeTag || null;
}


/**
 * Job date information interface
 */
export interface JobDateInfo {
  postedDate: string | null;
  foundDate: string;
  lastScannedDate: string | null;
}

/**
 * Extracts all relevant date information for a job
 */
export function getJobDateInfo(job: Job, lastScrapedAt?: Date | string | null): JobDateInfo {
  return {
    postedDate: getJobPostingDate(job),
    foundDate: getRelativeTimeString(job.created_at),
    lastScannedDate: lastScrapedAt ? getRelativeTimeString(lastScrapedAt) : null
  };
}
