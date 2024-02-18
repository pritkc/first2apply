import { getExceptionMessage } from "../lib/error";
import { app, dialog } from "electron";
import { updateElectronApp, UpdateSourceType } from "update-electron-app";

const S3_BUCKET =
  "https://s3.eu-central-1.amazonaws.com/first2apply.com/releases";

/**
 * Class used to handle the auto-updates.
 */
export class F2aAutoUpdater {
  private _canAutoUpdate = true;

  /**
   * Class constructor.
   */
  constructor() {
    // only enable auto-updates in packaged apps and not for windows
    this._canAutoUpdate = app.isPackaged && process.platform !== "win32";
  }

  /**
   * Start checking for updates.
   */
  start() {
    if (!this._canAutoUpdate) return;

    updateElectronApp({
      updateSource: {
        type: UpdateSourceType.StaticStorage,
        baseUrl: `${S3_BUCKET}/${process.platform}/${process.arch}`,
      },
      updateInterval: "1 hour",
      notifyUser: true,
      logger: console,
    });
  }

  /**
   * Stop checking for updates.
   */
  stop() {
    // this._cronJob?.stop();
  }
}
