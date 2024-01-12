export const JOB_PROVIDERS = {
  linkedin: {
    url: "https://www.linkedin.com/",
  },
  remoteok: {
    url: "https://remoteok.io/",
  },
};
export type JobProviders = keyof typeof JOB_PROVIDERS;

export type Job = {
  externalId: string;
  externalUrl: string;
  provider: JobProviders;
  title: string;
  companyName: string;
  companyLogo: string;
  location: string;
};

export type Link = {
  url: string;
};

/**
 * Supabase database schema.
 */
type LinkRow = Link & {
  id: string;
  user_id: string;
  created_at: Date;
};

type JobRow = Job & {
  id: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
};

export type DbSchema = {
  public: {
    Tables: {
      links: {
        Row: LinkRow;
        Insert: Pick<LinkRow, "url">;
        Update: never;
      };
      jobs: {
        Row: JobRow;
        Insert: Pick<
          JobRow,
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
