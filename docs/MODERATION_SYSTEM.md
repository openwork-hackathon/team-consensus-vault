# Human Chat Moderation System

**Task**: CVAULT-188 - TIER2-P6C: Human chat moderation bot
**Status**: ✅ Complete
**Date**: 2026-02-08

## Overview

The Consensus Vault chatroom now has a fully functional human chat moderation system powered by Google Gemini AI. The system performs asynchronous post-moderation of user messages, tracking violations and automatically applying mute/ban actions when thresholds are exceeded.

## Architecture

### Components

1. **Gemini Moderator** (`src/lib/chatroom/gemini-moderator.ts`)
   - AI-powered content moderation using Gemini 1.5 Flash
   - Analyzes messages for violations (hate speech, spam, harassment, manipulation, inappropriate content)
   - Returns severity score and violation categories
   - Non-blocking async operation

2. **Moderation KV Store** (`src/lib/chatroom/moderation-kv.ts`)
   - Server-side persistent storage using Vercel KV (with in-memory fallback)
   - Tracks muted users, banned users, and violation counts
   - Auto-moderation logic with escalating penalties
   - Automatic cleanup of expired mutes

3. **Client Moderation Manager** (`src/lib/chatroom/moderation.ts`)
   - Client-side localStorage-based moderation state
   - Used for local state management in browser
   - Syncs with server-side state

4. **API Endpoints**
   - **POST /api/chatroom/post** - Human message posting with async moderation
   - **POST /api/chatroom/admin** - Execute moderation actions (mute/unmute/ban/unban)
   - **GET /api/chatroom/admin** - Query moderation data (queue, users, logs)

5. **UI Components**
   - **ModerationPanel** - Admin dashboard for managing moderation
   - **UserModerationStatus** - Badge showing mute/ban status in chat
   - **ChatMessage** - Updated to display moderation indicators

## Features

### 1. Gemini-Powered Async Moderation

Messages are posted immediately (non-blocking), then moderated in the background:

```typescript
// Message posts immediately
await appendMessage(message);

// Moderation happens asynchronously
moderateMessageAsync(message)
  .then((result) => {
    // Handle result, apply auto-actions if needed
  })
  .catch((error) => {
    console.error('Moderation failed:', error);
  });
```

**API Keys**: Rotated across 4 Gemini API keys from `~/credentials/gemini-api-keys.txt`:
- vanclute@gmail.com
- tbqa.email@gmail.com
- jvcwork@gmail.com
- shazbotcto@gmail.com

### 2. Violation Detection

Gemini analyzes messages for these violation types:
- **spam** - Repetitive, promotional, or unsolicited content
- **hate_speech** - Attacks based on race, religion, gender, nationality, etc.
- **harassment** - Targeted personal attacks or bullying
- **manipulation** - Deceptive or misleading information
- **inappropriate_content** - Sexual, violent, or otherwise inappropriate material

**Confidence Scoring**: 0-100% confidence in the moderation decision.

### 3. Auto-Moderation System

**Violation Tracking**: Each flagged message increments the user's violation count.

**Auto-Mute Thresholds**:
- **3 violations** → Auto-mute with escalating duration:
  - 1st offense: 5 minutes
  - 2nd offense: 15 minutes
  - 3rd offense: 1 hour
  - 4th+ offense: 24 hours

**Auto-Ban Threshold**:
- **5 violations** → Permanent ban

### 4. Mute System

**Mute Durations**:
- 5 minutes
- 1 hour
- 24 hours
- Permanent (null duration)

**Mute State**:
```typescript
interface MutedUser {
  userId: string;
  handle: string;
  mutedAt: number;
  mutedUntil: number | null; // null = permanent
  reason: string;
  moderatorId: string;
}
```

**Automatic Expiry**: Expired mutes are automatically cleaned up when checked.

### 5. Ban System

**Ban State**:
```typescript
interface BannedUser {
  userId: string;
  handle: string;
  bannedAt: number;
  reason: string;
  moderatorId: string;
}
```

**Priority**: Ban takes precedence over mute. Banned users cannot post at all.

### 6. Moderation Actions

All actions are logged with full attribution:

