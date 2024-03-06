import { useError } from "@/hooks/error";
import { useLinks } from "@/hooks/links";
import { InfoCircledIcon } from "@radix-ui/react-icons";

import { DefaultLayout } from "./defaultLayout";
import { CreateLink } from "@/components/createLink";
import { LinksList } from "@/components/linksList";
import { CreateLinkSkeleton } from "@/components/skeletons/CreateLinkSkeleton";
import { LinksListSkeleton } from "@/components/skeletons/LinksListSkeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSites } from "@/hooks/sites";
import { openExternalUrl } from "@/lib/electronMainSdk";

export function LinksPage() {
  const { handleError } = useError();
  const { sites } = useSites();
  const { isLoading, links, removeLink } = useLinks();

  // sort sites by name
  const sortedSites = sites.sort((a, b) => a.name.localeCompare(b.name));

  // Delete an existing link
  const handleDeleteLink = async (linkId: number) => {
    try {
      await removeLink(linkId);
    } catch (error) {
      handleError({ error });
    }
  };

  if (isLoading) {
    return (
      <DefaultLayout className="p-6 md:p-10 space-y-16">
        <CreateLinkSkeleton />
        <LinksListSkeleton />
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout className="p-6 md:p-10">
      <h1 className="text-2xl font-medium tracking-wide pb-3">Job Searches</h1>

      {links.length === 0 && (
        <Card className="p-4 mb-4">
          <CardHeader>
            <CardTitle>How does it work?</CardTitle>
            <CardDescription>
              Learn how to add job searches and get notified when new ones are
              available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              First 2 Apply periodically visits your <u>pre-configured</u> job
              searches and fetches the list of jobs. If there are new jobs since
              the last visit, you will be notified.
            </p>
            <p>
              There is no magic involved, undearneath it's just a simple web
              browser that loads the page and extracts the data.
            </p>

            <Alert className="mt-4">
              <InfoCircledIcon className="w-5 h-5" />
              <AlertTitle>Pro Tip</AlertTitle>
              <AlertDescription>
                Make sure to apply the 'Last 24 Hours' filter where possible.
              </AlertDescription>
            </Alert>

            <div className="mx-auto my-6 w-fit">
              <img
                src="https://vnawaforiamopaudfefi.supabase.co/storage/v1/object/public/first2apply-public/copy_link.gif"
                alt="LI job search config"
              />
              <p className="mt-2 text-center">
                How to configure a job search on LinkedIn and copy paste the URL
                in the app
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {links.length > 0 && (
        <LinksList links={links} onDeleteLink={handleDeleteLink} />
      )}

      <div className="mt-6 space-y-3">
        <h2 className="text-2xl font-medium tracking-wide">
          Add new job search
        </h2>
        <p>
          Go to one of your favorite job search websites and search for a job.
          The more specific your filters, the better we can tailor job alerts
          for you.
          <br />
          Add as many varied searches as you like to maximize your opportunities
          to be first in line.
        </p>

        <CreateLink />

        <Alert className="mt-4">
          <InfoCircledIcon className="w-5 h-5" />
          <AlertTitle>Pick from one of the supported job boards</AlertTitle>
          <AlertDescription>
            <ul className="grid grid-cols-4 my-2">
              {sortedSites.map((site) => (
                <li key={site.id}>
                  <button
                    className="text-[#738a5c] dark:text-ring"
                    onClick={() => {
                      openExternalUrl(site.urls[0]);
                    }}
                  >
                    {site.name}
                  </button>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </DefaultLayout>
  );
}
