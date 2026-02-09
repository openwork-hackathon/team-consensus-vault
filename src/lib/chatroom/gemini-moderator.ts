// CVAULT-188: Gemini-powered async post-moderation
import { ModerationResult, ViolationType, ModerationStatus } from './types';

interface GeminiModerationResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

// Community guidelines prompt for Gemini
const MODERATION_PROMPT = `You are a content moderation AI. Analyze the following message and determine if it violates community guidelines.

Message to analyze: "{message}"

Evaluate for these violations:
- spam: repetitive, promotional, or unsolicited content
- hate_speech: attacks based on race, religion, gender, nationality, etc.
- harassment: targeted personal attacks or bullying
- manipulation: deceptive or misleading information designed to influence
- inappropriate_content: sexual, violent, or otherwise inappropriate material

Respond with ONLY a valid JSON object in this exact format:
{
  "status": "approved" | "flagged" | "removed",
  "violations": ["violation_type1", "violation_type2"],
  "confidence": 85,
  "reasoning": "Brief explanation of the decision"
}

Rules:
- "approved" = no violations found
- "flagged" = minor violations, message should be flagged but visible
- "removed" = severe violations, message should be hidden
- confidence should be 0-100
- violations array should only include types that apply
- reasoning should be concise but clear`;

export class GeminiModerator {
  private apiKeys: string[];
  private currentKeyIndex = 0;
  private isConfigured = false;

  constructor() {
    this.apiKeys = [];
    this.initialize();
  }

  private async initialize() {
    try {
      // In server-side context, read from environment or file system
      // In browser context, keys should be provided via env vars or API

      // Try to load from environment first (best practice for Vercel)
      const envKeys = [
        process.env.GEMINI_API_KEY_1,
        process.env.GEMINI_API_KEY_2,
        process.env.GEMINI_API_KEY_3,
        process.env.GEMINI_API_KEY_4,
      ].filter(k => k && k.startsWith('AIza'));

      if (envKeys.length > 0) {
        this.apiKeys = envKeys as string[];
        this.isConfigured = true;
        console.log(`[GeminiModerator] Initialized with ${this.apiKeys.length} API keys from environment`);
        return;
      }

      // Fallback: try to load from filesystem (Node.js context only)
      if (typeof window === 'undefined') {
        try {
          const fs = await import('fs/promises');
          const path = await import('path');
          const credentialsPath = path.join(process.env.HOME || '/home/shazbot', 'credentials', 'gemini-api-keys.txt');
          const text = await fs.readFile(credentialsPath, 'utf-8');
          const keys = text
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#') && line.startsWith('AIza'));

          this.apiKeys = keys;
          this.isConfigured = this.apiKeys.length > 0;

          if (this.isConfigured) {
            console.log(`[GeminiModerator] Initialized with ${this.apiKeys.length} API keys from file`);
          } else {
            console.warn('[GeminiModerator] No valid API keys found in file');
          }
        } catch (fsError) {
          console.warn('[GeminiModerator] Could not load API keys from filesystem:', fsError);
        }
      } else {
        console.warn('[GeminiModerator] No API keys available (browser context)');
      }
    } catch (error) {
      console.error('[GeminiModerator] Failed to initialize:', error);
    }
  }

  private getNextApiKey(): string | null {
    if (this.apiKeys.length === 0) return null;
    
    const key = this.apiKeys[this.currentKeyIndex];
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    return key;
  }

  /**
   * Moderate a message using Gemini API
   * This is async and non-blocking for message posting
   */
  async moderateMessage(content: string): Promise<ModerationResult> {
    if (!this.isConfigured) {
      console.warn('[GeminiModerator] Not configured, skipping moderation');
      return {
        status: 'approved',
        violations: [],
        confidence: 0,
        reasoning: 'Moderation system not configured'
      };
    }

    const apiKey = this.getNextApiKey();
    if (!apiKey) {
      console.warn('[GeminiModerator] No API key available');
      return {
        status: 'approved',
        violations: [],
        confidence: 0,
        reasoning: 'No API key available'
      };
    }

    try {
      const prompt = MODERATION_PROMPT.replace('{message}', content);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 500,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data: GeminiModerationResponse = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini');
      }

      const responseText = data.candidates[0].content.parts[0].text.trim();
      
      // Parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format from Gemini');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and normalize the response
      const result: ModerationResult = {
        status: this.normalizeStatus(parsed.status),
        violations: this.validateViolations(parsed.violations || []),
        confidence: Math.max(0, Math.min(100, parsed.confidence || 0)),
        reasoning: parsed.reasoning || 'No reasoning provided',
        flaggedAt: Date.now()
      };

      console.log(`[GeminiModerator] Moderated message: ${result.status} (${result.violations.length} violations)`);
      return result;

    } catch (error) {
      console.error('[GeminiModerator] Error moderating message:', error);
      
      // Return a safe default on error
      return {
        status: 'approved',
        violations: [],
        confidence: 0,
        reasoning: `Moderation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private normalizeStatus(status: string): ModerationStatus {
    const validStatuses: ModerationStatus[] = ['approved', 'flagged', 'removed'];
    return validStatuses.includes(status as ModerationStatus) 
      ? status as ModerationStatus 
      : 'approved';
  }

  private validateViolations(violations: any[]): ViolationType[] {
    const validViolations: ViolationType[] = ['spam', 'hate_speech', 'harassment', 'manipulation', 'inappropriate_content', 'other'];
    return violations
      .filter(v => validViolations.includes(v as ViolationType))
      .map(v => v as ViolationType);
  }

  /**
   * Check if user is allowed to post based on moderation status
   */
  isUserAllowedToPost(userId: string | undefined, moderationStore: any): { allowed: boolean; reason?: string } {
    if (!userId) {
      // AI personas can always post
      return { allowed: true };
    }

    // Check if user is banned
    if (moderationStore.bannedUsers[userId]) {
      const ban = moderationStore.bannedUsers[userId];
      return { 
        allowed: false, 
        reason: `User is banned: ${ban.reason}` 
      };
    }

    // Check if user is muted
    if (moderationStore.mutedUsers[userId]) {
      const mute = moderationStore.mutedUsers[userId];
      
      // Check if mute is permanent or still active
      if (mute.mutedUntil === null || mute.mutedUntil > Date.now()) {
        return { 
          allowed: false, 
          reason: mute.mutedUntil === null 
            ? `User is permanently muted: ${mute.reason}`
            : `User is muted until ${new Date(mute.mutedUntil).toLocaleString()}: ${mute.reason}`
        };
      }
    }

    return { allowed: true };
  }
}

// Singleton instance
export const geminiModerator = new GeminiModerator();