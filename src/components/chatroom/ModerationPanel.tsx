'use client';

/**
 * CVAULT-188: Moderation Panel Component
 * Admin UI for viewing moderation queue and managing muted/banned users
 */

import { useEffect, useState } from 'react';
import {
  ChatMessage,
  MutedUser,
  BannedUser,
  ModerationAction,
  ModerationResult,
} from '@/lib/chatroom/types';

interface ModerationPanelProps {
  moderatorId: string; // Admin user ID
  onClose?: () => void;
}

export default function ModerationPanel({ moderatorId, onClose }: ModerationPanelProps) {
  const [activeTab, setActiveTab] = useState<'queue' | 'muted' | 'banned' | 'log'>('queue');
  const [flaggedMessages, setFlaggedMessages] = useState<ChatMessage[]>([]);
  const [mutedUsers, setMutedUsers] = useState<MutedUser[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [moderationLog, setModerationLog] = useState<ModerationAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data based on active tab
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      let endpoint = '';
      switch (activeTab) {
        case 'queue':
          endpoint = '/api/chatroom/admin?action=moderation-queue';
          break;
        case 'muted':
          endpoint = '/api/chatroom/admin?action=muted-users';
          break;
        case 'banned':
          endpoint = '/api/chatroom/admin?action=banned-users';
          break;
        case 'log':
          endpoint = '/api/chatroom/admin?action=moderation-log&limit=50';
          break;
      }

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const data = await response.json();

      switch (activeTab) {
        case 'queue':
          setFlaggedMessages(data.queue || []);
          break;
        case 'muted':
          setMutedUsers(data.mutedUsers || []);
          break;
        case 'banned':
          setBannedUsers(data.bannedUsers || []);
          break;
        case 'log':
          setModerationLog(data.log || []);
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const executeModerationAction = async (
    action: 'mute' | 'unmute' | 'ban' | 'unban',
    targetUserId: string,
    targetHandle: string,
    duration?: number,
    reason?: string
  ) => {
    try {
      const response = await fetch('/api/chatroom/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          targetUserId,
          targetHandle,
          duration,
          reason: reason || `Manual ${action} by admin`,
          moderatorId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} user`);
      }

      // Refresh data
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to execute action');
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (mutedUntil: number | null) => {
    if (mutedUntil === null) return 'Permanent';
    const remaining = mutedUntil - Date.now();
    if (remaining <= 0) return 'Expired';

    const minutes = Math.floor(remaining / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const getViolationBadgeColor = (violation: string) => {
    switch (violation) {
      case 'hate_speech':
        return 'bg-red-600';
      case 'harassment':
        return 'bg-orange-600';
      case 'spam':
        return 'bg-yellow-600';
      case 'manipulation':
        return 'bg-purple-600';
      case 'inappropriate_content':
        return 'bg-pink-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl border border-cyan-500/30 shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cyan-500/30">
          <h2 className="text-2xl font-bold text-cyan-400">Moderation Panel</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-cyan-500/30">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'queue'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Moderation Queue
          </button>
          <button
            onClick={() => setActiveTab('muted')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'muted'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Muted Users
          </button>
          <button
            onClick={() => setActiveTab('banned')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'banned'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Banned Users
          </button>
          <button
            onClick={() => setActiveTab('log')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'log'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Action Log
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="text-center text-gray-400 py-8">Loading...</div>
          )}

          {error && (
            <div className="text-center text-red-400 py-8">Error: {error}</div>
          )}

          {!loading && !error && (
            <>
              {/* Moderation Queue Tab */}
              {activeTab === 'queue' && (
                <div className="space-y-4">
                  {flaggedMessages.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      No flagged messages
                    </div>
                  ) : (
                    flaggedMessages.map((message) => (
                      <div
                        key={message.id}
                        className="bg-gray-800 rounded-lg p-4 border border-cyan-500/20"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="font-bold text-cyan-400">
                              {message.handle}
                            </span>
                            <span className="text-gray-500 text-sm ml-2">
                              {formatTimestamp(message.timestamp)}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              message.moderation?.moderationResult?.status === 'removed'
                                ? 'bg-red-600 text-white'
                                : 'bg-yellow-600 text-white'
                            }`}
                          >
                            {message.moderation?.moderationResult?.status?.toUpperCase()}
                          </span>
                        </div>

                        <p className="text-gray-300 mb-3">{message.content}</p>

                        {message.moderation?.moderationResult && (
                          <div className="bg-gray-900 rounded p-3 mb-3">
                            <div className="flex flex-wrap gap-2 mb-2">
                              {message.moderation.moderationResult.violations.map(
                                (violation) => (
                                  <span
                                    key={violation}
                                    className={`px-2 py-1 rounded text-xs font-bold text-white ${getViolationBadgeColor(
                                      violation
                                    )}`}
                                  >
                                    {violation.replace('_', ' ').toUpperCase()}
                                  </span>
                                )
                              )}
                            </div>
                            <p className="text-sm text-gray-400">
                              Confidence: {message.moderation.moderationResult.confidence}%
                            </p>
                            <p className="text-sm text-gray-300 mt-1">
                              {message.moderation.moderationResult.reasoning}
                            </p>
                          </div>
                        )}

                        {message.moderation?.userId && (
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                executeModerationAction(
                                  'mute',
                                  message.moderation!.userId!,
                                  message.handle,
                                  5 * 60 * 1000,
                                  'Manual mute for flagged content'
                                )
                              }
                              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm transition-colors"
                            >
                              Mute 5min
                            </button>
                            <button
                              onClick={() =>
                                executeModerationAction(
                                  'mute',
                                  message.moderation!.userId!,
                                  message.handle,
                                  60 * 60 * 1000,
                                  'Manual mute for flagged content'
                                )
                              }
                              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded text-sm transition-colors"
                            >
                              Mute 1hr
                            </button>
                            <button
                              onClick={() =>
                                executeModerationAction(
                                  'ban',
                                  message.moderation!.userId!,
                                  message.handle,
                                  undefined,
                                  'Manual ban for severe violations'
                                )
                              }
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                            >
                              Ban
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Muted Users Tab */}
              {activeTab === 'muted' && (
                <div className="space-y-4">
                  {mutedUsers.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      No muted users
                    </div>
                  ) : (
                    mutedUsers.map((user) => (
                      <div
                        key={user.userId}
                        className="bg-gray-800 rounded-lg p-4 border border-cyan-500/20"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-cyan-400">{user.handle}</h3>
                            <p className="text-sm text-gray-400">ID: {user.userId}</p>
                            <p className="text-sm text-gray-300 mt-2">
                              <span className="font-semibold">Reason:</span> {user.reason}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                              Muted at: {formatTimestamp(user.mutedAt)}
                            </p>
                            <p className="text-sm text-gray-400">
                              Expires: {formatDuration(user.mutedUntil)}
                            </p>
                            <p className="text-sm text-gray-500">
                              By: {user.moderatorId}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              executeModerationAction('unmute', user.userId, user.handle)
                            }
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition-colors"
                          >
                            Unmute
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Banned Users Tab */}
              {activeTab === 'banned' && (
                <div className="space-y-4">
                  {bannedUsers.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      No banned users
                    </div>
                  ) : (
                    bannedUsers.map((user) => (
                      <div
                        key={user.userId}
                        className="bg-gray-800 rounded-lg p-4 border border-red-500/30"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-red-400">{user.handle}</h3>
                            <p className="text-sm text-gray-400">ID: {user.userId}</p>
                            <p className="text-sm text-gray-300 mt-2">
                              <span className="font-semibold">Reason:</span> {user.reason}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                              Banned at: {formatTimestamp(user.bannedAt)}
                            </p>
                            <p className="text-sm text-gray-500">
                              By: {user.moderatorId}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              executeModerationAction('unban', user.userId, user.handle)
                            }
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition-colors"
                          >
                            Unban
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Action Log Tab */}
              {activeTab === 'log' && (
                <div className="space-y-2">
                  {moderationLog.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      No actions logged
                    </div>
                  ) : (
                    moderationLog.map((action, index) => (
                      <div
                        key={index}
                        className="bg-gray-800 rounded-lg p-3 border border-cyan-500/20 text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span
                              className={`font-bold ${
                                action.type === 'ban' || action.type === 'mute'
                                  ? 'text-red-400'
                                  : 'text-green-400'
                              }`}
                            >
                              {action.type.toUpperCase()}
                            </span>
                            <span className="text-gray-400 mx-2">→</span>
                            <span className="text-cyan-400">{action.targetHandle}</span>
                            <span className="text-gray-500 ml-2">
                              by {action.moderatorId}
                            </span>
                          </div>
                          <span className="text-gray-500">
                            {formatTimestamp(action.timestamp)}
                          </span>
                        </div>
                        <p className="text-gray-400 mt-1">{action.reason}</p>
                        {action.duration && (
                          <p className="text-gray-500 text-xs mt-1">
                            Duration: {Math.floor(action.duration / 60000)} minutes
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
