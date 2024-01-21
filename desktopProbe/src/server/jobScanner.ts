import path from "path";
import fs from "fs";
import { Notification, app, powerSaveBlocker } from "electron";
import { ScheduledTask, schedule } from "node-cron";
import { AVAILABLE_CRON_RULES, JobScannerSettings } from "../lib/types";
import { F2aSupabaseApi } from "./supabaseApi";
import { getExceptionMessage } from "../lib/error";
import { Job } from "../../../supabase/functions/_shared/types";
import { promiseAllSequence } from "./helpers";
import { HtmlDownloader } from "./htmlDownloader";

const userDataPath = app.getPath("userData");
const settingsPath = path.join(userDataPath, "settings.json");

const DEFAULT_SETTINGS: JobScannerSettings = {
  cronRule: AVAILABLE_CRON_RULES[0].value,
  preventSleep: true,
  useSound: true,
};

/**
 * Class used to manage a cron job that periodically scans links.
 */
export class JobScanner {
  private _settings: JobScannerSettings = {
    preventSleep: false,
    useSound: false,
  };
  private _cronJob: ScheduledTask | undefined;
  private _prowerSaveBlockerId: number | undefined;

  constructor(
    private _supabaseApi: F2aSupabaseApi,
    private _htmlDownloader: HtmlDownloader,
    private _onNavigate: (_: { path: string }) => void
  ) {
    // used for testing
    // fs.unlinkSync(settingsPath);

    // load the setings from disk
    let settingsToApply = this._settings;
    if (fs.existsSync(settingsPath)) {
      settingsToApply = {
        ...this._settings,
        ...JSON.parse(fs.readFileSync(settingsPath, "utf-8")),
      };
      console.log(
        `loadied settings from disk: ${JSON.stringify(settingsToApply)}`
      );
    } else {
      console.log(`no settings found on disk, using defaults`);
      settingsToApply = DEFAULT_SETTINGS;
    }

    this._applySettings(settingsToApply);
  }

  /**
   * Perform a scan of all links.
   */
  async scanLinks() {
    try {
      console.log("scanning links...");

      // fetch all links from the database
      const links = (await this._supabaseApi.listLinks()) ?? [];
      console.log(`found ${links?.length} links`);

      const htmls = await promiseAllSequence(links, async (link) => ({
        linkId: link.id,
        content: await this._htmlDownloader.loadUrl(link.url),
      }));
      console.log(`downloaded html for ${htmls.length} links`);

      const { newJobs } = await this._supabaseApi.scanHtmls(htmls);
      this.showNewJobsNotification({ newJobs });

      console.log("scan complete");
    } catch (error) {
      console.error(getExceptionMessage(error));
    }
  }

  /**
   * Display a notfication for new jobs.
   */
  showNewJobsNotification({ newJobs }: { newJobs: Job[] }) {
    if (newJobs.length === 0) return;

    // Create a new notification
    const maxDisplayedJobs = 3;
    const displatedJobs = newJobs.slice(0, maxDisplayedJobs);
    const otherJobsCount = newJobs.length - maxDisplayedJobs;

    const firstJobsLabel = displatedJobs
      .map((job: any) => `${job.title} at ${job.companyName}`)
      .join(", ");
    const plural = otherJobsCount > 1 ? "s" : "";
    const otherJobsLabel =
      otherJobsCount > 0 ? ` and ${otherJobsCount} other${plural}` : "";
    const notification = new Notification({
      title: "Job Search Update",
      body: `${firstJobsLabel}${otherJobsLabel} ${
        displatedJobs.length > 1 ? "are" : "is"
      } now available!`,
      // sound: "Submarine",
      silent: this._settings.useSound === false,
    });

    // Show the notification
    notification.on("click", () => {
      this._onNavigate({ path: "/" });
    });
    notification.show();
  }

  /**
   * Update settings.
   */
  updateSettings(settings: JobScannerSettings) {
    this._applySettings(settings);
    this._saveSettings();
  }

  /**
   * Get the current settings.
   */
  getSettings() {
    return { ...this._settings };
  }

  /**
   * Persist settings to disk.
   */
  private _saveSettings() {
    fs.writeFileSync(settingsPath, JSON.stringify(this._settings));
    console.log(`settings saved to disk`);
  }

  /**
   * Apply a new set of settings into the runtime.
   */
  private _applySettings(settings: JobScannerSettings) {
    if (settings.cronRule !== this._settings.cronRule) {
      // stop old cron job
      if (this._cronJob) {
        console.log(`stopping old cron schedule`);
        this._cronJob.stop();
      }
      // start new cron job if needed
      if (settings.cronRule) {
        this._cronJob = schedule(settings.cronRule, () => this.scanLinks());
        console.log(`cron job started successfully`);
      }
    }

    if (settings.preventSleep !== this._settings.preventSleep) {
      // stop old power blocker
      if (typeof this._prowerSaveBlockerId === "number") {
        console.log(`stopping old prevent sleep`);
        powerSaveBlocker.stop(this._prowerSaveBlockerId);
      }
      // start new power blocker if needed
      if (settings.preventSleep) {
        this._prowerSaveBlockerId = powerSaveBlocker.start(
          "prevent-app-suspension"
        );
        console.log(
          `prevent sleep started successfully: ${this._prowerSaveBlockerId}`
        );
      }
    }

    this._settings = settings;
    console.log(`settings applied successfully`);
  }
}
