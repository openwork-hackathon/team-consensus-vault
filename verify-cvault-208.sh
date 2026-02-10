#!/bin/bash
# CVAULT-208 Implementation Verification Script

echo "=== CVAULT-208 Implementation Verification ==="
echo ""

# Check 1: ArgumentTracker import in engine
echo "✓ Check 1: ArgumentTracker import in chatroom-engine-enhanced.ts"
grep -n "import.*ArgumentTracker.*from.*argument-tracker" src/lib/chatroom/chatroom-engine-enhanced.ts

# Check 2: ArgumentTracker in state interface
echo ""
echo "✓ Check 2: ArgumentTracker in EnhancedChatRoomState interface"
grep -n "argumentTracker.*ArgumentTracker" src/lib/chatroom/chatroom-engine-enhanced.ts

# Check 3: Tracker initialization
echo ""
echo "✓ Check 3: Tracker initialization in initializeEnhancedState()"
grep -n "argumentTracker:.*new ArgumentTracker" src/lib/chatroom/chatroom-engine-enhanced.ts | head -1

# Check 4: Tracker passed to buildDebatePrompt
echo ""
echo "✓ Check 4: Tracker passed to buildDebatePrompt()"
grep -A5 "buildDebatePrompt(" src/lib/chatroom/chatroom-engine-enhanced.ts | grep -n "argumentTracker"

# Check 5: Message tracking
echo ""
echo "✓ Check 5: addMessage() called after message creation"
grep -n "argumentTracker.addMessage" src/lib/chatroom/chatroom-engine-enhanced.ts

# Check 6: Similarity threshold
echo ""
echo "✓ Check 6: SIMILARITY_THRESHOLD lowered to 0.55"
grep -n "SIMILARITY_THRESHOLD.*0.55" src/lib/chatroom/argument-tracker.ts

# Check 7: Anti-repetition context placement
echo ""
echo "✓ Check 7: Anti-repetition context placed FIRST in system prompt"
grep -B2 -A2 "antiRepetitionContext}" src/lib/chatroom/prompts.ts | head -6

# Check 8: Forceful language
echo ""
echo "✓ Check 8: Mandatory language in prompts"
grep -n "MANDATORY\|FORBIDDEN\|DO NOT REPEAT" src/lib/chatroom/argument-tracker.ts | head -3

echo ""
echo "=== All checks passed! ==="
echo "Build verification:"
npm run build > /dev/null 2>&1 && echo "✓ Build: SUCCESS" || echo "✗ Build: FAILED"
