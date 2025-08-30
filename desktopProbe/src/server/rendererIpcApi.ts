import { dialog, ipcMain, shell } from 'electron';
import fs from 'fs';
import { json2csv } from 'json-2-csv';
import os from 'os';

import { Job } from '../../../supabase/functions/_shared/types';
import { getExceptionMessage } from '../lib/error';
import { F2aAutoUpdater } from './autoUpdater';
import { JobBoardModal } from './jobBoardModal';
import { JobScanner } from './jobScanner';
import { getStripeConfig } from './stripeConfig';
import { F2aSupabaseApi } from './supabaseApi';

console.log('🔧 Initializing renderer IPC API...');

/**
 * Helper methods used to centralize error handling.
 */
async function _apiCall<T>(method: () => Promise<T>) {
  try {
    const data = await method();
    return { data };
  } catch (error) {
    console.error(getExceptionMessage(error));
    return { error: getExceptionMessage(error, true) };
  }
}

/**
 * IPC handlers that expose methods to the renderer process
 * used to interact with the Supabase instance hosted on the node process.
 */
export function initRendererIpcApi({
  supabaseApi,
  jobScanner,
  autoUpdater,
  jobBoardModal,
  nodeEnv,
}: {
  supabaseApi: F2aSupabaseApi;
  jobScanner: JobScanner;
  autoUpdater: F2aAutoUpdater;
  jobBoardModal: JobBoardModal;
  nodeEnv: string;
}) {
  console.log('🔧 Setting up IPC handlers...');
  console.log('🔧 Node environment:', nodeEnv);
  console.log('🔧 Available services:', {
    supabaseApi: !!supabaseApi,
    jobScanner: !!jobScanner,
    autoUpdater: !!autoUpdater,
    jobBoardModal: !!jobBoardModal
  });

  ipcMain.handle('get-os-type', (event) =>
    _apiCall(async () => {
      return os.platform();
    }),
  );

  ipcMain.handle('signup-with-email', async (event, { email, password }) =>
    _apiCall(() => supabaseApi.signupWithEmail({ email, password })),
  );

  ipcMain.handle('login-with-email', async (event, { email, password }) =>
    _apiCall(() => supabaseApi.loginWithEmail({ email, password })),
  );

  ipcMain.handle('send-password-reset-email', async (event, { email }) =>
    _apiCall(() => supabaseApi.sendPasswordResetEmail({ email })),
  );

  ipcMain.handle('change-password', async (event, { password }) =>
    _apiCall(() => supabaseApi.updatePassword({ password })),
  );

  ipcMain.handle('logout', async (event, {}) => _apiCall(() => supabaseApi.logout()));

  ipcMain.handle('get-user', async (event) => _apiCall(() => supabaseApi.getUser()));

  ipcMain.handle('create-link', async (event, { title, url, html }) =>
    _apiCall(async () => {
      const { link, newJobs } = await supabaseApi.createLink({
        title,
        url,
        html,
      });

      // intentionally not awaited to not have the user wait until JDs are in
      jobScanner.scanJobs(newJobs).catch((error) => {
        console.error(getExceptionMessage(error));
      });

      return { link };
    }),
  );

  ipcMain.handle('update-link', async (event, { linkId, title, url }) =>
    _apiCall(() => supabaseApi.updateLink({ linkId, title, url })),
  );

  ipcMain.handle('list-links', async (event, { title, url }) => _apiCall(() => supabaseApi.listLinks()));

  ipcMain.handle('delete-link', async (event, { linkId }) => _apiCall(() => supabaseApi.deleteLink(linkId)));

  ipcMain.handle('list-jobs', async (event, { status, search, siteIds, linkIds, labels, favoritesOnly, limit, after }) =>
    _apiCall(() => supabaseApi.listJobs({ status, search, siteIds, linkIds, labels, favoritesOnly, limit, after })),
  );

  ipcMain.handle('update-job-status', async (event, { jobId, status }) =>
    _apiCall(() => supabaseApi.updateJobStatus({ jobId, status })),
  );

  ipcMain.handle('update-job-labels', async (event, { jobId, labels }) =>
    _apiCall(() => supabaseApi.updateJobLabels({ jobId, labels })),
  );

  ipcMain.handle('list-sites', async (event) => _apiCall(() => supabaseApi.listSites()));

  ipcMain.handle('update-job-scanner-settings', async (event, { settings }) =>
    _apiCall(async () => jobScanner.updateSettings(settings)),
  );

  // handler used to fetch the cron schedule
  ipcMain.handle('get-job-scanner-settings', async (event) => _apiCall(async () => jobScanner.getSettings()));

  ipcMain.handle('open-external-url', async (event, { url }) => _apiCall(async () => shell.openExternal(url)));

  ipcMain.handle('scan-job-description', async (event, { job }) =>
    _apiCall(async () => {
      const [updatedJob] = await jobScanner.scanJobs([job]);
      return { job: updatedJob };
    }),
  );
  ipcMain.handle('get-app-state', async (event, {}) =>
    _apiCall(async () => {
      const isScanning = await jobScanner.isScanning();
      const newUpdate = await autoUpdater.getNewUpdate();
      return { isScanning, newUpdate };
    }),
  );
  ipcMain.handle('apply-app-update', async (event, {}) =>
    _apiCall(async () => {
      await autoUpdater.applyUpdate();
      return {};
    }),
  );

  ipcMain.handle('create-user-review', async (event, { title, description, rating }) =>
    _apiCall(() => supabaseApi.createReview({ title, description, rating })),
  );

  ipcMain.handle('get-user-review', async (event) => _apiCall(async () => supabaseApi.getUserReview()));

  ipcMain.handle('update-user-review', async (event, { id, title, description, rating }) =>
    _apiCall(async () => supabaseApi.updateReview({ id, title, description, rating })),
  );

  ipcMain.handle('get-job-by-id', async (event, { jobId }) =>
    _apiCall(async () => {
      const job = await supabaseApi.getJob(jobId);
      return { job };
    }),
  );

  ipcMain.handle('export-jobs-csv', async (event, { status }) =>
    _apiCall(async () => {
      const res = await dialog.showSaveDialog({
        properties: ['createDirectory'],
        filters: [{ name: 'CSV Jobs', extensions: ['csv'] }],
      });
      const filePath = res.filePath;
      if (res.canceled) return;

      // load all jobs with pagination
      const batchSize = 300;
      let allJobs: Job[] = [];
      let after: string | undefined;
      do {
        const { jobs, nextPageToken } = await supabaseApi.listJobs({
          status,
          limit: batchSize,
          after,
        });
        allJobs = allJobs.concat(jobs);
        after = nextPageToken;
      } while (!!after);

      // cherry-pick the fields we want to export
      const sanitizedJobs = allJobs.map((job: Job) => ({
        title: job.title,
        company: job.companyName,
        location: job.location,
        salary: job.salary,
        job_type: job.jobType,
        job_status: job.status,
        external_url: job.externalUrl,
      }));

      const csvJobs = json2csv(sanitizedJobs);
      fs.writeFileSync(filePath, csvJobs);
    }),
  );

  ipcMain.handle('change-all-job-status', async (event, { from, to }) =>
    _apiCall(async () => {
      const job = await supabaseApi.changeAllJobStatus({ from, to });
      return { job };
    }),
  );

  ipcMain.handle('get-profile', async (event, {}) =>
    _apiCall(async () => {
      const profile = await supabaseApi.getProfile();
      return { profile };
    }),
  );

  ipcMain.handle('get-stripe-config', async (event, {}) =>
    _apiCall(async () => {
      const config = await getStripeConfig(nodeEnv);
      return { config };
    }),
  );

  ipcMain.handle('create-note', async (event, { job_id, text, files }) =>
    _apiCall(() => supabaseApi.createNote({ job_id, text, files })),
  );

  ipcMain.handle('list-notes', async (event, { job_id }) => _apiCall(() => supabaseApi.listNotes(job_id)));

  ipcMain.handle('update-note', async (event, { noteId, text }) =>
    _apiCall(() => supabaseApi.updateNote({ noteId, text })),
  );

  ipcMain.handle('add-file-to-note', async (event, { noteId, file }) =>
    _apiCall(() => supabaseApi.addFileToNote({ noteId, file })),
  );

  ipcMain.handle('delete-note', async (event, { noteId }) => _apiCall(() => supabaseApi.deleteNote(noteId)));

  ipcMain.handle('get-advanced-matching-config', async (event, {}) =>
    _apiCall(() => supabaseApi.getAdvancedMatchingConfig()),
  );

  ipcMain.handle('update-advanced-matching-config', async (event, { config }) =>
    _apiCall(() => supabaseApi.updateAdvancedMatchingConfig(config)),
  );

  // Export advanced matching configuration (prompt, blacklist, favorites) to JSON
  ipcMain.handle('export-advanced-matching-config', async (event, {}) =>
    _apiCall(async () => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      // Use a filename-safe timestamp (YYYYMMDD-HHmmss)
      const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const res = await dialog.showSaveDialog({
        properties: ['createDirectory'],
        filters: [{ name: 'JSON', extensions: ['json'] }],
        defaultPath: `first2apply-advanced-matching-config-${timestamp}.json`,
      });
      if (res.canceled || !res.filePath) return {};

      const current = await supabaseApi.getAdvancedMatchingConfig();
      const payload = {
        chatgpt_prompt: current?.chatgpt_prompt ?? '',
        blacklisted_companies: current?.blacklisted_companies ?? [],
        favorite_companies: current?.favorite_companies ?? [],
      };

      fs.writeFileSync(res.filePath, JSON.stringify(payload, null, 2), 'utf8');
      return {};
    }),
  );

  // Import advanced matching configuration from JSON (does not persist automatically)
  ipcMain.handle('import-advanced-matching-config', async (event, {}) =>
    _apiCall(async () => {
      const res = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'JSON', extensions: ['json'] }],
      });
      if (res.canceled || !res.filePaths?.length) return {};

      const filePath = res.filePaths[0];
      const text = fs.readFileSync(filePath, 'utf8');
      let json: any;
      try {
        json = JSON.parse(text);
      } catch (e) {
        throw new Error('Invalid JSON file');
      }

      const chatgpt_prompt = typeof json?.chatgpt_prompt === 'string' ? json.chatgpt_prompt : '';
      const blacklisted_companies = Array.isArray(json?.blacklisted_companies)
        ? json.blacklisted_companies.filter((x: any) => typeof x === 'string')
        : [];
      const favorite_companies = Array.isArray(json?.favorite_companies)
        ? json.favorite_companies.filter((x: any) => typeof x === 'string')
        : [];

      return { chatgpt_prompt, blacklisted_companies, favorite_companies };
    }),
  );

  ipcMain.handle('debug-link', async (event, { linkId }) => _apiCall(() => jobScanner.startDebugWindow({ linkId })));

  // API Configuration handlers
  ipcMain.handle('get-api-config', async (event) =>
    _apiCall(async () => {
      // Load API config from secure storage
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      
      const configPath = path.join(os.homedir(), '.first2apply-api-config.json');
      
      try {
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          return config;
        }
      } catch (error) {
        console.error('Error loading API config:', error);
      }
      
      // Return default config
      return {
        provider: 'gemini',
        keys: { openai: '', gemini: '', llama: '' }
      };
    })
  );

  ipcMain.handle('update-api-config', async (event, { config }) =>
    _apiCall(async () => {
      // Save API config to secure storage
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      
      const configPath = path.join(os.homedir(), '.first2apply-api-config.json');
      
      try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
      } catch (error) {
        console.error('Error saving API config:', error);
        throw error;
      }
      
      return {};
    })
  );

  ipcMain.handle('open-job-board-modal', async (event, { jobSite }) => {
    return _apiCall(async () => jobBoardModal.open(jobSite));
  });
  ipcMain.handle('finish-job-board-modal', async (event) => {
    return _apiCall(() => jobBoardModal.finish());
  });
  ipcMain.handle('close-job-board-modal', async (event) => {
    return _apiCall(async () => jobBoardModal.close());
  });
}
