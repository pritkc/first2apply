import { IAnalyticsClient } from '@/lib/analytics';
import { BrowserWindow, Notification, app, powerSaveBlocker, shell } from 'electron';
import fs from 'fs';
import { ScheduledTask, schedule } from 'node-cron';
import path from 'path';

import { Job, Link } from '../../../supabase/functions/_shared/types';
import { getExceptionMessage, throwError } from '../lib/error';
import { AVAILABLE_CRON_RULES, JobScannerSettings } from '../lib/types';
import { chunk, promiseAllSequence, waitRandomBetween } from './helpers';
import { HtmlDownloader } from './htmlDownloader';
import { logger, LogSection } from './logger';
import { F2aSupabaseApi } from './supabaseApi';

const userDataPath = app.getPath('userData');
const settingsPath = path.join(userDataPath, 'settings.json');

const DEFAULT_SETTINGS: JobScannerSettings = {
  cronRule: AVAILABLE_CRON_RULES[0].value,
  preventSleep: true,
  useSound: true,
  areEmailAlertsEnabled: true,
};

/**
 * Class used to manage a cron job that periodically scans links.
 */
export class JobScanner {
  private _supabaseApi: F2aSupabaseApi;
  private _normalHtmlDownloader: HtmlDownloader;
  private _incognitoHtmlDownloader: HtmlDownloader;
  private _onNavigate: (_: { path: string }) => void;
  private _analytics: IAnalyticsClient;

  private _isRunning = true;
  // do not use the default settings directly
  private _settings: JobScannerSettings = {
    preventSleep: false,
    useSound: false,
    areEmailAlertsEnabled: true,
  };
  private _cronJob: ScheduledTask | undefined;
  private _prowerSaveBlockerId: number | undefined;
  private _notificationsMap: Map<string, Notification> = new Map();
  private _runningScansCount = 0;
  private _failedUrls: Map<string, { count: number; lastFailed: number }> = new Map();
  private _maxRetriesPerUrl = 5; // Increased back to 5 retries
  private _retryCooldownMs = 5 * 60 * 1000; // Reduced to 5 minutes

  constructor({
    supabaseApi,
    normalHtmlDownloader,
    incognitoHtmlDownloader,
    onNavigate,
    analytics,
  }: {
    supabaseApi: F2aSupabaseApi;
    normalHtmlDownloader: HtmlDownloader;
    incognitoHtmlDownloader: HtmlDownloader;
    onNavigate: (_: { path: string }) => void;
    analytics: IAnalyticsClient;
  }) {
    this._supabaseApi = supabaseApi;
    this._normalHtmlDownloader = normalHtmlDownloader;
    this._incognitoHtmlDownloader = incognitoHtmlDownloader;
    this._onNavigate = onNavigate;
    this._analytics = analytics;

    // used for testing
    // fs.unlinkSync(settingsPath);

    // load the setings from disk
    let settingsToApply = this._settings;
    if (fs.existsSync(settingsPath)) {
      settingsToApply = {
        ...this._settings,
        ...JSON.parse(fs.readFileSync(settingsPath, 'utf-8')),
      };
      logger.jobScanner.info(`Settings loaded from disk`, settingsToApply);
    } else {
      logger.jobScanner.info(`No settings found on disk, using defaults`);
      settingsToApply = DEFAULT_SETTINGS;
    }

    this._applySettings(settingsToApply);
  }

  /**
   * Check if there are any scans running.
   */
  isScanning() {
    return this._runningScansCount > 0;
  }

  /**
   * Scan all links for the current user.
   */
  async scanAllLinks() {
    // if the scanner hasn't finished scanning the previous links, skip this scan
    if (this.isScanning()) {
      logger.jobScanner.warn('Skipping scheduled scan - scanner is already processing other links');
      return;
    }

    // fetch all links from the database
    const links = (await this._supabaseApi.listLinks()) ?? [];
    logger.jobScanner.info(`Found ${links?.length} links to scan`);

    // start the scan
    return this.scanLinks({ links });
  }

