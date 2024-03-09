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
        <h1 className="text-2xl font-medium tracking-wide pb-2">
          Job Searches
        </h1>

        {links.length > 0 && <CreateLink />}
      </div>

      {links.length === 0 && (
        <div className="flex items-center justify-center w-full lg:h-[calc(100vh-160px)]">
          <div className="flex items-center flex-col lg:flex-row gap-10 xl:gap-20">
            <div className="lg:w-2/5">
              <h2 className="text-xl xl:text-2xl whitespace-break-spaces tracking-wide break-normal mt-6 lg:mt-0">
                <span className="font-medium">First 2 Apply</span> periodically
                visits your{" "}
                <span className="underline whitespace-nowrap">
                  pre-configured
                </span>{" "}
                job searches and fetches the list of jobs. If there are new jobs
                since the last visit, you will be notified.
              </h2>

              <p className="mt-1 lg:mt-4 mb-10 lg:mb-6">
                There is no magic involved, undearneath it's just a simple web
                browser that loads the page and extracts the data.
              </p>

              <Alert className="flex items-center gap-2 border-0 p-0">
                <AlertTitle className="mb-0">
                  <InfoCircledIcon className="w-5 h-5" />
                </AlertTitle>
                <AlertDescription className="text-base">
                  <span className="font-medium">Pro Tip: </span>Apply the 'Last
                  24 Hours' filter where possible.
                </AlertDescription>
              </Alert>

              <div className="mx-auto w-fit mt-10">
                <CreateLink />
              </div>
            </div>

            <div className="mx-auto mb-6 lg:w-3/5 space-y-4">
              <img
                src="https://vnawaforiamopaudfefi.supabase.co/storage/v1/object/public/first2apply-public/copy_link.gif"
                alt="LI job search config"
                className="w-full rounded-lg"
              />
              <p className="text-center">
                How to configure a job search on LinkedIn and copy paste the URL
                in the app
              </p>
            </div>
          </div>
        </div>
      )}

      {links.length > 0 && (
        <LinksList links={links} onDeleteLink={handleDeleteLink} />
      )}
    </DefaultLayout>
  );
}
