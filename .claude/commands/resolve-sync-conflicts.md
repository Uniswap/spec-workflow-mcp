---
description: Helper command for resolving conflicts during upstream sync
allowed-tools: Read, Edit, MultiEdit, Bash(git:*), Grep
---

# Resolve Upstream Sync Conflicts

I'll help you resolve merge conflicts from the upstream sync while preserving features from both sources.

## Analyzing current conflicts...

!git status --porcelain | grep -E "^(UU|AA|DD|AU|UA|DU|UD)"

Let me examine each conflicted file and resolve them intelligently:

## Conflict Resolution Process

For each conflicted file, I will:

1. **Analyze the conflict**
   - Read the file with conflict markers
   - Understand what changed in upstream (between <<<<<<< and =======)
   - Understand what changed locally (between ======= and >>>>>>>)

2. **Determine resolution strategy**
   - **Feature additions**: Keep both if they don't interfere
   - **Bug fixes**: Accept upstream fixes unless local has additional fixes
   - **Refactoring**: Merge intelligently to preserve both improvements
   - **Configuration**: Merge settings from both, with local taking precedence for custom configs
   - **Dependencies**: Use newer versions while preserving local additions

3. **Apply resolution**
   - Create merged content that includes both sets of changes
   - Remove conflict markers
   - Ensure code remains syntactically correct

## Resolution Patterns by File Type

### Package.json conflicts
- Merge dependencies from both sources
- Keep higher version numbers
- Preserve local scripts and configurations
- Merge devDependencies intelligently

### Source code conflicts (.ts, .js, .tsx, .jsx)
- Preserve local custom functions/features
- Accept upstream bug fixes
- Merge import statements from both
- Combine class/component methods when possible

### Configuration files
- Local environment configs take precedence
- Merge feature flags from both sources
- Keep local API endpoints/keys
- Accept upstream security improvements

### Documentation conflicts (.md)
- Combine documentation from both sources
- Keep local specific sections
- Update with upstream improvements
- Preserve local examples and guides

## Special Considerations

### For VSCode Extension files
- Preserve local command additions
- Accept upstream UI improvements
- Merge activation events
- Keep local configuration schemas

### For MCP Tool files
- Preserve local tool implementations
- Accept upstream tool improvements
- Merge tool configurations
- Keep local-specific parameters

### For Dashboard/Frontend files
- Preserve local UI customizations
- Accept upstream component improvements
- Merge styles intelligently
- Keep local feature flags

## Verification After Resolution

After resolving each file:
1. Check syntax validity
2. Ensure no duplicate declarations
3. Verify imports are complete
4. Test functionality if possible

Let me now resolve the conflicts based on these principles...

!git diff --name-only --diff-filter=U

For each conflicted file, I'll:
1. Read the current state with conflicts
2. Create a resolved version following the above strategies
3. Update the file
4. Stage the resolved file

After all conflicts are resolved:
!git add -A
!git status

The conflicts have been resolved following these principles:
- ✅ All local features preserved
- ✅ Upstream improvements incorporated
- ✅ Conflicts merged intelligently
- ✅ Code syntax maintained

You can now continue with the merge!