  /**
   * Perform a scan of a list links.
   */
  async scanLinks({ links, sendNotification = true }: { links: Link[]; sendNotification?: boolean }) {
    try {
      logger.jobScanner.start('Scanning links');
      this._analytics.trackEvent('scan_links_start', {
        links_count: links.length,
      });
      this._runningScansCount++;
      const start = new Date().getTime();

      await Promise.all(
        links.map(async (link) => {
          const newJobs = await this._normalHtmlDownloader
            .loadUrl({
              url: link.url,
              scrollTimes: 5,
              callback: async ({ html, maxRetries, retryCount }) => {
                if (!this._isRunning) return []; // stop if the scanner is closed

                const { newJobs, parseFailed } = await this._supabaseApi.scanHtmls([
                  { linkId: link.id, content: html, maxRetries, retryCount },
                ]);

                if (parseFailed) {
                  logger.jobScanner.debug(`Failed to parse HTML for link: ${link.title}`, {
                    linkId: link.id,
                  });

                  throw new Error(`failed to parse html for link ${link.id}`);
                }

                // add a random delay before moving on to the next link
                // to avoid being rate limited by cloudflare
                await waitRandomBetween(1000, 4000);

                return newJobs;
              },
            })
            .catch(async (error): Promise<Job[]> => {
              if (this._isRunning) {
                const errorMessage = getExceptionMessage(error);
                logger.jobScanner.failure(`Failed to scan link: ${errorMessage}`, {
                  linkId: link.id,
                });

                // when dealing with rate limits, bump the number of failed attempts for the link
                await this._supabaseApi
                  .increaseScrapeFailureCount({
                    linkId: link.id,
                    failures: link.scrape_failure_count + 1,
                  })
                  .catch((error) => {
                    logger.jobScanner.error(`Failed to increase scrape failure count: ${getExceptionMessage(error)}`, {
                      linkId: link.id,
                    });
                  });
              }

              // intetionally return an empty array if there is an error
              // in order to continue scanning the rest of the links
              return [];
            });

          return newJobs;
        }),
      ).then((r) => r.flat());
      logger.jobScanner.success(`Downloaded HTML for ${links.length} links`);

      // scan job descriptions for all pending jobs
      if (!this._isRunning) return;
      const { jobs } = await this._supabaseApi.listJobs({
        status: 'processing',
        limit: 300,
      });
      logger.jobScanner.info(`Found ${jobs.length} jobs that need processing`);
      const scannedJobs = await this.scanJobs(jobs);
      const newJobs = scannedJobs.filter((job) => job.status === 'new');

      // run post scan hook
      const newJobIds = newJobs.map((job) => job.id);
      await this._supabaseApi
        .runPostScanHook({
          newJobIds: sendNotification ? newJobIds : [], // hacky way to supress email alerts
          areEmailAlertsEnabled: this._settings.areEmailAlertsEnabled,
        })
        .catch((error) => {
          logger.jobScanner.error(`Failed to run post scan hook: ${getExceptionMessage(error)}`);
        });

      // fire a notification if there are new jobs
      if (!this._isRunning) return;
      if (sendNotification) this.showNewJobsNotification({ newJobs });

      const end = new Date().getTime();
      const took = (end - start) / 1000;
      logger.jobScanner.complete(`Scan complete in ${took.toFixed(0)} seconds`);
      this._analytics.trackEvent('scan_links_complete', {
        links_count: links.length,
        new_jobs_count: newJobs.length,
      });
    } catch (error) {
      logger.jobScanner.error(`Scan failed: ${getExceptionMessage(error)}`);
    } finally {
      this._runningScansCount--;
    }
  }

