import { useError } from "@/hooks/error";
import { useLinks } from "@/hooks/links";

import { InfoCircledIcon } from "@radix-ui/react-icons";

import { DefaultLayout } from "./defaultLayout";
import { CreateLink } from "@/components/createLink";
import { LinksList } from "@/components/linksList";
import { LinksListSkeleton } from "@/components/skeletons/linksListSkeleton.tsx";

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
      <DefaultLayout className="p-6 md:p-10">
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
        <>
          <div className="flex items-center justify-between">
            <h2 className="w-3/5 xl:w-1/2 text-xl md:text-2xl my-6 lg:my-10 whitespace-break-spaces tracking-wide break-normal">
              First 2 Apply periodically visits your{" "}
              <span className="font-medium whitespace-nowrap">
                pre-configured
              </span>{" "}
              job searches and fetches the list of jobs. If there are new jobs
              since the last visit, you will be notified.
            </h2>

            <div className="w-fit lg:hidden">
              <CreateLink />
            </div>
          </div>

          <div className="flex items-start flex-col-reverse lg:flex-row gap-6 lg:gap-10">
            <div className="lg:w-2/5 space-y-6 xl:space-y-12">
              <p className="text-justify">
                To optimize your job search and achieve the best results, the
                video displayed on the right will guide you through configuring
                a job search on LinkedIn. After setting up your search criteria
                to match your preferences and career goals, simply copy and
                paste the URL from the job platform into the app.
              </p>

              <p className="text-justify">
                This process ensures that we can provide you with the most
                relevant and effective job search results. There is no magic
                involved, undearneath it's just a simple web browser that loads
                the page and extracts the data.
              </p>

              <Alert className="flex items-center  gap-2 border-0 p-0">
                <AlertTitle className="mb-0">
                  <InfoCircledIcon className="w-5 h-5" />
                </AlertTitle>
                <AlertDescription className="text-base">
                  <span className="font-medium">Pro Tip: </span>Apply the 'Last
                  24 Hours' filter where possible.
                </AlertDescription>
              </Alert>

              <div className="mx-auto w-fit hidden lg:block">
                <CreateLink />
              </div>
            </div>

            <div className="mx-auto lg:w-3/5 space-y-4">
              <img
                src="https://vnawaforiamopaudfefi.supabase.co/storage/v1/object/public/first2apply-public/copy_link.gif"
                alt="LI job search config"
                className="w-full rounded-xl max-w-"
              />
              <p className="text-center text-sm">
                How to configure a job search on LinkedIn and copy paste the URL
                in the app
              </p>
            </div>
          </div>
        </>
      )}

      {links.length > 0 && (
        <LinksList links={links} onDeleteLink={handleDeleteLink} />
      )}
    </DefaultLayout>
  );
}
