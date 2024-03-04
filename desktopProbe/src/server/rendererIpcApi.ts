import { ipcMain, shell } from "electron";
import { F2aSupabaseApi } from "./supabaseApi";
import { getExceptionMessage } from "../lib/error";
import { JobScanner } from "./jobScanner";
import { HtmlDownloader } from "./htmlDownloader";

/**
 * Helper methods used to centralize error handling.
 */
async function _apiCall<T>(method: () => Promise<T>) {
  try {
    const data = await method();
    return { data };
  } catch (error) {
    console.error(getExceptionMessage(error));
    return { error: getExceptionMessage(error, true) };
  }
}

/**
 * IPC handlers that expose methods to the renderer process
 * used to interact with the Supabase instance hosted on the node process.
 */
export function initRendererIpcApi({
  supabaseApi,
  jobScanner,
  htmlDownloader,
}: {
  supabaseApi: F2aSupabaseApi;
  jobScanner: JobScanner;
  htmlDownloader: HtmlDownloader;
}) {
  ipcMain.handle("signup-with-email", async (event, { email, password }) =>
    _apiCall(() => supabaseApi.signupWithEmail({ email, password }))
  );

  ipcMain.handle("login-with-email", async (event, { email, password }) =>
    _apiCall(() => supabaseApi.loginWithEmail({ email, password }))
  );

  ipcMain.handle("send-password-reset-email", async (event, { email }) =>
    _apiCall(() => supabaseApi.sendPasswordResetEmail({ email }))
  );

  ipcMain.handle("change-password", async (event, { password }) =>
    _apiCall(() => supabaseApi.updatePassword({ password }))
  );

  ipcMain.handle("logout", async (event, {}) =>
    _apiCall(() => supabaseApi.logout())
  );

  ipcMain.handle("get-user", async (event) =>
    _apiCall(() => supabaseApi.getUser())
  );

  ipcMain.handle("create-link", async (event, { title, url }) =>
    _apiCall(async () => {
      const { link, newJobs } = await supabaseApi.createLink({
        title,
        url,
        html: await htmlDownloader.loadUrl(url),
      });

      // intentionally not awaited to not have the user wait until JDs are in
      jobScanner.scanJobs(newJobs).catch((error) => {
        console.error(getExceptionMessage(error));
      });

      return { link };
    })
  );

  ipcMain.handle("list-links", async (event, { title, url }) =>
    _apiCall(() => supabaseApi.listLinks())
  );

  ipcMain.handle("delete-link", async (event, { linkId }) =>
    _apiCall(() => supabaseApi.deleteLink(linkId))
  );

  ipcMain.handle("list-jobs", async (event, { status, limit, after }) =>
    _apiCall(() => supabaseApi.listJobs({ status, limit, after }))
  );

  ipcMain.handle("update-job-status", async (event, { jobId, status }) =>
    _apiCall(() => supabaseApi.updateJobStatus({ jobId, status }))
  );

  ipcMain.handle("list-sites", async (event) =>
    _apiCall(() => supabaseApi.listSites())
  );

  ipcMain.handle("update-job-scanner-settings", async (event, { settings }) =>
    _apiCall(async () => jobScanner.updateSettings(settings))
  );

  // handler used to fetch the cron schedule
  ipcMain.handle("get-job-scanner-settings", async (event) =>
    _apiCall(async () => jobScanner.getSettings())
  );

  ipcMain.handle("open-external-url", async (event, { url }) =>
    _apiCall(async () => shell.openExternal(url))
  );

  ipcMain.handle("scan-job-description", async (event, { job }) =>
    _apiCall(async () => jobScanner.scanJobs([job]))
  );

  ipcMain.handle(
    "create-review",
    async (event, { title, description, rating }) =>
      _apiCall(() => supabaseApi.createReview({ title, description, rating }))
  );
}
