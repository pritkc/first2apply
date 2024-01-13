import { DefaultLayout } from "./defaultLayout";
import { Dashboard } from "@/components/dashboard";
import { SettingsPage } from "./settings";
import { useEffect, useState } from "react";
import { listJobs } from "@/lib/electronMainSdk";
import { JobsList } from "@/components/jobsList";

/**
 * Component that renders the home page.
 */
export function Home() {
  const [jobs, setJobs] = useState([]);

  // load all jobs when the component mounts
  useEffect(() => {
    const asyncLoad = async () => {
      const jobs = await listJobs();
      setJobs(jobs);
    };
    asyncLoad();
  }, []);

  return (
    <DefaultLayout className="px-6 md:px-10 xl:px-0">
      {/* <Dashboard /> */}
      <JobsList jobs={jobs} />
    </DefaultLayout>
  );
}
