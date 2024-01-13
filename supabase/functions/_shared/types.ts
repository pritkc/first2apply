export const JOB_PROVIDERS = {
  linkedin: {
    url: "https://www.linkedin.com/",
  },
  remoteok: {
    url: "https://remoteok.io/",
  },
};
export type JobProviders = keyof typeof JOB_PROVIDERS;

export type Link = {
  id: string;
  url: string;
  title: string;
  user_id: string;
  created_at: Date;
};

export type Job = {
  id: string;
  user_id: string;
  externalId: string;
  externalUrl: string;
  provider: JobProviders;
  title: string;
  companyName: string;
  companyLogo: string;
  location: string;
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
