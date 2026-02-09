import { NextRequest } from 'next/server';
import {
  getMessages,
  getState,
  getUsers,
  updateUser,
  removeUser,
  cleanupInactiveUsers,
} from '@/lib/human-chat/kv-store';
import { HumanChatMessage, HumanChatUser } from '@/lib/human-chat/types';
import { registerConnection, unregisterConnection, broadcastToAll } from '@/lib/human-chat/utils';

const KEEPALIVE_INTERVAL = 15_000; // 15s

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  const connectionId = `conn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  // Get user info from query params (optional - for tracking active users)
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  const handle = url.searchParams.get('handle');
  const avatar = url.searchParams.get('avatar') || '👤';

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

      // Register connection
      registerConnection(connectionId, controller);

      // Send connection confirmation
      send('connected', {
        timestamp: Date.now(),
        connectionId,
      });

      // Load and send history
      const messages = await getMessages();
      const state = await getState();
      const users = await getUsers();
      
      send('history', { 
        messages, 
        state,
        activeUsers: Object.keys(users).length,
      });

      // Register user if provided
      if (userId && handle) {
        const user: HumanChatUser = {
          userId,
          handle,
          avatar,
          lastSeenAt: Date.now(),
          messageCount: users[userId]?.messageCount || 0,
          joinedAt: users[userId]?.joinedAt || Date.now(),
        };
        await updateUser(user);
        
        // Broadcast user joined to others
        broadcastToAll('user_joined', {
          userId,
          handle,
          avatar,
          activeUsers: Object.keys(users).length + 1,
        });
      }

      // Keepalive interval
      const keepaliveTimer = setInterval(sendKeepalive, KEEPALIVE_INTERVAL);

      // Cleanup on abort
      request.signal.addEventListener('abort', async () => {
        clearInterval(keepaliveTimer);
        unregisterConnection(connectionId);
        
        // Remove user from active users
        if (userId) {
          await removeUser(userId);
          const remainingUsers = await getUsers();
          broadcastToAll('user_left', {
            userId,
            handle,
            activeUsers: Object.keys(remainingUsers).length,
          });
        }
        
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
