import { BrowserWindow } from "electron";

/**
 * Wrapper over a headless window that can be used to download HTML.
 */
export class HtmlDownloader {
  private _scraperWindow: BrowserWindow | undefined;

  /**
   * Initialize the headless window.
   */
  init() {
    this._scraperWindow = new BrowserWindow({
      show: false,
      // set the window size
      width: 1600,
      height: 1200,
      webPreferences: {
        // disable the same origin policy
        webSecurity: false,
      },
    });
  }

  /**
   * Download the HTML of a given URL.
   */
  async loadUrl(url: string) {
    if (!this._scraperWindow) throw new Error("Scraper window not initialized");

    console.log(`downloading url: ${url} ...`);
    await this._scraperWindow.loadURL(url);

    const html = await this._scraperWindow.webContents.executeJavaScript(
      "document.documentElement.innerHTML"
    );
    // await this._scraperWindow.webContents.session.clearStorageData();
    console.log(`finished downloading url: ${url}`);

    return html;
  }

  /**
   * Close the headless window.
   */
  close() {
    if (this._scraperWindow) this._scraperWindow.close();
  }
}
