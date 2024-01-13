import { Session, User } from "@supabase/supabase-js";
import { CronRule } from "./types";

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
export async function createLink(url: string): Promise<{ id: string }> {
  // @ts-ignore
  const { link } = await window.electron.invoke("create-link", {
    url,
  });
  return link;
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
export async function getProbeCronSchedule(): Promise<CronRule> {
  // @ts-ignore
  const { cronRule } = await window.electron.invoke("get-probe-cron-rule", {});
  return cronRule;
}
