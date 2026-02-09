/**
 * Shared utilities for human chat functionality
 */

// Track active connections for broadcasting
const activeConnections = new Map<string, ReadableStreamDefaultController>();

/**
 * Broadcast a message to all connected clients
 */
export function broadcastToAll(eventType: string, data: unknown) {
  const encoder = new TextEncoder();
  const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  
  activeConnections.forEach((controller) => {
    try {
      controller.enqueue(encoder.encode(message));
    } catch {
      // Controller closed, will be cleaned up on next iteration
    }
  });
}

/**
 * Register a new connection for broadcasting
 */
export function registerConnection(connectionId: string, controller: ReadableStreamDefaultController) {
  activeConnections.set(connectionId, controller);
}

/**
 * Unregister a connection from broadcasting
 */
export function unregisterConnection(connectionId: string) {
  activeConnections.delete(connectionId);
}

/**
 * Get the number of active connections
 */
export function getActiveConnectionCount(): number {
  return activeConnections.size;
}