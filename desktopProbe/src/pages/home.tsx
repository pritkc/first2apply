import { DefaultLayout } from "./defaultLayout";
import { Dashboard } from "@/components/dashboard";
import { SettingsPage } from "./settings";
import { useEffect, useState } from "react";
import {
  getProbeCronSchedule,
  listJobs,
  updateProbeCronSchedule,
} from "@/lib/electronMainSdk";
import { JobsList } from "@/components/jobsList";
import { AVAILABLE_CRON_RULES, CronRule } from "@/lib/types";
import { useError } from "@/hooks/error";
import { CronSchedule } from "@/components/cronSchedule";

/**
 * Component that renders the home page.
 */
export function Home() {
  const { handleError } = useError();

  const [jobs, setJobs] = useState([]);
  const [cronRule, setCronRule] = useState<CronRule | undefined>();

  useEffect(() => {
    const asyncLoad = async () => {
      try {
        // load all jobs when the component mounts
        const jobs = await listJobs();
        setJobs(jobs);

        // load cron rule when component is mounted
        const cronRule = await getProbeCronSchedule();
        setCronRule(cronRule);
      } catch (error) {
        handleError(error);
      }
    };
    asyncLoad();
  }, []);

  // update cron rule when form is updated
  const onCronRuleChange = async (cron: string | undefined) => {
    try {
      const cronRule = AVAILABLE_CRON_RULES.find((cr) => cr.value === cron);
      await updateProbeCronSchedule({ cronRule });
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <DefaultLayout className="px-6 md:px-10 xl:px-0">
      <CronSchedule cronRule={cronRule} onCronRuleChange={onCronRuleChange} />
      <JobsList jobs={jobs} />
    </DefaultLayout>
  );
}
