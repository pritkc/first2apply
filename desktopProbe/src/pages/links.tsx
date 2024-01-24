import { useEffect, useState } from "react";

import { Link } from "../../../supabase/functions/_shared/types";
import { useError } from "@/hooks/error";

import { createLink, deleteLink, listLinks } from "@/lib/electronMainSdk";

import { DefaultLayout } from "./defaultLayout";
import { LinksList } from "@/components/linksList";
import { CreateLink } from "@/components/createLink";

export function LinksPage() {
  const { handleError } = useError();
  const [links, setLinks] = useState<Link[]>([]);

  // Load links on component mount
  useEffect(() => {
    const asyncLoad = async () => {
      try {
        const loadedLinks = await listLinks();
        setLinks(loadedLinks);
      } catch (error) {
        handleError(error);
      }
    };
    asyncLoad();
  }, []);

  // Create a new link
  const onCreateLink = async (newLink: Pick<Link, "title" | "url">) => {
    try {
      const createdLink = await createLink(newLink);
      setLinks((currentLinks) => [...currentLinks, createdLink]);
    } catch (error) {
      handleError(error);
    }
  };

  // Delete an existing link
  const handleDeleteLink = async (linkId: string) => {
    try {
      await deleteLink(linkId);

      // Update the local state to reflect the change
      setLinks((currentLinks) =>
        currentLinks.filter((link) => link.id !== linkId)
      );
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <DefaultLayout className="p-6 md:p-10 xl:px-0 space-y-16">
      <CreateLink onCreateLink={onCreateLink} />
      <LinksList links={links} onDeleteLink={handleDeleteLink} />
    </DefaultLayout>
  );
}
