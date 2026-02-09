/**
 * CVAULT-178: Typing indicator duration calculator
 * Simulates realistic human typing speed based on message length
 */

import { Persona } from './types';

// Base typing speed: 50-80ms per character (average human typing speed)
const BASE_MS_PER_CHAR_MIN = 50;
const BASE_MS_PER_CHAR_MAX = 80;

// Minimum and maximum duration caps
const MIN_DURATION_MS = 500;
const MAX_DURATION_MS = 8000;

// Variance factor for natural feel (±20%)
const VARIANCE_FACTOR = 0.2;

// Persona typing speed modifiers (some personas type faster/slower)
const PERSONA_SPEED_MODIFIERS: Record<string, number> = {
  // Fast typers (analytical, data-driven)
  'nxbl': 0.85,              // Cryptic minimalist - terse and fast
  '0xviv': 0.9,              // DeFi researcher - efficient
  'exchangeflow': 0.88,      // Data-driven, speaks in numbers
  'quantitative_quinn': 0.85, // Algo trader - fast with data
  'vol_surface': 0.9,        // Options nerd - precise and quick
  
  // Slow typers (more thoughtful, philosophical)
  'ozymandias': 1.15,        // Philosopher - measured
  'macromaven': 1.1,         // Conservative, thinks before typing
  'hodljenny': 1.2,          // Zen, unhurried
  'cycle_theorist': 1.1,     // Long-term thinker
  'just_a_plumber': 1.15,    // Folksy, takes time
  
  // Average typers (default 1.0)
  // Everyone else uses base speed
};

// Model-based speed modifiers (backup if persona not found)
const MODEL_SPEED_MODIFIERS: Record<string, number> = {
  'deepseek': 0.95,  // Technical, efficient
  'kimi': 1.0,       // Balanced
  'minimax': 1.05,   // Slightly more casual
  'glm': 1.0,        // Balanced
  'gemini': 1.0,     // Balanced
};

export interface TypingDurationConfig {
  durationMs: number;
  msPerChar: number;
  charCount: number;
  personaModifier: number;
}

/**
 * Calculate realistic typing duration for a message
 * 
 * @param content - The message content (or expected length)
 * @param persona - The persona typing (optional, for speed modifiers)
 * @returns Configuration object with duration and metadata
 */
export function calculateTypingDuration(
  content: string | number,
  persona?: Persona
): TypingDurationConfig {
  // Get character count (either from string or use provided number)
  const charCount = typeof content === 'string' ? content.length : content;
  
  // Get persona speed modifier
  let personaModifier = 1.0;
  if (persona) {
    personaModifier = PERSONA_SPEED_MODIFIERS[persona.id] ?? 
                      MODEL_SPEED_MODIFIERS[persona.modelId] ?? 
                      1.0;
  }
  
  // Calculate base ms per character with some randomness
  const baseMsPerChar = BASE_MS_PER_CHAR_MIN + 
    Math.random() * (BASE_MS_PER_CHAR_MAX - BASE_MS_PER_CHAR_MIN);
  
  // Apply persona modifier
  const msPerChar = baseMsPerChar * personaModifier;
  
  // Calculate base duration
  let durationMs = charCount * msPerChar;
  
  // Add variance for natural feel (±20% random variation)
  const variance = 1 + (Math.random() * 2 - 1) * VARIANCE_FACTOR;
  durationMs *= variance;
  
  // Apply caps
  durationMs = Math.max(MIN_DURATION_MS, Math.min(MAX_DURATION_MS, durationMs));
  
  // Round to nearest 100ms for cleaner numbers
  durationMs = Math.round(durationMs / 100) * 100;
  
  return {
    durationMs,
    msPerChar,
    charCount,
    personaModifier,
  };
}

