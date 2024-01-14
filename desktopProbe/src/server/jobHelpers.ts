import { BrowserWindow } from "electron";

/**
 * Function used to download the HTML of a given URL.
 */
export async function downloadUrl(url: string) {
  console.log(`downloading url: ${url} ...`);
  const html = await downloadUrlInHiddenWindow(url);
  console.log(`finished downloading url: ${url}`);

  return html;
}

/**
 * Helper method used to create an electron hidden window, load a given url and get the HTML.
 */
let SCRAPER_WINDOW: BrowserWindow | undefined;
export async function downloadUrlInHiddenWindow(url: string) {
  if (!SCRAPER_WINDOW) {
    SCRAPER_WINDOW = new BrowserWindow({
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
  await SCRAPER_WINDOW.loadURL(url);

  const html = await SCRAPER_WINDOW.webContents.executeJavaScript(
    "document.documentElement.innerHTML"
  );
  await SCRAPER_WINDOW.webContents.session.clearStorageData();

  return html;
}
