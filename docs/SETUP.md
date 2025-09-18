# Setup Guide

This guide covers all setup options for spec-workflow-mcp, including installation, configuration, and troubleshooting.

## Prerequisites

### NPM Registry Installation

We publish the `spec-workflow-mcp` to a private npm package registry, so you’ll need to setup a read-only auth token to be able to fetch the package from npmjs.

1. The read only token is stored in 1password in the general Engineering vault under “[**read-only npm-token**](https://start.1password.com/open/i?a=DXU26BR6HNGVFCPLPXN7OGHSYM&v=a35mtzmo445emckvxmae47kbba&i=mseb2ygsl6gi3uxxhvmn5nfime&h=uniswaplabs.1password.com)”. If you have trouble finding it, please reach out to [\*\*#team-security](https://uniswapteam.enterprise.slack.com/archives/C015DE5T719).\*\*
2. Create/Update your `~/.npmrc` with the necessary auth config by running the command below, substituting `${NODE_AUTH_TOKEN}` with the 1password npm token from step 1:

```bash
if [ -f "$HOME/.npmrc" ]; then
  echo "~/.npmrc file already exists, and we do not know its contents so we cannot predict how these lines will conflict with your existing .npmrc."
  echo "Please manually add these private NPM configs to your ~/.npmrc file and make sure to replace \${NODE_AUTH_TOKEN} with your 1password npm token:"
  echo ""
  echo "@uniswap:registry=https://registry.npmjs.org"
  echo "registry=https://registry.npmjs.org/"
  echo "always-auth=true"
  echo "//registry.npmjs.org/:_authToken=\${NODE_AUTH_TOKEN}"
else
  cat <<EOF >> ~/.npmrc
@uniswap:registry=https://registry.npmjs.org
registry=https://registry.npmjs.org/
always-auth=true
//registry.npmjs.org/:_authToken=\${NODE_AUTH_TOKEN}
EOF
fi
```

3. Create a new terminal/shell and then run: `npx -y @uniswap/spec-workflow-mcp@latest /path/to/project --dashboard` where `/path/to/project` is a code repository you want to develop a new feature spec for, and it will open up a locally-hosted webpage with which you can view the development progress of your Claude Code tasks.

## Quick Start Options

### Option 1: NPX (Recommended for Quick Use)

```bash
# Dashboard only mode (uses ephemeral port)
npx -y @uniswap/spec-workflow-mcp@latest /path/to/your/project --dashboard

# Dashboard only with custom port
npx -y @uniswap/spec-workflow-mcp@latest /path/to/your/project --dashboard --port 3000

# View all available options
npx -y @uniswap/spec-workflow-mcp@latest --help
```

**Command-Line Options:**

- `--help` - Show comprehensive usage information and examples
- `--dashboard` - Run dashboard-only mode (no MCP server)
- `--AutoStartDashboard` - Auto-start dashboard with MCP server
- `--port <number>` - Specify dashboard port (1024-65535)

### Option 2: MCP Client Integration

Add to your AI tool configuration (for Claude Code, this is `$HOME/claude.json` > find your project > `mcpServers`):

```json
{
  "mcpServers": {
    "spec-workflow": {
      "command": "npx",
      "args": [
        "-y",
        "@uniswap/spec-workflow-mcp@latest",
        "/path/to/your/project"
      ]
    }
  }
}
```

**With Auto-Started Dashboard**:

```json
{
  "mcpServers": {
    "spec-workflow": {
      "command": "npx",
      "args": [
        "-y",
        "@uniswap/spec-workflow-mcp@latest",
        "/path/to/your/project",
        "--AutoStartDashboard"
      ]
    }
  }
}
```

**With Custom Port**:

```json
{
  "mcpServers": {
    "spec-workflow": {
      "command": "npx",
      "args": [
        "-y",
        "@uniswap/spec-workflow-mcp@latest",
        "/path/to/your/project",
        "--AutoStartDashboard",
        "--port",
        "3456"
      ]
    }
  }
}
```

## MCP Client Setup

### Augment Code

Configure in your Augment settings:

```json
{
  "mcpServers": {
    "spec-workflow": {
      "command": "npx",
      "args": [
        "-y",
        "@uniswap/spec-workflow-mcp@latest",
        "/path/to/your/project"
      ]
    }
  }
}
```

### Claude Code CLI

Add to your MCP configuration:

```bash
claude mcp add spec-workflow --scope user -- npx -y @uniswap/spec-workflow-mcp@latest --AutoStartDashboard
```

**Note:** You may need to wrap the command in `cmd.exe /c "npx -y @uniswap/spec-workflow-mcp@latest /path/to/your/project"` for Windows.

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "spec-workflow": {
      "command": "npx",
      "args": [
        "-y",
        "@uniswap/spec-workflow-mcp@latest",
        "/path/to/your/project"
      ]
    }
  }
}
```

Or with auto-started dashboard:

```json
{
  "mcpServers": {
    "spec-workflow": {
      "command": "npx",
      "args": [
        "-y",
        "@uniswap/spec-workflow-mcp@latest",
        "/path/to/your/project",
        "--AutoStartDashboard"
      ]
    }
  }
}
```

### Cline/Claude Dev

Add to your MCP server configuration:

```json
{
  "mcpServers": {
    "spec-workflow": {
      "command": "npx",
      "args": [
        "-y",
        "@uniswap/spec-workflow-mcp@latest",
        "/path/to/your/project"
      ]
    }
  }
}
```

### Continue IDE Extension

Add to your Continue configuration:

```json
{
  "mcpServers": {
    "spec-workflow": {
      "command": "npx",
      "args": [
        "-y",
        "@uniswap/spec-workflow-mcp@latest",
        "/path/to/your/project"
      ]
    }
  }
}
```

### Cursor IDE

Add to your Cursor settings (`settings.json`):

```json
{
  "mcp.servers": {
    "spec-workflow": {
      "command": "npx",
      "args": [
        "-y",
        "@uniswap/spec-workflow-mcp@latest",
        "/path/to/your/project"
      ]
    }
  }
}
```

### OpenCode

Add to your `opencode.json` configuration file (either global at `~/.config/opencode/opencode.json` or project-specific):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "spec-workflow": {
      "type": "local",
      "command": [
        "npx",
        "-y",
        "@uniswap/spec-workflow-mcp@latest",
        "/path/to/your/project"
      ],
      "enabled": true
    }
  }
}
```

