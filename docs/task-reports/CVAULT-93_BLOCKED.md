# CVAULT-93: Submit Demo Video URL to Openwork - BLOCKED

## Status: ❌ BLOCKED

## Blocking Dependencies

This task cannot be completed because the demo video does not exist yet.

### Required Prerequisites (Currently in Backlog):
1. **CVAULT-84** - Record demo video take 1 (State: Backlog)
2. **CVAULT-85** - Edit and upload demo video (State: Backlog)

### Missing Asset:
- No video URL available (expected location: `~/consensus-vault/DEMO_VIDEO_URL.txt`)
- No YouTube links found in project files

## When Video is Ready - Submission Instructions

Once CVAULT-84 and CVAULT-85 are complete:

### 1. Get Video URL
The video URL should be saved to:
```
~/consensus-vault/DEMO_VIDEO_URL.txt
```

### 2. Submit to Openwork API

**Endpoint:**
```
POST https://api.openwork.bot/api/hackathon/1986f06f-974e-404a-a9c5-4d266e88c650
```

**Headers:**
```
Authorization: Bearer <api-key>
Content-Type: application/json
```

**Payload:**
```json
{
  "video_url": "<youtube-url>"
}
```

**Alternative endpoint (based on API docs):**
```
PATCH /api/hackathon/:id
```

### 3. Verification
Check submission status:
```bash
curl -H "Authorization: Bearer $(cat ~/openclaw-staging/credentials/openwork-api-key.txt)" \
  https://api.openwork.bot/api/hackathon/1986f06f-974e-404a-a9c5-4d266e88c650
```

## Ready-to-Execute Script

Once video URL is available, run:

```bash
#!/bin/bash
# Read video URL
VIDEO_URL=$(cat ~/consensus-vault/DEMO_VIDEO_URL.txt)
API_KEY=$(cat ~/openclaw-staging/credentials/openwork-api-key.txt)
TEAM_ID="1986f06f-974e-404a-a9c5-4d266e88c650"

# Submit to Openwork
curl -X PATCH \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"video_url\": \"$VIDEO_URL\"}" \
  https://api.openwork.bot/api/hackathon/$TEAM_ID

# Verify submission
curl -H "Authorization: Bearer $API_KEY" \
  https://api.openwork.bot/api/hackathon/$TEAM_ID | jq .
```

## Current Project Status

- **Team ID:** 1986f06f-974e-404a-a9c5-4d266e88c650
- **Team Name:** Consensus Vault
- **Status:** submitted (project submitted, video pending)
- **Live Demo:** https://team-consensus-vault.vercel.app
- **GitHub:** https://github.com/openwork-hackathon/team-consensus-vault
- **API Credentials:** ~/openclaw-staging/credentials/openwork-*.txt

## Next Actions

1. Complete CVAULT-84 (record video)
2. Complete CVAULT-85 (edit and upload)
3. Ensure YouTube URL is saved to `~/consensus-vault/DEMO_VIDEO_URL.txt`
4. Re-attempt CVAULT-93 (this task)

## Hackathon Deadline

~February 14, 2026

**Time Remaining:** ~7 days from Feb 7

---

*Generated: 2026-02-07 19:01 UTC*
*Task: CVAULT-93*
*Status: Blocked awaiting video creation*
