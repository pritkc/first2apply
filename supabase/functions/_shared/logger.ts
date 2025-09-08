import { Logger as MezmoLogger, createLogger } from "npm:@logdna/logger";
import { throwError } from "./errorUtils.ts";

export interface ILogger {
  debug(message: string, data?: Record<string, any>): void;
  info(message: string, data?: Record<string, any>): void;
  error(message: string, data?: Record<string, any>): void;
  addMeta(key: string, value: string): void;
  flush(): void;
}

/**
 * Custom logger class that wraps the Mezmo logger.
 */
class Logger implements ILogger {
  constructor(private _logger?: MezmoLogger) {}

  debug(message: string, data?: Record<string, any>) {
    console.log(message, data);
    if (this._logger?.debug) {
      this._logger.debug(message, {
        meta: data,
      });
    }
  }

  info(message: string, data?: Record<string, any>) {
    console.log(message, data);
    if (this._logger?.info) {
      this._logger.info(message, {
        meta: data,
      });
    }
  }

  error(message: string, data?: Record<string, any>) {
    console.error(message, data);
    if (this._logger?.error) {
      this._logger.error(message, {
        meta: data,
      });
    }
  }

  addMeta(key: string, value: string) {
    if (this._logger?.addMetaProperty) {
      this._logger.addMetaProperty(key, value);
    }
  }

  flush() {
    if (this._logger?.flush) {
      this._logger.flush();
    }
  }
}

export const createLoggerWithMeta = (meta: Record<string, string>) => {
  const mezmoApiKey = Deno.env.get("MEZMO_API_KEY");
  
  if (!mezmoApiKey || mezmoApiKey.trim() === '') {
    console.warn('MEZMO_API_KEY not found, falling back to console logging only');
    return new Logger(); // No Mezmo logger, console only
  }

  try {
    const mezmoLogger = createLogger(mezmoApiKey, {
      level: "info",
      app: "first2apply",
      env: "all",
      hostname: "edge-functions",
      meta,
      indexMeta: true,
    });

    return new Logger(mezmoLogger);
  } catch (error) {
    console.warn('Failed to initialize Mezmo logger, falling back to console logging:', error);
    return new Logger(); // Fallback to console only
  }
};
