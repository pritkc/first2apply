import { createContext, useContext, useEffect, useState } from "react";
import { JobSite } from "../../../supabase/functions/_shared/types";
import { useError } from "./error";
import { listSites } from "@/lib/electronMainSdk";
import { useSession } from "./session";

/**
 * Context that stores supported sites.
 */
export const SitesContext = createContext<{
  isLoading: boolean;
  sites: JobSite[];
  siteLogos: Record<number, string>;
}>({ isLoading: true, sites: [], siteLogos: {} });

/**
 * Global hook used to access the supported sites.
 */
export const useSites = () => {
  const sites = useContext(SitesContext);
  if (sites === undefined) {
    throw new Error("useSites must be used within a SitesProvider");
  }
  return sites;
};

// Create a provider for the sites
export const SitesProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const { handleError } = useError();
  const { isLoggedIn } = useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [sites, setSites] = useState<JobSite[]>([]);

  // Load the job sites list on mount
  useEffect(() => {
    const asyncLoad = async () => {
      try {
        if (!isLoggedIn) return;
        setSites(await listSites());
        setIsLoading(false);
      } catch (error) {
        handleError({ error });
      }
    };

    asyncLoad();
  }, [isLoggedIn]);

  const siteLogos = Object.fromEntries(
    sites.map((site) => [site.id, site.logo_url])
  );

  return (
    <SitesContext.Provider
      value={{
        isLoading,
        sites,
        siteLogos,
      }}
    >
      {children}
    </SitesContext.Provider>
  );
};
