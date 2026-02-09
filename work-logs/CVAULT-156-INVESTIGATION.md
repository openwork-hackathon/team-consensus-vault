# CVAULT-156: Vercel Build Queue Investigation Report

**Date:** 2026-02-09 03:11 UTC
**Investigated By:** Lead Engineer (Claude)
**Task:** CRITICAL: Investigate and fix why Vercel builds are stuck at queued

## Executive Summary

**STATUS:** BLOCKED - Requires Vercel dashboard access
**ROOT CAUSE:** Vercel GitHub App integration is broken
**WORKAROUND:** Alternate domain (team-consensus-vault-iota.vercel.app) is functioning
**IMPACT:** Main domain serves 30-hour-old cached content; submission uses working alternate domain

---

## Problem Statement

The Vercel deployment for `team-consensus-vault.vercel.app` is stuck with builds queued for 30+ hours. GitHub check suites are created but never execute, and the deployed site serves stale cached content.

**Evidence:**
- Main domain etag: `c20e3bab0bc2e4b1d8810a1b8d759396` (stale)
- Cache age: 105,937 seconds (~29.4 hours)
- GitHub check suite status: `queued` with 0 check runs
- Latest commit: `ea6c9bd` (pushed 2026-02-09 03:09 UTC)

---

## Investigation Findings

### 1. Dual Vercel Project Configuration

There are TWO separate Vercel projects for this repository:

| Project ID | Domain | Status | Auto-Deploy |
|-----------|--------|--------|-------------|
| `prj_FbiD470CjV1T9EfHJmlywGqrsRXP` | team-consensus-vault.vercel.app | Stale (30h old) | BROKEN ❌ |
| `prj_pizYRrkrjBvRIH20E6nnQ7VoVT7u` | team-consensus-vault-iota.vercel.app | Current | WORKING ✅ |

**Evidence:**
```bash
# Main domain - STALE
curl -I https://team-consensus-vault.vercel.app/
# etag: "c20e3bab0bc2e4b1d8810a1b8d759396"
# age: 105937

# Iota domain - CURRENT
curl -I https://team-consensus-vault-iota.vercel.app/
# etag: "517d7f79a86891f1c999a70a79dc6950" (different = newer)

# Chatroom feature verification
curl -I https://team-consensus-vault.vercel.app/chatroom
# HTTP 404 (feature not deployed)

curl -I https://team-consensus-vault-iota.vercel.app/chatroom
# HTTP 200 (feature exists)
```

**Configuration Files:**
- `.vercel/project.json` points to: `prj_pizYRrkrjBvRIH20E6nnQ7VoVT7u` (iota domain)
- Openwork API returns: `prj_FbiD470CjV1T9EfHJmlywGqrsRXP` (main domain)

### 2. GitHub Check Suite Analysis

**Current State:**
```json
{
  "id": 56800334043,
  "status": "queued",
  "conclusion": null,
  "check_runs_url": "https://api.github.com/.../check-runs",
  "total_count": 0,
  "check_runs": []
}
```

**Key Finding:** Check suites are created but contain ZERO check runs. This indicates:
- Vercel GitHub App is receiving push webhooks
- App is creating check suite placeholders
- App is NOT executing actual deployment check runs
- This is a Vercel-side integration failure

**Pattern Observed:**
- Every push to `main` creates a new check suite
- All check suites immediately enter `queued` status
- No check suite ever transitions to `in_progress` or `completed`
- No check runs are ever created within the suites

### 3. Attempted Remediation

#### ✅ Successful Actions:
1. **Verified local build works:** `npm run build` completes successfully
2. **Confirmed iota domain is current:** Has latest features (chatroom page exists)
3. **Triggered new commit:** Created empty commit to test webhook flow
4. **Verified Openwork submission:** Already points to working iota domain

#### ❌ Blocked Actions:
1. **GitHub check suite rerequest:** API endpoint returns 404
   ```bash
   gh api -X POST repos/.../check-suites/56800334043/rerequest
   # Error: Not Found (HTTP 404)
   ```

2. **Vercel API access:** No authentication token available
   ```bash
   curl https://api.vercel.com/v6/deployments?projectId=prj_FbiD470CjV1T9EfHJmlywGqrsRXP
   # Error: missing authentication token
   ```

3. **GitHub webhook inspection:** Insufficient permissions
   ```bash
   gh api repos/.../hooks
   # Error: needs "admin:repo_hook" scope
   ```

4. **Deploy hook not found:** No Vercel deploy hook URL in repo or credentials

### 4. Openwork API Investigation

**Team Data:**
```json
{
  "team_id": "1986f06f-974e-404a-a9c5-4d266e88c650",
  "vercel_project_id": "prj_FbiD470CjV1T9EfHJmlywGqrsRXP",
  "vercel_url": "https://team-consensus-vault.vercel.app",
  "demo_url": "https://team-consensus-vault-iota.vercel.app",
  "status": "submitted"
}
```

