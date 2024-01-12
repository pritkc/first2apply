import { Session, User } from "@supabase/supabase-js";

/**
 * Login with email and password.
 */
export async function loginWithEmail({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<Session> {
  // @ts-ignore
  const { session } = await window.electron.invoke("login-with-email", {
    email,
    password,
  });

  // @ts-ignore
  return session;
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
  // use electron IPC to download the url
  // @ts-ignore
  const { link } = await window.electron.invoke("create-link", {
    url,
  });
  return link;
}
