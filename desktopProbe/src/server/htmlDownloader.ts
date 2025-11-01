import { BrowserWindow } from 'electron';
import { backOff } from 'exponential-backoff';

import { sleep, waitRandomBetween } from './helpers';
import { ILogger } from './logger';
import { WorkerQueue } from './workerQueue';

const KNOWN_AUTHWALLS = ['authwall', 'login'];

// Realistic user agents from real browsers (updated for 2024/2025)
// Mix of Windows, Mac, and Linux to appear more diverse
const REALISTIC_USER_AGENTS = [
  // Chrome on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  // Chrome on Mac
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  // Edge on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  // Firefox on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  // Firefox on Mac
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
  // Safari on Mac
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
];

// Realistic viewport sizes (width x height) to simulate different devices/screen resolutions
const VIEWPORT_SIZES = [
  { width: 1920, height: 1080 }, // Full HD
  { width: 1680, height: 1050 }, // Common laptop
  { width: 1600, height: 900 },  // HD+
  { width: 1440, height: 900 },  // MacBook Air
  { width: 1366, height: 768 },  // Common laptop
  { width: 1536, height: 864 },  // Windows laptop
  { width: 2560, height: 1440 }, // 2K display
];

// Rate limiting tracker to prevent too many requests to the same domain
interface DomainRateLimit {
  domain: string;
  lastRequestTime: number;
  requestCount: number;
  cooldownUntil?: number;
}

class RateLimitTracker {
  private domainTracking = new Map<string, DomainRateLimit>();
  
  // LinkedIn-specific rate limits (stricter)
  private readonly LINKEDIN_MAX_REQUESTS_PER_HOUR = 30;
  private readonly LINKEDIN_MIN_DELAY_MS = 8000; // 8 seconds minimum between LinkedIn requests
  private readonly LINKEDIN_COOLDOWN_AFTER_N_REQUESTS = 10; // After 10 requests, take a break
  private readonly LINKEDIN_COOLDOWN_DURATION_MS = 300000; // 5 minute cooldown
  
  // General rate limits (more lenient)
  private readonly GENERAL_MIN_DELAY_MS = 2000; // 2 seconds minimum
  
  getDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }
  
  isLinkedIn(domain: string): boolean {
    return domain.toLowerCase().includes('linkedin.com');
  }
  
  async checkAndWait(url: string): Promise<void> {
    const domain = this.getDomain(url);
    const isLinkedIn = this.isLinkedIn(domain);
    const now = Date.now();
    
    let tracking = this.domainTracking.get(domain);
    if (!tracking) {
      tracking = {
        domain,
        lastRequestTime: 0,
        requestCount: 0,
      };
      this.domainTracking.set(domain, tracking);
    }
    
    // Check if in cooldown period
    if (tracking.cooldownUntil && now < tracking.cooldownUntil) {
      const waitTime = tracking.cooldownUntil - now;
      console.log(`[RateLimit] ${domain} in cooldown, waiting ${(waitTime / 1000).toFixed(1)}s`);
      await sleep(waitTime);
    }
    
    // Calculate time since last request
    const timeSinceLastRequest = now - tracking.lastRequestTime;
    const minDelay = isLinkedIn ? this.LINKEDIN_MIN_DELAY_MS : this.GENERAL_MIN_DELAY_MS;
    
    // Enforce minimum delay between requests to same domain
    if (timeSinceLastRequest < minDelay) {
      const waitTime = minDelay - timeSinceLastRequest;
      // Add extra random jitter (0-3 seconds)
      const jitter = Math.random() * 3000;
      const totalWait = waitTime + jitter;
      console.log(`[RateLimit] Enforcing delay for ${domain}: ${(totalWait / 1000).toFixed(1)}s`);
      await sleep(totalWait);
    }
    
    // Reset counter if more than 1 hour has passed
    if (now - tracking.lastRequestTime > 3600000) {
      tracking.requestCount = 0;
    }
    
    // Update tracking
    tracking.requestCount++;
    tracking.lastRequestTime = Date.now();
    
    // LinkedIn-specific: enforce cooldown after N requests
    if (isLinkedIn && tracking.requestCount >= this.LINKEDIN_COOLDOWN_AFTER_N_REQUESTS) {
      console.log(`[RateLimit] LinkedIn cooldown triggered after ${tracking.requestCount} requests`);
      tracking.cooldownUntil = Date.now() + this.LINKEDIN_COOLDOWN_DURATION_MS;
      tracking.requestCount = 0; // Reset counter
      
      // Wait for the cooldown
      await sleep(this.LINKEDIN_COOLDOWN_DURATION_MS);
    }
  }
  
  cleanup() {
    // Remove entries older than 2 hours to prevent memory leak
    const now = Date.now();
    const twoHoursAgo = now - 7200000;
    
    for (const [domain, tracking] of this.domainTracking.entries()) {
      if (tracking.lastRequestTime < twoHoursAgo) {
        this.domainTracking.delete(domain);
      }
    }
  }
}

