import { FunctionsHttpError, PostgrestError, SupabaseClient, User } from '@supabase/supabase-js';
import { backOff } from 'exponential-backoff';
import * as fs from 'fs';
import * as os from 'os';
import * as luxon from 'luxon';
import * as path from 'path';

import {
  AdvancedMatchingConfig,
  DbSchema,
  Job,
  JobLabel,
  JobStatus,
  Link,
} from '../../../supabase/functions/_shared/types';

/**
 * Class used to interact with our Supabase API.
 */
export class F2aSupabaseApi {
  constructor(private _supabase: SupabaseClient<DbSchema>) {}

  /**
   * Create a new user account using an email and password.
   */
  signupWithEmail({ email, password }: { email: string; password: string }) {
    return this._supabaseApiCall(() => this._supabase.auth.signUp({ email, password }));
  }

  /**
   * Login using an email and password.
   */
  async loginWithEmail({ email, password }: { email: string; password: string }) {
    return this._supabaseApiCall(() => this._supabase.auth.signInWithPassword({ email, password }));
  }

  /**
   * Send a password reset email.
   */
  sendPasswordResetEmail({ email }: { email: string }) {
    return this._supabaseApiCall(() =>
      this._supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'first2apply://reset-password',
      }),
    );
  }

  /**
   * Update the password for the current user.
   */
  updatePassword({ password }: { password: string }) {
    return this._supabaseApiCall(() => this._supabase.auth.updateUser({ password }));
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
    return this._supabaseApiCall(async () => await this._supabase.auth.getUser()).catch(() => ({
      user: null,
    } as { user: User | null }));
  }

  /**
   * Create a new link.
   */
  async createLink({ title, url, html }: { title: string; url: string; html: string }) {
    // for debugging, use a test.html file
    // const htmlFixture = fs.readFileSync(path.join(__dirname, '../../../test.html'), 'utf-8');
    // html = htmlFixture;

    const { link, newJobs } = await this._supabaseApiCall(() =>
      this._supabase.functions.invoke<{ link: Link; newJobs: Job[] }>('create-link', {
        body: {
          title,
          url,
          html,
        },
      }),
    );

    return { link, newJobs };
  }

  /**
   * Update an existing link.
   */
  async updateLink({ linkId, title, url }: { linkId: number; title: string; url: string }): Promise<Link> {
    const updatedLink = await this._supabaseApiCall(() =>
      this._supabase.functions.invoke<Link>('update-link', {
        body: { linkId, title, url },
      }),
    );

    return updatedLink;
  }

  /**
   * Get all registered links for the current user.
   */
  listLinks(): Promise<Link[]> {
    return this._supabaseApiCall(async () =>
      this._supabase.from('links').select('*').order('id', { ascending: false }),
    );
  }

  /**
   * Delete a link.
   */
  deleteLink(linkId: string) {
    return this._supabaseApiCall(async () => this._supabase.from('links').delete().eq('id', linkId));
  }

  /**
   * Insert a link directly into the database (for importing).
   */
  async insertLinkRaw({ title, url, site_id }: { title: string; url: string; site_id: number }): Promise<Link> {
    return this._supabaseApiCall(async () => {
      const { data } = await this._supabase
        .from('links')
        .insert({ title, url, site_id })
        .select('*')
        .single();
      return data;
    });
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
    }[],
  ) {
    return this._supabaseApiCall(() =>
      this._supabase.functions.invoke<{ newJobs: Job[]; parseFailed: boolean }>('scan-urls', {
        body: {
          htmls,
        },
      }),
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
    // Load API config saved by the desktop app UI
    let provider: 'openai' | 'gemini' | 'llama' | undefined;
    let openaiKey: string | undefined;
    let geminiKey: string | undefined;
    try {
      const configPath = path.join(os.homedir(), '.first2apply-api-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8')) as {
          provider?: 'openai' | 'gemini' | 'llama';
          keys?: { openai?: string; gemini?: string; llama?: string };
        };
        provider = config.provider;
        openaiKey = config.keys?.openai;
        geminiKey = config.keys?.gemini;
      }
    } catch {}

    return this._supabaseApiCall(() =>
      this._supabase.functions.invoke<{ job: Job; parseFailed: boolean }>('scan-job-description', {
        body: {
          jobId,
          html,
          maxRetries,
          retryCount,
          llmProvider: provider,
          openAiApiKey: openaiKey,
          geminiApiKey: geminiKey,
        },
      }),
    );
  }

  /**
   * Run the post scan hook edge function.
   */
  runPostScanHook({ newJobIds, areEmailAlertsEnabled }: { newJobIds: number[]; areEmailAlertsEnabled: boolean }) {
    return this._supabaseApiCall(() =>
      this._supabase.functions.invoke('post-scan-hook', {
        body: {
          newJobIds,
          areEmailAlertsEnabled,
        },
      }),
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
    labels,
    favoritesOnly,
    limit = 50,
    after,
  }: {
    status: JobStatus;
    search?: string;
    siteIds?: number[];
    linkIds?: number[];
    labels?: string[];
    favoritesOnly?: boolean;
    limit?: number;
    after?: string;
  }) {
    const jobs_search = search || undefined;
    const jobs_site_ids = siteIds?.length > 0 ? siteIds : undefined;
    const jobs_link_ids = linkIds?.length > 0 ? linkIds : undefined;
    const jobs_labels = labels?.length > 0 ? labels : undefined;
    const [jobs, countersByStatus] = await Promise.all([
      this._supabaseApiCall<Job[], PostgrestError>(async () => {
        const res = await this._supabase.rpc('list_jobs', {
          jobs_status: status,
          jobs_after: after ?? null,
          jobs_page_size: limit,
          jobs_search,
          jobs_site_ids,
          jobs_link_ids,
          jobs_labels,
          jobs_favorites_only: favoritesOnly ?? null,
        });

        return res;
      }),
      // Fetch counters for each status independently so tab badges reflect global counts
      Promise.all([
        this._supabaseApiCall(
          async () =>
            await this._supabase.rpc('count_jobs', {
              jobs_status: 'new',
              jobs_search,
              jobs_site_ids,
              jobs_link_ids,
              jobs_labels,
              jobs_favorites_only: favoritesOnly ?? null,
            }),
        ),
        this._supabaseApiCall(
          async () =>
            await this._supabase.rpc('count_jobs', {
              jobs_status: 'applied',
              jobs_search,
              jobs_site_ids,
              jobs_link_ids,
              jobs_labels,
              jobs_favorites_only: favoritesOnly ?? null,
            }),
        ),
        this._supabaseApiCall(
          async () =>
            await this._supabase.rpc('count_jobs', {
              jobs_status: 'archived',
              jobs_search,
              jobs_site_ids,
              jobs_link_ids,
              jobs_labels,
              jobs_favorites_only: favoritesOnly ?? null,
            }),
        ),
        this._supabaseApiCall(
          async () =>
            await this._supabase.rpc('count_jobs', {
              jobs_status: 'excluded_by_advanced_matching',
              jobs_search,
              jobs_site_ids,
              jobs_link_ids,
              jobs_labels,
              jobs_favorites_only: favoritesOnly ?? null,
            }),
        ),
      ]),
    ]);

    let nextPageToken: string | undefined;
    if (jobs.length === limit) {
      // the next page token will include the last id as well as it's last updated_at
      const lastJob = jobs[jobs.length - 1];
      nextPageToken = `${lastJob.id}!${lastJob.updated_at}`;
    }

    const countersMap = new Map<JobStatus, number>();
    try {
      const [newC, appliedC, archivedC, filteredC] = countersByStatus;
      const pickCount = (arr: any) => (Array.isArray(arr) && arr[0] && typeof arr[0].job_count === 'number' ? arr[0].job_count : 0);
      countersMap.set('new', pickCount(newC));
      countersMap.set('applied', pickCount(appliedC));
      countersMap.set('archived', pickCount(archivedC));
      // Stored procedure uses 'excluded_by_advanced_matching' but returns status accordingly if included; we set filtered explicitly
      countersMap.set('excluded_by_advanced_matching', pickCount(filteredC));
    } catch {}
    const payload = {
      jobs,
      new: countersMap.get('new') ?? 0,
      archived: countersMap.get('archived') ?? 0,
      applied: countersMap.get('applied') ?? 0,
      filtered: countersMap.get('excluded_by_advanced_matching') ?? 0,
      nextPageToken,
    };
    try {
      console.log('[supabaseApi.listJobs] status=%s search=%s siteIds=%j linkIds=%j labels=%j favoritesOnly=%j -> counts=%j nextPageToken=%s jobs=%d',
        status, !!search, jobs_site_ids, jobs_link_ids, jobs_labels, favoritesOnly, { new: payload.new, applied: payload.applied, archived: payload.archived, filtered: payload.filtered }, nextPageToken, jobs.length);
    } catch {}
    return payload;
  }

  /**
   * Update the status of a job.
   */
  updateJobStatus({ jobId, status }: { jobId: string; status: JobStatus }) {
    return this._supabaseApiCall(
      async () =>
        await this._supabase
          .from('jobs')
          .update({
            status,
            updated_at: luxon.DateTime.now().toUTC().toJSDate(),
          })
          .eq('id', jobId),
    );
  }

  /**
   * Update the labels of a job.
   * @returns the updated job
   */
  async updateJobLabels({ jobId, labels }: { jobId: string; labels: JobLabel[] }) {
    const [updatedJob] = await this._supabaseApiCall(
      async () =>
        await this._supabase
          .from('jobs')
          .update({
            labels,
          })
          .eq('id', jobId)
          .select('*'),
    );

    return updatedJob;
  }

  /**
   * List all sites.
   */
  listSites() {
    return this._supabaseApiCall(async () => await this._supabase.from('sites').select('*'));
  }

  /**
   * Get a job by id.
   */
  async getJob(jobId: number) {
    const [job] = await this._supabaseApiCall(async () => this._supabase.from('jobs').select('*').eq('id', jobId));
    return job;
  }

  /**
   * Change the status of all jobs with a certain status to another status.
   */
  async changeAllJobStatus({ from, to }: { from: JobStatus; to: JobStatus }) {
    return this._supabaseApiCall(async () =>
      this._supabase
        .from('jobs')
        .update({
          status: to,
          updated_at: luxon.DateTime.now().toUTC().toJSDate(),
        })
        .eq('status', from),
    );
  }

  /**
   * Wrapper around a Supabase method that handles errors.
   */
  private async _supabaseApiCall<T, E extends Error | PostgrestError | FunctionsHttpError>(
    method: () => Promise<{ data?: T; error: E }>,
  ) {
    const { data, error } = await backOff(
      async () => {
        const result = await method();
        if (result.error) throw result.error;

        return result;
      },
      {
        numOfAttempts: 5,
        jitter: 'full',
        startingDelay: 300,
      },
    );

    // edge functions don't throw errors, instead they return an errorMessage field in the data object
    // work around for this issue https://github.com/supabase/functions-js/issues/45
    if (
      !!data &&
      typeof data === 'object' &&
      'errorMessage' in data &&
      // @ts-ignore
      typeof data.errorMessage === 'string'
    ) {
      // @ts-ignore
      throw new Error(data.errorMessage);
    }

    if (error) throw error;

    return data;
  }

  /**
   * Create a user review.
   */
  async createReview({ title, description, rating }: { title: string; description?: string; rating: number }) {
    const [createdReview] = await this._supabaseApiCall(
      async () =>
        await this._supabase
          .from('reviews')
          .insert({
            title: title.trim(),
            description: description?.trim(),
            rating,
          })
          .select('*'),
    );

    return createdReview;
  }

  /**
   * Get user's review.
   */
  async getUserReview() {
    const [review] = await this._supabaseApiCall(async () => await this._supabase.from('reviews').select('*'));

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
    const [updatedReview] = await this._supabaseApiCall(
      async () =>
        await this._supabase
          .from('reviews')
          .update({
            title: title.trim(),
            description: description?.trim(),
            rating,
          })
          .eq('id', id)
          .select('*'),
    );

    return updatedReview;
  }

  /**
   * Get the profile of the current user.
   */
  async getProfile() {
    const [profile] = await this._supabaseApiCall(async () => await this._supabase.from('profiles').select('*'));

    return profile;
  }

  /**
   * Create a new note for the current user.
   */
  async createNote({ job_id, text, files }: { job_id: number; text: string; files?: string[] }) {
    const [createdNote] = await this._supabaseApiCall(
      async () => await this._supabase.from('notes').insert({ job_id, text, files }).select('*'),
    );

    return createdNote;
  }

  /**
   * Fetch all notes for the current user for a job.
   */
  async listNotes(job_id: number) {
    return this._supabaseApiCall(async () =>
      this._supabase.from('notes').select('*').eq('job_id', job_id).order('created_at', { ascending: false }),
    );
  }

  /**
   * Update an existing note by ID.
   */
  async updateNote({ noteId, text }: { noteId: number; text: string }) {
    return this._supabaseApiCall(async () =>
      this._supabase.from('notes').update({ text }).eq('id', noteId).select('*').single(),
    );
  }

  /**
   * Add a file to a note.
   */
  async addFileToNote({ noteId, file }: { noteId: number; file: string }) {
    const result = await this._supabase.from('notes').select('files').eq('id', noteId).single();

    if (result.error) {
      throw result.error;
    }

    const updatedFiles = result.data.files ? [...result.data.files, file] : [file];

    return this._supabaseApiCall(async () =>
      this._supabase.from('notes').update({ files: updatedFiles }).eq('id', noteId).single(),
    );
  }

  /**
   * Delete a specific note by ID.
   */
  async deleteNote(noteId: number) {
    return this._supabaseApiCall(async () => this._supabase.from('notes').delete().eq('id', noteId));
  }

  /**
   * Get the advanced matching configuration for the current user.
   */
  async getAdvancedMatchingConfig() {
    const [config] = await this._supabaseApiCall(
      async () => await this._supabase.from('advanced_matching').select('*'),
    );

    return config;
  }

  /**
   * Update the advanced matching configuration for the current user.
   */
  async updateAdvancedMatchingConfig(config: Pick<AdvancedMatchingConfig, 'chatgpt_prompt' | 'blacklisted_companies' | 'favorite_companies'>) {
    const [updatedConfig] = await this._supabaseApiCall(
      async () =>
        await this._supabase
          .from('advanced_matching')
          .upsert(config, {
            onConflict: 'user_id',
          })
          .select('*'),
    );

    return updatedConfig;
  }

  /**
   * Increase scrape failure count for a link.
   */
  async increaseScrapeFailureCount({ linkId, failures }: { linkId: number; failures: number }) {
    await this._supabaseApiCall(async () =>
      this._supabase.from('links').update({ scrape_failure_count: failures }).eq('id', linkId),
    );
  }
}
