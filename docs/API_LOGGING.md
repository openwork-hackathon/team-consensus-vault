# API Request/Response Logging

## Overview

The Consensus Vault API logging system provides comprehensive, structured logging for all API requests and responses. It's designed for debugging, monitoring, and security auditing while protecting sensitive information.

## Features

- **Structured JSON logging** for easier parsing and analysis
- **Request/response correlation** via unique request IDs
- **Sensitive data sanitization** (auth tokens, API keys, passwords are redacted)
- **Environment-aware logging** (verbose in development, minimal in production)
- **Response timing and body size tracking**
- **Error logging with stack traces**
- **CORS headers and metadata logging**

## Installation

The logging system is automatically available via the `api-logger.ts` module in `src/lib/`.

## Usage

### Basic Usage in API Routes

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createApiLogger } from '@/lib/api-logger';

export async function GET(request: NextRequest) {
  const logger = createApiLogger(request);
  
  try {
    // Log incoming request
    logger.logRequest();
    
    // Your handler logic
    const data = await fetchData();
    
    // Create response
    const response = NextResponse.json(data);
    
    // Log outgoing response
    logger.logResponse(response, data);
    
    return response;
  } catch (error) {
    // Log error with stack trace
    logger.logError(error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### With Request Body Logging

```typescript
export async function POST(request: NextRequest) {
  const logger = createApiLogger(request);
  
  try {
    logger.logRequest();
    
    // Read request body
    const body = await request.json();
    
    // Log request body (sanitized)
    logger.logRequestBody(body);
    
    // Process request
    const result = await processData(body);
    
    const response = NextResponse.json(result);
    logger.logResponse(response, result);
    
    return response;
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Bad request' },
      { status: 400 }
    );
  }
}
```

### Using the Convenience Wrapper

For simpler integration, use the `withApiLogging` wrapper:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/api-logger';

export async function GET(request: NextRequest) {
  return withApiLogging(request, async (logger) => {
    // Your handler logic
    const data = await fetchData();
    
    // Access logger if needed
    logger.info('Custom log message', { customData: 'value' });
    
    return NextResponse.json(data);
  });
}
```

### Quick Logging Utilities

For general logging needs:

```typescript
import { apiLogger } from '@/lib/api-logger';

// Debug logging (only in development)
apiLogger.debug('Processing started', { itemCount: 42 });

// Info logging
apiLogger.info('User action completed', { userId: '123', action: 'login' });

// Warning logging
apiLogger.warn('Rate limit approaching', { requests: 95, limit: 100 });

// Error logging
try {
  // Some operation
} catch (error) {
  apiLogger.error('Operation failed', error instanceof Error ? error : undefined, {
    context: 'user registration',
    userId: '123',
  });
}
```

## Configuration

### Environment Variables

```bash
# Log level (debug, info, warn, error)
LOG_LEVEL=info

# Node environment (development, production, test)
NODE_ENV=development
```

### Log Levels

- **debug**: Detailed information for debugging (default in development)
- **info**: General operational information (default in production)
- **warn**: Warning conditions that might need attention
- **error**: Error conditions that require investigation

### Output Format

**Development**: Pretty-printed logs for readability
```
[2024-01-15T10:30:00.000Z] [INFO] [req_1705314600000_abc123] Incoming GET request to /api/deepseek
```

**Production**: JSON logs for parsing and analysis
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "req_1705314600000_abc123",
  "level": "info",
  "message": "Incoming GET request to /api/deepseek",
  "data": {
    "method": "GET",
    "url": "/api/deepseek",
    "query": { "asset": "BTC" },
    "headers": { "user-agent": "curl/7.68.0" },
    "ip": "192.168.1.1",
    "userAgent": "curl/7.68.0"
  },
  "environment": "production",
  "service": "consensus-vault-api"
}
```

## Security Considerations

### Sensitive Data Redaction

The logger automatically redacts sensitive information from:
- Headers: `authorization`, `api-key`, `x-api-key`, `token`, `cookie`, etc.
- Request/response bodies: `apiKey`, `api_key`, `token`, `password`, `secret`, etc.

### What Gets Logged

**Logged**:
- Request method, URL, query parameters
- Sanitized headers
- Client IP (from x-forwarded-for or x-real-ip)
- User agent
- Response status, timing, size
- Sanitized request/response bodies
- Error messages and stack traces (development only)

**Not Logged**:
- Raw authentication tokens
- API keys
- Passwords and secrets
- Full error stack traces in production

## Best Practices

1. **Always use the logger in API routes** for consistent logging
2. **Log request bodies** for POST/PUT/PATCH requests to aid debugging
3. **Include context in error logs** to help with troubleshooting
4. **Use appropriate log levels** to control verbosity
5. **Test logging in both development and production modes**

## Example: Complete API Route

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createApiLogger } from '@/lib/api-logger';

export async function POST(request: NextRequest) {
  const logger = createApiLogger(request);
  
  try {
    // Log incoming request
    logger.logRequest();
    
    // Parse and log request body
    const body = await request.json();
    logger.logRequestBody(body);
    
    // Validate input
    const { asset, context } = body;
    if (!asset) {
      const error = new Error('Missing required field: asset');
      logger.logError(error, { validation: 'missing_asset' });
      return NextResponse.json(
        { error: 'Missing required field: asset' },
        { status: 400 }
      );
    }
    
    // Process request
    const startTime = Date.now();
    const analysis = await analyzeAsset(asset, context);
    const processingTime = Date.now() - startTime;
    
    logger.info('Analysis completed', {
      asset,
      processingTime,
      result: analysis.signal,
    });
    
    // Create response
    const response = NextResponse.json({
      signal: analysis.signal,
      confidence: analysis.confidence,
      reasoning: analysis.reasoning,
      asset: asset.toUpperCase(),
      processingTime,
      timestamp: new Date().toISOString(),
    });
    
    // Log response
    logger.logResponse(response, analysis);
    
    return response;
  } catch (error) {
    // Log unexpected errors
    logger.logError(error instanceof Error ? error : new Error(String(error)), {
      endpoint: 'deepseek',
      method: 'POST',
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        requestId: logger.getRequestId(), // Include for correlation
      },
      { status: 500 }
    );
  }
}
```

## Troubleshooting

### No Logs Appearing
- Check `LOG_LEVEL` environment variable
- Ensure `NODE_ENV` is set correctly
- Verify console output is not being redirected

### Sensitive Data in Logs
- Ensure you're using the provided logger methods
- Check that custom data doesn't contain sensitive information
- Verify redaction is working by checking log output

### Performance Concerns
- Logging is asynchronous and non-blocking
- Body parsing for logging uses cloned requests
- In production, only essential information is logged