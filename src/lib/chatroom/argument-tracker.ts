/**
 * Argument Tracker for Anti-Repetition
 * CVAULT-208: Tracks key arguments and phrases to prevent repetition in persona responses
 */

import { ChatMessage } from './types';

// Threshold for considering an argument "covered" (similarity score)
// CVAULT-208: Lowered from 0.7 to 0.55 for stricter repetition detection
const SIMILARITY_THRESHOLD = 0.55;

// Maximum number of covered topics to track
const MAX_COVERED_TOPICS = 10;

// Maximum length of argument fingerprint
const MAX_FINGERPRINT_LENGTH = 150;

/**
 * Extract key arguments and phrases from recent messages
 */
export interface CoveredTopic {
  id: string;
  content: string;
  fingerprint: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  speakers: string[];
  timestamp: number;
  confidence: number;
}

/**
 * Track arguments that have been covered in recent conversation
 */
export class ArgumentTracker {
  private coveredTopics: Map<string, CoveredTopic> = new Map();

  /**
   * Add a message's key arguments to the tracker
   */
  addMessage(message: ChatMessage): void {
    const extractedArguments = this.extractKeyArguments(message.content);

    extractedArguments.forEach(arg => {
      const fingerprint = this.generateFingerprint(arg);
      const existing = Array.from(this.coveredTopics.values())
        .find(topic => this.calculateSimilarity(topic.fingerprint, fingerprint) > SIMILARITY_THRESHOLD);

      if (existing) {
        // Update existing topic
        existing.speakers.push(message.personaId);
        existing.timestamp = message.timestamp;
        if (message.confidence && message.confidence > existing.confidence) {
          existing.confidence = message.confidence;
        }
      } else {
        // Add new topic
        const topic: CoveredTopic = {
          id: `topic_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          content: arg,
          fingerprint,
          sentiment: message.sentiment || 'neutral',
          speakers: [message.personaId],
          timestamp: message.timestamp,
          confidence: message.confidence || 50,
        };
        this.coveredTopics.set(topic.id, topic);
      }
    });

    // Clean up old topics if we have too many
    this.cleanupOldTopics();
  }

  /**
   * Get recently covered topics for anti-repetition prompts
   */
  getCoveredTopics(limit: number = 5): CoveredTopic[] {
    const topics = Array.from(this.coveredTopics.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
    
    return topics;
  }

  /**
   * Get topics by sentiment for targeted anti-repetition
   */
  getCoveredTopicsBySentiment(sentiment: 'bullish' | 'bearish' | 'neutral'): CoveredTopic[] {
    return Array.from(this.coveredTopics.values())
      .filter(topic => topic.sentiment === sentiment)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 3);
  }

  /**
   * Check if new content is too similar to recent topics
   */
  isRepetitive(newContent: string): boolean {
    const newFingerprint = this.generateFingerprint(newContent);
    
    return Array.from(this.coveredTopics.values()).some(topic =>
      this.calculateSimilarity(topic.fingerprint, newFingerprint) > SIMILARITY_THRESHOLD
    );
  }

  /**
   * Extract key arguments from message content
   */
  private extractKeyArguments(content: string): string[] {
    const extractedArgs: string[] = [];
    
    // Remove sentiment tags
    let cleanContent = content.replace(/\[SENTIMENT:[^\]]+\]/gi, '').trim();
    
    // Split by sentence and take meaningful ones
    const sentences = cleanContent.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
    
    for (const sentence of sentences) {
      // Look for data-backed statements
      if (this.containsMarketData(sentence)) {
        extractedArgs.push(sentence);
      }
      // Look for opinion statements with conviction
      else if (this.containsConviction(sentence)) {
        extractedArgs.push(sentence);
      }
    }

    return extractedArgs.slice(0, 3); // Max 3 arguments per message
  }

  /**
   * Check if content contains market data
   */
  private containsMarketData(content: string): boolean {
    const dataPatterns = [
      /\d+%/,           // Percentages
      /\$[\d,]+/,      // Dollar amounts
      /\d+\s*(k|m|b)/i, // Large numbers
      /volume.*\$?[\d,]+/i, // Volume mentions
      /market.*cap.*\$?[\d,]+/i, // Market cap
      /\d+h|\d+d/i,     // Timeframes
      /support|resistance|breakout|breakdown/i, // Technical terms
    ];
    
    return dataPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Check if content contains conviction/strong opinion
   */
  private containsConviction(content: string): boolean {
    const convictionPatterns = [
      /will|going to|definitely|certainly|absolutely/i,
      /should|must|need to/i,
      /obvious|clear|evident/i,
      /strong|weak|bullish|bearish/i,
      /\d+% (confident|sure|certain)/i,
    ];
    
    return convictionPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Generate a fingerprint for similarity comparison
   */
  private generateFingerprint(content: string): string {
    // Remove common words and normalize
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
      'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
    ]);
    
    // Extract key terms
    const words = content.toLowerCase()
      .replace(/[^\w\s$%]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 10); // Max 10 key words
    
    return words.sort().join(' ');
  }

  /**
   * Calculate similarity between two fingerprints (0-1)
   */
  private calculateSimilarity(fingerprint1: string, fingerprint2: string): number {
    const words1 = new Set(fingerprint1.split(' ').filter(w => w.length > 0));
    const words2 = new Set(fingerprint2.split(' ').filter(w => w.length > 0));
    
    if (words1.size === 0 && words2.size === 0) return 1;
    if (words1.size === 0 || words2.size === 0) return 0;
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Clean up old topics to prevent memory bloat
   */
  private cleanupOldTopics(): void {
    if (this.coveredTopics.size <= MAX_COVERED_TOPICS) return;
    
    const topics = Array.from(this.coveredTopics.entries())
      .sort((a, b) => b[1].timestamp - a[1].timestamp);
    
    // Keep the most recent topics
    const toKeep = topics.slice(0, MAX_COVERED_TOPICS);
    this.coveredTopics = new Map(toKeep);
  }

  /**
   * Format covered topics for prompt inclusion
   */
  formatForPrompt(): string {
    const topics = this.getCoveredTopics(5);

    if (topics.length === 0) return '';

    let result = '\n\n=== DO NOT REPEAT - ALREADY SAID ===\n';
    result += 'These arguments were JUST MADE. DO NOT rehash them:\n\n';

    topics.forEach((topic, index) => {
      const speakers = [...new Set(topic.speakers)].join(', ').slice(0, 30);
      result += `❌ "${topic.content}"\n`;
      result += `   (Already said by ${speakers})\n\n`;
    });

    result += '🚫 STRICT RULE: Do NOT repeat these. Say something COMPLETELY DIFFERENT.\n';
    result += 'Bring fresh data, new angles, or challenge these with different evidence.\n';

    return result;
  }
}

/**
 * Create anti-repetition prompt section
 */
export function buildAntiRepetitionSection(tracker: ArgumentTracker, personaSentiment?: 'bullish' | 'bearish' | 'neutral'): string {
  if (personaSentiment) {
    // Get topics from same sentiment side
    const topics = tracker.getCoveredTopicsBySentiment(personaSentiment);

    if (topics.length === 0) return '';

    let result = '\n\n🚫 === FORBIDDEN: THESE ' + personaSentiment.toUpperCase() + ' ARGUMENTS ALREADY MADE ===\n';
    result += `DO NOT repeat these ${personaSentiment} points. They were JUST SAID:\n\n`;

    topics.forEach((topic, index) => {
      result += `❌ ${index + 1}. "${topic.content}"\n`;
    });

    result += '\n⚠️ MANDATORY REQUIREMENT: ';
    result += 'Say something COMPLETELY DIFFERENT from the above. ';
    result += 'Bring NEW data, DIFFERENT technical levels, FRESH reasoning, or COUNTER these with unique evidence. ';
    result += 'Do NOT rehash, reframe, or reword these same points. ';
    result += 'Your response MUST add distinct new information.\n';

    return result;
  }

  return tracker.formatForPrompt();
}