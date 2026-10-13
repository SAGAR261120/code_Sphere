/**
 * CPC Marketplace — Production Structured Logging Engine
 * Standardized JSON logging with sensitive field redaction and request tracing.
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

const LOG_LEVEL_PRIORITIES: Record<LogLevel, number> = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
  FATAL: 50,
};

const SENSITIVE_KEYS = new Set([
  'password',
  'confirmpassword',
  'token',
  'sessiontoken',
  'secret',
  'session_secret',
  'webhook_secret',
  'apikey',
  'authorization',
  'cookie',
  'creditcard',
  'cardnumber',
  'cvv',
  'pin',
  'privatekey',
  'signature',
]);

/**
 * Deeply clone an object, redacting sensitive keys.
 */
export function redactSensitiveData(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item));
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase().replace(/[-_]/g, '');
    if (SENSITIVE_KEYS.has(lowerKey)) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redactSensitiveData(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export interface LogContext {
  requestId?: string;
  userId?: string;
  ip?: string;
  path?: string;
  action?: string;
  [key: string]: any;
}

class Logger {
  private minLevel: LogLevel;

  constructor() {
    const envLevel = (process.env.LOG_LEVEL || 'INFO').toUpperCase() as LogLevel;
    this.minLevel = LOG_LEVEL_PRIORITIES[envLevel] ? envLevel : 'INFO';
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITIES[level] >= LOG_LEVEL_PRIORITIES[this.minLevel];
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: any
  ): string {
    const entry: Record<string, any> = {
      timestamp: new Date().toISOString(),
      level,
      message,
      environment: process.env.NODE_ENV || 'development',
    };

    if (context && Object.keys(context).length > 0) {
      entry.context = redactSensitiveData(context);
    }

    if (error) {
      entry.error = {
        name: error.name || 'Error',
        message: error.message || String(error),
        code: error.code || error.statusCode,
        stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
      };
    }

    return JSON.stringify(entry);
  }

  debug(message: string, context?: LogContext) {
    if (!this.shouldLog('DEBUG')) return;
    console.debug(this.formatMessage('DEBUG', message, context));
  }

  info(message: string, context?: LogContext) {
    if (!this.shouldLog('INFO')) return;
    console.log(this.formatMessage('INFO', message, context));
  }

  warn(message: string, context?: LogContext, error?: any) {
    if (!this.shouldLog('WARN')) return;
    console.warn(this.formatMessage('WARN', message, context, error));
  }

  error(message: string, context?: LogContext, error?: any) {
    if (!this.shouldLog('ERROR')) return;
    console.error(this.formatMessage('ERROR', message, context, error));
  }

  fatal(message: string, context?: LogContext, error?: any) {
    if (!this.shouldLog('FATAL')) return;
    console.error(this.formatMessage('FATAL', message, context, error));
  }
}

export const logger = new Logger();
