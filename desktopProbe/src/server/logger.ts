import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export enum LogSection {
  MAIN = 'MAIN',
  JOB_SCANNER = 'JOB_SCANNER',
  HTML_DOWNLOADER = 'HTML_DOWNLOADER',
  SUPABASE_API = 'SUPABASE_API',
  EMAIL = 'EMAIL',
  DATABASE = 'DATABASE',
  AUTH = 'AUTH',
  CRON = 'CRON',
  WINDOW = 'WINDOW',
  SYSTEM = 'SYSTEM',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  section: LogSection;
  message: string;
  data?: any;
  error?: Error;
}

export class Logger {
  private _logLevel: LogLevel;
  private _logFile: string;
  private _logEntries: LogEntry[] = [];
  private _maxEntries: number = 1000;
  private _sectionColors: Map<LogSection, string> = new Map();
  private _levelColors: Map<LogLevel, string> = new Map();

  constructor(logLevel: LogLevel = LogLevel.INFO) {
    this._logLevel = logLevel;
    this._logFile = path.join(app.getPath('userData'), 'logs', 'app.log');
    
    // Ensure logs directory exists
    const logDir = path.dirname(this._logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Initialize color schemes
    this._initializeColors();
  }

  private _initializeColors(): void {
    // Section colors (bright, distinct colors)
    this._sectionColors.set(LogSection.MAIN, '\x1b[36m'); // Cyan
    this._sectionColors.set(LogSection.JOB_SCANNER, '\x1b[32m'); // Green
    this._sectionColors.set(LogSection.HTML_DOWNLOADER, '\x1b[33m'); // Yellow
    this._sectionColors.set(LogSection.SUPABASE_API, '\x1b[35m'); // Magenta
    this._sectionColors.set(LogSection.EMAIL, '\x1b[34m'); // Blue
    this._sectionColors.set(LogSection.DATABASE, '\x1b[31m'); // Red
    this._sectionColors.set(LogSection.AUTH, '\x1b[37m'); // White
    this._sectionColors.set(LogSection.CRON, '\x1b[90m'); // Gray
    this._sectionColors.set(LogSection.WINDOW, '\x1b[94m'); // Light Blue
    this._sectionColors.set(LogSection.SYSTEM, '\x1b[95m'); // Light Magenta

    // Level colors
    this._levelColors.set(LogLevel.DEBUG, '\x1b[90m'); // Gray
    this._levelColors.set(LogLevel.INFO, '\x1b[37m'); // White
    this._levelColors.set(LogLevel.WARN, '\x1b[33m'); // Yellow
    this._levelColors.set(LogLevel.ERROR, '\x1b[31m'); // Red
  }

  private _getColorReset(): string {
    return '\x1b[0m';
  }

  private _formatTimestamp(): string {
    const now = new Date();
    return now.toISOString().replace('T', ' ').replace('Z', '');
  }

  private _formatSection(section: LogSection): string {
    const color = this._sectionColors.get(section) || '\x1b[37m';
    return `${color}[${section}]${this._getColorReset()}`;
  }

  private _formatLevel(level: LogLevel): string {
    const color = this._levelColors.get(level) || '\x1b[37m';
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    return `${color}${levelNames[level]}${this._getColorReset()}`;
  }

  private _formatMessage(message: string, data?: any, error?: Error): string {
    let formatted = message;
    
    if (data !== undefined) {
      if (typeof data === 'object') {
        formatted += ` ${JSON.stringify(data, null, 2)}`;
      } else {
        formatted += ` ${data}`;
      }
    }
    
    if (error) {
      formatted += `\n  Error: ${error.message}`;
      if (error.stack) {
        formatted += `\n  Stack: ${error.stack}`;
      }
    }
    
    return formatted;
  }

  private _log(level: LogLevel, section: LogSection, message: string, data?: any, error?: Error): void {
    if (level < this._logLevel) return;

    const entry: LogEntry = {
      timestamp: this._formatTimestamp(),
      level,
      section,
      message,
      data,
      error,
    };

    this._logEntries.push(entry);
    
    // Keep only the last maxEntries
    if (this._logEntries.length > this._maxEntries) {
      this._logEntries = this._logEntries.slice(-this._maxEntries);
    }

    // Console output with colors
    const timestamp = `\x1b[90m${entry.timestamp}\x1b[0m`;
    const sectionFormatted = this._formatSection(section);
    const levelFormatted = this._formatLevel(level);
    const messageFormatted = this._formatMessage(message, data, error);
    
    console.log(`${timestamp} ${sectionFormatted} ${levelFormatted} ${messageFormatted}`);

    // Write to file
    this._writeToFile(entry);
  }

  private _writeToFile(entry: LogEntry): void {
    try {
      const logLine = `${entry.timestamp} [${entry.section}] ${LogLevel[entry.level]} ${entry.message}${entry.data ? ` ${JSON.stringify(entry.data)}` : ''}${entry.error ? ` Error: ${entry.error.message}` : ''}\n`;
      fs.appendFileSync(this._logFile, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  // Public logging methods
  debug(section: LogSection, message: string, data?: any): void {
    this._log(LogLevel.DEBUG, section, message, data);
  }

  info(section: LogSection, message: string, data?: any): void {
    this._log(LogLevel.INFO, section, message, data);
  }

  warn(section: LogSection, message: string, data?: any): void {
    this._log(LogLevel.WARN, section, message, data);
  }

  error(section: LogSection, message: string, data?: any, error?: Error): void {
    this._log(LogLevel.ERROR, section, message, data, error);
  }

  // Specialized logging methods for common patterns
  success(section: LogSection, message: string, data?: any): void {
    this.info(section, `✅ ${message}`, data);
  }

  failure(section: LogSection, message: string, data?: any, error?: Error): void {
    this.error(section, `❌ ${message}`, data, error);
  }

  progress(section: LogSection, message: string, current: number, total: number, data?: any): void {
    const percentage = Math.round((current / total) * 100);
    const progressBar = this._createProgressBar(current, total);
    this.info(section, `🔄 ${message} ${progressBar} ${percentage}% (${current}/${total})`, data);
  }

  start(section: LogSection, message: string, data?: any): void {
    this.info(section, `🚀 Starting: ${message}`, data);
  }

  complete(section: LogSection, message: string, data?: any): void {
    this.info(section, `✅ Completed: ${message}`, data);
  }

  private _createProgressBar(current: number, total: number, width: number = 20): string {
    const filled = Math.round((current / total) * width);
    const empty = width - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
  }

  // Section-specific convenience methods
  jobScanner = {
    start: (message: string, data?: any) => this.start(LogSection.JOB_SCANNER, message, data),
    complete: (message: string, data?: any) => this.complete(LogSection.JOB_SCANNER, message, data),
    progress: (message: string, current: number, total: number, data?: any) => this.progress(LogSection.JOB_SCANNER, message, current, total, data),
    success: (message: string, data?: any) => this.success(LogSection.JOB_SCANNER, message, data),
    failure: (message: string, data?: any, error?: Error) => this.failure(LogSection.JOB_SCANNER, message, data, error),
    info: (message: string, data?: any) => this.info(LogSection.JOB_SCANNER, message, data),
    warn: (message: string, data?: any) => this.warn(LogSection.JOB_SCANNER, message, data),
    error: (message: string, data?: any, error?: Error) => this.error(LogSection.JOB_SCANNER, message, data, error),
    debug: (message: string, data?: any) => this.debug(LogSection.JOB_SCANNER, message, data),
  };

  htmlDownloader = {
    start: (message: string, data?: any) => this.start(LogSection.HTML_DOWNLOADER, message, data),
    complete: (message: string, data?: any) => this.complete(LogSection.HTML_DOWNLOADER, message, data),
    success: (message: string, data?: any) => this.success(LogSection.HTML_DOWNLOADER, message, data),
    failure: (message: string, data?: any, error?: Error) => this.failure(LogSection.HTML_DOWNLOADER, message, data, error),
    info: (message: string, data?: any) => this.info(LogSection.HTML_DOWNLOADER, message, data),
    warn: (message: string, data?: any) => this.warn(LogSection.HTML_DOWNLOADER, message, data),
    error: (message: string, data?: any, error?: Error) => this.error(LogSection.HTML_DOWNLOADER, message, data, error),
  };

  supabaseApi = {
    start: (message: string, data?: any) => this.start(LogSection.SUPABASE_API, message, data),
    complete: (message: string, data?: any) => this.complete(LogSection.SUPABASE_API, message, data),
    success: (message: string, data?: any) => this.success(LogSection.SUPABASE_API, message, data),
    failure: (message: string, data?: any, error?: Error) => this.failure(LogSection.SUPABASE_API, message, data, error),
    info: (message: string, data?: any) => this.info(LogSection.SUPABASE_API, message, data),
    warn: (message: string, data?: any) => this.warn(LogSection.SUPABASE_API, message, data),
    error: (message: string, data?: any, error?: Error) => this.error(LogSection.SUPABASE_API, message, data, error),
  };

  email = {
    start: (message: string, data?: any) => this.start(LogSection.EMAIL, message, data),
    complete: (message: string, data?: any) => this.complete(LogSection.EMAIL, message, data),
    success: (message: string, data?: any) => this.success(LogSection.EMAIL, message, data),
    failure: (message: string, data?: any, error?: Error) => this.failure(LogSection.EMAIL, message, data, error),
    info: (message: string, data?: any) => this.info(LogSection.EMAIL, message, data),
    warn: (message: string, data?: any) => this.warn(LogSection.EMAIL, message, data),
    error: (message: string, data?: any, error?: Error) => this.error(LogSection.EMAIL, message, data, error),
  };

  // Utility methods
  getLogEntries(): LogEntry[] {
    return [...this._logEntries];
  }

  getLogEntriesBySection(section: LogSection): LogEntry[] {
    return this._logEntries.filter(entry => entry.section === section);
  }

  getLogEntriesByLevel(level: LogLevel): LogEntry[] {
    return this._logEntries.filter(entry => entry.level === level);
  }

  clearLogs(): void {
    this._logEntries = [];
  }

  setLogLevel(level: LogLevel): void {
    this._logLevel = level;
  }

  getLogFile(): string {
    return this._logFile;
  }
}

// Export singleton instance
export const logger = new Logger();

// Backward compatibility interface
export interface ILogger {
  info(message: string, data?: any): void;
  error(message: string, data?: any, error?: Error): void;
  warn(message: string, data?: any): void;
  debug(message: string, data?: any): void;
}