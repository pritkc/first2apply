export const JOB_PROVIDERS = {
  linkedin: {
    url: "https://www.linkedin.com/",
  },
  remoteok: {
    url: "https://remoteok.com/",
  },
  weworkremotely: {
    url: "https://weworkremotely.com/",
  },
};
export type JobProviders = keyof typeof JOB_PROVIDERS;

// indeed.com - protected against scraping using cloudflare :/
// https://www.breakoutlist.com/
// https://topstartups.io/#
// https://www.nowhiteboard.org/?&page=4&languages=JavaScript&level=Senior
// https://peoplefirstjobs.com/jobs/development
// https://4dayweek.io/

export type Link = {
  id: string;
  url: string;
  title: string;
  user_id: string;
  created_at: Date;
};

export type JobType = "remote" | "hybrid" | "onsite";
export type Job = {
  id: string;
  user_id: string;
  externalId: string;
  externalUrl: string;
  provider: JobProviders;

  title: string;
  companyName: string;
  companyLogo?: string;

  jobType?: JobType;
  location?: string;
  salary?: string;
  tags?: string[];

  visible: boolean;
  archived: boolean;

  created_at: Date;
  updated_at: Date;
};

/**
 * Supabase database schema.
 */
export type DbSchema = {
  public: {
    Tables: {
      links: {
        Row: Link;
        Insert: Pick<Link, "url" | "title">;
        Update: never;
      };
      jobs: {
        Row: Job;
        Insert: Pick<
          Job,
          | "provider"
          | "externalId"
          | "externalUrl"
          | "title"
          | "companyName"
          | "companyLogo"
          | "location"
        >;
        Update: never;
      };
    };
    Views: {};
    Functions: {};
  };
  private: {
    Tables: {};
    Views: {};
    Functions: {};
  };
};