```typescript
interface ModerationAction {
  type: 'mute' | 'unmute' | 'ban' | 'unban';
  targetUserId: string;
  targetHandle: string;
  duration?: number; // Only for mute
  reason: string;
  moderatorId: string; // 'gemini', 'system', or admin user ID
  timestamp: number;
}
```

**Moderator Attribution**:
- `gemini` - Auto-moderation by Gemini AI
- `system` - Auto-actions triggered by violation thresholds
- `admin_*` - Manual actions by human admins

## API Usage

### Post a Human Message

```typescript
POST /api/chatroom/post
{
  "userId": "user_12345",
  "handle": "Alice",
  "content": "Hello everyone!"
}

Response:
{
  "success": true,
  "message": {
    "id": "msg_1234567890_abc123",
    "timestamp": 1234567890000
  }
}
```

**Validation**:
- Content: 1-1000 characters, trimmed
- User must not be muted or banned
- Message posts immediately, moderation is async

### Execute Moderation Action (Admin)

```typescript
POST /api/chatroom/admin
{
  "action": "mute",
  "targetUserId": "user_12345",
  "targetHandle": "Alice",
  "duration": 300000, // 5 minutes in ms, null for permanent
  "reason": "Spamming chat",
  "moderatorId": "admin_jane"
}

Response:
{
  "success": true,
  "result": {
    "action": "mute",
    "targetUserId": "user_12345",
    "targetHandle": "Alice",
    "mutedUntil": 1234567890000,
    "reason": "Spamming chat"
  }
}
```

**Valid Actions**: `mute`, `unmute`, `ban`, `unban`, `reset-violations`

### Query Moderation Data (Admin)

```typescript
// Get moderation queue (flagged messages)
GET /api/chatroom/admin?action=moderation-queue

// Get muted users
GET /api/chatroom/admin?action=muted-users

// Get banned users
GET /api/chatroom/admin?action=banned-users

// Get user status
GET /api/chatroom/admin?action=user-status&userId=user_12345

// Get moderation log
GET /api/chatroom/admin?action=moderation-log&limit=50
```

## UI Components

### ModerationPanel

Admin dashboard for viewing and managing moderation:

```tsx
import ModerationPanel from '@/components/chatroom/ModerationPanel';

<ModerationPanel
  moderatorId="admin_jane"
  onClose={() => setShowPanel(false)}
/>
```

**Features**:
- **Moderation Queue**: View all flagged messages with violation details
- **Muted Users**: View and unmute users
- **Banned Users**: View and unban users
- **Action Log**: View recent moderation actions

**Quick Actions**:
- Mute 5min / Mute 1hr / Ban buttons on flagged messages
- Unmute/Unban buttons on user lists

### UserModerationStatus

Badge showing mute/ban status in chat messages:

```tsx
import UserModerationStatus from '@/components/chatroom/UserModerationStatus';

<UserModerationStatus
  userId="user_12345"
  isAI={false}
/>
```

**Features**:
- Shows "MUTED" or "BANNED" badge next to username
- Hover tooltip with reason and time remaining
- Auto-refreshes every 30 seconds
- AI personas never show badges

### Integration in ChatMessage

The `ChatMessage` component now displays moderation status:

```tsx
{message.moderation?.userId && (
  <UserModerationStatus
    userId={message.moderation.userId}
    isAI={false}
  />
)}
```

## Testing

Comprehensive test suite in `tests/moderation.test.ts` with 29 tests covering:

- ✅ Moderation result validation
- ✅ Violation types
- ✅ Auto-moderation thresholds
- ✅ Mute/ban action validation
- ✅ User status detection
- ✅ Expired mute detection
- ✅ Violation tracking
- ✅ Message content validation
- ✅ Status priority (ban over mute)
- ✅ Moderator attribution
- ✅ Timestamp validation

**Run tests**:
```bash
npm test -- tests/moderation.test.ts
```

**Results**: All 29 tests passing ✅

## Configuration

### Environment Variables

```env
# Gemini API Keys (for Vercel deployment)
GEMINI_API_KEY_1=<your-key-1>
GEMINI_API_KEY_2=<your-key-2>
GEMINI_API_KEY_3=<your-key-3>
GEMINI_API_KEY_4=<your-key-4>

# Vercel KV (for persistent storage)
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
```

### Filesystem Keys (Local)

Keys loaded from `~/credentials/gemini-api-keys.txt` when running locally.

