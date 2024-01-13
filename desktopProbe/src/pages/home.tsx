import { useSupabase } from "@/hooks/supabase";
import { getExceptionMessage } from "@/lib/error";
import { createLink } from "@/lib/electronMainSdk";
import { DefaultLayout } from "./defaultLayout";
import { Dashboard } from "@/components/dashboard";

/**
 * Component that renders the home page.
 */
export function Home() {
  const supabase = useSupabase();

  const onCreateLink = async () => {
    try {
      console.log("App mounted");

      const url =
        "https://www.linkedin.com/jobs/search?keywords=Node.js&location=Zurich%2C+Switzerland&geoId=102436504&trk=public_jobs_jobs-search-bar_search-submit";

      const createdLink = await createLink(url);
      console.log(JSON.stringify(createdLink, null, 2));
    } catch (error) {
      console.error(getExceptionMessage(error));
    }
  };

  return (
    <DefaultLayout className="px-6 md:px-10 xl:px-0">
      <Dashboard />
    </DefaultLayout>
  );
}