  /**
   * Check if a URL should be skipped due to repeated failures.
   */
  private shouldSkipUrl(url: string): boolean {
    const failureInfo = this._failedUrls.get(url);
    if (!failureInfo) return false;

    const now = Date.now();
    const timeSinceLastFailure = now - failureInfo.lastFailed;
    const isLinkedIn = url.includes('linkedin.com');

    // Special handling for LinkedIn URLs - less aggressive skipping
    if (isLinkedIn && failureInfo.count >= 3) {
      const linkedinCooldown = 10 * 60 * 1000; // 10 minutes for LinkedIn
      if (timeSinceLastFailure < linkedinCooldown) {
        return true;
      }
    }

    // If we've exceeded max retries and it's been less than cooldown time, skip
    if (failureInfo.count >= this._maxRetriesPerUrl && timeSinceLastFailure < this._retryCooldownMs) {
      return true;
    }

    // If cooldown has passed, reset the failure count
    if (timeSinceLastFailure >= this._retryCooldownMs) {
      this._failedUrls.delete(url);
      return false;
    }

    return false;
  }

  /**
   * Record a URL failure.
   */
  private recordUrlFailure(url: string): void {
    const now = Date.now();
    const failureInfo = this._failedUrls.get(url);
    
    if (failureInfo) {
      failureInfo.count += 1;
      failureInfo.lastFailed = now;
    } else {
      this._failedUrls.set(url, { count: 1, lastFailed: now });
    }

    // If this URL has failed too many times, show a notification
    const currentFailureInfo = this._failedUrls.get(url);
    if (currentFailureInfo && currentFailureInfo.count >= this._maxRetriesPerUrl) {
      logger.jobScanner.warn(`URL skipped due to repeated failures: ${url}`, {
        failureCount: currentFailureInfo.count,
        lastFailed: new Date(currentFailureInfo.lastFailed).toISOString()
      });
      
      // Show notification to user
      this.showUrlSkippedNotification(url, currentFailureInfo.count);
    }
  }

