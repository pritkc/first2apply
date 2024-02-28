import { BrowserWindow } from "electron";
import { Logger } from "pino";
import { backOff } from "exponential-backoff";

const KNOWN_AUTHWALLS = ["authwall", "login"];

/**
 * Wrapper over a headless window that can be used to download HTML.
 */
export class HtmlDownloader {
  private _scraperWindow: BrowserWindow | undefined;

  /**
   * Class constructor.
   */
  constructor(private _logger: Logger) {}

  /**
   * Initialize the headless window.
   */
  init() {
    this._scraperWindow = new BrowserWindow({
      show: true,
      // set the window size
      width: 1600,
      height: 1200,
      webPreferences: {
        // disable the same origin policy
        webSecurity: false,
        partition: "persist:scraper",
      },
    });
  }

  /**
   * Download the HTML of a given URL.
   */
  async loadUrl(url: string, scrollTimes = 3) {
    if (!this._scraperWindow) throw new Error("Scraper window not initialized");

    await backOff(async () => {
      this._logger.info(`downloading url: ${url} ...`);
      await this._scraperWindow.loadURL(url);

      // scroll to bottom a few times to trigger infinite loading
      for (let i = 0; i < scrollTimes; i++) {
        await this._scraperWindow.webContents.executeJavaScript(
          'window.scrollTo({left:0, top: document.body.scrollHeight, behavior: "instant"});'
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // check if page was redirected to a login page
      const finalUrl = this._scraperWindow.webContents.getURL();
      if (KNOWN_AUTHWALLS.some((authwall) => finalUrl?.includes(authwall))) {
        this._logger.error(`authwall detected: ${finalUrl}`);
        throw new Error("authwall");
      }
    });

    this._logger.info(
      `loaded url: ${this._scraperWindow.webContents.getURL()}`
    );

    const html = await this._scraperWindow.webContents.executeJavaScript(
      "document.documentElement.innerHTML"
    );
    // await this._scraperWindow.webContents.session.clearStorageData();
    this._logger.info(`finished downloading url: ${url}`);

    return html;
  }

  /**
   * Close the headless window.
   */
  close() {
    this._scraperWindow?.close();
  }
}
