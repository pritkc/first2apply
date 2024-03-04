import { User } from "@supabase/supabase-js";
import { JobScannerSettings } from "./types";
import {
  Job,
  JobSite,
  JobStatus,
  Link,
  Review,
} from "../../../supabase/functions/_shared/types";

async function _mainProcessApiCall<T>(
  channel: string,
  params?: object
): Promise<T> {
  // @ts-ignore
  const { data, error } = await window.electron.invoke(channel, params);
  if (error) throw new Error(error);

  return data;
}

/**
 * Create a new account with email and password.
 */
export async function signupWithEmail({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<User> {
  const { user } = await _mainProcessApiCall<{ user: User }>(
    "signup-with-email",
    {
      email,
      password,
    }
  );

  return user;
}

/**
 * Login with email and password.
 */
export async function loginWithEmail({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<User> {
  const { user } = await _mainProcessApiCall<{ user: User }>(
    "login-with-email",
    {
      email,
      password,
    }
  );

  return user;
}

/**
 * Send a password reset email.
 */
export async function sendPasswordResetEmail({
  email,
}: {
  email: string;
}): Promise<void> {
  await _mainProcessApiCall("send-password-reset-email", { email });
}

/**
 * Change the password of the current user.
 */
export async function changePassword({
  password,
}: {
  password: string;
}): Promise<User> {
  const { user } = await _mainProcessApiCall<{ user: User }>(
    "change-password",
    { password }
  );
  return user;
}

/**
 * Logout user session.
 */
export async function logout(): Promise<void> {
  await _mainProcessApiCall("logout", {});
}

/**
 * Get user from the current session.
 */
export async function getUser(): Promise<User | null> {
  const { user } = await _mainProcessApiCall<{ user: User | null }>(
    "get-user",
    {}
  );
  return user;
}

/**
 * Function used to create a new link.
 */
export async function createLink({
  title,
  url,
}: {
  title: string;
  url: string;
}): Promise<Link> {
  const { link } = await _mainProcessApiCall<{ link: Link }>("create-link", {
    title,
    url,
  });
  return link;
}

/**
 * List all links.
 */
export async function listLinks(): Promise<Link[]> {
  const links = await _mainProcessApiCall<Link[]>("list-links", {});
  return links;
}

/**
 * Delete a link.
 */
export async function deleteLink(linkId: number): Promise<void> {
  await _mainProcessApiCall("delete-link", { linkId });
}

/**
 * List all jobs.
 */
export async function listJobs({
  status,
  limit,
  after,
}: {
  status: JobStatus;
  limit?: number;
  after?: string;
}) {
  const result = await _mainProcessApiCall<{
    jobs: Job[];
    new: number;
    applied: number;
    archived: number;
    nextPageToken?: string;
  }>("list-jobs", {
    status,
    limit,
    after,
  });

  return result;
}

/**
 * Update the archived status of a job.
 */
export async function updateJobStatus({
  jobId,
  status,
}: {
  jobId: number;
  status: JobStatus;
}): Promise<void> {
  await _mainProcessApiCall("update-job-status", { jobId, status });
}

/**
 * List all sites.
 */
export async function listSites() {
  return await _mainProcessApiCall<JobSite[]>("list-sites", {});
}

/**
 * Update the settings of the probe.
 */
export async function updateProbeSettings(
  settings: JobScannerSettings
): Promise<void> {
  await _mainProcessApiCall("update-job-scanner-settings", {
    settings,
  });
}

/**
 * Get the current settings of the probe.
 */
export async function getProbeSettings(): Promise<JobScannerSettings> {
  const settings = await _mainProcessApiCall<JobScannerSettings>(
    "get-job-scanner-settings",
    {}
  );
  return settings;
}

/**
 * Open a url in the default browser.
 */
export async function openExternalUrl(url: string): Promise<void> {
  await _mainProcessApiCall("open-external-url", { url });
}

/**
 * Create a user review.
 */
export async function createReview({
  title,
  description,
  rating,
}: {
  title: string;
  description: string;
  rating: number;
}): Promise<Review> {
  const { review } = await _mainProcessApiCall<{ review: Review }>(
    "create-review",
    {
      title,
      description,
      rating,
    }
  );
  return review;
}
