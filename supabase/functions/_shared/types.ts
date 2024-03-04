export enum SiteProvider {
  linkedin = "linkedin",
  indeed = "indeed",
  glassdoor = "glassdoor",
  weworkremotely = "weworkremotely",
  remoteok = "remoteok",
}

export type JobSite = {
  id: number;
  provider: SiteProvider;
  name: string;
  urls: string[];
  queryParamsToRemove?: string[];
  blacklisted_paths: string[];
  created_at: Date;
  logo_url: string;
};

export type Link = {
  id: number;
  url: string;
  title: string;
  user_id: string;
  site_id: number;
  created_at: Date;
};

export type JobType = "remote" | "hybrid" | "onsite";
export type JobStatus = "new" | "applied" | "archived";
export type Job = {
  id: number;
  user_id: string;
  externalId: string;
  externalUrl: string;
  siteId: number;

  // main info
  title: string;
  companyName: string;
  companyLogo?: string;

  // metadata
  jobType?: JobType;
  location?: string;
  salary?: string;
  tags?: string[];

  description?: string;

  status: JobStatus;

  created_at: Date;
  updated_at: Date;
};

/**
 * Supabase database schema.
 */
export type DbSchema = {
  public: {
    Tables: {
      sites: {
        Row: JobSite;
        Insert: Pick<JobSite, "name" | "urls">;
        Update: never;
      };
      links: {
        Row: Link;
        Insert: Pick<Link, "url" | "title" | "site_id">;
        Update: never;
      };
      jobs: {
        Row: Job;
        Insert: Pick<
          Job,
          | "siteId"
          | "externalId"
          | "externalUrl"
          | "title"
          | "companyName"
          | "companyLogo"
          | "location"
          | "salary"
          | "tags"
          | "jobType"
          | "status"
        >;
        Update: Pick<Job, "status"> | Pick<Job, "description">;
      };
    };
    Views: {};
    Functions: {};
  };
};
