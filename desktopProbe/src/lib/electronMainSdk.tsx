import { Session } from "@supabase/supabase-js";

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