  /**
   * Show notification when a URL is skipped due to repeated failures.
   */
  private showUrlSkippedNotification(url: string, failureCount: number): void {
    const notification = new Notification({
      title: 'URL Skipped - Manual Review Required',
      body: `URL failed ${failureCount} times and has been skipped. Please check for robot detection: ${url.substring(0, 100)}...`,
      icon: 'assets/icon.png'
    });

    notification.on('click', () => {
      // Open the URL in the default browser for manual review
      require('electron').shell.openExternal(url);
    });

    notification.show();

    // Emit event to renderer process
    try {
      const { BrowserWindow } = require('electron');
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('url-skipped', {
          url,
          failureCount,
          lastFailed: new Date().toISOString(),
          jobTitle: undefined, // This could be enhanced to include job title
          companyName: undefined, // This could be enhanced to include company name
        });
      }
    } catch (error) {
      logger.jobScanner.error('Failed to emit url-skipped event:', error);
    }
  }

  /**
   * Scan a list of new jobs to extract the description.
   */
  async scanJobs(jobs: Job[]): Promise<Job[]> {
    logger.jobScanner.start(`Scanning ${jobs.length} job descriptions`);

    // figure out which jobs can be scanned in incognito mode
    const sites = await this._supabaseApi.listSites();
    const sitesMap = new Map(sites.map((site) => [site.id, site]));
    
    // Use the same logic as legacy - incognito for supported sites, normal for others
    const incognitoJobsToScan = jobs.filter((job) => sitesMap.get(job.siteId)?.incognito_support);
    const normalJobsToScan = jobs.filter((job) => !sitesMap.get(job.siteId)?.incognito_support);

    const scanJobDescriptions = async ({
      jobsToScan,
      htmlDownloader,
    }: {
      jobsToScan: Job[];
      htmlDownloader: HtmlDownloader;
    }) => {
      const jobChunks = chunk(jobsToScan, 10);
      const updatedJobs = await promiseAllSequence(jobChunks, async (chunkOfJobs) => {
        if (!this._isRunning) return chunkOfJobs; // stop if the scanner is closed

        return Promise.all(
          chunkOfJobs.map(async (job) => {
            // Check if this URL should be skipped due to repeated failures
            if (this.shouldSkipUrl(job.externalUrl)) {
              logger.jobScanner.warn(`Skipping URL due to repeated failures: ${job.externalUrl}`, {
                jobId: job.id,
                jobTitle: job.title
              });
              return job; // Return original job without processing
            }

            try {
              return await htmlDownloader.loadUrl({
                url: job.externalUrl,
                scrollTimes: 1,
                callback: async ({ html, maxRetries, retryCount }) => {
                  logger.jobScanner.success(`Downloaded HTML for ${job.title}`, {
                    jobId: job.id,
                  });

                  // stop if the scanner is closed
                  if (!this._isRunning) return job;

                  const { job: updatedJob, parseFailed } = await this._supabaseApi.scanJobDescription({
                    jobId: job.id,
                    html,
                    maxRetries,
                    retryCount,
                  });

                  if (parseFailed) {
                    logger.jobScanner.debug(`Failed to parse job description: ${job.title}`, {
                      jobId: job.id,
                    });

                    throw new Error(`failed to parse job description for ${job.id}`);
                  }

                  // add a random delay before moving on to the next link
                  // to avoid being rate limited by cloudflare
                  await waitRandomBetween(300, 1000);

                  return updatedJob;
                },
              });
            } catch (error) {
              // Record the URL failure
              this.recordUrlFailure(job.externalUrl);
              
              if (this._isRunning) {
                const errorMessage = getExceptionMessage(error);
                logger.jobScanner.failure(`Failed to scan job description: ${errorMessage}`, {
                  jobId: job.id,
                  url: job.externalUrl
                });
              }

              // intetionally return initial job if there is an error
              // in order to continue scanning the rest of the jobs
              return job;
            }
          }),
        );
      }).then((r) => r.flat());

      return updatedJobs;
    };

    const [scannedNormalJobs, scannedIncognitoJobs] = await Promise.all([
      scanJobDescriptions({
        jobsToScan: normalJobsToScan,
        htmlDownloader: this._normalHtmlDownloader,
      }),
      scanJobDescriptions({
        jobsToScan: incognitoJobsToScan,
        htmlDownloader: this._incognitoHtmlDownloader,
      }),
    ]);

    const allScannedJobs = [...scannedIncognitoJobs, ...scannedNormalJobs];
    const updatedJobs = jobs.map((job) => allScannedJobs.find((j) => j.id === job.id) ?? throwError('job not found')); // preserve the order

    logger.jobScanner.complete('Finished scanning job descriptions');

    return updatedJobs;
  }

  /**
   * Scan LinkedIn jobs specifically for applicant data using authenticated session.
   * This is a separate method to avoid risks with bulk scraping.
   */
  async scanLinkedInApplicantData(jobs: Job[]): Promise<Job[]> {
    // Applicants feature has been removed
    return jobs;
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

    const firstJobsLabel = displatedJobs.map((job: any) => `${job.title} at ${job.companyName}`).join(', ');
    const plural = otherJobsCount > 1 ? 's' : '';
    const otherJobsLabel = otherJobsCount > 0 ? ` and ${otherJobsCount} other${plural}` : '';
    const notification = new Notification({
      title: 'Job Search Update',
      body: `${firstJobsLabel}${otherJobsLabel} ${displatedJobs.length > 1 ? 'are' : 'is'} now available!`,
      // sound: "Submarine",
      silent: !this._settings.useSound,
    });

    // Play an additional audible alert for emphasis if enabled
    if (this._settings.useSound) {
      // 3 quick beeps for a louder notification without extra deps
      shell.beep();
      setTimeout(() => shell.beep(), 180);
      setTimeout(() => shell.beep(), 360);
    }

    // Show the notification
    const notificationId = new Date().getTime().toString();
    this._notificationsMap.set(notificationId, notification);
    notification.on('click', () => {
      this._onNavigate({ path: '/?status=new' });
      this._notificationsMap.delete(notificationId);
      this._analytics.trackEvent('notification_click', {
        jobs_count: newJobs.length,
      });
    });
    notification.show();
    this._analytics.trackEvent('show_notification', {
      jobs_count: newJobs.length,
    });
  }

  /**
   * Update settings.
   */
  updateSettings(settings: JobScannerSettings) {
    this._applySettings(settings);
    this._saveSettings();
    this._analytics.trackEvent('update_settings', settings);
  }

  /**
   * Get the current settings.
   */
  getSettings() {
    return { ...this._settings };
  }

  /**
   * Close the scanner.
   */
  close() {
    // end cron job
    if (this._cronJob) {
      logger.jobScanner.info(`Stopping cron schedule`);
      this._cronJob.stop();
    }

    // stop power blocker
    if (typeof this._prowerSaveBlockerId === 'number') {
      logger.jobScanner.info(`Stopping prevent sleep`);
      powerSaveBlocker.stop(this._prowerSaveBlockerId);
    }

    // Clear failed URLs map when closing
    this._failedUrls.clear();

    this._isRunning = false;
  }

  /**
   * Start a debug window for a link.
   */
  async startDebugWindow({ linkId }: { linkId: number }) {
    const link = await this._supabaseApi.listLinks().then((links) => links.find((l) => l.id === linkId));
    if (!link) {
      throw new Error(`link not found: ${linkId}`);
    }

    const debugWindow = new ScannerDebugWindow(logger, () => {
      // scan the link after the debug window is closed
      this.scanLinks({ links: [link] }).catch((error) => {
        logger.jobScanner.error(`Debug scan failed: ${getExceptionMessage(error)}`);
      });
    });

    await debugWindow.loadUrl(link.url);
  }

  /**
   * Persist settings to disk.
   */
  private _saveSettings() {
    fs.writeFileSync(settingsPath, JSON.stringify(this._settings));
    logger.jobScanner.info(`Settings saved to disk`);
  }

  /**
   * Apply a new set of settings into the runtime.
   */
  private _applySettings(settings: JobScannerSettings) {
    if (settings.cronRule !== this._settings.cronRule) {
      // stop old cron job
      if (this._cronJob) {
        logger.jobScanner.info(`Stopping old cron schedule`);
        this._cronJob.stop();
      }
      // start new cron job if needed
      if (settings.cronRule) {
        this._cronJob = schedule(settings.cronRule, () => this.scanAllLinks());
        logger.jobScanner.info(`Cron job started successfully: ${settings.cronRule}`);
      }
    }

    if (settings.preventSleep !== this._settings.preventSleep) {
      // stop old power blocker
      if (typeof this._prowerSaveBlockerId === 'number') {
        logger.jobScanner.info(`Stopping old prevent sleep`);
        powerSaveBlocker.stop(this._prowerSaveBlockerId);
      }
      // start new power blocker if needed
      if (settings.preventSleep) {
        this._prowerSaveBlockerId = powerSaveBlocker.start('prevent-app-suspension');
        logger.jobScanner.info(`Prevent sleep started successfully: ${this._prowerSaveBlockerId}`);
      }
    }

    this._settings = settings;
    logger.jobScanner.info(`Settings applied successfully`);
  }
}

/**
 * Class used to open a debug window for manual user intervention to a link.
 */
class ScannerDebugWindow {
  private _window: BrowserWindow | undefined;

  /**
   * Class constructor.
   */
  constructor(
    private _logger: any,
    private _onClose: () => void = () => {},
  ) {
    this._window = new BrowserWindow({
      show: true,
      width: 1600,
      height: 1200,
      webPreferences: {
        webSecurity: true,
        partition: `persist:scraper`,
      },
    });

    // destroy the window when closed
    this._window.on('close', (event) => {
      this._logger.info('debug window closed');
      this._window = undefined;
      this._onClose();
    });
  }

  /**
   * Load a url into the debug window.
   */
  loadUrl(url: string) {
    this._window?.loadURL(url);
  }
}
