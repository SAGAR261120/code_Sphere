/**
 * CPC Marketplace — Production Error Monitor & Alert Dispatcher
 * Dispatches critical system errors, captures contextual payloads, and notifies admins.
 */

import { logger, LogContext } from './logger';
import { prisma } from './prisma';

export interface SecurityAlertPayload {
  eventType: 'BRUTE_FORCE' | 'IDOR_ATTEMPT' | 'SQLI_ATTEMPT' | 'REPLAY_ATTACK' | 'RATE_LIMIT_EXCEEDED';
  ip?: string;
  userId?: string;
  path?: string;
  details: Record<string, any>;
}

export class ErrorMonitor {
  /**
   * Captures an unexpected exception with context and logs it via structured logger.
   */
  static captureException(error: any, context?: LogContext) {
    logger.error(`Unhandled Exception: ${error?.message || String(error)}`, context, error);

    // In a multi-tenant cloud environment, Sentry/Datadog would be invoked here:
    // if (process.env.SENTRY_DSN) Sentry.captureException(error);
  }

  /**
   * Records a security alert event, writes to audit log, and notifies administrators.
   */
  static async recordSecurityAlert(alert: SecurityAlertPayload) {
    logger.warn(`Security Incident Detected: ${alert.eventType}`, {
      ...alert.details,
      userId: alert.userId,
      ip: alert.ip,
      path: alert.path,
    });

    try {
      // If user is authenticated, create in-app notification of security alert
      if (alert.userId) {
        // Record in PostgreSQL Audit Log
        await prisma.auditLog.create({
          data: {
            adminId: alert.userId,
            action: `SECURITY_ALERT:${alert.eventType}`,
            targetType: 'SecurityIncident',
            targetId: alert.userId,
            reason: `Automated detection: ${alert.eventType}`,
            ipAddress: alert.ip || null,
            metadata: {
              ...alert.details,
              path: alert.path,
              detectedAt: new Date().toISOString(),
            },
          },
        });

        await prisma.notification.create({
          data: {
            userId: alert.userId,
            type: 'SECURITY_ALERT',
            title: 'Security Alert on Your Account',
            message: `Unusual security event (${alert.eventType}) was detected. If this was not you, please secure your account.`,
            actionUrl: '/profile',
          },
        });
      }
    } catch (err) {
      // Fail open so audit creation error doesn't break primary request handling
      logger.error('Failed to persist security alert audit record', undefined, err);
    }
  }
}