## Development Setup

### Local Development with Forked Repository

#### Method 1: Direct Configuration

1. Clone and build the repository:

   ```bash
   git clone https://github.com/your-org/spec-workflow-mcp
   cd spec-workflow-mcp
   npm install
   npm run build
   ```

2. Update your MCP configuration to point to the local build:

   ```json
   "spec-workflow": {
     "type": "stdio",
     "command": "node",
     "args": [
       "/path/to/spec-workflow-mcp/dist/index.js",
       "/path/to/your/project/"
     ],
     "env": {
       "PROJECT_PATH": "/path/to/your/project/",
       "DASHBOARD_PORT": "3456"
     }
   }
   ```

3. Restart your MCP client for changes to take effect

#### Method 2: NPM Link (Development)

Use npm link to test your local changes:

```bash
cd /path/to/spec-workflow-mcp
npm link

# Then in your project directory:
cd /path/to/your/project
npm link @uniswap/spec-workflow-mcp
```

#### Method 3: Direct Execution (Testing)

Run the MCP server directly:

```bash
cd /path/to/spec-workflow-mcp
npm run dev /path/to/your/project -- --dashboard
```

### Installing Orchestration Agents (Advanced)

If using the orchestration features:

```bash
# Global installation (for all projects)
cp .claude/agents/*.md ~/.claude/agents/

# OR project-specific (for current project only)
cp .claude/agents/*.md /path/to/your/project/.claude/agents/
```

## User Interface Options

### Web Dashboard (Required for CLI users)

The web dashboard provides:

