import { NextRequest } from 'next/server';
import {
  getMessages,
  getRollingHistory,
  appendMessage,
  getState,
  setState,
  acquireLock,
  releaseLock,
  getMessageIndex,
  initializeIfEmpty,
  getPersuasionStates,
  setPersuasionStates,
  saveDebateSummary,
  clearDebateSummary,
  getDebateHistory,
  saveConsensusSnapshot,
  getConsensusSnapshots,
  cleanupRollingHistory,
} from '@/lib/chatroom/kv-store';
import { extractDebateSummary } from '@/lib/chatroom/argument-extractor';
import {
  generateNextMessageEnhanced,
  initializeEnhancedState,
} from '@/lib/chatroom/chatroom-engine-enhanced';
import { PERSONAS_BY_ID } from '@/lib/chatroom/personas';
import { ChatRoomState, ConsensusSnapshot, MessageSentiment } from '@/lib/chatroom/types';
import { precomputeTypingDuration } from '@/lib/chatroom/typing-duration';

// Message interval ranges (ms)
const DEBATE_INTERVAL_MIN = 60_000;  // 60s
const DEBATE_INTERVAL_MAX = 90_000;  // 90s
const COOLDOWN_INTERVAL_MIN = 120_000; // 120s
const COOLDOWN_INTERVAL_MAX = 180_000; // 180s
const POLL_INTERVAL = 5_000;  // 5s poll for messages from other generators
const KEEPALIVE_INTERVAL = 15_000; // 15s

