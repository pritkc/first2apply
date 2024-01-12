import { Button } from "@/components/ui/button";
import { useSupabase } from "@/hooks/supabase";
import { getExceptionMessage } from "@/lib/error";
import { createLink } from "@/lib/electronMainSdk";

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
    <div>
      <Button onClick={onCreateLink}>Click me</Button>
    </div>
  );
}
