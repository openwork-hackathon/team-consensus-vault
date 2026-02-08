/**
 * Enhanced error types for Chatroom engine
 * Similar to consensus-engine.ts but adapted for chatroom use case
 */

import type { UserFacingError, ProgressUpdate } from '../types';

// Error types specific to chatroom
export enum ChatroomErrorType {
  TIMEOUT = 'TIMEOUT',
  API_ERROR = 'API_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  MISSING_API_KEY = 'MISSING_API_KEY',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  MODERATOR_FAILED = 'MODERATOR_FAILED',
}

export class ChatroomError extends Error {
  constructor(
    message: string,
    public type: ChatroomErrorType,
    public personaId?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ChatroomError';
  }
}

/**
 * Create user-facing error for chatroom errors
 */
export function createUserFacingError(error: ChatroomError): UserFacingError {
  const { type, message, personaId, originalError } = error;
  
  switch (type) {
    case ChatroomErrorType.RATE_LIMIT:
      return {
        type: 'rate_limit',
        message: 'Rate limit exceeded - this AI is taking a break',
        severity: 'warning',
        recoveryGuidance: 'The AI will be available again shortly. Other AI personalities will continue the debate.',
        retryable: true,
        modelId: personaId,
        estimatedWaitTime: 30000, // 30 seconds
      };
      
    case ChatroomErrorType.TIMEOUT:
      return {
        type: 'timeout',
        message: 'This AI is taking longer than expected to respond',
        severity: 'warning',
        recoveryGuidance: 'The AI may be experiencing high load. The conversation will continue with other participants.',
        retryable: true,
        modelId: personaId,
      };
      
    case ChatroomErrorType.NETWORK_ERROR:
      return {
        type: 'network',
        message: 'Connection issue with this AI',
        severity: 'warning',
        recoveryGuidance: 'Network connectivity issue. The AI will rejoin when connection is restored.',
        retryable: true,
        modelId: personaId,
      };
      
    case ChatroomErrorType.MISSING_API_KEY:
      return {
        type: 'configuration',
        message: 'AI service temporarily unavailable',
        severity: 'critical',
        recoveryGuidance: 'This is a server configuration issue. Other AI personalities will continue the discussion.',
        retryable: false,
        modelId: personaId,
      };
      
    case ChatroomErrorType.PARSE_ERROR:
    case ChatroomErrorType.INVALID_RESPONSE:
      return {
        type: 'parse_error',
        message: 'This AI sent an unclear response',
        severity: 'warning',
        recoveryGuidance: 'The AI will try again in the next message. This usually resolves automatically.',
        retryable: true,
        modelId: personaId,
      };
      
    case ChatroomErrorType.MODERATOR_FAILED:
      return {
        type: 'moderator_error',
        message: 'Speaker selection system experiencing issues',
        severity: 'warning',
        recoveryGuidance: 'Using random speaker selection until the moderator recovers.',
        retryable: true,
      };
      
    case ChatroomErrorType.API_ERROR:
    default:
      // Check for quota/billing issues
      if (originalError && typeof originalError === 'object' && 'message' in originalError) {
        const errorMsg = (originalError as { message?: string }).message || '';
        if (errorMsg.includes('quota') || errorMsg.includes('billing')) {
          return {
            type: 'quota_exceeded',
            message: 'AI service quota exceeded',
            severity: 'critical',
            recoveryGuidance: 'This AI is temporarily unavailable. Other personalities will continue the debate.',
            retryable: false,
            modelId: personaId,
          };
        }
      }
      return {
        type: 'api_error',
        message: 'AI service temporarily unavailable',
        severity: 'warning',
        recoveryGuidance: 'This AI is experiencing issues. The conversation will continue with other participants.',
        retryable: true,
        modelId: personaId,
      };
  }
}

/**
 * Create progress update for slow AI responses
 */
export function createProgressUpdate(
  personaId: string, 
  elapsedTime: number, 
  message?: string
): ProgressUpdate {
  const isSlow = elapsedTime > 15000; // 15 seconds
  const estimatedRemaining = elapsedTime * 0.5; // Rough estimate
  
  return {
    modelId: personaId,
    status: isSlow ? 'slow' : 'processing',
    message: message || (isSlow ? 'Taking longer than expected...' : 'Thinking...'),
    elapsedTime,
    estimatedRemainingTime: estimatedRemaining,
  };
}
