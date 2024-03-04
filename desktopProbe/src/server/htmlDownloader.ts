import { BrowserWindow } from "electron";
import { Logger } from "pino";
import { backOff } from "exponential-backoff";
import { WorkerQueue } from "./workerQueue";
import { sleep } from "./helpers";

const KNOWN_AUTHWALLS = ["authwall", "login"];

/**
 * Wrapper over a headless window that can be used to download HTML.
 */
export class HtmlDownloader {
  private _pool: BrowserWindowPool | undefined;

  /**
   * Class constructor.
   */
  constructor(private _logger: Logger) {}

  /**
   * Initialize the headless window.
   */
  init() {
    this._pool = new BrowserWindowPool(2);
  }

  /**
   * Load the HTML of a given URL with concurrency support.
   */
  async loadUrl(url: string, scrollTimes = 3) {
    if (!this._pool) throw new Error("Pool not initialized");

    return this._pool.useBrowserWindow((window) =>
      this._downloadHtml(window, url, scrollTimes)
    );
  }

  /**
   * Close the headless window.
   */
  async close() {
    return this._pool?.close();
  }

  /**
   * Download the HTML of a given URL.
   */
  private async _downloadHtml(
    window: BrowserWindow,
    url: string,
    scrollTimes: number
  ) {
    this._logger.info(`downloading url: ${url} ...`);
    await backOff(
      async () => {
        let statusCode: number | undefined;
        window.webContents.once(
          "did-navigate",
          (event, url, httpResponseCode) => {
            statusCode = httpResponseCode;
          }
        );
        await window.loadURL(url);

        // handle 429 status code
        if (statusCode === 429) {
          this._logger.debug(`429 status code detected: ${url}`);
          await sleep(5_000);
          throw new Error("rate limit exceeded");
        }

        // scroll to bottom a few times to trigger infinite loading
        for (let i = 0; i < scrollTimes; i++) {
          await window.webContents.executeJavaScript(
            'window.scrollTo({left:0, top: document.body.scrollHeight, behavior: "instant"});'
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
          // check if page was redirected to a login page
          const finalUrl = window.webContents.getURL();
          if (
            KNOWN_AUTHWALLS.some((authwall) => finalUrl?.includes(authwall))
          ) {
            this._logger.debug(`authwall detected: ${finalUrl}`);
            // await window.webContents.session.clearStorageData({});
            throw new Error("authwall");
          }
        }
      },
      {
        numOfAttempts: 20,
        maxDelay: 5_000,
        retry: () => {
          return this._pool.isRunning();
        },
      }
    );

    const html: string = await window.webContents.executeJavaScript(
      "document.documentElement.innerHTML"
    );

    this._logger.info(`finished downloading url: ${url}`);

    return html;
  }
}

/**
 * Class used to manage a pool of headless windows.
 */
class BrowserWindowPool {
  private _isRunning = true;
  private _pool: Array<{
    id: number;
    window: BrowserWindow;
    isAvailable: boolean;
  }> = [];
  private _queue: WorkerQueue;

  /**
   * Class constructor.
   */
  constructor(instances: number) {
    for (let i = 0; i < instances; i++) {
      this._pool.push({
        id: i,
        window: new BrowserWindow({
          show: false,
          // set the window size
          width: 1600,
          height: 1200,
          webPreferences: {
            // disable the same origin policy
            webSecurity: false,
            partition: `persist:scraper-${i}`,
          },
        }),
        isAvailable: true,
      });
    }

    this._queue = new WorkerQueue(instances);
  }

  /**
   * Get an available window and use it.
   */
  async useBrowserWindow<T>(fn: (window: BrowserWindow) => Promise<T>) {
    if (!this._isRunning) throw new Error("Pool is closed");

    return this._queue.enqueue(() => {
      const worker = this._pool.find((w) => w.isAvailable);
      if (!worker) throw new Error("No available window found");
      worker.isAvailable = false;

      return fn(worker.window).finally(() => {
        worker.isAvailable = true;
      });
    });
  }

  /**
   * Wait until all windows are available and close them.
   */
  close() {
    this._isRunning = false;

    return new Promise<void>((resolve) => {
      // wait until the queue is empty
      this._queue.on("empty", () => {
        this._pool.forEach((w) => w.window.close());

        // artificial delay to allow the window to close
        setTimeout(() => resolve(), 500);
      });

      // trigger the empty event if the queue is already empty
      this._queue.next();
    });
  }

  /**
   * Check if the pool is running.
   */
  isRunning() {
    return this._isRunning;
  }
}
