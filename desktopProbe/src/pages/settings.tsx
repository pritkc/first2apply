import { LinksList } from "@/components/linksList";
import { DefaultLayout } from "./defaultLayout";
import { useEffect, useState } from "react";
import { useError } from "@/hooks/error";
import { Link } from "../../../supabase/functions/_shared/types";
import { listLinks } from "@/lib/electronMainSdk";

export function SettingsPage() {
  const { handleError } = useError();

  const [links, setLinks] = useState<Link[]>([]);

  useEffect(() => {
    const asyncLoad = async () => {
      try {
        const links = await listLinks();
        console.log(JSON.stringify(links, null, 2));
        setLinks([...links, ...links, ...links, ...links]);
      } catch (error) {
        handleError(error);
      }
    };

    asyncLoad();
  }, []);

  return (
    <DefaultLayout className="p-6 md:p-10 xl:px-0">
      <LinksList links={links}></LinksList>
    </DefaultLayout>
  );
}
