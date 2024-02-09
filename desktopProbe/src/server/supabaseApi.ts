import {
  FunctionsHttpError,
  PostgrestError,
  SupabaseClient,
  User,
} from "@supabase/supabase-js";
import {
  DbSchema,
  Job,
  JobStatus,
  Link,
} from "../../../supabase/functions/_shared/types";
import * as luxon from "luxon";

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
  loginWithEmail({ email, password }: { email: string; password: string }) {
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
  async createLink({
    title,
    url,
    html,
  }: {
    title: string;
    url: string;
    html: string;
  }): Promise<{ link: Link }> {
    return this._supabaseApiCall(() =>
      this._supabase.functions.invoke("create-link", {
        body: {
          title,
          url,
          html,
        },
      })
    );
  }

  /**
   * Get all registered links for the current user.
   */
  listLinks() {
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
  scanHtmls(htmls: { linkId: number; content: string }[]) {
    return this._supabaseApiCall(() =>
      this._supabase.functions.invoke("scan-urls", {
        body: {
          htmls,
        },
      })
    );
  }

  /**
   * List all jobs for the current user.
   */
  async listJobs({
    status,
    limit = 50,
    after,
  }: {
    status: JobStatus;
    limit?: number;
    after?: string;
  }) {
    const jobs = await this._supabaseApiCall<Job[], PostgrestError>(
      async () => {
        // @ts-ignore
        const res = await this._supabase.rpc("list_jobs", {
          jobs_status: status,
          jobs_after: after ?? null,
          jobs_page_size: limit,
        });

        return res;
      }
    );

    // also return counters for grouped statuses
    const statusses: JobStatus[] = ["new", "archived", "applied"];
    const counters = await Promise.all(
      statusses.map(async (status) => {
        const { count, error } = await this._supabase
          .from("jobs")
          .select("*", { count: "exact", head: true })
          .eq("status", status);
        if (error) throw error;

        return { status, count };
      })
    );

    let nextPageToken: string | undefined;
    if (jobs.length === limit) {
      // the next page token will include the last id as well as it's last updated_at
      const lastJob = jobs[jobs.length - 1];
      nextPageToken = `${lastJob.id}!${lastJob.updated_at}`;
    }

    return {
      jobs,
      new: counters[0].count,
      archived: counters[1].count,
      applied: counters[2].count,
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
   * List all sites.
   */
  listSites() {
    return this._supabaseApiCall(
      async () => await this._supabase.from("sites").select("*")
    );
  }

  /**
   * Wrapper around a Supabase method that handles errors.
   */
  private async _supabaseApiCall<
    T,
    E extends Error | PostgrestError | FunctionsHttpError
  >(method: () => Promise<{ data?: T; error: E }>) {
    const { data, error } = await method();

    // edge functions don't throw errors, instead they return an errorMessage field in the data object
    // work around for this issue https://github.com/supabase/functions-js/issues/45
    if (
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
  }
}