function randomInterval(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Helper to determine primary stance from array of sentiments for consensus snapshot
 */
function getPrimaryStanceForSnapshot(sentiments: MessageSentiment[]): MessageSentiment {
  if (sentiments.length === 0) return 'neutral';
  const counts = { bullish: 0, bearish: 0, neutral: 0 };
  for (const s of sentiments) {
    counts[s]++;
  }
  if (counts.bullish > counts.bearish && counts.bullish > counts.neutral) return 'bullish';
  if (counts.bearish > counts.bullish && counts.bearish > counts.neutral) return 'bearish';
  return 'neutral';
}

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  const lockId = `sse_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const connectionStartTime = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (eventType: string, data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // Controller closed
        }
      };

      const sendKeepalive = () => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          // Controller closed
        }
      };

      // Initialize state if first connection ever
      await initializeIfEmpty();

      // Track connection establishment time
      const connectionEstablishmentTime = Date.now() - connectionStartTime;

      // Send connection confirmation with timing metrics
      send('connected', {
        timestamp: Date.now(),
        connectionTimeMs: connectionEstablishmentTime
      });

      // CVAULT-217: Use rolling history (1-hour window) for initial load
      // This ensures clients only see messages from the last hour
      const history = await getRollingHistory();
      const state = await getState();
      
      // CVAULT-217: Also fetch consensus snapshots for historical context
      const consensusSnapshots = await getConsensusSnapshots();
      
      send('history', { 
        messages: history, 
        phase: state.phase, 
        cooldownEndsAt: state.cooldownEndsAt,
        consensusSnapshots: consensusSnapshots.slice(-5), // Send last 5 snapshots
      });

      // Send current consensus if any
      if (state.consensusDirection !== null) {
        send('consensus_update', {
          direction: state.consensusDirection,
          strength: state.consensusStrength,
        });
      }

      // Send typing indicator if next speaker is pre-selected
      // CVAULT-178: Include estimated typing duration based on persona
      if (state.nextSpeakerId) {
        const nextPersona = PERSONAS_BY_ID[state.nextSpeakerId];
        if (nextPersona) {
          const typingConfig = precomputeTypingDuration(nextPersona);
          send('typing', {
            id: nextPersona.id,
            handle: nextPersona.handle,
            avatar: nextPersona.avatar,
            durationMs: typingConfig.durationMs,
            expectedLength: typingConfig.charCount,
          });
        }
      }

      // Keepalive interval
      const keepaliveTimer = setInterval(sendKeepalive, KEEPALIVE_INTERVAL);

      // Track last known message index for change detection
      let lastKnownIndex = await getMessageIndex();

      // CVAULT-217: Track last cleanup time for periodic rolling history cleanup
      let lastCleanupTime = Date.now();
      
      // Main loop
      const runLoop = async () => {
        while (!request.signal.aborted) {
          const currentState = await getState();
          const now = Date.now();
          
          // CVAULT-217: Periodic cleanup of rolling history (every 5 minutes)
          if (now - lastCleanupTime >= 5 * 60 * 1000) {
            try {
              const cleanupResult = await cleanupRollingHistory();
              if (cleanupResult.removed > 0) {
                console.log(`[CVAULT-217] Periodic cleanup: removed ${cleanupResult.removed} old messages`);
              }
              lastCleanupTime = now;
            } catch (cleanupError) {
              console.error('[CVAULT-217] Error during periodic cleanup:', cleanupError);
            }
          }

          // Determine interval based on phase
          const isDebate = currentState.phase === 'DEBATE' || currentState.phase === 'CONSENSUS';
          const interval = isDebate
            ? randomInterval(DEBATE_INTERVAL_MIN, DEBATE_INTERVAL_MAX)
            : randomInterval(COOLDOWN_INTERVAL_MIN, COOLDOWN_INTERVAL_MAX);

          const timeSinceLastMessage = now - (currentState.lastMessageAt || 0);
          const messageDue = timeSinceLastMessage >= interval || currentState.messageCount === 0;

          if (messageDue) {
            // Try to acquire lock for generation
            const gotLock = await acquireLock(lockId);

            if (gotLock) {
              try {
                // Re-verify state after acquiring lock (prevent duplicate generation)
                const freshState = await getState();
                const freshNow = Date.now();
                const freshTimeSince = freshNow - (freshState.lastMessageAt || 0);
                const minInterval = isDebate ? DEBATE_INTERVAL_MIN * 0.8 : COOLDOWN_INTERVAL_MIN * 0.8;

                if (freshTimeSince >= minInterval || freshState.messageCount === 0) {
                  // Send typing indicator with duration
                  // CVAULT-178: Calculate realistic typing duration based on persona and expected message length
                  const nextId = freshState.nextSpeakerId;
                  let typingDurationMs = 2000; // Default fallback
                  
                  if (nextId) {
                    const persona = PERSONAS_BY_ID[nextId];
                    if (persona) {
                      const typingConfig = precomputeTypingDuration(persona);
                      typingDurationMs = typingConfig.durationMs;
                      
                      send('typing', {
                        id: persona.id,
                        handle: persona.handle,
                        avatar: persona.avatar,
                        durationMs: typingConfig.durationMs,
                        expectedLength: typingConfig.charCount,
                      });
                    }
                  }

                  // CVAULT-217: Use rolling history for context (messages within 1-hour window)
                  // This ensures the engine only considers recent, relevant context
                  const currentHistory = await getRollingHistory();

                  // Load persuasion states
                  const savedPersuasionStates = await getPersuasionStates();

                  // Build enhanced state
                  const enhancedState = initializeEnhancedState();
                  Object.assign(enhancedState, freshState);

                  // Restore persuasion states
                  if (Object.keys(savedPersuasionStates).length > 0) {
                    for (const [personaId, pState] of Object.entries(savedPersuasionStates)) {
                      enhancedState.persuasionStore.updateState(personaId, {
                        personaId,
                        currentStance: pState.currentStance,
                        conviction: pState.convictionLevel,
                        convictionScore: pState.convictionScore,
                        stanceHistory: [{
                          stance: pState.currentStance,
                          conviction: pState.convictionScore,
                          timestamp: pState.lastStanceChangeAt || Date.now(),
                        }],
                        persuasionFactors: [],
                        lastUpdated: Date.now(),
                      });
                    }
                  }

                  let result;

                  try {
                    // CVAULT-185: Call enhanced engine with BTC market data
                    result = await generateNextMessageEnhanced(currentHistory, enhancedState, 'BTC');

                    // Check if this is a system message (empty content) indicating cooldown
                    if (result.message.personaId === 'system' && !result.message.content) {
                      // Just update state, don't append empty message
                      await setState(result.state);

                      // Broadcast phase change if any
                      if (result.phaseChange) {
                        send('phase_change', {
                          from: result.phaseChange.from,
                          to: result.phaseChange.to,
                          cooldownEndsAt: result.state.cooldownEndsAt,
                        });
                      }

                      lastKnownIndex = await getMessageIndex();
                      return; // Skip normal message flow
                    }

                    // CVAULT-184: Check for skipped messages (silent persona failures)
                    // Don't append or broadcast skipped messages - just update state
                    if ((result.message as any).skipped) {
                      await setState(result.state);
                      lastKnownIndex = await getMessageIndex();
                      return; // Skip normal message flow
                    }

                  } catch (genError) {
                    // This should rarely happen since enhanced engine handles errors internally
                    console.error('[chatroom-stream] Unexpected generation error (should be rare):', {
                      error: genError instanceof Error ? genError.message : String(genError),
                      timestamp: new Date().toISOString(),
                    });

                    // Release lock and continue to next iteration WITHOUT sending error to frontend
                    continue;
                  }

                  // CVAULT-178: Wait for typing duration before showing message
                  // This simulates the persona "typing" the message
                  const elapsedSinceTyping = Date.now() - freshNow;
                  const remainingTypingTime = Math.max(0, typingDurationMs - elapsedSinceTyping);
                  
                  if (remainingTypingTime > 0 && !request.signal.aborted) {
                    await new Promise(r => setTimeout(r, remainingTypingTime));
                  }
                  
                  // Check if connection is still alive before broadcasting
                  if (request.signal.aborted) {
                    return;
                  }

                  // CVAULT-185: Save persuasion states
                  const newPersuasionStates: Record<string, any> = {};
                  const allStates = result.state.persuasionStore.getAllStates();
                  for (const [personaId, pState] of Object.entries(allStates)) {
                    newPersuasionStates[personaId] = {
                      currentStance: pState.currentStance,
                      convictionLevel: pState.conviction,
                      convictionScore: pState.convictionScore,
                      stanceChanges: Math.max(0, pState.stanceHistory.length - 1),
                      lastStanceChangeAt: pState.stanceHistory[pState.stanceHistory.length - 1]?.timestamp,
                    };
                  }
                  await setPersuasionStates(newPersuasionStates);

                  // Store message and state
                  await appendMessage(result.message);

                  // Convert enhanced state to basic state for storage
                  const basicState: ChatRoomState = {
                    ...result.state,
                    phase: result.state.phase,
                    cooldownEndsAt: result.state.cooldownEndsAt,
                    consensusDirection: result.state.consensusDirection,
                    consensusStrength: result.state.consensusStrength,
                    lastMessageAt: result.state.lastMessageAt,
                    messageCount: result.state.messageCount,
                    nextSpeakerId: result.state.nextSpeakerId,
                  };
                  await setState(basicState);

                  // Broadcast message
                  send('message', result.message);

                  // CVAULT-185: Broadcast stance change if it occurred
                  if (result.stanceChanged && result.previousStance) {
                    send('stance_change', {
                      personaId: result.message.personaId,
                      handle: result.message.handle,
                      from: result.previousStance,
                      to: result.persuasionState.currentStance,
                      convictionScore: result.persuasionState.convictionScore,
                    });
                  }

                  // CVAULT-190: Capture debate summary when consensus is reached
                  // CVAULT-217: Also create a persistent consensus snapshot
                  if (result.phaseChange?.to === 'CONSENSUS' && result.consensusUpdate) {
                    try {
                      const debateHistory = await getMessages();
                      const persuasionStates = result.state.persuasionStore.getAllStates();
                      const debateHistorySummaries = await getDebateHistory();
                      const roundNumber = debateHistorySummaries.length + 1;
                      
                      const summary = extractDebateSummary(
                        debateHistory,
                        persuasionStates,
                        roundNumber,
                        result.consensusUpdate.direction || 'neutral',
                        result.consensusUpdate.strength
                      );
                      
                      await saveDebateSummary(summary);
                      console.log(`[CVAULT-190] Debate summary captured for round ${roundNumber}: ${summary.consensusDirection} @ ${summary.consensusStrength}%`);
                      
                      // CVAULT-217: Create persistent consensus snapshot
                      // This snapshot will persist even after messages are pruned
                      const personaContributions: Record<string, {
                        personaId: string;
                        handle: string;
                        messageCount: number;
                        sentiments: MessageSentiment[];
                        keyPoints: string[];
                      }> = {};
                      
                      for (const msg of debateHistory) {
                        if (!personaContributions[msg.personaId]) {
                          personaContributions[msg.personaId] = {
                            personaId: msg.personaId,
                            handle: msg.handle,
                            messageCount: 0,
                            sentiments: [],
                            keyPoints: [],
                          };
                        }
                        personaContributions[msg.personaId].messageCount++;
                        if (msg.sentiment) {
                          personaContributions[msg.personaId].sentiments.push(msg.sentiment);
                        }
                        const firstSentence = msg.content.split(/[.!?]/)[0]?.trim();
                        if (firstSentence && firstSentence.length > 10) {
                          personaContributions[msg.personaId].keyPoints.push(firstSentence);
                        }
                      }
                      
                      const topPersonaContributions = Object.values(personaContributions)
                        .map(pc => ({
                          personaId: pc.personaId,
                          handle: pc.handle,
                          messageCount: pc.messageCount,
                          primaryStance: getPrimaryStanceForSnapshot(pc.sentiments),
                          keyPoints: pc.keyPoints.slice(0, 3),
                        }))
                        .sort((a, b) => b.messageCount - a.messageCount)
                        .slice(0, 5);
                      
                      const consensusSnapshot: ConsensusSnapshot = {
                        id: `consensus_${Date.now()}_${roundNumber}`,
                        timestamp: Date.now(),
                        timestampRange: {
                          start: debateHistory.length > 0 ? debateHistory[0].timestamp : Date.now(),
                          end: debateHistory.length > 0 ? debateHistory[debateHistory.length - 1].timestamp : Date.now(),
                        },
                        consensusDirection: result.consensusUpdate.direction || 'neutral',
                        consensusStrength: result.consensusUpdate.strength,
                        keyArgumentsSummary: {
                          bullish: summary.keyBullishArguments.slice(0, 5),
                          bearish: summary.keyBearishArguments.slice(0, 5),
                          neutral: [],
                        },
                        topPersonaContributions,
                        messageCount: debateHistory.length,
                        snapshotReason: 'consensus_reached',
                      };
                      
                      await saveConsensusSnapshot(consensusSnapshot);
                      
                      // Broadcast the new snapshot to all connected clients
                      send('consensus_snapshot', consensusSnapshot);
                      
                      console.log(`[CVAULT-217] Consensus snapshot created: ${consensusSnapshot.consensusDirection} @ ${consensusSnapshot.consensusStrength}%`);
                    } catch (summaryError) {
                      // Non-blocking: log error but don't break consensus flow
                      console.error('[CVAULT-190/217] Failed to capture debate summary or consensus snapshot:', summaryError);
                    }
                  }
                  
                  // CVAULT-190: Clear debate summary when starting new debate round
                  if (result.phaseChange?.from === 'COOLDOWN' && result.phaseChange?.to === 'DEBATE') {
                    try {
                      await clearDebateSummary();
                    } catch (clearError) {
                      console.error('[CVAULT-190] Failed to clear debate summary:', clearError);
                    }
                  }

                  // Broadcast phase change if any
                  if (result.phaseChange) {
                    send('phase_change', {
                      from: result.phaseChange.from,
                      to: result.phaseChange.to,
                      cooldownEndsAt: result.state.cooldownEndsAt,
                    });
                  }

                  // Broadcast consensus update if any
                  if (result.consensusUpdate) {
                    send('consensus_update', result.consensusUpdate);
                  }

                  // Send next typing indicator
                  // CVAULT-178: Include typing duration for next speaker
                  if (result.state.nextSpeakerId) {
                    const nextPersona = PERSONAS_BY_ID[result.state.nextSpeakerId];
                    if (nextPersona) {
                      // Delay typing indicator slightly for realism
                      await new Promise(r => setTimeout(r, 2000));
                      if (!request.signal.aborted) {
                        const nextTypingConfig = precomputeTypingDuration(nextPersona);
                        send('typing', {
                          id: nextPersona.id,
                          handle: nextPersona.handle,
                          avatar: nextPersona.avatar,
                          durationMs: nextTypingConfig.durationMs,
                          expectedLength: nextTypingConfig.charCount,
                        });
                      }
                    }
                  }

                  lastKnownIndex = await getMessageIndex();
                }
              } catch (error) {
                // CVAULT-184: Log errors internally but NEVER send to frontend
                console.error('[chatroom-stream] Loop error (logged only, not sent to client):', {
                  error: error instanceof Error ? error.message : String(error),
                  timestamp: new Date().toISOString(),
                });
              } finally {
                await releaseLock(lockId);
              }
            } else {
              // Another connection is generating — poll for new messages
              await pollForNewMessages(send, lastKnownIndex, request.signal);
              lastKnownIndex = await getMessageIndex();
            }
          } else {
            // Not time for a new message yet — poll for messages from other generators
            const newIndex = await getMessageIndex();
            if (newIndex > lastKnownIndex) {
              await pollForNewMessages(send, lastKnownIndex, request.signal);
              lastKnownIndex = newIndex;
            }
          }

          // Wait before next iteration
          if (!request.signal.aborted) {
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
          }
        }
      };

      runLoop().catch(err => {
        console.error('[chatroom-stream] Loop error:', err);
      });

      // Cleanup on abort
      request.signal.addEventListener('abort', () => {
        clearInterval(keepaliveTimer);
        releaseLock(lockId).catch(() => {});
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

/**
 * Poll KV for messages that were added since lastKnownIndex
 * CVAULT-217: Uses rolling history to only send recent messages
 */
async function pollForNewMessages(
  send: (eventType: string, data: unknown) => void,
  lastKnownIndex: number,
  signal: AbortSignal
) {
  if (signal.aborted) return;

  try {
    // CVAULT-217: Use rolling history to get only recent messages
    const messages = await getRollingHistory();
    const state = await getState();

    // Send the latest messages that the client might not have
    // We use the index difference to know how many new messages there are
    const currentIndex = await getMessageIndex();
    const newCount = currentIndex - lastKnownIndex;

    if (newCount > 0 && messages.length > 0) {
      const newMessages = messages.slice(-Math.min(newCount, messages.length));
      for (const msg of newMessages) {
        if (!signal.aborted) {
          send('message', msg);
        }
      }
    }

    // Also send latest state
    if (!signal.aborted) {
      send('consensus_update', {
        direction: state.consensusDirection,
        strength: state.consensusStrength,
      });
    }
  } catch (error) {
    console.error('[chatroom-stream] Poll error:', error);
  }
}
