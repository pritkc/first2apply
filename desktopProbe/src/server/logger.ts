import { Logger as MezmoLogger, createLogger } from '@logdna/logger';
import { app } from 'electron';

import { ENV } from '../env';

export interface ILogger {
  debug(message: string, data?: Record<string, any>): void;
  info(message: string, data?: Record<string, any>): void;
  error(message: string, data?: Record<string, any>): void;
  addMeta(key: string, value: string): void;
  flush(): void;
}

/**
 * Custom logger class that wraps the Mezmo logger or falls back to console.
 */
class Logger implements ILogger {
  constructor(private _logger?: MezmoLogger) {}

  debug(message: string, data?: Record<string, any>) {
    console.log(message, data);
    if (this._logger) {
      this._logger.debug(message, {
        meta: data,
      });
    }
  }

  info(message: string, data?: Record<string, any>) {
    console.log(message, data);
    if (this._logger) {
      this._logger.info(message, {
        meta: data,
      });
    }
  }

  error(message: string, data?: Record<string, any>) {
    console.error(message, data);
    if (this._logger) {
      this._logger.error(message, {
        meta: data,
      });
    }
  }

  addMeta(key: string, value: string) {
    if (this._logger) {
      this._logger.addMetaProperty(key, value);
    }
  }

  flush() {
    if (this._logger) {
      this._logger.flush();
    }
  }
}

// Only create Mezmo logger if API key is provided
let mezmoLogger: MezmoLogger | undefined;
if (ENV.mezmoApiKey && ENV.mezmoApiKey.trim() !== '') {
  try {
    mezmoLogger = createLogger(ENV.mezmoApiKey, {
      level: ENV.nodeEnv === 'development' ? 'debug' : 'info',
      app: ENV.appBundleId,
      env: ENV.nodeEnv,
      hostname: process.platform,
      meta: {
        version: app.getVersion(),
        arch: process.arch,
      },
      indexMeta: true,
    });
  } catch (error) {
    console.warn('Failed to initialize Mezmo logger, falling back to console logging:', error);
  }
}

export const logger = new Logger(mezmoLogger);
