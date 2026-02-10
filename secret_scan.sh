#!/bin/bash

echo "=== SECRET SCAN REPORT ==="
echo "Repository: team-consensus-vault"
echo "Scan date: $(date)"
echo ""

# Function to scan for patterns
scan_patterns() {
    local pattern_name="$1"
    local pattern="$2"
    local files="$3"
    
    echo "=== Scanning for $pattern_name ==="
    if [ -n "$files" ]; then
        grep -n -H -i "$pattern" $files 2>/dev/null | head -20
    else
        grep -r -n -H -i "$pattern" . --include="*.js" --include="*.ts" --include="*.json" --include="*.md" --include="*.txt" --include="*.sh" --include="*.mjs" --include="*.cjs" --include="*.jsx" --include="*.tsx" 2>/dev/null | head -20
    fi
    echo ""
}

# Scan tracked files
echo "=== Scanning tracked git files ==="
TRACKED_FILES=$(git ls-files)
echo "Total tracked files: $(echo "$TRACKED_FILES" | wc -l)"

# Common secret patterns
echo ""
echo "=== Common Secret Patterns ==="

# API keys patterns
scan_patterns "API Keys (sk-)" "sk-[a-zA-Z0-9]{20,}"
scan_patterns "API Keys (AKIA)" "AKIA[0-9A-Z]{16}"
scan_patterns "API Keys (Bearer)" "Bearer [a-zA-Z0-9._-]{20,}"
scan_patterns "API Keys (key=)" "key=[a-zA-Z0-9]{20,}"
scan_patterns "API Keys (api_key)" "api_key=['\"][a-zA-Z0-9._-]{20,}['\"]"
scan_patterns "API Keys (apikey)" "apikey=['\"][a-zA-Z0-9._-]{20,}['\"]"
scan_patterns "OpenAI style keys" "sk-[a-zA-Z0-9]{48}"
scan_patterns "Google API keys" "AIza[0-9A-Za-z\\-_]{35}"
scan_patterns "Generic keys" "[0-9a-f]{32}"
scan_patterns "JWT tokens" "eyJ[a-zA-Z0-9_-]{10,}\\.[a-zA-Z0-9_-]{10,}\\.[a-zA-Z0-9_-]{10,}"

# Password patterns
scan_patterns "Passwords" "password=['\"][^'\"]{6,}['\"]"
scan_patterns "Passwords (colon)" ":[^:]{6,}@"

# Token patterns
scan_patterns "Access tokens" "access_token=['\"][a-zA-Z0-9._-]{20,}['\"]"
scan_patterns "Refresh tokens" "refresh_token=['\"][a-zA-Z0-9._-]{20,}['\"]"

# Check for .env files in git
echo "=== Checking for .env files in git ==="
git ls-files | grep -E "\.env" | while read file; do
    echo "WARNING: .env file found in git: $file"
    # Check if it contains actual keys
    if grep -q "=" "$file" 2>/dev/null; then
        echo "  Contains key-value pairs. Checking for actual secrets..."
        grep -E "(sk-|AKIA|key=|api_key|password)" "$file" 2>/dev/null | head -5
    fi
done
echo ""

# Check git history for removed sensitive files
echo "=== Checking git history for removed sensitive files ==="
git log --all --full-history --name-only --diff-filter=D | sort -u | grep -E "\.(env|key|pem|secret|token)" | head -10

echo ""
echo "=== Scanning complete ==="