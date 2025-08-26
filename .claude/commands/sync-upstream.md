---
description: Sync upstream spec-workflow-mcp repository to local package's main branch
allowed-tools: Bash(git:*), Bash(gh:*), mcp__github__*, mcp__graphite__*
argument-hint: [optional: upstream-repo-url]
---

# Sync Upstream Repository

I'll help you sync the upstream spec-workflow-mcp repository with your local package's main branch while preserving features from both sources.

## Process Overview

I will:

1. Ensure your local main branch is up to date
2. Create a new sync branch with timestamp
3. Fetch and merge upstream changes using GitHub MCP tools where possible
4. Handle any conflicts by preserving features from both sources
5. Create a PR to your main branch for review

## Starting the sync process

First, let me check your current git status and configuration:

!git status
!git branch --show-current

Now I'll determine the repository owner and name:

!REPO_URL=$(git remote get-url origin)
!echo "Repository URL: $REPO_URL"

### Parse owner and repo from URL (works for both SSH and HTTPS)

!OWNER=$(echo "$REPO_URL" | sed -E 's/.*[:/]([^/]+)\/[^/]+\.git$/\1/')
!REPO=$(echo "$REPO_URL" | sed -E 's/.*[:/][^/]+\/([^/]+)\.git$/\1/')
!echo "Owner: $OWNER, Repo: $REPO"

1. **Save current branch and stash changes if needed**
!CURRENT_BRANCH=$(git branch --show-current) && echo "Current branch: $CURRENT_BRANCH"
!git stash push -m "Auto-stash before upstream sync" 2>/dev/null || echo "No changes to stash"

2. **Switch to main and update it**
!git checkout main
!git pull origin main

3. **Create a new sync branch**
!SYNC_BRANCH="sync-upstream-$(date +%Y%m%d-%H%M%S)" && echo "Creating branch: $SYNC_BRANCH"

Now I'll use the GitHub MCP to create the branch:

```
mcp__github__create_branch(
  owner: "$OWNER",
  repo: "$REPO",
  branch: "$SYNC_BRANCH",
  from_branch: "main"
)
```

!git fetch origin
!git checkout "$SYNC_BRANCH"

4. **Configure upstream remote if not present**
!UPSTREAM_URL="${ARGUMENTS:-https://github.com/Uniswap/spec-workflow-mcp.git}"
!git remote get-url upstream 2>/dev/null || git remote add upstream "$UPSTREAM_URL"
!echo "Upstream URL: $(git remote get-url upstream)"

5. **Fetch upstream changes**
!git fetch upstream main

6. **Attempt to merge upstream/main**
!git merge upstream/main --no-edit -m "Merge upstream spec-workflow-mcp main branch" || MERGE_CONFLICT=true

If there are conflicts, I'll help resolve them:

## Conflict Resolution Strategy

When resolving conflicts, I will:

- **Preserve local features**: Keep any custom functionality added to the local package
- **Accept upstream improvements**: Incorporate bug fixes and enhancements from upstream
- **Merge intelligently**: For overlapping changes, create a combined solution that includes both sets of features
- **Remove additions mentioning pimzino**: Check CLOSELY for any code, comments, or documentation that references "pimzino". Migrate it to use the Uniswap equivalent, or otherwise just eliminate it to ensure the codebase is clean and free from such mentions. This fork is intended to be a Uniswao-specific solution.
- **Document changes**: Add comments where significant merges occur

Let me check if there are conflicts to resolve:

!git status --porcelain | grep -E "^(UU|AA|DD|AU|UA|DU|UD)" && HAS_CONFLICTS=true || echo "No conflicts detected"

If conflicts exist, I'll analyze each conflicted file and resolve them:

For each conflicted file, I will:

1. Read both versions to understand the changes
2. Create a merged version that preserves features from both
3. Test that the merge maintains functionality
4. Mark the conflict as resolved

After resolving all conflicts (if any), I'll continue:

7. **Verify the merge**
!git status
!git diff --stat main..HEAD

8. **Run any available tests to ensure nothing is broken**
!npm test 2>/dev/null || echo "No tests configured"

9. **Push the branch and create a pull request**

First, push the branch:
!git push -u origin "$SYNC_BRANCH"

Now I'll create a PR using the GitHub MCP:

```javascript
mcp__github__create_pull_request(
  owner: "$OWNER",
  repo: "$REPO",
  title: "Sync upstream spec-workflow-mcp repository",
  body: "This PR syncs the latest changes from the upstream spec-workflow-mcp repository while preserving local customizations.

## Changes included

- Latest updates from upstream repository
- Preserved all local custom features
- Resolved conflicts (if any) by merging features from both sources

## Merge strategy

- Conflicts were resolved by combining features from both upstream and local
- Local customizations were preserved
- Upstream improvements were incorporated

Please review the changes carefully before merging.",
  base: "main",
  head: "$SYNC_BRANCH"
)
```

If you're using Graphite, you can alternatively use:

```javascript
mcp__graphite__run_gt_cmd(
  cwd: "$(pwd)",
  args: ["submit", "--no-interactive"],
  why: "Submit the sync branch as a PR"
)
```

10. **Return to original branch**
!git checkout "$CURRENT_BRANCH"
!git stash pop 2>/dev/null || echo "No stash to restore"

## Summary

The upstream sync process is complete! Here's what was done:

- Created a new branch: `$SYNC_BRANCH`
- Merged upstream changes while preserving local features
- Created a PR for review before merging to main

**Next steps:**

1. Review the PR carefully
2. Run your test suite to ensure everything works
3. Merge the PR when ready

The PR preserves both upstream improvements and local customizations, ensuring no features are lost from either source.
