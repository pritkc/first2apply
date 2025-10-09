'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { useError } from '@/hooks/error';
import { useSkippedUrls } from '@/hooks/skippedUrls';
import { changeAllJobsStatus, exportJobsToCsv } from '@/lib/electronMainSdk';
import { ArchiveIcon, DotsVerticalIcon, DownloadIcon, TrashIcon, UpdateIcon } from '@radix-ui/react-icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Job, JobStatus } from '@/lib/supabase/types';
import { Button } from '../ui/button';
import { JobTabsContent } from './jobTabsContent';
import { TabActions } from './tabActions';
import { SkippedUrlsAlert } from './skippedUrlsAlert';

export type JobListing = {
  isLoading: boolean;
  hasMore: boolean;
  jobs: Array<
    Job & {
      isLoadingJD?: boolean;
    }
  >;
  new: number;
  applied: number;
  archived: number;
  filtered: number;
  nextPageToken?: string;
};

/**
 * Job tabs component.
 */
export function JobTabs() {
  const { handleError } = useError();
  const { skippedUrls, retryUrl, openUrl, dismissAlert } = useSkippedUrls();

  const router = useRouter();

  // Parse the query parameters to determine the active tab
  const searchParams = useSearchParams();
  const status = (searchParams.get('status') || 'new') as JobStatus;
  const search = searchParams.get('search') || '';
  const siteIds = searchParams.get('site_ids') ? (searchParams.get('site_ids')?.split(',').map(Number) ?? []) : [];
  const linkIds = searchParams.get('link_ids') ? (searchParams.get('link_ids')?.split(',').map(Number) ?? []) : [];

  const [listing, setListing] = useState<JobListing>({
    isLoading: true,
    hasMore: true,
    jobs: [],
    new: 0,
    applied: 0,
    archived: 0,
    filtered: 0,
  });



  // Handle tab change
  const onTabChange = (tabValue: string) => {
    router.push(
      `?status=${tabValue}&search=${search}&site_ids=${siteIds?.join(
        ',',
      )}&link_ids=${linkIds?.join(',')}&r=${Math.random()}`,
    );
  };

  // Archive all jobs from the current tab
  const onArchiveAll = async (tab: JobStatus) => {
    try {
      await changeAllJobsStatus({ from: status, to: 'archived' });

      // refresh the tab
      onTabChange(tab);

      toast({
        title: 'All jobs archived',
        description: `All your ${status} jobs have been archived, you can find them in the archived tab.`,
        variant: 'success',
      });
    } catch (error) {
      handleError({ error, title: 'Failed to archive all jobs' });
    }
  };

  // Delete all jobs from the current tab
  const onDeleteAll = async (tab: JobStatus) => {
    try {
      await changeAllJobsStatus({ from: tab, to: 'deleted' });

      // refresh the tab
      onTabChange(tab);

      toast({
        title: 'All jobs deleted',
        description: `All your ${status} jobs have been deleted.`,
        variant: 'success',
      });
    } catch (error) {
      handleError({ error, title: 'Failed to delete all jobs' });
    }
  };

  // Download all jobs from the current tab to a CSV file
  const onCsvExport = async (tab: JobStatus) => {
    try {
      await exportJobsToCsv(tab);
      toast({
        title: 'Jobs exported',
        description: `All your ${tab} jobs have been exported to a CSV file.`,
        variant: 'success',
      });
    } catch (error) {
      handleError({ error, title: 'Failed to export jobs' });
    }
  };

  return (
    <Tabs value={status} onValueChange={(value: string) => onTabChange(value)} className="h-[calc(100vh-96px)]">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-medium tracking-wide">Jobs</h1>
        <div className="md:hidden">
          <TabActions
            tab={status}
            onTabChange={onTabChange}
            onCsvExport={onCsvExport}
            onArchiveAll={onArchiveAll}
            onDeleteAll={onDeleteAll}
          />
        </div>
      </div>

      {/* Skipped URLs Alert */}
      <SkippedUrlsAlert
        skippedUrls={skippedUrls}
        onRetryUrl={retryUrl}
        onOpenUrl={openUrl}
        onDismiss={dismissAlert}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <TabsList className="flex flex-1 md:flex-none xl:w-2/5">
            <TabsTrigger value="new" className="flex-1">
              New jobs <span className="hidden sm:inline">{`(${listing.new})`}</span>
            </TabsTrigger>
            <TabsTrigger value="applied" className="flex-1">
              Applied <span className="hidden sm:inline">{`(${listing.applied})`}</span>
            </TabsTrigger>
            <TabsTrigger value="archived" className="flex-1">
              Archived <span className="hidden sm:inline">{`(${listing.archived})`}</span>
            </TabsTrigger>
            <TabsTrigger value="excluded_by_advanced_matching" className="flex-1">
              Filtered out <span className="hidden sm:inline">{`(${listing.filtered})`}</span>
            </TabsTrigger>
          </TabsList>


        </div>

        {/* Tab action buttons */}
        <div className="hidden md:block">
          <TabActions
            tab={status}
            onTabChange={onTabChange}
            onCsvExport={onCsvExport}
            onArchiveAll={onArchiveAll}
            onDeleteAll={onDeleteAll}
          />
        </div>
      </div>

      <JobTabsContent
        status={status}
        listing={listing}
        setListing={setListing}
        search={search}
        siteIds={siteIds}
        linkIds={linkIds}

      />
    </Tabs>
  );
}
