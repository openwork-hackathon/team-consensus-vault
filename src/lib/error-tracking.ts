/**
 * Error Tracking Integration Configuration
 * 
 * This module provides integration points for external error tracking services
 * like Sentry, LogRocket, Datadog, etc.
 */

import type { UserFacingError } from './types';

// Interface for error tracking service configuration
interface ErrorTrackingConfig {
  enabled: boolean;
  service: 'sentry' | 'datadog' | 'logrocket' | 'custom';
  dsn?: string;
  environment?: string;
  sampleRate?: number;
}

// Default configuration
const config: ErrorTrackingConfig = {
  enabled: process.env.NODE_ENV === 'production',
  service: 'sentry',
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  sampleRate: 1.0, // Report 100% of errors in production
};

// Error tracking service interface
interface ErrorTrackingService {
  captureException(error: Error, context?: Record<string, any>): void;
  captureMessage(message: string, level?: 'info' | 'warning' | 'error', context?: Record<string, any>): void;
  setUser(user: { id: string; email?: string; username?: string }): void;
  addBreadcrumb(message: string, category: string, level?: 'info' | 'warning' | 'error'): void;
}

// Sentry integration
class SentryService implements ErrorTrackingService {
  private isInitialized = false;

  initialize() {
    if (this.isInitialized || typeof window === 'undefined') return;

    try {
      // Dynamic import to avoid SSR issues
      // @ts-ignore - Sentry is optional and may not be installed
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.init({
          dsn: config.dsn,
          environment: config.environment,
          tracesSampleRate: config.sampleRate,
          integrations: [
            new Sentry.BrowserTracing(),
            new Sentry.Replay(),
          ],
          replaysSessionSampleRate: 0.1,
          replaysOnErrorSampleRate: 1.0,
        });
        this.isInitialized = true;
        console.log('Sentry initialized for error tracking');
      }).catch(() => {
        console.log('Sentry not available - error tracking disabled');
      });
    } catch (error) {
      console.warn('Failed to initialize Sentry:', error);
    }
  }

  captureException(error: Error, context?: Record<string, any>) {
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, { extra: context });
    }
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureMessage(message, level, { extra: context });
    }
  }

  setUser(user: { id: string; email?: string; username?: string }) {
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.setUser(user);
    }
  }

  addBreadcrumb(message: string, category: string, level: 'info' | 'warning' | 'error' = 'info') {
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.addBreadcrumb({
        message,
        category,
        level,
        timestamp: Date.now(),
      });
    }
  }
}

// Mock service for development
class MockService implements ErrorTrackingService {
  captureException(error: Error, context?: Record<string, any>) {
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Tracking (Mock)');
      console.error('Exception:', error.message);
      console.log('Context:', context);
      console.groupEnd();
    }
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
    if (process.env.NODE_ENV === 'development') {
      console.group(`📝 Message Tracking (Mock) [${level.toUpperCase()}]`);
      console.log('Message:', message);
      console.log('Context:', context);
      console.groupEnd();
    }
  }

  setUser(user: { id: string; email?: string; username?: string }) {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 User tracking (Mock):', user);
    }
  }

  addBreadcrumb(message: string, category: string, level: 'info' | 'warning' | 'error' = 'info') {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🍞 Breadcrumb [${category}]:`, message);
    }
  }
}

// Select the appropriate service based on configuration
const sentryService = new SentryService();
const errorService: ErrorTrackingService = config.enabled
  ? sentryService
  : new MockService();

// Initialize the service
if (config.enabled) {
  sentryService.initialize();
}

/**
 * Enhanced error capture with consensus-specific context
 */
export function captureConsensusError(
  error: Error,
  context: {
    correlationId?: string;
    modelId?: string;
    asset?: string;
    userFacingError?: UserFacingError;
    additionalContext?: Record<string, any>;
  }
) {
  const enrichedContext = {
    component: 'consensus-engine',
    correlation_id: context.correlationId,
    model_id: context.modelId,
    asset: context.asset,
    user_facing_error: context.userFacingError,
    ...context.additionalContext,
  };

  errorService.captureException(error, enrichedContext);
  
  // Add breadcrumb for error tracking
  errorService.addBreadcrumb(
    `Consensus error: ${error.message}`,
    'consensus-engine',
    'error'
  );
}

/**
 * Capture consensus performance issue
 */
export function captureConsensusPerformanceIssue(
  message: string,
  context: {
    correlationId?: string;
    modelId?: string;
    responseTime?: number;
    threshold?: number;
    asset?: string;
  }
) {
  errorService.captureMessage(message, 'warning', {
    component: 'consensus-engine',
    type: 'performance_issue',
    ...context,
  });

  errorService.addBreadcrumb(
    `Performance issue: ${message}`,
    'performance',
    'warning'
  );
}

/**
 * Capture user interaction for debugging
 */
export function trackUserInteraction(
  action: string,
  context: {
    userId?: string;
    asset?: string;
    success?: boolean;
    duration?: number;
  }
) {
  errorService.captureMessage(`User action: ${action}`, 'info', {
    component: 'user-interaction',
    action,
    ...context,
  });
}

/**
 * Set user context for error tracking
 */
export function setErrorTrackingUser(user: { id: string; email?: string; username?: string }) {
  errorService.setUser(user);
}

/**
 * Add breadcrumb for user journey tracking
 */
export function addUserJourneyBreadcrumb(message: string, category: string = 'user-journey') {
  errorService.addBreadcrumb(message, category, 'info');
}

/**
 * Report system health issues to error tracking
 */
export function reportSystemHealthIssue(
  issue: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  context: Record<string, any>
) {
  const level = severity === 'critical' ? 'error' : 'warning';
  errorService.captureMessage(`System health issue: ${issue}`, level, {
    component: 'system-health',
    severity,
    ...context,
  });
}

/**
 * Initialize error tracking for the application
 */
export function initializeErrorTracking() {
  if (config.enabled) {
    console.log('🔍 Error tracking initialized:', config.service);
    
    // Add initial breadcrumb
    errorService.addBreadcrumb(
      'Application started',
      'application',
      'info'
    );
  } else {
    console.log('🚫 Error tracking disabled for', config.environment);
  }
}

// Export the error service for direct use if needed
export { errorService };

// Export configuration for external access
export { config as errorTrackingConfig };