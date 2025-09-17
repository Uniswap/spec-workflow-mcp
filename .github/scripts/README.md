# GitHub Actions Scripts

## analyze-version-bump.js

This script uses Claude AI to intelligently determine the appropriate semantic version bump (major, minor, or patch) based on git changes since the last published version.

### How it works

1. **Fetches git history**: Gets all commits and changes since the last git tag
2. **Sends to Claude API**: Analyzes the changes using Claude's understanding of semantic versioning
3. **Returns recommendation**: Outputs either "major", "minor", or "patch"

### Semantic Versioning Rules

- **MAJOR** (x.0.0): Breaking changes, incompatible API changes, removing features
- **MINOR** (0.x.0): New features, new functionality, backwards-compatible additions  
- **PATCH** (0.0.x): Bug fixes, documentation, refactoring, performance improvements

### Requirements

- `ANTHROPIC_API_KEY` must be set as a GitHub secret
- Repository must have git tags for version history
- Node.js 18+ for ES modules support

### Manual Testing

To test locally:

```bash
# Set your API key
export ANTHROPIC_API_KEY="your-api-key"

# Run the script
node .github/scripts/analyze-version-bump.js
```

### Usage in GitHub Actions

The script is automatically called in the publish workflow when:
- Code is pushed to the `main` branch (automatic publishing)
- Manual workflow dispatch with no version specified and `use_ai` set to "yes"

### Fallback Behavior

If Claude API fails or returns an invalid response, the script defaults to a "patch" version bump to ensure the workflow continues.

## Auto-Publishing Workflow

The publish workflow now supports three trigger modes:

### 1. Automatic on Push to Main
- Triggers automatically when code is pushed to the `main` branch
- Uses Claude AI to analyze changes and determine version bump
- Commits the version change back to the repository with `[skip ci]` flag
- Creates a git tag for the new version (e.g., `v1.2.3`)
- Publishes to private NPM registry

### 2. Manual via Workflow Dispatch
- Can be triggered manually from GitHub Actions UI
- Options:
  - **Leave version empty** → Claude AI determines bump automatically
  - **Specify "major", "minor", or "patch"** → Manual bump type
  - **Specify exact version like "1.2.3"** → Set specific version
  - **Toggle `use_ai` to "no"** → Disable AI analysis

### 3. On Release Creation
- Triggers when a GitHub release is published
- Uses the version from the release

### Infinite Loop Prevention

The workflow includes a simple and reliable safeguard to prevent infinite loops:

**Commit Message Detection**: The workflow skips any commit that contains the `[workflow:version-bump]` tag. This tag is automatically added to all version bump commits made by the workflow itself.

Example commit message:
```
chore: bump version to 1.2.3 [workflow:version-bump]
```

This approach ensures that:
- The workflow can still react to all file changes (including `package.json`)
- Only automated version bumps are ignored
- Manual version changes will still trigger the workflow

### Required Secrets

- `ANTHROPIC_API_KEY`: Your Claude API key for AI-powered version analysis
- `NPM_TOKEN`: NPM authentication token for publishing to private registry
- `WORKFLOW_PAT`: GitHub Personal Access Token for repository operations

### Workflow Permissions

The workflow requires:
- `contents: write` - To push commits and tags
- `id-token: write` - For authentication with private NPM registry