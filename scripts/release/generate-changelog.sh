#!/bin/bash
# Generate changelog from git commits using Conventional Commits format
# Usage: ./generate-changelog.sh [from_tag] [to_tag]
#
# Commit types:
#   feat:     New features
#   fix:      Bug fixes
#   docs:     Documentation changes
#   style:    Code style changes (formatting, etc.)
#   refactor: Code refactoring
#   perf:     Performance improvements
#   test:     Adding or updating tests
#   chore:    Maintenance tasks
#   ci:       CI/CD changes
#   build:    Build system changes

set -e

FROM_TAG="${1:-}"
TO_TAG="${2:-HEAD}"

# If no from tag, get the previous tag
if [ -z "$FROM_TAG" ]; then
    FROM_TAG=$(git describe --tags --abbrev=0 "$TO_TAG^" 2>/dev/null || echo "")
fi

# Build git log range
if [ -n "$FROM_TAG" ]; then
    RANGE="$FROM_TAG..$TO_TAG"
    echo "## Changes from $FROM_TAG to $TO_TAG"
else
    RANGE="$TO_TAG"
    echo "## All Changes"
fi
echo ""

# Get commits
COMMITS=$(git log "$RANGE" --pretty=format:"%H|%s|%an" --reverse 2>/dev/null || git log --pretty=format:"%H|%s|%an" --reverse)

# Temporary files for categories
TMPDIR=$(mktemp -d)
touch "$TMPDIR/features" "$TMPDIR/fixes" "$TMPDIR/docs" "$TMPDIR/refactor" 
touch "$TMPDIR/perf" "$TMPDIR/chore" "$TMPDIR/ci" "$TMPDIR/other"

# Parse commits
echo "$COMMITS" | while IFS='|' read -r hash subject author; do
    [ -z "$hash" ] && continue
    
    short_hash="${hash:0:7}"
    
    # Extract type using grep/sed (more portable than bash regex)
    type=$(echo "$subject" | sed -n 's/^\([a-z]*\)[(:].*$/\1/p')
    
    if [ -n "$type" ]; then
        # Remove the type prefix to get the message
        message=$(echo "$subject" | sed 's/^[a-z]*([^)]*): //' | sed 's/^[a-z]*: //')
        entry="- ${message} (\`${short_hash}\`)"
        
        case "$type" in
            feat)     echo "$entry" >> "$TMPDIR/features" ;;
            fix)      echo "$entry" >> "$TMPDIR/fixes" ;;
            docs)     echo "$entry" >> "$TMPDIR/docs" ;;
            refactor) echo "$entry" >> "$TMPDIR/refactor" ;;
            perf)     echo "$entry" >> "$TMPDIR/perf" ;;
            chore)    echo "$entry" >> "$TMPDIR/chore" ;;
            ci|build) echo "$entry" >> "$TMPDIR/ci" ;;
            style|test) echo "$entry" >> "$TMPDIR/chore" ;;
            *)        echo "- ${subject} (\`${short_hash}\`)" >> "$TMPDIR/other" ;;
        esac
    else
        echo "- ${subject} (\`${short_hash}\`)" >> "$TMPDIR/other"
    fi
done

# Print sections
print_section() {
    local title="$1"
    local emoji="$2"
    local file="$3"
    
    if [ -s "$file" ]; then
        echo "### $emoji $title"
        echo ""
        cat "$file"
        echo ""
    fi
}

print_section "New Features" "🚀" "$TMPDIR/features"
print_section "Bug Fixes" "🐛" "$TMPDIR/fixes"
print_section "Performance" "⚡" "$TMPDIR/perf"
print_section "Refactoring" "♻️" "$TMPDIR/refactor"
print_section "Documentation" "📚" "$TMPDIR/docs"
print_section "CI/CD & Build" "🔧" "$TMPDIR/ci"
print_section "Maintenance" "🧹" "$TMPDIR/chore"
print_section "Other Changes" "📝" "$TMPDIR/other"

# Print commit count
TOTAL=$(echo "$COMMITS" | grep -c '^' 2>/dev/null || echo 0)
echo "---"
echo "*${TOTAL} commit(s) in this release*"

# Cleanup
rm -rf "$TMPDIR"
