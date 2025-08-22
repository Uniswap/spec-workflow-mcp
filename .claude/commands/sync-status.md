---
description: Check sync status between local and upstream repositories
allowed-tools: Bash(git:*)
argument-hint: [optional: upstream-repo-url]
---

# Check Upstream Sync Status

I'll check the synchronization status between your local repository and the upstream spec-workflow-mcp repository.

## Current Repository Status

!echo "Current branch: $(git branch --show-current)"
!git status --short

## Remote Configuration

!git remote -v

## Checking Upstream Configuration

!UPSTREAM_URL="${ARGUMENTS:-https://github.com/Uniswap/spec-workflow-mcp.git}"
!git remote get-url upstream 2>/dev/null || echo "Upstream not configured. Would use: $UPSTREAM_URL"

## Fetching Latest Information

!git fetch origin 2>/dev/null
!git fetch upstream 2>/dev/null || echo "Upstream remote not configured"

## Branch Comparison

### Local vs Origin
!echo "Commits ahead of origin/main:"
!git log --oneline origin/main..main 2>/dev/null | head -5 || echo "None or branch not found"
!echo -e "\nCommits behind origin/main:"
!git log --oneline main..origin/main 2>/dev/null | head -5 || echo "None or branch not found"

### Local vs Upstream
!echo -e "\nCommits ahead of upstream/main:"
!git log --oneline upstream/main..main 2>/dev/null | head -5 || echo "Cannot compare - upstream not configured"
!echo -e "\nCommits behind upstream/main:"
!git log --oneline main..upstream/main 2>/dev/null | head -5 || echo "Cannot compare - upstream not configured"

## Summary Statistics

!echo -e "\n📊 Sync Statistics:"
!echo "- Ahead of origin: $(git rev-list --count origin/main..main 2>/dev/null || echo 0) commits"
!echo "- Behind origin: $(git rev-list --count main..origin/main 2>/dev/null || echo 0) commits"
!echo "- Ahead of upstream: $(git rev-list --count upstream/main..main 2>/dev/null || echo 'N/A') commits"
!echo "- Behind upstream: $(git rev-list --count main..upstream/main 2>/dev/null || echo 'N/A') commits"

## Recent Activity

!echo -e "\n📅 Last 5 commits on main:"
!git log --oneline -5 main

## Recommendations

Based on the status above:
- If behind upstream: Run `/sync-upstream` to sync with the latest upstream changes
- If ahead of origin: Push your changes with `git push origin main`
- If behind origin: Pull changes with `git pull origin main`
- If conflicts exist: Use `/resolve-sync-conflicts` to help resolve them