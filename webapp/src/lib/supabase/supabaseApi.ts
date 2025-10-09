import {
  FunctionsHttpError,
  PostgrestError,
  SupabaseClient,
  User,
} from "@supabase/supabase-js";
import { backOff } from "exponential-backoff";
import * as luxon from "luxon";

import {
  AdvancedMatchingConfig,
  DbSchema,
  Job,
  JobLabel,
  JobStatus,
  Link,
} from "../../../../supabase/functions/_shared/types";

/**
 * Class used to interact with our Supabase API.
 */
export class F2aSupabaseApi {
  constructor(private _supabase: SupabaseClient<DbSchema>) {}

  /**
   * Create a new user account using an email and password.
   */
  signupWithEmail({ email, password }: { email: string; password: string }) {
    return this._supabaseApiCall(() =>
      this._supabase.auth.signUp({ email, password })
    );
  }

  /**
   * Login using an email and password.
   */
  async loginWithEmail({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) {
    const resp = await this._supabase.auth.signInWithPassword({
      email,
      password,
    });

    return this._supabaseApiCall(() =>
      this._supabase.auth.signInWithPassword({ email, password })
    );
  }

  /**
   * Send a password reset email.
   */
  sendPasswordResetEmail({ email }: { email: string }) {
    return this._supabaseApiCall(() =>
      this._supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "first2apply://reset-password",
      })
    );
  }

  /**
   * Update the password for the current user.
   */
  updatePassword({ password }: { password: string }) {
    return this._supabaseApiCall(() =>
      this._supabase.auth.updateUser({ password })
    );
  }

  /**
   * Logout the current user.
   */
  async logout() {
    return this._supabaseApiCall(async () => this._supabase.auth.signOut());
  }

  /**
   * Get the user from the current supabase session
   */
  getUser(): Promise<{ user: User | null }> {
    return this._supabaseApiCall(
      async () => await this._supabase.auth.getUser()
    ).catch(() => ({
      user: null,
    }));
  }

  /**
   * Create a new link.
   */
  async createLink({ title, url }: { title: string; url: string }) {
    const { link, newJobs } = await this._supabaseApiCall(() =>
      this._supabase.functions.invoke<{ link: Link; newJobs: Job[] }>(
        "create-link",
        {
          body: {
            title,
            url,
          },
        }
      )
    );

    return { link, newJobs };
  }

  /**
   * Get all registered links for the current user.
   */
  listLinks(): Promise<Link[]> {
    return this._supabaseApiCall(async () =>
      this._supabase.from("links").select("*").order("id", { ascending: false })
    );
  }

  /**
   * Delete a link.
   */
  deleteLink(linkId: string) {
    return this._supabaseApiCall(async () =>
      this._supabase.from("links").delete().eq("id", linkId)
    );
  }

  /**
   * Scan a list of htmls for new jobs.
   */
  scanHtmls(
    htmls: {
      linkId: number;
      content: string;
      maxRetries: number;
      retryCount: number;
    }[]
  ) {
    return this._supabaseApiCall(() =>
      this._supabase.functions.invoke<{ newJobs: Job[]; parseFailed: boolean }>(
        "scan-urls",
        {
          body: {
            htmls,
          },
        }
      )
    );
  }

  /**
   * Scan HTML for a job description.
   */
  scanJobDescription({
    jobId,
    html,
    maxRetries,
    retryCount,
  }: {
    jobId: number;
    html: string;
    maxRetries: number;
    retryCount: number;
  }) {
    return this._supabaseApiCall(() =>
      this._supabase.functions.invoke<{ job: Job; parseFailed: boolean }>(
        "scan-job-description",
        {
          body: {
            jobId,
            html,
            maxRetries,
            retryCount,
          },
        }
      )
    );
  }

  /**
   * Run the post scan hook edge function.
   */
  runPostScanHook({
    newJobIds,
    areEmailAlertsEnabled,
  }: {
    newJobIds: number[];
    areEmailAlertsEnabled: boolean;
  }) {
    return this._supabaseApiCall(() =>
      this._supabase.functions.invoke("post-scan-hook", {
        body: {
          newJobIds,
          areEmailAlertsEnabled,
        },
      })
    );
  }

  /**
   * List all jobs for the current user.
   */
  async listJobs({
    status,
    search,
    siteIds,
    linkIds,
    limit = 50,
    after,
  }: {
    status: JobStatus;
    search?: string;
    siteIds?: number[];
    linkIds?: number[];
    limit?: number;
    after?: string;
  }) {
    const jobs_search = search || undefined;
    const jobs_site_ids = siteIds?.length ?? 0 > 0 ? siteIds : undefined;
    const jobs_link_ids = linkIds?.length ?? 0 > 0 ? linkIds : undefined;
    console.log('[SupabaseApi:listJobs] params', {
      status,
      search: jobs_search,
      siteIds: jobs_site_ids,
      linkIds: jobs_link_ids,
      limit,
      after,
    });
    const [jobs, counters] = await Promise.all([
      this._supabaseApiCall<Job[], PostgrestError>(async () => {
        const res = await this._supabase.rpc("list_jobs", {
          jobs_status: status,
          jobs_after: after ?? null,
          jobs_page_size: limit,
          jobs_search,
          jobs_site_ids,
          jobs_link_ids,
          jobs_labels: undefined,
          jobs_favorites_only: false,
          jobs_hide_reposts: false, // Add missing parameter to match 10-parameter version
          jobs_show_reposts_only: false, // Add missing parameter to match 10-parameter version
        });
        console.log('[SupabaseApi:listJobs] list_jobs result', { rows: res?.length, limit, after });
        return res;
      }),
      this._supabaseApiCall<
        Array<{
          status: JobStatus;
          job_count: number;
        }>,
        PostgrestError
      >(async () => {
        const res = await this._supabase.rpc("count_jobs", {
          jobs_status: status,
          jobs_search,
          jobs_site_ids,
          jobs_link_ids,
          jobs_labels: undefined,
          jobs_favorites_only: false,
          jobs_hide_reposts: false, // Add missing parameter to match 8-parameter version
          jobs_show_reposts_only: false, // Add missing parameter to match 8-parameter version
        });
        try {
          console.log('[SupabaseApi:listJobs] count_jobs result', res);
        } catch {}
        return res;
      }),
    ]);

    let nextPageToken: string | undefined;
    if (jobs.length === limit) {
      // the next page token will include the last id as well as it's last updated_at
      const lastJob = jobs[jobs.length - 1];
      nextPageToken = `${lastJob.id}!${lastJob.updated_at}`;
    }
    console.log('[SupabaseApi:listJobs] computed nextPageToken', { nextPageToken });

    const countersMap = new Map(counters.map((c) => [c.status, c.job_count]));
    return {
      jobs,
      new: countersMap.get("new") ?? 0,
      archived: countersMap.get("archived") ?? 0,
      applied: countersMap.get("applied") ?? 0,
      filtered: countersMap.get("excluded_by_advanced_matching") ?? 0,
      nextPageToken,
    };
  }

  /**
   * Update the status of a job.
   */
  updateJobStatus({ jobId, status }: { jobId: string; status: JobStatus }) {
    return this._supabaseApiCall(
      async () =>
        await this._supabase
          .from("jobs")
          .update({
            status,
            updated_at: luxon.DateTime.now().toUTC().toJSDate(),
          })
          .eq("id", jobId)
    );
  }

  /**
   * Update the labels of a job.
   * @returns the updated job
   */
  async updateJobLabels({
    jobId,
    labels,
  }: {
    jobId: string;
    labels: JobLabel[];
  }) {
    const [updatedJob] = await this._supabaseApiCall(
      async () =>
        await this._supabase
          .from("jobs")
          .update({
            labels,
          })
          .eq("id", jobId)
          .select("*")
    );

    return updatedJob;
  }

  /**
   * List all sites.
   */
  listSites() {
    return this._supabaseApiCall(
      async () => await this._supabase.from("sites").select("*")
    );
  }

  /**
   * Get a job by id.
   */
  async getJob(jobId: number) {
    const [job] = await this._supabaseApiCall(async () =>
      this._supabase.from("jobs").select("*").eq("id", jobId)
    );
    return job;
  }

  /**
   * Change the status of all jobs with a certain status to another status.
   */
  async changeAllJobStatus({ from, to }: { from: JobStatus; to: JobStatus }) {
    return this._supabaseApiCall(async () =>
      this._supabase
        .from("jobs")
        .update({
          status: to,
          updated_at: luxon.DateTime.now().toUTC().toJSDate(),
        })
        .eq("status", from)
    );
  }

  /**
   * Wrapper around a Supabase method that handles errors.
   */
  private async _supabaseApiCall<
    T,
    E extends Error | PostgrestError | FunctionsHttpError | null
  >(
    method: () => Promise<
      | {
          data: T;
          error: null;
        }
      | {
          data: null;
          error: E;
        }
    >
  ): Promise<T | undefined> {
    const startMs = Date.now();
    const attemptTimings: number[] = [];
    const label = '[webapp-supabaseApi]';
    try {
      const { data, error } = await backOff(
        async () => {
          const attemptStart = Date.now();
          const result = await method();
          attemptTimings.push(Date.now() - attemptStart);
          if (result.error) throw result.error;

          return result;
        },
        {
          numOfAttempts: 5,
          jitter: "full",
          startingDelay: 300,
        }
      );

      const totalMs = Date.now() - startMs;
      try {
        // Log only if slow (>500ms) or there were retries
        const maxAttempt = attemptTimings.length > 0 ? Math.max(...attemptTimings) : totalMs;
        if (totalMs > 500 || attemptTimings.length > 1) {
          console.log(
            `${label} success in %d ms (attempts=%d, timings=%s)`,
            totalMs,
            attemptTimings.length || 1,
            attemptTimings.join(',') || String(totalMs),
          );
        }
      } catch {}

    // edge functions don't throw errors, instead they return an errorMessage field in the data object
    // work around for this issue https://github.com/supabase/functions-js/issues/45
    if (
      !!data &&
      typeof data === "object" &&
      "errorMessage" in data &&
      // @ts-ignore
      typeof data.errorMessage === "string"
    ) {
      // @ts-ignore
      throw new Error(data.errorMessage);
    }

    if (error) throw error;

    return data;
    } catch (err: any) {
      const totalMs = Date.now() - startMs;
      try {
        console.error(`${label} failed in %d ms (attempts=%d, timings=%s): %s`, totalMs, attemptTimings.length || 1, attemptTimings.join(','), err?.message || String(err));
      } catch {}
      throw err;
    }
  }

  /**
   * Create a user review.
   */
  async createReview({
    title,
    description,
    rating,
  }: {
    title: string;
    description?: string;
    rating: number;
  }) {
    const [createdReview] =
      (await this._supabaseApiCall(
        async () =>
          await this._supabase
            .from("reviews")
            .insert({
              title: title.trim(),
              description: description?.trim(),
              rating,
            })
            .select("*")
      )) ?? [];

    return createdReview;
  }

  /**
   * Get user's review.
   */
  async getUserReview() {
    const [review] =
      (await this._supabaseApiCall(
        async () => await this._supabase.from("reviews").select("*")
      )) ?? [];

    return review;
  }

  /**
   * Update a user review.
   */
  async updateReview({
    id,
    title,
    description,
    rating,
  }: {
    id: number;
    title: string;
    description?: string;
    rating: number;
  }) {
    const [updatedReview] =
      (await this._supabaseApiCall(
        async () =>
          await this._supabase
            .from("reviews")
            .update({
              title: title.trim(),
              description: description?.trim(),
              rating,
            })
            .eq("id", id)
            .select("*")
      )) ?? [];

    return updatedReview;
  }

  /**
   * Get the profile of the current user.
   */
  async getProfile() {
    const [profile] =
      (await this._supabaseApiCall(
        async () => await this._supabase.from("profiles").select("*")
      )) ?? [];

    return profile;
  }

  /**
   * Create a new note for the current user.
   */
  async createNote({
    job_id,
    text,
    files,
  }: {
    job_id: number;
    text: string;
    files?: string[];
  }) {
    const [createdNote] =
      (await this._supabaseApiCall(
        async () =>
          await this._supabase.from("notes").insert({ text, files }).select("*")
      )) ?? [];

    return createdNote;
  }

  /**
   * Fetch all notes for the current user for a job.
   */
  async listNotes(job_id: number) {
    return this._supabaseApiCall(async () =>
      this._supabase
        .from("notes")
        .select("*")
        .eq("job_id", job_id)
        .order("created_at", { ascending: false })
    );
  }

  /**
   * Update an existing note by ID.
   */
  async updateNote({ noteId, text }: { noteId: number; text: string }) {
    return this._supabaseApiCall(async () =>
      this._supabase
        .from("notes")
        .update({ text })
        .eq("id", noteId)
        .select("*")
        .single()
    );
  }

  /**
   * Add a file to a note.
   */
  async addFileToNote({ noteId, file }: { noteId: number; file: string }) {
    const result = await this._supabase
      .from("notes")
      .select("files")
      .eq("id", noteId)
      .single();

    if (result.error) {
      throw result.error;
    }

    const updatedFiles = result.data.files
      ? [...result.data.files, file]
      : [file];

    return this._supabaseApiCall(async () =>
      this._supabase
        .from("notes")
        .update({ files: updatedFiles })
        .eq("id", noteId)
        .single()
    );
  }

  /**
   * Delete a specific note by ID.
   */
  async deleteNote(noteId: number) {
    return this._supabaseApiCall(async () =>
      this._supabase.from("notes").delete().eq("id", noteId)
    );
  }

  /**
   * Get the advanced matching configuration for the current user.
   */
  async getAdvancedMatchingConfig() {
    const [config] = await this._supabaseApiCall(
      async () => await this._supabase.from("advanced_matching").select("*")
    );

    return config;
  }

  /**
   * Update the advanced matching configuration for the current user.
   */
  async updateAdvancedMatchingConfig(
    config: Pick<
      AdvancedMatchingConfig,
      "chatgpt_prompt" | "blacklisted_companies"
    >
  ) {
    const [updatedConfig] = await this._supabaseApiCall(
      async () =>
        await this._supabase
          .from("advanced_matching")
          .upsert(config, {
            onConflict: "user_id",
          })
          .select("*")
    );

    return updatedConfig;
  }
}
