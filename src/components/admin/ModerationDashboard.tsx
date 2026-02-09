'use client';

// CVAULT-188: Admin moderation dashboard for reviewing flagged messages
import { useState, useEffect } from 'react';
import { ChatMessage, MutedUser, BannedUser, ModerationAction } from '@/lib/chatroom/types';

interface ModerationQueueItem extends ChatMessage {
  moderation: NonNullable<ChatMessage['moderation']>;
}

interface UserStatus {
  userId: string;
  muted: boolean;
  banned: boolean;
  violations: number;
  mutedUntil?: number | null;
  muteReason?: string;
  banReason?: string;
}

export default function ModerationDashboard() {
  const [activeTab, setActiveTab] = useState<'queue' | 'users' | 'log'>('queue');
  const [queue, setQueue] = useState<ModerationQueueItem[]>([]);
  const [mutedUsers, setMutedUsers] = useState<MutedUser[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [moderationLog, setModerationLog] = useState<ModerationAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const moderatorId = 'admin'; // TODO: Get from auth context

  // Load data based on active tab
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'queue') {
        const res = await fetch('/api/chatroom/admin?action=moderation-queue');
        const data = await res.json();
        if (data.success) {
          setQueue(data.queue || []);
        } else {
          setError(data.error || 'Failed to load queue');
        }
      } else if (activeTab === 'users') {
        const [mutedRes, bannedRes] = await Promise.all([
          fetch('/api/chatroom/admin?action=muted-users'),
          fetch('/api/chatroom/admin?action=banned-users'),
        ]);
        const mutedData = await mutedRes.json();
        const bannedData = await bannedRes.json();

        if (mutedData.success) setMutedUsers(mutedData.mutedUsers || []);
        if (bannedData.success) setBannedUsers(bannedData.bannedUsers || []);
      } else if (activeTab === 'log') {
        const res = await fetch('/api/chatroom/admin?action=moderation-log&limit=50');
        const data = await res.json();
        if (data.success) {
          setModerationLog(data.log || []);
        } else {
          setError(data.error || 'Failed to load log');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async (
    action: string,
    targetUserId: string,
    targetHandle: string,
    duration: number | null,
    reason: string
  ) => {
    try {
      const res = await fetch('/api/chatroom/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          targetUserId,
          targetHandle,
          duration,
          reason,
          moderatorId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(`${action} successful for ${targetHandle}`);
        loadData(); // Reload data
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h2 className="text-2xl font-bold mb-4">Moderation Dashboard</h2>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-border">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'queue'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Moderation Queue {queue.length > 0 && `(${queue.length})`}
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'users'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Muted/Banned Users
        </button>
        <button
          onClick={() => setActiveTab('log')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'log'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Moderation Log
        </button>
      </div>

      {/* Loading/Error States */}
      {loading && <div className="text-center py-8 text-muted-foreground">Loading...</div>}
      {error && <div className="text-center py-8 text-red-500">Error: {error}</div>}

      {/* Moderation Queue Tab */}
      {!loading && !error && activeTab === 'queue' && (
        <div>
          {queue.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No flagged messages</div>
          ) : (
            <div className="space-y-4">
              {queue.map((msg) => (
                <div key={msg.id} className="border border-yellow-500 rounded-lg p-4 bg-yellow-500/10">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold">{msg.handle}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {new Date(msg.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs">
                      <span
                        className={`px-2 py-1 rounded ${
                          msg.moderation.moderationResult?.status === 'removed'
                            ? 'bg-red-500 text-white'
                            : 'bg-yellow-500 text-black'
                        }`}
                      >
                        {msg.moderation.moderationResult?.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="mb-2 p-3 bg-background rounded">{msg.content}</div>

                  <div className="text-sm mb-3">
                    <div className="text-red-500 font-medium">
                      Violations: {msg.moderation.moderationResult?.violations.join(', ')}
                    </div>
                    <div className="text-muted-foreground">
                      Reasoning: {msg.moderation.moderationResult?.reasoning}
                    </div>
                    <div className="text-muted-foreground">
                      Confidence: {msg.moderation.moderationResult?.confidence}%
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        executeAction(
                          'mute',
                          msg.moderation.userId!,
                          msg.handle,
                          15 * 60 * 1000,
                          'Flagged message violation'
                        )
                      }
                      className="px-3 py-1 bg-yellow-500 text-black rounded hover:bg-yellow-600"
                    >
                      Mute 15min
                    </button>
                    <button
                      onClick={() =>
                        executeAction(
                          'ban',
                          msg.moderation.userId!,
                          msg.handle,
                          null,
                          'Severe violation'
                        )
                      }
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Ban
                    </button>
                    <button
                      onClick={() => alert('Message approved (TODO: implement message update)')}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Muted/Banned Users Tab */}
      {!loading && !error && activeTab === 'users' && (
        <div>
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3">Muted Users ({mutedUsers.length})</h3>
            {mutedUsers.length === 0 ? (
              <div className="text-muted-foreground">No muted users</div>
            ) : (
              <div className="space-y-2">
                {mutedUsers.map((user) => (
                  <div key={user.userId} className="border border-border rounded p-3 flex justify-between items-center">
                    <div>
                      <div className="font-bold">{user.handle}</div>
                      <div className="text-sm text-muted-foreground">
                        Until:{' '}
                        {user.mutedUntil === null
                          ? 'Permanent'
                          : new Date(user.mutedUntil).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Reason: {user.reason}</div>
                    </div>
                    <button
                      onClick={() => executeAction('unmute', user.userId, user.handle, null, 'Admin override')}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Unmute
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3">Banned Users ({bannedUsers.length})</h3>
            {bannedUsers.length === 0 ? (
              <div className="text-muted-foreground">No banned users</div>
            ) : (
              <div className="space-y-2">
                {bannedUsers.map((user) => (
                  <div key={user.userId} className="border border-red-500 rounded p-3 flex justify-between items-center bg-red-500/10">
                    <div>
                      <div className="font-bold">{user.handle}</div>
                      <div className="text-sm text-muted-foreground">
                        Banned: {new Date(user.bannedAt).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Reason: {user.reason}</div>
                    </div>
                    <button
                      onClick={() => executeAction('unban', user.userId, user.handle, null, 'Admin override')}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Unban
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Moderation Log Tab */}
      {!loading && !error && activeTab === 'log' && (
        <div>
          {moderationLog.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No moderation actions logged</div>
          ) : (
            <div className="space-y-2">
              {moderationLog.reverse().map((action, idx) => (
                <div key={idx} className="border border-border rounded p-3">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <span className="font-bold">{action.type.toUpperCase()}</span>
                      <span className="ml-2">{action.targetHandle}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(action.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">Reason: {action.reason}</div>
                  <div className="text-xs text-muted-foreground">By: {action.moderatorId}</div>
                  {action.duration && (
                    <div className="text-xs text-muted-foreground">
                      Duration: {Math.round(action.duration / 1000 / 60)} minutes
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
