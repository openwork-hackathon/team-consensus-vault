import { NextRequest } from 'next/server';
import {
  getMessages,
  appendMessage,
  getState,
  setState,
  acquireLock,
  releaseLock,
  getMessageIndex,
  initializeIfEmpty,
} from '@/lib/chatroom/kv-store';
import { generateNextMessage } from '@/lib/chatroom/chatroom-engine';
import { PERSONAS_BY_ID } from '@/lib/chatroom/personas';

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

      // Load and send history
      const history = await getMessages();
      const state = await getState();
      send('history', { messages: history, phase: state.phase, cooldownEndsAt: state.cooldownEndsAt });

      // Send current consensus if any
      if (state.consensusDirection !== null) {
        send('consensus_update', {
          direction: state.consensusDirection,
          strength: state.consensusStrength,
        });
      }

      // Send typing indicator if next speaker is pre-selected
      if (state.nextSpeakerId) {
        const nextPersona = PERSONAS_BY_ID[state.nextSpeakerId];
        if (nextPersona) {
          send('typing', {
            id: nextPersona.id,
            handle: nextPersona.handle,
            avatar: nextPersona.avatar,
          });
        }
      }

      // Keepalive interval
      const keepaliveTimer = setInterval(sendKeepalive, KEEPALIVE_INTERVAL);

      // Track last known message index for change detection
      let lastKnownIndex = await getMessageIndex();

      // Main loop
      const runLoop = async () => {
        while (!request.signal.aborted) {
          const currentState = await getState();
          const now = Date.now();

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
                  // Send typing indicator
                  const nextId = freshState.nextSpeakerId;
                  if (nextId) {
                    const persona = PERSONAS_BY_ID[nextId];
                    if (persona) {
                      send('typing', {
                        id: persona.id,
                        handle: persona.handle,
                        avatar: persona.avatar,
                      });
                    }
                  }

                  // Generate message with error handling
                  const currentHistory = await getMessages();
                  let result;

                  try {
                    result = await generateNextMessage(currentHistory, freshState);
                  } catch (genError) {
                    // Log generation error but continue
                    console.error('[chatroom-stream] Message generation failed:', genError);

                    // Send error event to clients
                    send('generation_error', {
                      timestamp: Date.now(),
                      error: genError instanceof Error ? genError.message : 'Unknown generation error',
                    });

                    // Continue to next iteration without storing message
                    throw genError; // Re-throw to trigger finally block
                  }

                  // Store message and state
                  await appendMessage(result.message);
                  await setState(result.state);

                  // Broadcast message
                  send('message', result.message);

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
                  if (result.state.nextSpeakerId) {
                    const nextPersona = PERSONAS_BY_ID[result.state.nextSpeakerId];
                    if (nextPersona) {
                      // Delay typing indicator slightly for realism
                      await new Promise(r => setTimeout(r, 2000));
                      if (!request.signal.aborted) {
                        send('typing', {
                          id: nextPersona.id,
                          handle: nextPersona.handle,
                          avatar: nextPersona.avatar,
                        });
                      }
                    }
                  }

                  lastKnownIndex = await getMessageIndex();
                }
              } catch (error) {
                console.error('[chatroom-stream] Generation error:', error);

                // Send detailed error to clients for debugging
                send('system_error', {
                  timestamp: Date.now(),
                  message: 'Message generation failed - will retry on next cycle',
                  severity: 'warning',
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
 */
async function pollForNewMessages(
  send: (eventType: string, data: unknown) => void,
  lastKnownIndex: number,
  signal: AbortSignal
) {
  if (signal.aborted) return;

  try {
    const messages = await getMessages();
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
