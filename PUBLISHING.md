# Publishing to GitHub Packages

This guide explains how to publish the `@uniswap/spec-workflow-mcp` package to GitHub Packages.

## Prerequisites

1. **GitHub Personal Access Token (PAT)**
   - Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
   - Create a **classic token** or **fine-grained token** with:
     - `write:packages` scope (to publish)
     - `read:packages` scope (to install)
     - `delete:packages` scope (optional, for cleanup)
   - Save the token securely

2. **Repository Access**
   - Ensure you have write access to the repository
   - For organization packages, ensure you're a member of the organization

## Manual Publishing

### 1. Set up Authentication

```bash
# Set the token as an environment variable
export NODE_AUTH_TOKEN=YOUR_GITHUB_TOKEN

# Or add to ~/.npmrc (be careful not to commit this!)
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN" >> ~/.npmrc
```

### 2. Build and Publish

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Bump version (choose one)
npm version patch  # 0.0.18 → 0.0.19
npm version minor  # 0.0.18 → 0.1.0
npm version major  # 0.0.18 → 1.0.0

# Publish to GitHub Packages
npm publish
```

## Automated Publishing (GitHub Actions)

The repository includes GitHub Actions workflows for automated publishing:

### Release-based Publishing

1. Create a new release on GitHub
2. The workflow will automatically:
   - Build the package
   - Publish to GitHub Packages using the release tag as version

### Manual Workflow Dispatch

1. Go to Actions → "Publish Package to GitHub Packages"
2. Click "Run workflow"
3. Optionally specify a version (or leave empty to use package.json version)
4. The workflow will build and publish

## Verifying Publication

After publishing, verify the package is available:

1. **Check GitHub Packages**:
   - Go to <https://github.com/uniswap/spec-workflow-mcp/packages>
   - You should see the package listed

2. **Test Installation**:

   ```bash
   # In a test directory
   echo "@uniswap:registry=https://npm.pkg.github.com" > .npmrc
   echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN" >> .npmrc
   npm install @uniswap/spec-workflow-mcp@latest
   ```

3. **Test with npx**:

   ```bash
   NODE_AUTH_TOKEN=YOUR_GITHUB_TOKEN npx @uniswap/spec-workflow-mcp@latest --version
   ```

## Troubleshooting

### "401 Unauthorized" Error

- Verify your token has the correct scopes
- Ensure the token hasn't expired
- Check that you're authenticated: `npm whoami --registry=https://npm.pkg.github.com`

### "404 Not Found" Error

- The package name must match `@uniswap/spec-workflow-mcp`
- Ensure the repository exists and you have access
- Wait a few minutes after publishing for the package to be available

### "403 Forbidden" Error

- Check organization membership if publishing to an org
- Verify repository permissions
- Ensure the package name matches the repository owner

### Package Not Installing

- Clear npm cache: `npm cache clean --force`
- Verify .npmrc configuration
- Try using the full registry URL: `npm install @uniswap/spec-workflow-mcp --registry=https://npm.pkg.github.com`

## Version Management

- Use semantic versioning (MAJOR.MINOR.PATCH)
- Update CHANGELOG.md with version changes
- Tag releases in git: `git tag v0.0.19 && git push --tags`
- Consider using conventional commits for automated versioning

## Security Notes

- **Never commit .npmrc with tokens**
- Add `.npmrc` to `.gitignore` if it contains tokens
- Use environment variables in CI/CD
- Rotate tokens regularly
- Use fine-grained tokens with minimal scopes when possible

## Using in Projects

For projects that need to use this package:

### Option 1: Project-level Configuration

```bash
# In your project root
echo "@uniswap:registry=https://npm.pkg.github.com" > .npmrc
echo "//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}" >> .npmrc
```

### Option 2: User-level Configuration

```bash
# In your home directory
npm config set @uniswap:registry https://npm.pkg.github.com
npm config set //npm.pkg.github.com/:_authToken NODE_AUTH_TOKEN
```

### Option 3: Environment Variable

```bash
NODE_AUTH_TOKEN=YOUR_GITHUB_TOKEN npm install @uniswap/spec-workflow-mcp
```

## MCP Client Configuration

When configuring MCP clients to use the GitHub Package:

```json
{
  "mcpServers": {
    "spec-workflow": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@uniswap/spec-workflow-mcp@latest", "/path/to/project"],
      "env": {
        "NODE_AUTH_TOKEN": "YOUR_GITHUB_TOKEN"
      }
    }
  }
}
```

Or set the token globally in your shell profile:

```bash
# Add to ~/.bashrc, ~/.zshrc, etc.
export NODE_AUTH_TOKEN="YOUR_GITHUB_TOKEN"
```
