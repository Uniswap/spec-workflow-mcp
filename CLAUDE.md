# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Spec Workflow MCP server - a Model Context Protocol implementation that provides structured spec-driven development workflow tools with a real-time web dashboard for AI-assisted software development.

## Development Commands

### Build and Development

```bash
# Install dependencies
npm install

# Full build (TypeScript + Dashboard + Static assets)
npm run build

# Development mode with auto-reload
npm run dev

# Start production server
npm start

# Clean build artifacts
npm run clean

# Dashboard-specific development
npm run dev:dashboard    # Run dashboard in development mode

npm run dev:dashboard -- --path=/path/to/project # Run dashboard in development mode for a specific project
npm run build:dashboard  # Build dashboard only
```

### Running the MCP Server

```bash
# With dashboard (required for approvals and tracking)
npx -y @uniswap/spec-workflow-mcp@latest /path/to/project --dashboard
npx -y @uniswap/spec-workflow-mcp@latest /path/to/project --dashboard --port 3000

# For local development
npm run dev /path/to/project -- --dashboard
```

## Architecture

### Core Components

1. **MCP Server** (`src/server.ts`, `src/index.ts`)
   - Implements Model Context Protocol for AI tool integration
   - Manages tool registration and handling
   - Coordinates with dashboard via WebSocket

2. **Dashboard** (`src/dashboard/`, `src/dashboard_frontend/`)
   - Real-time web interface built with React + TypeScript + Vite
   - WebSocket communication for live updates
   - Approval system for document review
   - Task progress tracking

3. **Tools** (`src/tools/`)
   - Each tool is a separate TypeScript module
   - Key tools: `spec-workflow-guide`, `create-spec-doc`, `manage-tasks`, `orchestrate-with-agents`
   - Tools handle spec creation, approval requests, and task management

4. **Agent Orchestration** (`.claude/agents/`)
   - `agent-orchestrator.md`: Coordinates multiple AI agents
   - `agent-capability-analyst.md`: Analyzes agent capabilities
   - Integration point: `src/tools/orchestrate-with-agents.ts`

### Workflow Structure

The system creates this directory structure in projects:

```trees
.spec-workflow/
  steering/          # Project guidance documents
    product.md
    tech.md
    structure.md
  specs/
    {spec-name}/     # Each spec gets its own directory
      requirements.md
      design.md
      tasks.md
  approval/          # Approval tracking
    {spec-name}/
      {document-id}.json
```

### Key Implementation Details

1. **Session Management** (`src/core/session-manager.ts`)
   - Tracks active dashboard connections
   - Manages approval state synchronization
   - Handles real-time updates via WebSocket

2. **Approval System**
   - Frontend: `src/dashboard_frontend/src/modules/approvals/`
   - Backend: `src/tools/request-approval.ts`, `get-approval-status.ts`
   - Enables human-in-the-loop review of generated documents

3. **Task Management** (`src/tools/manage-tasks.ts`)
   - Parses markdown task lists with status markers: `[]` pending, `[-]` in-progress, `[x]` completed
   - Integrates with agent orchestration for automated implementation
   - Tracks progress in real-time

4. **Dashboard Frontend**
   - Built with Vite + React + TypeScript + Tailwind CSS
   - Router-based navigation (`react-router-dom`)
   - Real-time updates via WebSocket
   - Markdown rendering with syntax highlighting

## TypeScript Configuration

- Target: ES2022
- Module: node16
- Strict mode enabled
- Dashboard frontend excluded from main TypeScript build (handled by Vite)

## Development Workflow

When making changes:

1. **For MCP server changes**: Modify files in `src/` (excluding `dashboard_frontend/`)
2. **For dashboard changes**: Modify files in `src/dashboard_frontend/`
3. **For tool additions**: Add new tool in `src/tools/` and register in `src/tools/index.ts`
4. **For agent modifications**: Update markdown files in `.claude/agents/`
5. Always run `npm run typecheck` after changes to ensure there are no TypeScript errors

## Testing Changes

1. Build the project: `npm run build`
2. Run in development: `npm run dev /path/to/test/project -- --dashboard`
3. Test dashboard separately: `npm run dev:dashboard`
4. Verify WebSocket communication in browser console
5. Check approval flow works end-to-end

## Key Integration Points

- **MCP Client Configuration**: Server expects project path as first argument
- **Dashboard Communication**: Uses WebSocket on `/ws` endpoint
- **Approval System**: Requires dashboard to be running for document approvals
- **Agent Orchestration**: Invoked through `orchestrate-with-agents` tool
- **File Watching**: Uses `chokidar` for monitoring spec document changes

## Steering Docs

Reference more specific steering documentation as documented below:

- Product: @.spec-workflow/steering/product.md
- Project Structure: @.spec-workflow/steering/structure
- Technical: @.spec-workflow/steering/tech.md
