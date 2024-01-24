import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { JobScannerSettings } from "@/lib/types";
import { Job, Link as Links } from "../../../supabase/functions/_shared/types";

import { useError } from "@/hooks/error";
import {
  listLinks,
  getProbeSettings,
  listJobs,
  archiveJob,
  openExternalUrl,
  updateProbeSettings,
} from "@/lib/electronMainSdk";

import { DefaultLayout } from "./defaultLayout";
import { Button } from "@/components/ui/button";
import { JobsList } from "@/components/jobsList";
import { CronSchedule } from "@/components/cronSchedule";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Component that renders the home page.
 */
export function Home() {
  const { handleError } = useError();
  const { search } = useLocation();

  const [jobs, setJobs] = useState([]);
  const [settings, setSettings] = useState<JobScannerSettings>({
    cronRule: undefined,
    useSound: false,
    preventSleep: false,
  });

  const [links, setLinks] = useState<Links[]>([]);

  useEffect(() => {
    const asyncLoad = async () => {
      try {
        // Load links
        const links = await listLinks();
        setLinks(links);

        // Load settings
        const loadedSettings = await getProbeSettings();
        setSettings(loadedSettings);
      } catch (error) {
        handleError(error);
      }
    };

    asyncLoad();
  }, []);

  // update jobs when search changes
  useEffect(() => {
    const asyncLoad = async () => {
      try {
        console.log("search changed");
        setJobs(await listJobs());
      } catch (error) {
        handleError(error);
      }
    };
    asyncLoad();
  }, [search]);

  // update cron rule when form is updated
  const onCronRuleChange = async (cronRule: string | undefined) => {
    try {
      const newSettings = { ...settings, cronRule };
      await updateProbeSettings(newSettings);
      setSettings(newSettings);
    } catch (error) {
      handleError(error);
    }
  };

  // Separate latest and archived jobs in two arrays
  const { latestJobs, archivedJobs } = jobs.reduce(
    (acc, job) => {
      if (job.archived) {
        acc.archivedJobs.push(job);
      } else {
        acc.latestJobs.push(job);
      }
      return acc;
    },
    { latestJobs: [], archivedJobs: [] }
  );

  // Update the archived status of a job
  const onArchive = async (jobId: string) => {
    try {
      await archiveJob(jobId);

      // Update the local state to reflect the change
      setJobs(jobs.map((j) => (j.id === jobId ? { ...j, archived: true } : j)));
    } catch (error) {
      handleError(error);
    }
  };

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
          {/* <h2 className="text-2xl font-medium tracking-wide pt-4">
            Recent job posts
          </h2>
          <hr className="w-full text-muted-foreground" /> */}

          <Tabs defaultValue="latest" className="w-full flex flex-col gap-6">
            <TabsList className="h-fit p-2">
              <TabsTrigger value="latest" className="px-6 py-4 flex-1">
                Latest Jobs
              </TabsTrigger>
              <TabsTrigger value="archived" className="px-6 py-4 flex-1">
                Archives
              </TabsTrigger>
            </TabsList>
            <TabsContent value="latest">
              <JobsList
                jobs={latestJobs}
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