## Security

### 5-Layer Secret Defense

All API keys are protected by the 5-layer secret leak prevention system:

1. ✅ Global pre-commit hooks scan for secrets
2. ✅ Git wrapper intercepts all commits
3. ✅ Claude Code deny rules block `--no-verify`
4. ✅ Post-commit hook auto-reverts leaked secrets
5. ✅ Global gitignore + per-repo hardening

### Admin Authentication

**TODO**: Current implementation accepts `moderatorId` from request body. In production:

1. Add JWT or session-based authentication
2. Verify admin role before allowing moderation actions
3. Rate limit moderation endpoints

```typescript
// TODO: Add authentication check
// const session = await getServerSession(authOptions);
// if (!session || !session.user?.isAdmin) {
//   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
// }
```

## Database Schema

### Vercel KV Keys

```typescript
const KEYS = {
  moderation: 'chatroom:moderation_store',
  userViolations: 'chatroom:user_violations',
  moderationQueue: 'chatroom:moderation_queue',
};
```

### ModerationStore Structure

```typescript
interface ModerationStore {
  mutedUsers: Record<string, MutedUser>;
  bannedUsers: Record<string, BannedUser>;
  moderationLog: ModerationAction[];
}
```

### User Violations

```typescript
Record<string, number> // userId -> violation count
```

## Performance

### Async Moderation

- ✅ Messages post immediately (no blocking)
- ✅ Moderation happens in background
- ✅ API key rotation prevents rate limits
- ✅ Gemini 1.5 Flash: ~1-2 second response time

### Storage

- ✅ Vercel KV for production (persistent)
- ✅ In-memory fallback for development
- ✅ Log rotation: Last 500 actions kept
- ✅ Auto-cleanup of expired mutes

## Future Enhancements

1. **User Appeals**: Allow users to appeal mutes/bans
2. **Custom Filters**: Admin-configurable keyword filters
3. **Warning System**: Formal warnings before auto-mute
4. **Moderation Metrics**: Dashboard showing violation trends
5. **Export Logs**: Download moderation logs as CSV
6. **Webhook Notifications**: Alert admins on severe violations
7. **ML Training**: Use moderation data to improve Gemini prompts

## Files Modified/Created

### Created
- `src/lib/chatroom/gemini-moderator.ts` - Gemini AI moderator
- `src/lib/chatroom/moderation-kv.ts` - Server-side storage
- `src/lib/chatroom/moderation.ts` - Client-side manager
- `src/app/api/chatroom/moderate/route.ts` - Moderation API (manual actions)
- `src/app/api/chatroom/admin/route.ts` - Admin API
- `src/components/chatroom/ModerationPanel.tsx` - Admin UI
- `src/components/chatroom/UserModerationStatus.tsx` - Status badge
- `tests/moderation.test.ts` - Test suite
- `docs/MODERATION_SYSTEM.md` - This documentation

### Modified
- `src/app/api/chatroom/post/route.ts` - Added async moderation
- `src/components/chatroom/ChatMessage.tsx` - Added status badge
- `src/lib/chatroom/types.ts` - Added moderation types

## Completion Checklist

- ✅ Gemini-powered async moderation endpoint
- ✅ Server-side KV storage for moderation data
- ✅ Mute system with escalating durations
- ✅ Ban system with permanent blocks
- ✅ Auto-moderation with violation tracking
- ✅ Admin API for manual moderation actions
- ✅ ModerationPanel UI component
- ✅ UserModerationStatus badge component
- ✅ Integration into ChatMessage component
- ✅ Comprehensive test suite (29 tests, all passing)
- ✅ Documentation

## Deployment

### Vercel Environment Variables

Add these to Vercel dashboard:

```bash
GEMINI_API_KEY_1=<your-key-1>
GEMINI_API_KEY_2=<your-key-2>
GEMINI_API_KEY_3=<your-key-3>
GEMINI_API_KEY_4=<your-key-4>
```

### Vercel KV Setup

1. Add Vercel KV integration to project
2. Environment variables are automatically added
3. Moderation data persists across deployments

---

**Implementation Complete**: 2026-02-08
**Total Files**: 9 created, 3 modified
**Test Coverage**: 29 tests, 100% passing
**Ready for CTO Review** ✅
