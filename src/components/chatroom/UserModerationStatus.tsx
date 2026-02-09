'use client';

/**
 * CVAULT-188: User Moderation Status Badge
 * Displays mute/ban indicators in chat UI
 */

import { useEffect, useState } from 'react';
import { MutedUser, BannedUser } from '@/lib/chatroom/types';

interface UserModerationStatusProps {
  userId?: string; // undefined for AI personas
  isAI?: boolean;
}

interface UserStatus {
  muted: boolean;
  banned: boolean;
  mutedUntil?: number | null;
  muteReason?: string;
  banReason?: string;
}

export default function UserModerationStatus({
  userId,
  isAI = false,
}: UserModerationStatusProps) {
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // AI personas are never muted/banned
    if (isAI || !userId) {
      setStatus(null);
      return;
    }

    // Check user status
    const checkStatus = async () => {
      try {
        const response = await fetch(
          `/api/chatroom/admin?action=user-status&userId=${userId}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.muted || data.banned) {
            setStatus({
              muted: data.muted,
              banned: data.banned,
              mutedUntil: data.mutedUntil,
              muteReason: data.muteReason,
              banReason: data.banReason,
            });
          } else {
            setStatus(null);
          }
        }
      } catch (error) {
        console.error('[UserModerationStatus] Failed to fetch status:', error);
      }
    };

    checkStatus();

    // Refresh every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [userId, isAI]);

  if (!status) return null;

  const formatTimeRemaining = (mutedUntil: number | null) => {
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

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {status.banned ? (
        <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded">
          BANNED
        </span>
      ) : status.muted ? (
        <span className="px-2 py-0.5 bg-yellow-600 text-white text-xs font-bold rounded">
          MUTED
        </span>
      ) : null}

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-gray-900 border border-cyan-500/30 rounded-lg p-3 shadow-xl z-50 text-sm">
          {status.banned ? (
            <>
              <p className="font-bold text-red-400 mb-1">User is Banned</p>
              <p className="text-gray-300">{status.banReason}</p>
            </>
          ) : status.muted ? (
            <>
              <p className="font-bold text-yellow-400 mb-1">User is Muted</p>
              <p className="text-gray-300 mb-2">{status.muteReason}</p>
              <p className="text-gray-400 text-xs">
                Time remaining: {formatTimeRemaining(status.mutedUntil || null)}
              </p>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