- **Live Project Overview** - Real-time updates of specs and progress
- **Document Viewer** - Read requirements, design, and tasks documents
- **Task Progress Tracking** - Visual progress bars and task status
- **Approval Workflow** - Review and approve documents

Start the dashboard:

```bash
npx -y @uniswap/spec-workflow-mcp@latest /path/to/your/project --dashboard
```

If you use the `--AutoStartDashboard` flag with your MCP client, the dashboard will start automatically and you don't need to run the command above.

### VSCode Extension (Recommended for VSCode users)

Install the **[Spec Workflow MCP Extension](https://marketplace.visualstudio.com/items?itemName=Pimzino.spec-workflow-mcp)** from the VSCode marketplace.

**Extension Features:**

- Integrated sidebar dashboard with real-time updates
- Archive system for organizing completed specs
- Full approval workflow with VSCode native dialogs
- Sound notifications for approvals and completions
- Editor context menu actions for approvals and comments

**IMPORTANT:** For CLI users, the web dashboard is mandatory. For VSCode users, the extension replaces the need for a separate web dashboard.

## Verifying Your Setup

### Basic Verification

1. Check tool availability:

   ```
   Call spec-workflow-guide
   ```

2. List available specs:

   ```
   Call spec-list with your project path
   ```

3. Create a test spec:

   ```
   Create a spec called test-feature
   ```

### Advanced Verification (Orchestration)

1. Check orchestration availability:

   ```
   Call orchestrate-with-agents with:
   - task: "Test orchestration"
   - phase: "requirements"
   ```

2. Verify agent availability:
   - Use the Task tool to list available agents
   - Look for `agent-orchestrator` and `agent-capability-analyst`

## Configuration Options

### Project Configuration

Create `.spec-workflow/orchestration.yaml` in your project to customize:

```yaml
orchestration:
  enabled: true
  preferences:
    capabilities: []
    avoidCapabilities: []
  confidence_threshold: 0.7
  parallel_execution: true
```

You can copy the default config from `configs/orchestration.yaml` in this repo to `.spec-workflow/orchestration.yaml` in your project to get started quickly!

### Dashboard Configuration

Set environment variables for dashboard customization:

```bash
DASHBOARD_PORT=3456  # Custom port for dashboard
PROJECT_PATH=/path/to/project  # Project directory
```

## Troubleshooting

### Common Issues

1. **Dashboard not starting**

   - Ensure you're using the `--dashboard` flag
   - Check console output for the dashboard URL
   - Verify port availability (use `--port` for custom port)

2. **Private NPM registry authentication failure**

   - Verify your token is valid and has package access
   - Check `.npmrc` configuration
   - Ensure the NPM read-only auth token from 1password is set correctly

3. **MCP server not connecting**

   - Verify file paths in your configuration
   - Ensure Node.js is available in your system PATH
   - Check that the project has been built (`npm run build`)

4. **Port conflicts**

   - Use `--port <different-number>` to specify another port
   - Check what's using the port:
     - Windows: `netstat -an | find ":3000"`
     - macOS/Linux: `lsof -i :3000`
   - Omit `--port` to use an ephemeral port

5. **Dashboard not updating**
   - WebSocket connection may be lost
   - Refresh the browser
   - Check browser console for errors

### Advanced Troubleshooting

#### "Tool not found" error

- Ensure you've run `npm install && npm run build`
- Check that `/dist/index.js` exists
- Verify the path in your MCP configuration

#### "Agent orchestrator not available"

- Copy agent definitions to `.claude/agents/`
- Ensure MCP client can read the agents directory
- Check file permissions

#### Changes not taking effect

- Restart your MCP client completely
- Clear any MCP server caches
- Check for typos in configuration

## Getting Help

- Check the [Issues](https://github.com/uniswap/spec-workflow-mcp/issues) page for known problems
- Create a new issue using the provided templates
- Use the workflow guides within the tools for step-by-step instructions

## Next Steps

After setup, refer to the main [README](README.md) for:

- How to use the tools
- Creating specs and steering documents
- Workflow processes
- Available tools and commands
