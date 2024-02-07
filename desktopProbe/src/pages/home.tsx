import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useError } from "@/hooks/error";
import { useSettings } from "@/hooks/settings";
import { useLinks } from "@/hooks/links";

import { listJobs, archiveJob, openExternalUrl } from "@/lib/electronMainSdk";

import { DefaultLayout } from "./defaultLayout";
import { CronScheduleSkeleton } from "@/components/skeletons/CronScheduleSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { JobsListSkeleton } from "@/components/skeletons/JobsListSkeleton";
import { Button } from "@/components/ui/button";
import { JobsList } from "@/components/jobsList";
import { CronSchedule } from "@/components/cronSchedule";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Component that renders the home page.
 */
export function Home() {
  const { handleError } = useError();

  const navigate = useNavigate();
  const location = useLocation();

  // Parse the query parameters to determine the active tab
  const activeTab = new URLSearchParams(location.search).get("tab") || "new";

  const { links, isLoading } = useLinks();
  const { settings, updateSettings } = useSettings();

  const [jobs, setJobs] = useState([]);

  // Update jobs when location changes
  useEffect(() => {
    const asyncLoad = async () => {
      try {
        setJobs(await listJobs());
      } catch (error) {
        handleError(error);
      }
    };
    asyncLoad();
  }, [location]);

  // Update cron rule
  const onCronRuleChange = async (cronRule: string | undefined) => {
    try {
      const newSettings = { ...settings, cronRule };
      await updateSettings(newSettings);
    } catch (error) {
      handleError(error);
    }
  };

  // Separate new and archived jobs in two arrays
  const { newJobs, archivedJobs } = jobs.reduce(
    (acc, job) => {
      if (job.archived) {
        acc.archivedJobs.push(job);
      } else {
        acc.newJobs.push(job);
      }
      return acc;
    },
    { newJobs: [], archivedJobs: [] }
  );

  // Update the archived status of a job
  const onArchive = async (jobId: number) => {
    try {
      await archiveJob(jobId);

      // Update the local state to reflect the change
      setJobs(jobs.map((j) => (j.id === jobId ? { ...j, archived: true } : j)));
    } catch (error) {
      handleError(error);
    }
  };

  // Handle tab change
  const onTabChange = (tabValue: string) => {
    // Update the URL with the new tab value
    navigate(`?tab=${tabValue}`, { replace: true });
  };

  if (isLoading) {
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
            defaultValue={activeTab}
            className="w-full flex flex-col gap-6"
            onValueChange={(value) => onTabChange(value)}
          >
            <TabsList className="h-fit p-2">
              <TabsTrigger value="new" className="px-6 py-4 flex-1">
                New Jobs {`(${newJobs.length})`}
              </TabsTrigger>
              <TabsTrigger value="applied" className="px-6 py-4 flex-1">
                Applied {`(${archivedJobs.length})`}
              </TabsTrigger>
              <TabsTrigger value="archived" className="px-6 py-4 flex-1">
                Archived {`(${archivedJobs.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new">
              <JobsList
                jobs={newJobs}
                onApply={(job) => {
                  openExternalUrl(job.externalUrl);
                }}
                onArchive={onArchive}
              />
            </TabsContent>
            <TabsContent value="applied">
              <JobsList
                jobs={newJobs}
                onApply={(job) => {
                  openExternalUrl(job.externalUrl);
                }}
                onArchive={onArchive}
              />
            </TabsContent>
            <TabsContent value="archived">
              <JobsList
                jobs={archivedJobs}
                onApply={(job) => {
                  openExternalUrl(job.externalUrl);
                }}
                onArchive={onArchive}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </DefaultLayout>
  );
}
