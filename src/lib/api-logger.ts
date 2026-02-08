/**
 * Comprehensive API Request/Response Logger for Consensus Vault
 * 
 * Features:
 * - Structured JSON logging for easier parsing
 * - Request/response correlation via request IDs
 * - Sensitive data sanitization (no auth tokens, API keys)
 * - Environment-aware logging levels (verbose in dev, minimal in prod)
 * - Response timing and body size tracking
 * - Error logging with stack traces
 * - CORS headers and metadata logging
 */

import { NextRequest, NextResponse } from 'next/server';

// Environment configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug');

// Log levels
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Check if a log level should be emitted based on configured LOG_LEVEL
 */
function shouldLog(level: LogLevel): boolean {
  const levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };
  const currentLevel = levels[LOG_LEVEL as LogLevel] ?? 1; // Default to info
  return levels[level] >= currentLevel;
}

/**
 * Generate a unique request ID for correlation
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sanitize headers to remove sensitive information
 */
function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  const sensitiveKeys = [
    'authorization',
    'api-key',
    'x-api-key',
    'token',
    'cookie',
    'set-cookie',
    'password',
    'secret',
    'private-key',
  ];

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize request/response body to remove sensitive information
 */
function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveFields = [
    'apiKey',
    'api_key',
    'token',
    'password',
    'secret',
    'privateKey',
    'private_key',
    'authorization',
    'credentials',
  ];

  const sanitized = { ...body };
  for (const field of sensitiveFields) {
    if (sanitized[field] !== undefined) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Calculate response body size in bytes
 */
function calculateBodySize(body: any): number {
  if (!body) return 0;
  try {
    const jsonString = JSON.stringify(body);
    return new Blob([jsonString]).size;
  } catch {
    return 0;
  }
}

/**
 * Structured log entry interface
 */
interface LogEntry {
  timestamp: string;
  requestId: string;
  level: LogLevel;
  message: string;
  data?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

/**
 * Write a structured log entry
 */
function writeLog(entry: LogEntry): void {
  if (!shouldLog(entry.level)) {
    return;
  }

  const logOutput = {
    ...entry,
    environment: NODE_ENV,
    service: 'consensus-vault-api',
  };

  // Use appropriate console method based on level
  const logMethod = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
  }[entry.level];

  // In production, log as JSON for easier parsing
  if (NODE_ENV === 'production') {
    logMethod(JSON.stringify(logOutput));
  } else {
    // In development, pretty print for readability
    const { timestamp, requestId, level, message, ...rest } = logOutput;
    logMethod(`[${timestamp}] [${level.toUpperCase()}] [${requestId}] ${message}`, rest);
  }
}

/**
 * API Logger class for request/response logging
 */
export class ApiLogger {
  private requestId: string;
  private startTime: number;
  private request: NextRequest;
  private url: URL;

  constructor(request: NextRequest) {
    this.requestId = generateRequestId();
    this.startTime = Date.now();
    this.request = request;
    this.url = new URL(request.url);
  }

  /**
   * Log incoming request
   */
  logRequest(): void {
    const headers = Object.fromEntries(this.request.headers.entries());
    const sanitizedHeaders = sanitizeHeaders(headers);

    const requestData: Record<string, any> = {
      method: this.request.method,
      url: this.url.pathname,
      query: Object.fromEntries(this.url.searchParams.entries()),
      headers: sanitizedHeaders,
      ip: this.request.headers.get('x-forwarded-for') || this.request.headers.get('x-real-ip') || 'unknown',
      userAgent: this.request.headers.get('user-agent') || 'unknown',
    };

    // Try to parse and log request body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(this.request.method)) {
      // Note: Body will be logged after it's read in the route handler
      requestData.hasBody = true;
    }

    writeLog({
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
      level: 'info',
      message: `Incoming ${this.request.method} request to ${this.url.pathname}`,
      data: requestData,
    });
  }

  /**
   * Log request body (call this after reading the body in route handler)
   */
  logRequestBody(body: any): void {
    const sanitizedBody = sanitizeBody(body);
    
    writeLog({
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
      level: 'debug',
      message: `Request body for ${this.request.method} ${this.url.pathname}`,
      data: {
        body: sanitizedBody,
        bodySize: calculateBodySize(body),
      },
    });
  }

  /**
   * Log outgoing response
   */
  logResponse(response: NextResponse | Response, responseBody?: any): void {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    const status = response.status;
    const statusText = response.statusText;

    const headers = Object.fromEntries(response.headers.entries());
    const sanitizedHeaders = sanitizeHeaders(headers);

    const responseData: Record<string, any> = {
      status,
      statusText,
      durationMs: duration,
      headers: sanitizedHeaders,
    };

    if (responseBody !== undefined) {
      const sanitizedResponseBody = sanitizeBody(responseBody);
      responseData.body = sanitizedResponseBody;
      responseData.bodySize = calculateBodySize(responseBody);
    }

    const level = status >= 400 ? 'warn' : 'info';
    const message = `Response for ${this.request.method} ${this.url.pathname}: ${status} ${statusText} (${duration}ms)`;

    writeLog({
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
      level,
      message,
      data: responseData,
    });
  }

  /**
   * Log error with stack trace
   */
  logError(error: Error, context?: Record<string, any>): void {
    const errorData: Record<string, any> = {
      error: {
        message: error.message,
        name: error.name,
        stack: NODE_ENV === 'production' ? undefined : error.stack, // Don't log stack in prod
      },
      context: {
        method: this.request.method,
        url: this.url.pathname,
        ...context,
      },
      durationMs: Date.now() - this.startTime,
    };

    writeLog({
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
      level: 'error',
      message: `Error in ${this.request.method} ${this.url.pathname}: ${error.message}`,
      data: errorData,
      error: {
        message: error.message,
        stack: error.stack,
      },
    });
  }

  /**
   * Get the request ID for correlation
   */
  getRequestId(): string {
    return this.requestId;
  }

  /**
   * Get request duration so far
   */
  getDuration(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Log informational message
   */
  info(message: string, data?: Record<string, any>): void {
    writeLog({
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
      level: 'info',
      message: `[${this.request.method} ${this.url.pathname}] ${message}`,
      data,
    });
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: Record<string, any>): void {
    writeLog({
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
      level: 'warn',
      message: `[${this.request.method} ${this.url.pathname}] ${message}`,
      data,
    });
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: Record<string, any>): void {
    writeLog({
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
      level: 'debug',
      message: `[${this.request.method} ${this.url.pathname}] ${message}`,
      data,
    });
  }
}

/**
 * Middleware wrapper for API routes
 * Usage: 
 *   const logger = createApiLogger(request);
 *   logger.logRequest();
 *   // ... handle request
 *   logger.logResponse(response);
 */
export function createApiLogger(request: NextRequest): ApiLogger {
  return new ApiLogger(request);
}

/**
 * Helper to wrap API route handlers with automatic logging
 * Usage:
 *   export async function GET(request: NextRequest) {
 *     return withApiLogging(request, async () => {
 *       // Your handler logic
 *       return NextResponse.json({ data: 'result' });
 *     });
 *   }
 */
export async function withApiLogging(
  request: NextRequest,
  handler: (logger: ApiLogger) => Promise<NextResponse | Response>
): Promise<NextResponse | Response> {
  const logger = createApiLogger(request);
  
  try {
    logger.logRequest();
    
    // Read and log request body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        const clone = request.clone();
        const body = await clone.json().catch(() => null);
        if (body) {
          logger.logRequestBody(body);
        }
      } catch {
        // Ignore body parsing errors for logging
      }
    }
    
    const response = await handler(logger);
    
    // Try to extract response body for logging
    try {
      const clone = response.clone();
      const body = await clone.json().catch(() => null);
      logger.logResponse(response, body);
    } catch {
      logger.logResponse(response);
    }
    
    return response;
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Quick logging utilities for common scenarios
 */
export const apiLogger = {
  debug: (message: string, data?: Record<string, any>) => {
    writeLog({
      timestamp: new Date().toISOString(),
      requestId: 'system',
      level: 'debug',
      message,
      data,
    });
  },

  info: (message: string, data?: Record<string, any>) => {
    writeLog({
      timestamp: new Date().toISOString(),
      requestId: 'system',
      level: 'info',
      message,
      data,
    });
  },

  warn: (message: string, data?: Record<string, any>) => {
    writeLog({
      timestamp: new Date().toISOString(),
      requestId: 'system',
      level: 'warn',
      message,
      data,
    });
  },

  error: (message: string, error?: Error, data?: Record<string, any>) => {
    writeLog({
      timestamp: new Date().toISOString(),
      requestId: 'system',
      level: 'error',
      message,
      data: {
        ...data,
        error: error ? {
          message: error.message,
          stack: NODE_ENV === 'production' ? undefined : error.stack,
        } : undefined,
      },
      error: error ? {
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  },
};