/**
 * Calculate typing duration for a message of estimated length
 * Used when we don't know the exact message yet (predictive typing)
 * 
 * @param persona - The persona typing
 * @param minChars - Minimum expected characters
 * @param maxChars - Maximum expected characters
 * @returns Configuration object with duration and metadata
 */
export function estimateTypingDuration(
  persona?: Persona,
  minChars: number = 50,
  maxChars: number = 200
): TypingDurationConfig {
  // Use a random length within the expected range
  const estimatedLength = minChars + Math.random() * (maxChars - minChars);
  return calculateTypingDuration(Math.round(estimatedLength), persona);
}

/**
 * Get the expected message length range for a persona based on their style
 */
export function getPersonaMessageLengthRange(persona: Persona): { min: number; max: number } {
  // Most personas are configured for 2-4 sentences
  // Average sentence is ~15-25 words, average word is ~5 characters
  // So 2-4 sentences = 150-400 characters typically
  
  const ranges: Record<string, { min: number; max: number }> = {
    'nxbl': { min: 30, max: 80 },           // Very terse
    'chartsurgeon': { min: 100, max: 250 }, // Technical with numbers
    'just_a_plumber': { min: 120, max: 300 }, // Folksy stories
    'liquidation_larry': { min: 80, max: 200 }, // Direct
    'sats_stacker': { min: 80, max: 180 },  // Simple, consistent
    'ico_veteran': { min: 120, max: 280 },  // Skeptical commentary
    'wyckoff_wizard': { min: 100, max: 220 }, // Technical terms
    'uncle_bags': { min: 120, max: 280 },   // War stories
    '0xviv': { min: 120, max: 260 },        // Data-heavy
    'exchangeflow': { min: 80, max: 200 },  // Data points
    'nft_flipping_fiona': { min: 100, max: 220 }, // Sentiment analysis
    'regulatory_rick': { min: 120, max: 280 }, // Legal context
    'miner_mike': { min: 100, max: 220 },   // Technical mining
    'airdrop_hunter': { min: 100, max: 220 }, // Protocol info
    'moonvember': { min: 100, max: 240 },   // Enthusiastic
    'quantumrug': { min: 100, max: 240 },   // Cynical commentary
    'ser_fumbles': { min: 100, max: 260 },  // Self-deprecating
    'the_intern': { min: 80, max: 180 },    // Questions
    'meme_lord_marcus': { min: 100, max: 200 }, // Meme references
    'doomer_dave': { min: 100, max: 220 },  // Pessimistic
    'shill_detector': { min: 100, max: 240 }, // Exposés
    'ozymandias': { min: 140, max: 320 },   // Philosophical
    'gas_goblin': { min: 80, max: 180 },    // Quick observations
    'hodljenny': { min: 80, max: 180 },     // Zen simplicity
    'arb_sam': { min: 100, max: 220 },      // Arbitrage details
    'l2_maximalist': { min: 100, max: 220 }, // Technical
    'stablecoin_sophie': { min: 100, max: 220 }, // Stable analysis
    'bridge_brian': { min: 100, max: 240 }, // Cross-chain
    'macromaven': { min: 120, max: 280 },   // Macro context
    'panicsellpaul': { min: 120, max: 280 }, // Worried analysis
    'vol_surface': { min: 100, max: 200 },  // Options data
    'bag_lady_42': { min: 120, max: 280 },  // Contrarian views
    'etf_ernie': { min: 100, max: 220 },    // ETF data
    'asia_alice': { min: 100, max: 240 },   // Market context
    'cycle_theorist': { min: 100, max: 220 }, // Cycle analysis
  };
  
  return ranges[persona.id] ?? { min: 100, max: 250 };
}

/**
 * Pre-compute typing duration for the next message
 * This should be called when selecting the next speaker
 */
export function precomputeTypingDuration(persona: Persona): TypingDurationConfig {
  const lengthRange = getPersonaMessageLengthRange(persona);
  return estimateTypingDuration(persona, lengthRange.min, lengthRange.max);
}
