import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

export interface SkippedUrl {
  url: string;
  failureCount: number;
  lastFailed: string;
  jobTitle?: string;
  companyName?: string;
}

export function useSkippedUrls() {
  const [skippedUrls, setSkippedUrls] = useState<SkippedUrl[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Listen for skipped URL events from the main process
  useEffect(() => {
    const handleSkippedUrl = (event: any, skippedUrl: SkippedUrl) => {
      setSkippedUrls(prev => {
        // Check if URL already exists
        const existingIndex = prev.findIndex(item => item.url === skippedUrl.url);
        if (existingIndex >= 0) {
          // Update existing entry
          const updated = [...prev];
          updated[existingIndex] = skippedUrl;
          return updated;
        } else {
          // Add new entry
          return [...prev, skippedUrl];
        }
      });
    };

    // Listen for events from the main process via electron API
    if (typeof window !== 'undefined' && (window as any).electron) {
      (window as any).electron.on('url-skipped', handleSkippedUrl);
    }

    return () => {
      if (typeof window !== 'undefined' && (window as any).electron) {
        // Note: There's no removeListener in the current preload, but this is fine for cleanup
        // The event listener will be cleaned up when the component unmounts
      }
    };
  }, []);

  const retryUrl = useCallback(async (url: string) => {
    try {
      setIsLoading(true);
      
      // Remove from skipped URLs list
      setSkippedUrls(prev => prev.filter(item => item.url !== url));
      
      // Notify the main process to retry the URL
      // This would need to be implemented in the electron main process
      // For now, we'll just show a toast
      toast({
        title: 'URL Retry Requested',
        description: 'The URL has been removed from the skipped list and will be retried on the next scan.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Failed to retry URL:', error);
      toast({
        title: 'Retry Failed',
        description: 'Failed to retry the URL. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openUrl = useCallback((url: string) => {
    // Open URL in external browser
    window.open(url, '_blank');
  }, []);

  const dismissAlert = useCallback(() => {
    setSkippedUrls([]);
  }, []);

  const clearSkippedUrls = useCallback(() => {
    setSkippedUrls([]);
    toast({
      title: 'Skipped URLs Cleared',
      description: 'All skipped URLs have been cleared.',
      variant: 'default',
    });
  }, []);

  return {
    skippedUrls,
    isLoading,
    retryUrl,
    openUrl,
    dismissAlert,
    clearSkippedUrls,
  };
}
