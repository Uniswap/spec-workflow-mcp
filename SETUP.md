# Setting Up the Forked spec-workflow-mcp with Orchestration

## Quick Setup

### Method 1: Update Claude Configuration

1. Open your Claude configuration:
   - In Claude Code: Settings → Edit Configuration
   - Or directly edit: `~/.claude.json`

2. Find the existing `spec-workflow` configuration under your project's `mcpServers` section

3. Replace it with this configuration (or add alongside as `spec-workflow-forked`):

```json
"spec-workflow-forked": {
  "type": "stdio",
  "command": "node",
  "args": [
    "/Users/nick.koutrelakos/Projects/forked/spec-workflow-mcp/dist/index.js",
    "/Users/nick.koutrelakos/Projects/universe/"
  ],
  "env": {
    "PROJECT_PATH": "/Users/nick.koutrelakos/Projects/universe/",
    "DASHBOARD_PORT": "3456"
  }
}
```

4. Restart Claude Code for changes to take effect

### Method 2: Test with NPM Link (Development)

If you want to use it like the original but with your changes:

```bash
cd /Users/nick.koutrelakos/Projects/forked/spec-workflow-mcp
npm link

# Then in your project directory:
cd /Users/nick.koutrelakos/Projects/universe
npm link @pimzino/spec-workflow-mcp
```

### Method 3: Direct Execution (Testing)

Run the MCP server directly:

```bash
cd /Users/nick.koutrelakos/Projects/forked/spec-workflow-mcp
./launch-mcp.sh /Users/nick.koutrelakos/Projects/universe/
```

## Installing the Orchestration Agents

Copy the agent definitions to your Claude Code agents directory:

```bash
# Global installation (for all projects)
cp .claude/agents/*.md ~/.claude/agents/

# OR project-specific (for current project only)
cp .claude/agents/*.md /Users/nick.koutrelakos/Projects/universe/.claude/agents/
```

## Verifying the Setup

1. After restarting Claude Code, you should be able to call:
   - `spec-workflow-guide` - Should now include orchestration steps
   - `orchestrate-with-agents` - New tool for agent orchestration

2. Check if agents are available:
   - Use the Task tool to list available agents
   - You should see `agent-orchestrator` and `agent-capability-analyst`

3. Test orchestration:
   ```
   Call orchestrate-with-agents with:
   - task: "Test orchestration"
   - phase: "requirements"
   ```

## Configuration Options

Edit `.spec-workflow/orchestration.yaml` in your project to customize:
- Enable/disable orchestration
- Set capability preferences
- Adjust confidence thresholds
- Configure parallel execution

## Troubleshooting

### "Tool not found" error
- Ensure you've run `npm install && npm run build`
- Check that `/dist/index.js` exists
- Verify the path in your Claude configuration

### "Agent orchestrator not available"
- Copy agent definitions to `.claude/agents/`
- Ensure Claude Code can read the agents directory
- Check file permissions

### Changes not taking effect
- Restart Claude Code completely
- Clear any MCP server caches
- Check for typos in configuration

## Dashboard Access

When running, access the dashboard at:
http://localhost:3456

This shows:
- Spec workflow progress
- Task status
- Approval requests
- Orchestration activity (when implemented)