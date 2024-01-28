import { Link } from "../../../supabase/functions/_shared/types";
import { useError } from "@/hooks/error";
import { useLinks } from "@/hooks/links";

import { DefaultLayout } from "./defaultLayout";
import { CreateLink } from "@/components/createLink";
import { LinksList } from "@/components/linksList";
import { CreateLinkSkeleton } from "@/components/skeletons/CreateLinkSkeleton";
import { LinksListSkeleton } from "@/components/skeletons/LinksListSkeleton";

export function LinksPage() {
  const { handleError } = useError();
  const { isLoading, links, createLink, removeLink } = useLinks();

  // Create a new link
  const onCreateLink = async (newLink: Pick<Link, "title" | "url">) => {
    try {
      await createLink(newLink);
    } catch (error) {
      handleError(error);
    }
  };

  // Delete an existing link
  const handleDeleteLink = async (linkId: number) => {
    try {
      await removeLink(linkId);
    } catch (error) {
      handleError(error);
    }
  };

  if (isLoading) {
    return (
      <DefaultLayout className="p-6 md:p-10 xl:px-0 space-y-16">
        <CreateLinkSkeleton />
        <LinksListSkeleton />
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout className="p-6 md:p-10 xl:px-0 space-y-16">
      <CreateLink onCreateLink={onCreateLink} />
      <LinksList links={links} onDeleteLink={handleDeleteLink} />
    </DefaultLayout>
  );
}
