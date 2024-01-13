import { Session, User } from "@supabase/supabase-js";
import { CronRule } from "./types";
import { Job, Link } from "../../../supabase/functions/_shared/types";

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
  // @ts-ignore
  const { user } = await window.electron.invoke("signup-with-email", {
    email,
    password,
  });

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
  // @ts-ignore
  const { user } = await window.electron.invoke("login-with-email", {
    email,
    password,
  });

  return user;
}

/**
 * Get user from the current session.
 */
export async function getUser(): Promise<User | null> {
  // @ts-ignore
  const { user } = await window.electron.invoke("get-user", {});
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
  // @ts-ignore
  const { link } = await window.electron.invoke("create-link", {
    title,
    url,
  });
  return link;
}

/**
 * List all links.
 */
export async function listLinks(): Promise<Link[]> {
  // @ts-ignore
  const links = await window.electron.invoke("list-links", {});
  return links;
}

/**
 * List all jobs.
 */
export async function listJobs(): Promise<Job[]> {
  // @ts-ignore
  const jobs = await window.electron.invoke("list-jobs", {});
  return jobs;
}

/**
 * Update the cron schedule of the probe.
 */
export async function updateProbeCronSchedule({
  cronRule,
}: {
  cronRule?: CronRule;
}): Promise<void> {
  // @ts-ignore
  await window.electron.invoke("update-probe-cron-schedule", {
    cronRule,
  });
}

/**
 * Get the current cron schedule of the probe.
 */
export async function getProbeCronSchedule(): Promise<CronRule | undefined> {
  // @ts-ignore
  const { cronRule } = await window.electron.invoke("get-probe-cron-rule", {});
  return cronRule;
}
