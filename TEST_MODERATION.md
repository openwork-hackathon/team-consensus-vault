# Moderation System Test Plan

## Prerequisites
1. Ensure Vercel KV is configured (KV_REST_API_URL, KV_REST_API_TOKEN)
2. Set Gemini API keys (environment or file-based)

## API Endpoint Tests

### 1. Human Message Posting
```bash
curl -X POST http://localhost:3000/api/chatroom/post \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_1",
    "handle": "TestUser",
    "content": "This is a test message"
  }'
```

Expected: `{"success": true, "message": {"id": "msg_...", "timestamp": ...}}`

### 2. Post Spam Message (Should Trigger Moderation)
```bash
curl -X POST http://localhost:3000/api/chatroom/post \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_1",
    "handle": "TestUser",
    "content": "BUY NOW! CLICK HERE! LIMITED TIME OFFER!!!"
  }'
```

### 3. Check User Status
```bash
curl "http://localhost:3000/api/chatroom/admin?action=user-status&userId=test_user_1"
```

Expected: `{"success": true, "userId": "test_user_1", "violations": 1, ...}`

### 4. Get Moderation Queue
```bash
curl "http://localhost:3000/api/chatroom/admin?action=moderation-queue"
```

Expected: `{"success": true, "queue": [...], "count": N}`

### 5. Mute User (Admin Action)
```bash
curl -X POST http://localhost:3000/api/chatroom/admin \
  -H "Content-Type: application/json" \
  -d '{
    "action": "mute",
    "targetUserId": "test_user_1",
    "targetHandle": "TestUser",
    "duration": 900000,
    "reason": "Testing mute",
    "moderatorId": "admin"
  }'
```

Expected: `{"success": true, "result": {"action": "mute", ...}}`

### 6. Try Posting While Muted
```bash
curl -X POST http://localhost:3000/api/chatroom/post \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_1",
    "handle": "TestUser",
    "content": "I should be muted"
  }'
```

Expected: `{"error": "You are muted until ...", "muted": true}` (status 403)

### 7. Unmute User
```bash
curl -X POST http://localhost:3000/api/chatroom/admin \
  -H "Content-Type: application/json" \
  -d '{
    "action": "unmute",
    "targetUserId": "test_user_1",
    "targetHandle": "TestUser",
    "reason": "Test complete",
    "moderatorId": "admin"
  }'
```

### 8. Ban User
```bash
curl -X POST http://localhost:3000/api/chatroom/admin \
  -H "Content-Type: application/json" \
  -d '{
    "action": "ban",
    "targetUserId": "test_user_1",
    "targetHandle": "TestUser",
    "reason": "Testing ban",
    "moderatorId": "admin"
  }'
```

### 9. Get Muted Users
```bash
curl "http://localhost:3000/api/chatroom/admin?action=muted-users"
```

### 10. Get Banned Users
```bash
curl "http://localhost:3000/api/chatroom/admin?action=banned-users"
```

### 11. Get Moderation Log
```bash
curl "http://localhost:3000/api/chatroom/admin?action=moderation-log&limit=20"
```

## Auto-Moderation Test Sequence

Post 5 messages with violations from same user:

```bash
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/chatroom/post \
    -H "Content-Type: application/json" \
    -d "{
      \"userId\": \"auto_test_user\",
      \"handle\": \"AutoTestUser\",
      \"content\": \"SPAM MESSAGE $i - BUY NOW!!!\"
    }"
  sleep 2
done
```

Expected behavior:
- Message 1-2: Posted, flagged but visible
- Message 3: Posted, auto-muted 5 minutes
- Message 4: Rejected (muted)
- After 5 minutes: Can post again
- Message 5: Posted, auto-muted 15 minutes
- After several more violations: Auto-banned

Check user status:
```bash
curl "http://localhost:3000/api/chatroom/admin?action=user-status&userId=auto_test_user"
```

## UI Tests

### Admin Dashboard
1. Navigate to `/admin/moderation`
2. Verify three tabs: Queue, Users, Log
3. Check Queue tab shows flagged messages
4. Click "Mute 15min" on a flagged message
5. Verify Users tab shows the muted user
6. Click "Unmute" to remove mute
7. Check Log tab shows the mute/unmute actions

## Integration Tests

### Test with Real Chatroom
1. Navigate to `/chatroom`
2. (TODO: Add human message input UI)
3. Post a clean message → should appear
4. Post a spam message → should appear but be flagged in admin dashboard
5. Post 3+ violations → should auto-mute
6. Try posting while muted → should be rejected

## Cleanup
```bash
# Reset test user
curl -X POST http://localhost:3000/api/chatroom/admin \
  -H "Content-Type: application/json" \
  -d '{
    "action": "reset-violations",
    "targetUserId": "test_user_1",
    "targetHandle": "TestUser",
    "reason": "Test cleanup",
    "moderatorId": "admin"
  }'
```