**Key Discovery:** The `demo_url` ALREADY points to the working iota domain!

**API Limitations:**
- No endpoint found for triggering Vercel deployments
- PATCH `/api/hackathon/:id` only accepts: `token_url`, `status`
- Cannot update `demo_url` after submission
- No deploy/redeploy endpoints documented in API guide

---

## Root Cause Analysis

### Primary Cause: Vercel GitHub App Integration Failure

The Vercel GitHub App (`app_id: 8329`) is in a broken state for project `prj_FbiD470CjV1T9EfHJmlywGqrsRXP`:

1. **Webhook reception:** Working (check suites are created)
2. **Check run creation:** Failing (0 runs in every suite)
3. **Deployment execution:** Not happening (site remains stale)

**Hypothesis:** The Vercel project is either:
- Not properly linked to the GitHub repository
- Missing required configuration (build command, framework detection)
- Experiencing a Vercel platform issue with check run execution
- Has a misconfigured GitHub App installation

### Secondary Factor: Split Project Configuration

The local `.vercel/project.json` points to a DIFFERENT Vercel project than what Openwork created. This suggests:
- Developers ran `vercel` CLI and created their own project
- This project (`prj_pizYRrkrjBvRIH20E6nnQ7VoVT7u`) has working auto-deploy
- Openwork created a separate project for the main domain
- The Openwork project was never properly configured

---

## Current Status Assessment

### ✅ GOOD NEWS:
1. **Hackathon submission is safe:** `demo_url` points to working iota domain
2. **Judges will see current code:** Iota domain has all latest features
3. **Auto-deploy IS working:** Just on the alternate domain
4. **Application is functional:** No code/build issues

### ⚠️ CONCERNS:
1. **Brand confusion:** Two different domains serve different versions
2. **Main domain stale:** Official Openwork URL shows old content
3. **Check suites accumulating:** Creating noise in GitHub PR/commit view
4. **Cannot fix without access:** Requires Vercel dashboard or API token

---

## Resolution Options

### Option 1: Manual Vercel Dashboard Intervention (RECOMMENDED)

**Required:** Vercel account access (likely tied to Openwork hackathon team)

**Steps:**
1. Login to https://vercel.com/dashboard
2. Navigate to project `prj_FbiD470CjV1T9EfHJmlywGqrsRXP`
3. Go to Settings → Git Integration
4. Verify repository connection: `openwork-hackathon/team-consensus-vault`
5. Check "Auto-deploy" is enabled for `main` branch
6. Manually trigger redeploy of commit `ea6c9bd` (or latest)
7. Monitor deployment logs for errors

**Alternative if integration is broken:**
- Disconnect and reconnect GitHub repository
- Or delete the broken project and use only the iota domain

**Estimated Time:** 5-10 minutes
**Success Probability:** 95%

### Option 2: Use Vercel API with Authentication

**Required:** Vercel API token with deployment permissions

**Steps:**
1. Obtain Vercel API token from dashboard or environment
2. Trigger deployment via API:
   ```bash
   curl -X POST "https://api.vercel.com/v13/deployments" \
     -H "Authorization: Bearer <VERCEL_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "team-consensus-vault",
       "gitSource": {
         "type": "github",
         "repo": "openwork-hackathon/team-consensus-vault",
         "ref": "main"
       }
     }'
   ```

**Estimated Time:** 5 minutes
**Success Probability:** 90%
**Blocker:** No Vercel token available in credentials

### Option 3: Accept Dual-Domain Setup (NO ACTION REQUIRED)

**Rationale:**
- Openwork submission already uses working domain
- Judges will see current deployment
- Hackathon deadline is ~Feb 14 (5 days away)
- Fixing main domain provides no functional benefit for judging

**Trade-offs:**
- ✅ Zero effort required
- ✅ Submission is already correct
- ❌ Brand inconsistency (two domains)
- ❌ Main Openwork URL shows stale content

**Recommendation:** Use this option if time is critical and resources are limited

### Option 4: Migrate to Iota Domain as Primary

**Steps:**
1. Verify iota domain continues auto-deploying
2. Update all documentation/links to use iota domain
3. Accept that main domain is legacy/deprecated

**Blocker:** Cannot update Openwork `vercel_url` via API (read-only after submission)

---

## Recommendations

### Immediate Actions (NONE REQUIRED for hackathon)

The current setup is FUNCTIONAL for hackathon submission:
- ✅ Demo URL points to working deployment
- ✅ Latest code is accessible to judges
- ✅ No impact on judging or scoring

### Post-Hackathon Cleanup

Once hackathon is complete (after Feb 14), consider:

1. **Audit Vercel projects:** Determine which domain should be canonical
2. **Fix or delete broken project:** Either repair main domain or remove it
3. **Clean up check suites:** Contact GitHub support if stuck checks cause issues
4. **Document configuration:** Update `.vercel/project.json` with correct project

### If Main Domain MUST Be Fixed Before Deadline

**Priority 1:** Obtain Vercel dashboard access
- Login as team owner or admin
- Check project settings and Git integration
- Manually trigger redeploy

**Priority 2:** If dashboard access fails, obtain Vercel API token
- Generate from Vercel dashboard
- Use API to trigger deployment programmatically

**Priority 3:** Contact Openwork support
- Ask if they can trigger redeploy on our behalf
- Request access to Vercel project they created
- Check if there's a hidden API endpoint for deployment control

---

## Technical Deep Dive

### GitHub Check Suite Lifecycle (Normal)

```
push → webhook → Vercel App → create check suite → create check run
                                      ↓
                              status: queued → in_progress → completed
                                                     ↓
                                               deploy process
```

### GitHub Check Suite Lifecycle (Our Case)

```
push → webhook → Vercel App → create check suite → ??? (STOPS HERE)
                                      ↓
                              status: queued (STUCK FOREVER)
                                      ↓
                           check_runs: [] (EMPTY ARRAY)
```

### Why This Indicates Vercel-Side Issue

1. **GitHub webhook is working:** Check suites are created immediately after push
2. **Vercel App receives event:** App ID 8329 successfully creates suite object
3. **Check run creation fails:** Zero runs in all suites indicates Vercel App isn't proceeding past initial webhook handling
4. **No error reported:** Check suite has `conclusion: null` instead of `conclusion: "failure"`

**Likely Causes:**
- Project configuration missing in Vercel database
- GitHub App permissions revoked or expired
- Vercel internal error creating deployment jobs
- Project in suspended/paused state

---

## Data Collection Summary

### Commits Tested
- `7ba4c53` (GLM, Feb 9 03:02 UTC) - Check suite 56800042323, status: queued
- `ea6c9bd` (Claude, Feb 9 03:09 UTC) - Check suite 56800334043, status: queued

### Domains Verified
- `team-consensus-vault.vercel.app` - Stale (etag: c20e3bab0bc2e4b1d8810a1b8d759396)
- `team-consensus-vault-iota.vercel.app` - Current (etag: 517d7f79a86891f1c999a70a79dc6950)

### API Endpoints Tested
- ✅ GitHub commits API
- ✅ GitHub check-suites API
- ✅ GitHub check-runs API
- ❌ GitHub check-suites rerequest (404)
- ❌ GitHub webhooks API (403 - needs admin:repo_hook)
- ❌ GitHub installations API (404)
- ❌ Vercel deployments API (401 - missing token)
- ❌ Vercel projects API (401 - missing token)
- ✅ Openwork hackathon team API

### Credentials Available
- ✅ GitHub token (via gh CLI) - limited scopes
- ✅ Openwork API key - read access
- ❌ Vercel API token - not found
- ❌ Vercel CLI config - not found
- ❌ Deploy hook URL - not found

---

## Conclusion

**FINDING:** The Vercel build queue issue is REAL and UNRESOLVABLE without Vercel dashboard/API access.

**IMPACT:** MINIMAL for hackathon - submission points to working alternate domain.

**ACTION REQUIRED:** NONE (for hackathon completion)

**OPTIONAL ACTION:** Fix main domain via Vercel dashboard if brand consistency desired.

**SIGNAL:** [[SIGNAL:blocked:vercel_dashboard_access_required]]

---

## Appendix: Commands for Verification

```bash
# Check main domain staleness
curl -sI https://team-consensus-vault.vercel.app/ | grep -E "(etag|age)"

# Check iota domain freshness
curl -sI https://team-consensus-vault-iota.vercel.app/ | grep -E "(etag|age)"

# Verify chatroom feature deployment
curl -I https://team-consensus-vault.vercel.app/chatroom  # Should be 404 (stale)
curl -I https://team-consensus-vault-iota.vercel.app/chatroom  # Should be 200 (current)

# Check GitHub check suite status
gh api repos/openwork-hackathon/team-consensus-vault/commits/main/check-suites \
  --jq '.check_suites[] | select(.app.slug == "vercel") | {status, conclusion, check_runs_count: .latest_check_runs_count}'

# Get check runs (should be empty array)
gh api repos/openwork-hackathon/team-consensus-vault/commits/main/check-suites \
  --jq '.check_suites[] | select(.app.slug == "vercel") | .check_runs_url' \
  | head -1 | xargs gh api
```

---

**Report End**
**Total Investigation Time:** ~30 minutes
**Status:** Investigation complete, blocked on external access
**Next Owner:** Human with Vercel dashboard access
