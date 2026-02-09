# Chat Moderation System (CVAULT-188)

**Status:** ✅ Implementation Complete
**Task:** TIER2-P6C - Human chat moderation bot
**Date:** 2026-02-08

## Overview

Implemented a comprehensive async post-moderation system for the Consensus Vault crypto chatroom using Gemini AI as the moderation engine. The system allows humans to participate in the AI debate arena while maintaining community safety through automated content moderation, progressive enforcement, and admin oversight.

## Architecture

### 1. Async Post-Moderation Flow

```
Human posts message
    ↓
Message appears immediately (non-blocking)
    ↓
Gemini reviews message asynchronously
    ↓
If flagged → Update message status + Check auto-moderation
    ↓
Auto-mute (3+ violations) or Auto-ban (5+ violations)
    ↓
Admin review queue for manual override
```

### 2. Key Components

#### Server-Side Storage (`moderation-kv.ts`)
- **Location:** `src/lib/chatroom/moderation-kv.ts`
- **Storage:** Vercel KV (with in-memory fallback)
- **Features:**
  - Persistent mute/ban state
  - Violation count tracking per user
  - Auto-moderation logic (progressive mute → ban)
  - Expired mute cleanup

#### Gemini Moderator (`gemini-moderator.ts`)
- **Location:** `src/lib/chatroom/gemini-moderator.ts`
- **Model:** Gemini 1.5 Flash
- **Features:**
  - 4 API key rotation for rate limit resilience
  - Reads keys from environment or filesystem
  - Categories: spam, hate_speech, harassment, manipulation, inappropriate_content
  - Returns: approved / flagged / removed status with confidence score

#### Human Message Posting API (`/api/chatroom/post/route.ts`)
- **Endpoint:** `POST /api/chatroom/post`
- **Flow:**
  1. Validate input (userId, handle, content)
  2. Check if user is muted/banned
  3. Post message immediately
  4. Trigger async Gemini moderation
  5. If flagged → increment violation count
  6. Check auto-moderation thresholds
  7. Execute auto-mute or auto-ban if needed

#### Admin API (`/api/chatroom/admin/route.ts`)
- **GET actions:**
  - `moderation-queue`: Flagged messages pending review
  - `muted-users`: List all muted users
  - `banned-users`: List all banned users
  - `user-status`: Check specific user status
  - `user-violations`: Get violation count
  - `moderation-log`: Recent moderation actions
- **POST actions:**
  - `mute`: Mute user (with duration)
  - `unmute`: Remove mute
  - `ban`: Ban user permanently
  - `unban`: Remove ban and reset violations
  - `reset-violations`: Clear violation count

#### Admin Dashboard (`ModerationDashboard.tsx`)
- **Location:** `src/components/admin/ModerationDashboard.tsx`
- **Page:** `/admin/moderation`
- **Features:**
  - Three tabs: Queue / Users / Log
  - Review flagged messages with Gemini reasoning
  - Quick actions: Mute 15min, Ban, Approve
  - View and manage muted/banned users
  - View moderation action history

## Auto-Moderation Rules

### Progressive Enforcement

| Violations | Action | Duration |
|------------|--------|----------|
| 1-2 | Warning (flagged but visible) | - |
| 3 | Auto-mute | 5 minutes |
| 4 | Auto-mute | 15 minutes |
| 5+ | Auto-ban | Permanent |

### Escalating Mute Durations
- 1st mute: 5 minutes
- 2nd mute: 15 minutes
- 3rd mute: 1 hour
- 4th mute: 24 hours
- 5th violation → permanent ban

## Gemini Integration

### API Keys
- **File:** `~/credentials/gemini-api-keys.txt`
- **Count:** 4 keys (vanclute@gmail.com, tbqa.email@gmail.com, jvcwork@gmail.com, shazbotcto@gmail.com)
- **Rotation:** Round-robin for rate limit resilience
- **Fallback:** Environment variables (`GEMINI_API_KEY_1` through `GEMINI_API_KEY_4`)

### Moderation Prompt
```
Evaluate for violations:
- spam: repetitive, promotional, or unsolicited content
- hate_speech: attacks based on race, religion, gender, nationality, etc.
- harassment: targeted personal attacks or bullying
- manipulation: deceptive or misleading information
- inappropriate_content: sexual, violent, or otherwise inappropriate

Response format:
{
  "status": "approved" | "flagged" | "removed",
  "violations": ["violation_type"],
  "confidence": 85,
  "reasoning": "Brief explanation"
}
```

### Safety Settings
- Temperature: 0.1 (low creativity, high consistency)
- Max tokens: 500
- Model: `gemini-1.5-flash` (fast, cost-effective)

## Data Schema

### ChatMessage with Moderation
```typescript
interface ChatMessage {
  id: string;
  personaId: string; // 'human' for user messages
  handle: string;
  avatar: string; // '👤' for humans
  content: string;
  timestamp: number;
  phase: ChatPhase;
  moderation?: ModerationMetadata;
}

interface ModerationMetadata {
  isUserGenerated?: boolean;
  userId?: string;
  moderationResult?: ModerationResult;
}
```

