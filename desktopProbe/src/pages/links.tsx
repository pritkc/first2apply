import { useError } from "@/hooks/error";
import { useLinks } from "@/hooks/links";
import { InfoCircledIcon } from "@radix-ui/react-icons";

import { DefaultLayout } from "./defaultLayout";
import { CreateLink } from "@/components/createLink";
import { LinksList } from "@/components/linksList";
import { CreateLinkSkeleton } from "@/components/skeletons/CreateLinkSkeleton";
import { LinksListSkeleton } from "@/components/skeletons/LinksListSkeleton";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function LinksPage() {
  const { handleError } = useError();
  const { isLoading, links, removeLink } = useLinks();

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
      <div className="flex justify-between">
        <h1 className="text-2xl font-medium tracking-wide pb-3">
          Job Searches
        </h1>

        {links.length > 0 && <CreateLink />}
      </div>

      {links.length === 0 && (
        <div className="h-full flex flex-col justify-center items-center mx-auto max-w-[720px]">
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

          <CreateLink />
        </div>
      )}

      {links.length > 0 && (
        <LinksList links={links} onDeleteLink={handleDeleteLink} />
      )}
    </DefaultLayout>
  );
}
