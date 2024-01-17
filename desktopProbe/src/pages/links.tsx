import { useError } from "@/hooks/error";
import { DefaultLayout } from "./defaultLayout";
import { useEffect, useState } from "react";
import { Link } from "../../../supabase/functions/_shared/types";
import { createLink, listLinks } from "@/lib/electronMainSdk";
import { LinksList } from "@/components/linksList";
import { CreateLink } from "@/components/createLink";

export function LinksPage() {
  const { handleError } = useError();

  const [links, setLinks] = useState<Link[]>([]);

  useEffect(() => {
    const asyncLoad = async () => {
      try {
        const links = await listLinks();
        setLinks(links);
      } catch (error) {
        handleError(error);
      }
    };

    asyncLoad();
  }, []);

  const onCreateLink = async (newLink: Pick<Link, "title" | "url">) => {
    try {
      const createdLink = await createLink(newLink);
      console.log(JSON.stringify(createdLink, null, 2));
      setLinks((links) => [...links, createdLink]);
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <DefaultLayout className="p-6 md:p-10 xl:px-0 space-y-16">
      <CreateLink onCreateLink={onCreateLink}></CreateLink>
      <LinksList links={links}></LinksList>
    </DefaultLayout>
  );
}