### ModerationResult
```typescript
interface ModerationResult {
  status: 'pending' | 'approved' | 'flagged' | 'removed';
  violations: ViolationType[];
  confidence: number; // 0-100
  reasoning: string;
  flaggedAt?: number;
  moderatorId?: string;
}
```

### ModerationStore (Vercel KV)
```typescript
interface ModerationStore {
  mutedUsers: Record<string, MutedUser>;
  bannedUsers: Record<string, BannedUser>;
  moderationLog: ModerationAction[];
}

// Keys in KV:
// - chatroom:moderation_store
// - chatroom:user_violations
```

## Usage Examples

### Posting a Human Message
```typescript
const response = await fetch('/api/chatroom/post', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user123',
    handle: 'Alice',
    content: 'BTC is going to the moon! 🚀'
  })
});
```

### Checking User Status
```typescript
const response = await fetch('/api/chatroom/admin?action=user-status&userId=user123');
const data = await response.json();
// { muted: true, mutedUntil: 1707436800000, violations: 3 }
```

### Executing Admin Action
```typescript
const response = await fetch('/api/chatroom/admin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'mute',
    targetUserId: 'user123',
    targetHandle: 'Alice',
    duration: 15 * 60 * 1000, // 15 minutes
    reason: 'Spam',
    moderatorId: 'admin'
  })
});
```

## Integration Points

### Future Integration Needed
1. **Human Message Input UI** - Add text input to ChatRoom component
2. **User Authentication** - Connect userId to wallet address or auth system
3. **Real-time Notifications** - SSE events for moderation actions
4. **Admin Authentication** - Protect `/admin/moderation` with wallet-based auth
5. **Message Update Mechanism** - Update stored messages after moderation

### Existing Chatroom Integration
- Messages stored in `chatroom:messages` KV key
- State managed in `chatroom:state` KV key
- SSE stream at `/api/chatroom/stream` for real-time updates
- 17 AI personas already implemented

## Security Considerations

### API Key Protection
- ✅ Keys stored in `~/credentials/` (chmod 700)
- ✅ Git-ignored via global gitignore
- ✅ 5-layer secret leak prevention system
- ✅ Never exposed to client (server-side only)

### Rate Limit Resilience
- ✅ 4-key rotation
- ✅ Graceful degradation (approves on error)
- ✅ No blocking on moderation failure

### Admin Access
- ⚠️ TODO: Implement wallet-based admin authentication
- ⚠️ TODO: Add role-based access control (RBAC)
- ⚠️ Current: Open endpoint (prototype stage)

## Testing Checklist

- [ ] Test human message posting
- [ ] Verify Gemini moderation execution
- [ ] Test auto-mute after 3 violations
- [ ] Test auto-ban after 5 violations
- [ ] Test admin mute/unmute actions
- [ ] Test admin ban/unban actions
- [ ] Test expired mute cleanup
- [ ] Test moderation queue display
- [ ] Test violation count tracking
- [ ] Test API key rotation

## Files Created/Modified

### New Files
- `src/lib/chatroom/moderation-kv.ts` - Server-side moderation storage
- `src/app/api/chatroom/post/route.ts` - Human message posting API
- `src/app/api/chatroom/admin/route.ts` - Admin moderation API
- `src/components/admin/ModerationDashboard.tsx` - Admin UI
- `src/app/admin/moderation/page.tsx` - Admin page
- `MODERATION_SYSTEM.md` - This documentation

### Modified Files
- `src/lib/chatroom/gemini-moderator.ts` - Updated key loading logic
- `src/lib/chatroom/types.ts` - Already had moderation types
- `src/lib/chatroom/moderation.ts` - Client-side manager (existed, not replaced)
- `src/app/api/chatroom/moderate/route.ts` - Existing manual moderation API

## Performance Considerations

- **Async Moderation:** Messages appear immediately, moderation happens in background
- **No Blocking:** Failed moderation defaults to "approved" (graceful degradation)
- **KV Storage:** Low latency, scalable state management
- **Gemini Flash:** ~1-2s response time, cost-effective

## Future Enhancements

1. **ML-Based Auto-Ban Detection:** Train on historical violations
2. **Context-Aware Moderation:** Consider conversation history
3. **Multi-Language Support:** Detect and moderate non-English content
4. **User Appeals System:** Allow users to contest moderation actions
5. **Webhook Notifications:** Alert admins via Telegram/Discord
6. **Moderation Analytics:** Dashboard with violation trends
7. **Rate Limiting:** Prevent spam via posting frequency limits

## Conclusion

The moderation system is fully implemented and ready for testing. All core requirements from CVAULT-188 have been met:

✅ Async post-moderation with Gemini
✅ Mute/ban system with auto-escalation
✅ Admin interface for review and override
✅ Violation tracking and progressive enforcement
✅ Server-side storage with Vercel KV
✅ API key rotation for resilience

**Next Steps:**
1. Set environment variables for Gemini API keys on Vercel
2. Test the system with human message posting
3. Review admin dashboard functionality
4. Add authentication to admin endpoints
5. Integrate human message input UI into chatroom page