// Global rate limit tracker instance
const globalRateLimitTracker = new RateLimitTracker();

/**
 * Wrapper over a headless window that can be used to download HTML.
 */
export class HtmlDownloader {
  private _isRunning = false;
  private _pool: BrowserWindowPool | undefined;
  private _logger: ILogger;
  private _numInstances: number;
  private _incognitoMode: boolean;

  /**
   * Class constructor.
   */
  constructor({
    logger,
    numInstances,
    incognitoMode,
  }: {
    logger: ILogger;
    numInstances: number;
    incognitoMode: boolean;
  }) {
    this._logger = logger;
    this._numInstances = numInstances;
    this._incognitoMode = incognitoMode;
  }

  /**
   * Initialize the headless window.
   */
  init() {
    this._pool = new BrowserWindowPool(this._numInstances, this._incognitoMode);
    this._isRunning = true;
  }

  /**
   * Load the HTML of a given URL with concurrency support.
   *
   * Takes in a callback that will be called with the HTML content. Will be retried if it fails
   * with a new version of the window's HTML. Using a callback instead of returning the HTML directly
   * because we need to keep the window aquired until the callback is finished.
   */
  async loadUrl<T>({
    url,
    scrollTimes = 3,
    callback,
  }: {
    url: string;
    scrollTimes?: number;
    callback: (_: { html: string; maxRetries: number; retryCount: number }) => Promise<T>;
  }): Promise<T> {
    if (!this._pool) throw new Error('Pool not initialized');

    return this._pool.useBrowserWindow(async (window) => {
      await this._loadUrl(window, url, scrollTimes);

      const maxRetries = 1;
      let retryCount = 0;
      return backOff(
        async () => {
          const html: string = await window.webContents.executeJavaScript('document.documentElement.innerHTML');
          return callback({ html, maxRetries, retryCount: retryCount++ });
        },
        {
          jitter: 'full',
          numOfAttempts: 1 + maxRetries,
          maxDelay: 5_000,
          startingDelay: 1_000,
          retry: () => {
            // perform retries only if the window is still running
            return this._isRunning;
          },
        },
      );
    });
  }

  /**
   * Close the headless window.
   */
  async close() {
    this._isRunning = false;
    return this._pool?.close();
  }

  /**
   * Load an URL and make sure to wait for the page to load.
   */
  private async _loadUrl(window: BrowserWindow, url: string, scrollTimes: number) {
    if (!this._isRunning) return '<html></html>';

    this._logger.info(`loading url: ${url} ...`);
    
    // Apply rate limiting BEFORE making the request
    await globalRateLimitTracker.checkAndWait(url);
    
    await backOff(
      async () => {
        let statusCode: number | undefined;
        window.webContents.once('did-navigate', (event, url, httpResponseCode) => {
          statusCode = httpResponseCode;
        });
        await window.loadURL(url);

        // handle rate limits
        const title = await window.webContents.executeJavaScript('document.title');
        if (statusCode === 429 || title?.toLowerCase().startsWith('just a moment')) {
          this._logger.debug(`429 status code detected: ${url}`);
          await waitRandomBetween(20_000, 40_000);
          throw new Error('rate limit exceeded');
        }

        // Check for authwall BEFORE scrolling
        const finalUrl = window.webContents.getURL();
        if (KNOWN_AUTHWALLS.some((authwall) => finalUrl?.includes(authwall))) {
          this._logger.debug(`authwall detected: ${finalUrl}`);
          throw new Error('authwall');
        }

        // scroll to bottom a few times to trigger infinite loading
        for (let i = 0; i < scrollTimes; i++) {
          // Add variance to scroll behavior - sometimes scroll to 90%, sometimes 100%
          const scrollPercent = Math.random() > 0.3 ? 1.0 : 0.9;
          
          await window.webContents.executeJavaScript(
            `
              Array.from(document.querySelectorAll('*'))
                .filter(el => el.scrollHeight > el.clientHeight)
                .forEach(el => {
                  // Smooth scroll to the bottom (or near bottom)
                  el.scrollTo({
                    top: el.scrollHeight * ${scrollPercent},
                    behavior: 'smooth'
                  });
                });
            `,
          );
          
          // Use longer, more random delays with variance based on scroll iteration
          // First scroll: 3-7 seconds (reading time)
          // Subsequent scrolls: 2-6 seconds
          const minDelay = i === 0 ? 3_000 : 2_000;
          const maxDelay = i === 0 ? 7_000 : 6_000;
          await waitRandomBetween(minDelay, maxDelay);

          // check if page was redirected to a login page during scrolling
          const currentUrl = window.webContents.getURL();
          if (KNOWN_AUTHWALLS.some((authwall) => currentUrl?.includes(authwall))) {
            this._logger.debug(`authwall detected after scroll: ${currentUrl}`);
            throw new Error('authwall');
          }
        }
      },
      {
        jitter: 'full',
        numOfAttempts: 20,
        maxDelay: 5_000,
        retry: (e: Error) => {
          // Don't retry if it's an authwall error - it won't succeed on retry
          if (e.message === 'authwall') {
            return false;
          }
          // perform retries only if the window is still running
          return this._isRunning;
        },
      },
    );

    this._logger.info(`finished loading url: ${url}`);
  }
}

