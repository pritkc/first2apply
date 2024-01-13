import path from "path";
import fs from "fs";
import { Notification, app } from "electron";
import { ScheduledTask, schedule } from "node-cron";
import { AVAILABLE_CRON_RULES, CronRule } from "../lib/types";
import { F2aSupabaseApi } from "./supabaseApi";
import { downloadUrl } from "./jobHelpers";
import { getExceptionMessage } from "../lib/error";
import { Job } from "../../../supabase/functions/_shared/types";

const userDataPath = app.getPath("userData");
const cronRulePath = path.join(userDataPath, "cronRule.json");

/**
 * Class used to manage a cron job that periodically scans links.
 */
export class JobScanner {
  private _cronRule: CronRule | undefined = AVAILABLE_CRON_RULES[0];
  private _cronJob: ScheduledTask | undefined;

  constructor(private _supabaseApi: F2aSupabaseApi) {
    // load the cron rule from disk and start the cron job
    if (fs.existsSync(cronRulePath)) {
      console.log(`loading cron rule from disk`);
      this._cronRule = JSON.parse(fs.readFileSync(cronRulePath, "utf-8"));
    } else {
      console.log(`no cron rule found on disk, using default`);
    }
    this._cronJob = schedule(this._cronRule.value, () => this.scanLinks());
    console.log(`cron job started successfully`);
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

      const htmls = await Promise.all(
        links.map(async (link) => ({
          linkId: link.id,
          content: await downloadUrl(link.url),
        }))
      );
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
      body: `${firstJobsLabel}${otherJobsLabel} are now available!`,
      // sound: "Submarine",
      // silent: false,
    });

    // Show the notification
    notification.show();
  }

  /**
   * Update the cron rule.
   */
  updateSearchFrequency({ cronRule }: { cronRule?: CronRule }) {
    console.log(`setting cron schedule: ${cronRule?.name ?? "Never"}`);

    // stop old cron job
    if (this._cronJob) {
      console.log(`stopping old cron schedule`);
      this._cronJob.stop();
    }

    // start new cron job if needed
    if (cronRule) {
      fs.writeFileSync(cronRulePath, JSON.stringify(cronRule));

      this._cronJob = schedule(cronRule.value, () => this.scanLinks());
      console.log(`cron job started successfully`);
    } else {
      fs.unlinkSync(cronRulePath);
    }
  }

  /**
   * Get the current cron rule.
   */
  getCronRule() {
    return { ...this._cronRule };
  }
}
