import { DefaultLayout } from "./defaultLayout";
import { useEffect, useState } from "react";
import {
  getProbeSettings,
  listJobs,
  updateProbeSettings,
} from "@/lib/electronMainSdk";
import { JobsList } from "@/components/jobsList";
import { JobScannerSettings } from "@/lib/types";
import { useError } from "@/hooks/error";
import { CronSchedule } from "@/components/cronSchedule";

/**
 * Component that renders the home page.
 */
export function Home() {
  const { handleError } = useError();

  const [jobs, setJobs] = useState([]);
  const [settings, setSettings] = useState<JobScannerSettings>({
    cronRule: undefined,
    useSound: false,
    preventSleep: false,
  });

  useEffect(() => {
    const asyncLoad = async () => {
      try {
        // load all jobs when the component mounts
        setJobs(await listJobs());

        // load settings when component is mounted
        setSettings(await getProbeSettings());
      } catch (error) {
        handleError(error);
      }
    };
    asyncLoad();
  }, []);

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

  return (
    <DefaultLayout className="px-6 md:px-10 xl:px-0">
      <CronSchedule
        cronRule={settings.cronRule}
        onCronRuleChange={onCronRuleChange}
      />
      <JobsList jobs={jobs} />
    </DefaultLayout>
  );
}