/**
 * Class used to manage a pool of headless windows.
 */
class BrowserWindowPool {
  private _pool: Array<{
    id: number;
    window: BrowserWindow;
    isAvailable: boolean;
  }> = [];
  private _queue: WorkerQueue;

  /**
   * Class constructor.
   */
  constructor(instances: number, incognitoMode: boolean) {
    for (let i = 0; i < instances; i++) {
      // Randomize viewport size for each window instance to appear more human-like
      const viewport = VIEWPORT_SIZES[Math.floor(Math.random() * VIEWPORT_SIZES.length)];
      
      const window = new BrowserWindow({
        show: false,
        // Use randomized viewport size
        width: viewport.width,
        height: viewport.height,
        webPreferences: {
          webSecurity: true,
          partition: incognitoMode ? `incognito` : `persist:scraper`,
        },
      });

      // Set a realistic user agent for each window (randomized)
      const userAgent = REALISTIC_USER_AGENTS[Math.floor(Math.random() * REALISTIC_USER_AGENTS.length)];
      window.webContents.setUserAgent(userAgent);
      
      console.log(`[BrowserWindow ${i}] Using viewport ${viewport.width}x${viewport.height} with UA: ${userAgent.substring(0, 50)}...`);

      // Add realistic HTTP headers to appear more human-like
      window.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
        const headers = { ...details.requestHeaders };
        
        // Add common browser headers if not present
        if (!headers['Accept-Language']) {
          headers['Accept-Language'] = 'en-US,en;q=0.9';
        }
        if (!headers['Accept']) {
          headers['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8';
        }
        if (!headers['Accept-Encoding']) {
          headers['Accept-Encoding'] = 'gzip, deflate, br';
        }
        if (!headers['DNT']) {
          headers['DNT'] = '1'; // Do Not Track header
        }
        if (!headers['Upgrade-Insecure-Requests']) {
          headers['Upgrade-Insecure-Requests'] = '1';
        }
        if (!headers['Sec-Fetch-Site']) {
          headers['Sec-Fetch-Site'] = 'none';
        }
        if (!headers['Sec-Fetch-Mode']) {
          headers['Sec-Fetch-Mode'] = 'navigate';
        }
        if (!headers['Sec-Fetch-User']) {
          headers['Sec-Fetch-User'] = '?1';
        }
        if (!headers['Sec-Fetch-Dest']) {
          headers['Sec-Fetch-Dest'] = 'document';
        }
        
        callback({ requestHeaders: headers });
      });

      // disable LinkedIn's passkey request, because it triggers an annoying popup
      window.webContents.session.webRequest.onBeforeRequest((details, callback) => {
        // if the request url matches the url which appears to be sending the passkey request
        if (details.url.includes('checkpoint/pk/initiateLogin')) {
          // never call the callback to block the request
        } else {
          callback({});
        }
      });

      this._pool.push({
        id: i,
        window,
        isAvailable: true,
      });
    }

    this._queue = new WorkerQueue(instances);
    
    // Cleanup old rate limit entries periodically
    setInterval(() => {
      globalRateLimitTracker.cleanup();
    }, 3600000); // Every hour
  }

  /**
   * Get an available window and use it.
   */
  async useBrowserWindow<T>(fn: (window: BrowserWindow) => Promise<T>) {
    return this._queue.enqueue(() => {
      const worker = this._pool.find((w) => w.isAvailable);
      if (!worker) throw new Error('No available window found');
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
    return new Promise<void>((resolve) => {
      // wait until the queue is empty
      this._queue.on('empty', () => {
        this._pool.forEach((w) => w.window.close());

        // artificial delay to allow the window to close
        setTimeout(() => resolve(), 500);
      });

      // trigger the empty event if the queue is already empty
      this._queue.next();
    });
  }
}
