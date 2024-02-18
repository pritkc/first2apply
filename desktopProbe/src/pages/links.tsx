import { useError } from "@/hooks/error";
import { useLinks } from "@/hooks/links";

import { DefaultLayout } from "./defaultLayout";
import { CreateLink } from "@/components/createLink";
import { LinksList } from "@/components/linksList";
import { CreateLinkSkeleton } from "@/components/skeletons/CreateLinkSkeleton";
import { LinksListSkeleton } from "@/components/skeletons/LinksListSkeleton";

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
    <DefaultLayout className="p-6 md:p-10 space-y-16">
      <CreateLink />
      {links.length > 0 && (
        <LinksList links={links} onDeleteLink={handleDeleteLink} />
      )}
    </DefaultLayout>
  );
}
