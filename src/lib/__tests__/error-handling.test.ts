/**
 * Unit tests for enhanced error handling in consensus engine
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  ConsensusError,
  ConsensusErrorType,
  createUserFacingError,
  logger,
  getModelsHealthStatus,
  getSystemHealthSummary,
  generateCorrelationId,
} from '../consensus-engine';

// Mock logger to prevent console output during tests
vi.mock('../consensus-engine', async () => {
  const actual = await vi.importActual('../consensus-engine');
  return {
    ...actual,
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      getLogs: vi.fn(() => []),
      clear: vi.fn(),
    },
  };
});

describe('Enhanced Error Handling', () => {
  describe('ConsensusError with Correlation ID', () => {
    it('should generate unique correlation IDs', () => {
      const error1 = new ConsensusError('Test error', ConsensusErrorType.API_ERROR, 'test-model');
      const error2 = new ConsensusError('Test error', ConsensusErrorType.API_ERROR, 'test-model');

      expect(error1.correlationId).toBeDefined();
      expect(error2.correlationId).toBeDefined();
      expect(error1.correlationId).not.toBe(error2.correlationId);
    });

    it('should include metadata in error', () => {
      const metadata = { httpStatus: 502, service: 'test-service' };
      const error = new ConsensusError(
        'Test error',
        ConsensusErrorType.GATEWAY_ERROR,
        'test-model',
        null,
        metadata
      );

      expect(error.metadata).toEqual(metadata);
      expect(error.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('createUserFacingError', () => {
    it('should create proper rate limit error with guidance', () => {
      const error = new ConsensusError(
        'Rate limit exceeded',
        ConsensusErrorType.RATE_LIMIT,
        'test-model'
      );
      const userError = createUserFacingError(error);

      expect(userError.type).toBe('rate_limit');
      expect(userError.severity).toBe('warning');
      expect(userError.retryable).toBe(true);
      expect(userError.estimatedWaitTime).toBe(45000);
      expect(userError.recoveryGuidance).toContain('too many requests');
    });

    it('should create specific guidance for gateway errors', () => {
      const error502 = new ConsensusError(
        'Bad Gateway',
        ConsensusErrorType.GATEWAY_ERROR,
        'test-model',
        null,
        { httpStatus: 502, service: 'gemini' }
      );
      const userError502 = createUserFacingError(error502);

      expect(userError502.type).toBe('gateway_error');
      expect(userError502.estimatedWaitTime).toBe(180000);
      expect(userError502.recoveryGuidance).toContain('server issues');

      const error503 = new ConsensusError(
        'Service Unavailable',
        ConsensusErrorType.GATEWAY_ERROR,
        'test-model',
        null,
        { httpStatus: 503, service: 'gemini', likelyRecoveryTime: '2-5 minutes' }
      );
      const userError503 = createUserFacingError(error503);

      expect(userError503.estimatedWaitTime).toBe(300000);
      expect(userError503.recoveryGuidance).toContain('high load');
    });

    it('should provide timeout guidance with wait times', () => {
      const error = new ConsensusError(
        'Request timed out',
        ConsensusErrorType.TIMEOUT,
        'test-model'
      );
      const userError = createUserFacingError(error);

      expect(userError.type).toBe('timeout');
      expect(userError.estimatedWaitTime).toBe(60000);
      expect(userError.recoveryGuidance).toContain('high demand');
    });

    it('should provide network error guidance with recovery estimates', () => {
      const error = new ConsensusError(
        'Connection failed',
        ConsensusErrorType.NETWORK_ERROR,
        'test-model'
      );
      const userError = createUserFacingError(error);

      expect(userError.type).toBe('network');
      expect(userError.estimatedWaitTime).toBe(120000);
      expect(userError.recoveryGuidance).toContain('2-3 minutes');
    });

    it('should handle missing API key errors with appropriate severity', () => {
      const error = new ConsensusError(
        'Missing API key',
        ConsensusErrorType.MISSING_API_KEY,
        'test-model'
      );
      const userError = createUserFacingError(error);

      expect(userError.type).toBe('configuration');
      expect(userError.severity).toBe('critical');
      expect(userError.retryable).toBe(false);
      expect(userError.recoveryGuidance).toContain('server configuration');
    });
  });

  describe('Logger with Correlation IDs', () => {
    beforeEach(() => {
      logger.clear();
    });

    afterEach(() => {
      logger.clear();
    });

    it('should log errors with correlation IDs', () => {
      const correlationId = generateCorrelationId();
      logger.error('Test error message', correlationId, { modelId: 'test-model' });

      const logs = logger.getLogs(correlationId);
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('error');
      expect(logs[0].message).toBe('Test error message');
      expect(logs[0].correlationId).toBe(correlationId);
    });

    it('should filter logs by correlation ID', () => {
      const corrId1 = 'corr-1';
      const corrId2 = 'corr-2';

      logger.info('Message 1', corrId1);
      logger.info('Message 2', corrId2);
      logger.info('Message 3', corrId1);

      const logs1 = logger.getLogs(corrId1);
      const logs2 = logger.getLogs(corrId2);

      expect(logs1).toHaveLength(2);
      expect(logs2).toHaveLength(1);
    });
  });

  describe('Health Check System', () => {
    beforeEach(() => {
      // Reset global state
      vi.clearAllMocks();
    });

    it('should return health status for all models', () => {
      const healthStatus = getModelsHealthStatus();

      expect(Array.isArray(healthStatus)).toBe(true);
      expect(healthStatus.length).toBeGreaterThan(0);

      healthStatus.forEach(status => {
        expect(status).toHaveProperty('modelId');
        expect(status).toHaveProperty('isHealthy');
        expect(status).toHaveProperty('circuitBreakerStatus');
        expect(status).toHaveProperty('failureCount');
        expect(status).toHaveProperty('successRate');
        expect(status).toHaveProperty('averageResponseTime');
        expect(status).toHaveProperty('totalRequests');
      });
    });

    it('should return system health summary', () => {
      const summary = getSystemHealthSummary();

      expect(summary).toHaveProperty('overall');
      expect(summary).toHaveProperty('models');
      expect(summary.overall).toHaveProperty('status');
      expect(summary.overall).toHaveProperty('healthy_models');
      expect(summary.overall).toHaveProperty('total_models');
      expect(summary.overall).toHaveProperty('healthy_percentage');

      expect(['healthy', 'degraded', 'unhealthy']).toContain(summary.overall.status);
      expect(summary.overall.healthy_percentage).toBeGreaterThanOrEqual(0);
      expect(summary.overall.healthy_percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('Correlation ID Generation', () => {
    it('should generate IDs with correct format', () => {
      const id = generateCorrelationId();

      expect(id).toMatch(/^cv-\d+-[a-z0-9]+$/);
    });

    it('should generate unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateCorrelationId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('Error Type Coverage', () => {
    const errorTypes = Object.values(ConsensusErrorType);
    
    it('should have comprehensive error types', () => {
      expect(errorTypes).toContain('TIMEOUT');
      expect(errorTypes).toContain('API_ERROR');
      expect(errorTypes).toContain('GATEWAY_ERROR');
      expect(errorTypes).toContain('RATE_LIMIT');
      expect(errorTypes).toContain('NETWORK_ERROR');
      expect(errorTypes).toContain('MISSING_API_KEY');
    });

    it('should handle all error types in user-facing conversion', () => {
      errorTypes.forEach(errorType => {
        const error = new ConsensusError('Test', errorType, 'test-model');
        const userError = createUserFacingError(error);

        expect(userError).toBeDefined();
        expect(userError.type).toBeDefined();
        expect(userError.message).toBeDefined();
        expect(userError.severity).toBeDefined();
        expect(userError.retryable).toBeDefined();
      });
    });
  });
});