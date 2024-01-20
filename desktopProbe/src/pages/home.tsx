import { useEffect, useState } from "react";
import { JobScannerSettings } from "@/lib/types";
import { useError } from "@/hooks/error";
import { useLocation } from "react-router-dom";
import {
  getProbeSettings,
  listJobs,
  openExternalUrl,
  updateProbeSettings,
} from "@/lib/electronMainSdk";
import { useScrollToSection } from "@/hooks/useScrollToSection";
import { DefaultLayout } from "./defaultLayout";
import { JobsList } from "@/components/jobsList";
import { CronSchedule } from "@/components/cronSchedule";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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

  useEffect(() => {
    const asyncLoad = async () => {
      try {
        // load settings when component is mounted
        setSettings(await getProbeSettings());
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

  const scrollToSection = useScrollToSection(24);

  return (
    <DefaultLayout className="px-6 xl:px-0 pb-6">
      <section className="max-w-[980px] px-6 md:px-10 lg:px-20 pt-32 pb-20 mx-auto flex flex-col items-center gap-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold">
          Be the: <span className="text-primary">first 2 apply</span>
        </h1>
        <p className="text-muted-foreground lg:max-w-[800px] text-center">
          Save your tailored job searches from top job platforms, and let us do
          the heavy lifting. We'll monitor your specified job feeds and swiftly
          notify you of new postings, providing you the edge to be the first in
          line.
        </p>
        <div className="flex flex-row gap-4">
          <Link to="/links">
            <Button>Add new search</Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => scrollToSection("recent-jobs")}
          >
            Recent jobs
          </Button>
        </div>
      </section>

      <section className="border rounded-lg p-8 space-y-8" id="recent-jobs">
        <div>
          <h2 className="text-2xl font-medium tracking-wide mb-4">
            Recent job posts
          </h2>
          <CronSchedule
            cronRule={settings.cronRule}
            onCronRuleChange={onCronRuleChange}
          />
        </div>
        <hr className="w-full text-muted-foreground" />
        <JobsList
          jobs={jobs}
          onApply={(job) => {
            openExternalUrl(job.externalUrl);
          }}
          onDismiss={(job) => {}}
        />
      </section>
    </DefaultLayout>
  );
}
