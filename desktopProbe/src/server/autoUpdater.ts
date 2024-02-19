import { app, autoUpdater, Notification } from "electron";
import { Logger } from "pino";
import { schedule, ScheduledTask } from "node-cron";

import { getExceptionMessage } from "../lib/error";

const S3_BUCKET =
  "https://s3.eu-central-1.amazonaws.com/first2apply.com/releases";

/**
 * Class used to handle the auto-updates. For now only supported on MacOS since Windows updates
 * are handled by the Microsoft Store.
 */
export class F2aAutoUpdater {
  private _canAutoUpdate = false;
  private _cronJob: ScheduledTask | undefined;
  private _notification: Notification | undefined;

  /**
   * Class constructor.
   */
  constructor(private _logger: Logger, private _onQuit: () => Promise<void>) {
    // only enable auto-updates in packaged apps and not for windows
    this._canAutoUpdate = app.isPackaged && process.platform === "darwin";
  }

  /**
   * Start checking for updates.
   */
  start() {
    if (!this._canAutoUpdate) return;

    const url = `${S3_BUCKET}/${process.platform}/${process.arch}/RELEASES.json`;
    autoUpdater.setFeedURL({ url, serverType: "json" });

    // setup auto updater events
    autoUpdater.on("error", (error) => {
      console.error("Error fetching updates", getExceptionMessage(error));
    });
    autoUpdater.on("checking-for-update", () => {
      this._logger.info("Checking for updates ...");
    });
    autoUpdater.on("update-available", () => {
      this._logger.info("Update available, downloading in background ...");
    });
    autoUpdater.on("update-not-available", () => {
      this._logger.info("No updates available");
    });

    autoUpdater.on(
      "update-downloaded",
      (event, releaseNotes, releaseName, releaseDate, updateURL) => {
        this._showUpdateNotification(releaseName);
      }
    );

    // check for updates every hour
    this._cronJob = schedule("0 * * * *", () => {
      autoUpdater.checkForUpdates();
    });

    // check for updates on startup
    autoUpdater.checkForUpdates();
  }

  /**
   * Stop checking for updates.
   */
  stop() {
    this._cronJob?.stop();
  }

  /**
   * Show a notification for new updates.
   */
  private _showUpdateNotification(releaseName: string) {
    // show a notification
    this._notification = new Notification({
      title: releaseName,
      body: "A new version has been downloaded. Restart the application to apply the updates.",
      actions: [{ text: "Restart Now", type: "button" }],
    });
    this._notification.show();

    const applyUpdate = async () => {
      try {
        this._logger.info("Restarting to apply update ...");
        await this._onQuit();
        autoUpdater.quitAndInstall();
      } catch (error) {
        console.error(getExceptionMessage(error));
      }
    };

    this._notification.on("action", applyUpdate);
    this._notification.on("click", applyUpdate);
  }
}
