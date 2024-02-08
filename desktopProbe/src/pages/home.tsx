import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useError } from "@/hooks/error";
import { useSettings } from "@/hooks/settings";
import { useLinks } from "@/hooks/links";

import {
  listJobs,
  updateJobStatus,
  openExternalUrl,
} from "@/lib/electronMainSdk";

import { DefaultLayout } from "./defaultLayout";
import { CronScheduleSkeleton } from "@/components/skeletons/CronScheduleSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { JobsListSkeleton } from "@/components/skeletons/JobsListSkeleton";
import { Button } from "@/components/ui/button";
import { JobsList } from "@/components/jobsList";
import { CronSchedule } from "@/components/cronSchedule";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Job, JobStatus } from "../../../supabase/functions/_shared/types";

const JOB_BATCH_SIZE = 20;
const ALL_JOB_STATUSES: JobStatus[] = ["new", "applied", "archived"];

/**
 * Component that renders the home page.
 */
export function Home() {
  const { handleError } = useError();

  const navigate = useNavigate();
  const location = useLocation();

  const { links, isLoading: isLoadingLinks } = useLinks();
  const {
    settings,
    updateSettings,
    isLoading: isLoadingSettings,
  } = useSettings();

  // Parse the query parameters to determine the active tab
  const status = (new URLSearchParams(location.search).get("status") ||
    "new") as JobStatus;

  const [listing, setListing] = useState<{
    isLoading: boolean;
    hasMore: boolean;
    jobs: Job[];
    new: number;
    applied: number;
    archived: number;
  }>({
    isLoading: true,
    hasMore: true,
    jobs: [],
    new: 0,
    applied: 0,
    archived: 0,
  });

  // Update jobs when location changes
  useEffect(() => {
    const asyncLoad = async () => {
      try {
        setListing((listing) => ({ ...listing, isLoading: true }));
        const result = await listJobs({ status, limit: JOB_BATCH_SIZE });

        setListing({
          ...result,
          isLoading: false,
          hasMore: result.jobs.length === JOB_BATCH_SIZE,
        });
      } catch (error) {
        handleError({ error, title: "Failed to load jobs" });
      }
    };
    asyncLoad();
  }, [status]);

  // Update cron rule
  const onCronRuleChange = async (cronRule: string | undefined) => {
    try {
      const newSettings = { ...settings, cronRule };
      await updateSettings(newSettings);
    } catch (error) {
      handleError({ error, title: "Failed to update notification frequency" });
    }
  };

  // Update the archived status of a job
  const onArchive = async (jobId: number) => {
    try {
      await updateJobStatus({ jobId, status: "archived" });

      setListing((listing) => {
        const jobs = listing.jobs.filter((job) => job.id !== jobId);

        return {
          ...listing,
          jobs,
          new: status === "new" ? listing.new - 1 : listing.new,
          applied: status === "applied" ? listing.applied - 1 : listing.applied,
          archived: listing.archived + 1,
        };
      });
    } catch (error) {
      handleError({ error, title: "Failed to archive job" });
    }
  };

  // Handle tab change
  const onTabChange = (tabValue: string) => {
    navigate(`?status=${tabValue}`);
  };

  const onLoadMore = async () => {
    try {
      const result = await listJobs({
        status,
        limit: JOB_BATCH_SIZE,
        afterId: listing.jobs[listing.jobs.length - 1].id,
      });

      setListing((listing) => ({
        ...listing,
        jobs: [...listing.jobs, ...result.jobs],
        hasMore: result.jobs.length === JOB_BATCH_SIZE,
      }));
    } catch (error) {
      handleError({ error, title: "Failed to load more jobs" });
    }
  };

  if (isLoadingLinks || isLoadingSettings) {
    return (
      <DefaultLayout className="px-6 xl:px-0 flex flex-col py-6 md:p-10">
        <div className="space-y-10">
          <CronScheduleSkeleton />

          <div className="h-[68px] bg-card w-full rounded-lg flex flex-row gap-2 p-2 animate-pulse">
            <Skeleton className="px-6 py-4 flex-1" />
            <Skeleton className="px-6 py-4 flex-1" />
          </div>

          <JobsListSkeleton />
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout
      className={`px-6 xl:px-0 flex flex-col ${
        links.length === 0
          ? "justify-evenly h-screen pb-14 max-w-[800px] w-full px-6 md:px-10 lg:px-20"
          : "py-6 md:p-10 xl:px-0"
      }`}
    >
      {links.length === 0 ? (
        <>
          <div className="flex flex-col items-center gap-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold">
              Be the: <span className="text-primary">first 2 apply</span>
            </h1>
            <p className="text-muted-foreground text-center">
              Save your tailored job searches from top job platforms, and let us
              do the heavy lifting. We'll monitor your specified job feeds and
              swiftly notify you of new postings, providing you the edge to be
              the first in line.
            </p>
            <Link to="/links">
              <Button>Add new search</Button>
            </Link>
          </div>
          <CronSchedule
            cronRule={settings.cronRule}
            onCronRuleChange={onCronRuleChange}
          />
        </>
      ) : (
        <div className="space-y-10">
          <CronSchedule
            cronRule={settings.cronRule}
            onCronRuleChange={onCronRuleChange}
          />

          <Tabs
            value={status}
            className="w-full flex flex-col gap-6"
            onValueChange={(value) => onTabChange(value)}
          >
            <TabsList className="h-fit p-2">
              <TabsTrigger value="new" className="px-6 py-4 flex-1">
                New Jobs {`(${listing.new})`}
              </TabsTrigger>
              <TabsTrigger value="applied" className="px-6 py-4 flex-1">
                Applied {`(${listing.applied})`}
              </TabsTrigger>
              <TabsTrigger value="archived" className="px-6 py-4 flex-1">
                Archived {`(${listing.archived})`}
              </TabsTrigger>
            </TabsList>

            {ALL_JOB_STATUSES.map((statusItem) => {
              return (
                <TabsContent key={statusItem} value={statusItem}>
                  {listing.isLoading || statusItem !== status ? (
                    <JobsListSkeleton />
                  ) : (
                    <JobsList
                      jobs={listing.jobs}
                      hasMore={listing.hasMore}
                      onApply={(job) => {
                        openExternalUrl(job.externalUrl);
                      }}
                      onArchive={onArchive}
                      onLoadMore={onLoadMore}
                    />
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      )}
    </DefaultLayout>
  );
}
