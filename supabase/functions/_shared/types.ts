export enum SiteProvider {
  linkedin = "linkedin",
  glassdoor = "glassdoor",
  indeed = "indeed",
  remoteok = "remoteok",
  weworkremotely = "weworkremotely",
  dice = "dice",
  flexjobs = "flexjobs",
  bestjobs = "bestjobs",
  echojobs = "echojobs",
  remotive = "remotive",
  remoteio = "remoteio",
  builtin = "builtin",
  naukri = "naukri",
  robertHalf = "robertHalf",
}

export const JOB_LABELS = {
  CONSIDERING: "Considering",
  SUBMITTED: "Submitted",
  INTERVIEWING: "Interviewing",
  OFFER: "Offer",
  REJECTED: "Rejected",
  GHOSTED: "Ghosted",
} as const;

export type JobLabel = (typeof JOB_LABELS)[keyof typeof JOB_LABELS];

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
export type JobStatus = "new" | "applied" | "archived" | "deleted";
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
  labels: JobLabel[];

  created_at: Date;
  updated_at: Date;
};

export type Review = {
  id: number;
  user_id: string;
  title: string;
  description?: string;
  rating: number;
  created_at: Date;
};
export type HtmlDump = {
  id: number;
  user_id: string;
  url: string;
  html: string;
  created_at: Date;
};

export type SubscriptionTier = "basic" | "pro";
export type Profile = {
  id: number;
  user_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_end_date: string;
  subscription_tier: SubscriptionTier;
  is_trial: boolean;
};

export type StripeBillingPlan = {
  tier: SubscriptionTier;
  monthlyCheckoutLink: string;
  quarterlyCheckoutLink: string;
  biannuallyCheckoutLink: string;
  yearlyCheckoutLink: string;
};

export type StripeConfig = {
  customerPortalLink: string;
  plans: StripeBillingPlan[];
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
        Update:
          | Pick<Job, "status">
          | Pick<Job, "description">
          | Pick<Job, "labels">;
      };
      reviews: {
        Row: Review;
        Insert: Pick<Review, "title" | "description" | "rating">;
        Update: Pick<Review, "title" | "description" | "rating">;
      };
      html_dumps: {
        Row: HtmlDump;
        Insert: Pick<HtmlDump, "url" | "html">;
        Update: never;
      };
      profiles: {
        Row: Profile;
        Insert: never;
        Update: Pick<
          Profile,
          | "stripe_customer_id"
          | "stripe_subscription_id"
          | "subscription_end_date"
          | "subscription_tier"
          | "is_trial"
        >;
      };
    };
    Views: {};
    Functions: {
      get_user_id_by_email: {
        Params: { email: string };
        Returns: { id: string };
      };
    };
  };
};
