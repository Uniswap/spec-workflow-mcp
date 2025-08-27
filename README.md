# Spec Workflow MCP

[![GitHub Package](https://img.shields.io/badge/GitHub%20Package-@uniswap%2Fspec--workflow--mcp-blue)](https://github.com/uniswap/spec-workflow-mcp/packages)
[![VSCode Extension](https://badgen.net/vs-marketplace/v/Pimzino.spec-workflow-mcp)](https://marketplace.visualstudio.com/items?itemName=Pimzino.spec-workflow-mcp)

A Model Context Protocol (MCP) server that provides structured spec-driven development workflow tools for AI-assisted software development, featuring a real-time web dashboard and VSCode extension for monitoring and managing your project's progress directly in your development environment.

> **Note:** This package is published to GitHub Packages. See [Installation](#installation) for setup instructions.

## 📺 Showcase

### 🔄 Approval System in Action

<a href="https://www.youtube.com/watch?v=C-uEa3mfxd0" target="_blank">
  <img src="https://img.youtube.com/vi/C-uEa3mfxd0/maxresdefault.jpg" alt="Approval System Demo" width="600">
</a>

*See how the approval system works: create documents, request approval through the dashboard, provide feedback, and track revisions.*

### 📊 Dashboard & Spec Management

<a href="https://www.youtube.com/watch?v=g9qfvjLUWf8" target="_blank">
  <img src="https://img.youtube.com/vi/g9qfvjLUWf8/maxresdefault.jpg" alt="Dashboard Demo" width="600">
</a>

*Explore the real-time dashboard: view specs, track progress, navigate documents, and monitor your development workflow.*

## Installation

### Quick Setup

For detailed installation and setup instructions, see **[SETUP.md](docs/SETUP.md)**.

**Prerequisites**: GitHub Packages authentication is required. See [SETUP.md](docs/SETUP.md#prerequisites) for details.

```bash
# Quick start with dashboard
npx -y @uniswap/spec-workflow-mcp@latest /path/to/project --dashboard

# Or add to your MCP client configuration
# See SETUP.md for client-specific instructions
```

## Features

- **Structured Development Workflow** - Sequential spec creation (Requirements → Design → Tasks)
- **Real-Time Web Dashboard** - Monitor specs, tasks, and progress with live updates
- **VSCode Extension** - Integrated sidebar dashboard for developers working in VSCode
- **Document Management** - View and manage all spec documents from dashboard or extension
- **Archive System** - Organize completed specs to keep active projects clean
- **Task Progress Tracking** - Visual progress bars and detailed task status
- **Approval Workflow** - Complete approval process with approve, reject, and revision requests
- **Steering Documents** - Project vision, technical decisions, and structure guidance
- **Sound Notifications** - Configurable audio alerts for approvals and task completions
- **Bug Workflow** - Complete bug reporting and resolution tracking
- **Template System** - Pre-built templates for all document types
- **Cross-Platform** - Works on Windows, macOS, and Linux

## Quick Start

For complete setup instructions, see **[SETUP.md](docs/SETUP.md)**.

### Two Interface Options

1. **Web Dashboard** (Required for CLI users)

   ```bash
   npx -y @uniswap/spec-workflow-mcp@latest /path/to/project --dashboard
   ```

2. **VSCode Extension** (Recommended for VSCode users)
   - Install from [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=Pimzino.spec-workflow-mcp)
   - No separate dashboard needed - integrated into VSCode

See [SETUP.md](docs/SETUP.md#user-interface-options) for detailed interface options.

## How to Use

You can simply mention spec-workflow or whatever name you gave the MCP server in your conversation. The AI will handle the complete workflow automatically or you can use some of the example prompts below:

### Creating Specs

- **"Create a spec for user authentication"** - Creates complete spec workflow for that feature
- **"Create a spec called payment-system"** - Builds full requirements → design → tasks
- **"Build a spec for @prd"** - Takes your existing PRD and creates the complete spec workflow from it
- **"Create a spec for shopping-cart - include add to cart, quantity updates, and checkout integration"** - Detailed feature spec

### Getting Information

- **"List my specs"** - Shows all specs and their current status
- **"Show me the user-auth progress"** - Displays detailed progress information

### Implementation

- **"Execute task 1.2 in spec user-auth"** - Runs a specific task from your spec
- **Copy prompts from dashboard** - Use the "Copy Prompt" button in the task list on your dashboard

The agent automatically handles approval workflows, task management, and guides you through each phase.

## MCP Client Setup

See **[SETUP.md](docs/SETUP.md#mcp-client-setup)** for detailed configuration instructions for:

- Augment Code
- Claude Code CLI
- Claude Desktop
- Cline/Claude Dev
- Continue IDE
- Cursor IDE
- OpenCode

Example configuration:

```json
{
  "mcpServers": {
    "spec-workflow": {
      "command": "npx",
      "args": ["-y", "@uniswap/spec-workflow-mcp@latest", "/path/to/your/project"]
    }
  }
}
```

## Available Tools

### Workflow Guides

- `spec-workflow-guide` - Complete guide for the spec-driven workflow process
- `steering-guide` - Guide for creating project steering documents

### Spec Management

- `create-spec-doc` - Create/update spec documents (requirements, design, tasks)
- `spec-list` - List all specs with status information
- `spec-status` - Get detailed status of a specific spec
- `manage-tasks` - Comprehensive task management for spec implementation

### Context & Templates

- `get-template-context` - Get markdown templates for all document types
- `get-steering-context` - Get project steering context and guidance
- `get-spec-context` - Get context for a specific spec

### Steering Documents

- `create-steering-doc` - Create project steering documents (product, tech, structure)

### Approval System

- `request-approval` - Request user approval for documents
- `get-approval-status` - Check approval status
- `delete-approval` - Clean up completed approvals

## User Interfaces

### Web Dashboard

The web dashboard is a separate service for CLI users. Each project gets its own dedicated dashboard running on an ephemeral port. The dashboard provides:

- **Live Project Overview** - Real-time updates of specs and progress
- **Document Viewer** - Read requirements, design, and tasks documents
- **Task Progress Tracking** - Visual progress bars and task status
- **Steering Documents** - Quick access to project guidance
- **Dark Mode** - Automatically enabled for better readability

#### Dashboard Features

<<<<<<< HEAD

=======
>>>>>>> upstream/main

- **Spec Cards** - Overview of each spec with status indicators
- **Document Navigation** - Switch between requirements, design, and tasks
- **Task Management** - View task progress and copy implementation prompts
- **Real-Time Updates** - WebSocket connection for live project status

### VSCode Extension

The VSCode extension provides all dashboard functionality directly within your IDE:

- **Sidebar Integration** - Access everything from the Activity Bar
- **Archive Management** - Switch between active and archived specs
- **Native Dialogs** - VSCode confirmation dialogs for all actions
- **Editor Integration** - Context menu actions for approvals and comments
- **Sound Notifications** - Configurable audio alerts
- **No External Dependencies** - Works entirely within VSCode

#### Extension Advantages for VSCode Users

- **Single Environment** - No need to switch between browser and IDE
- **Native Experience** - Uses VSCode's native UI components
- **Better Integration** - Context menu actions and editor integration
- **Simplified Setup** - No separate dashboard service required

## Workflow Process

### 1. Project Setup (Recommended)

```
steering-guide → create-steering-doc (product, tech, structure)
```

Creates foundational documents to guide your project development.

### 2. Feature Development

```
spec-workflow-guide → create-spec-doc → [review] → implementation
```

Sequential process: Requirements → Design → Tasks → Implementation

### 3. Implementation Support

- Use `get-spec-context` for detailed implementation context
- Use `manage-tasks` to track task completion
- Monitor progress via the web dashboard

## File Structure

```
your-project/
  .spec-workflow/
    steering/
      product.md        # Product vision and goals
      tech.md          # Technical decisions
      structure.md     # Project structure guide
    specs/
      {spec-name}/
        requirements.md # What needs to be built
        design.md      # How it will be built
        tasks.md       # Implementation breakdown
    approval/
      {spec-name}/
        {document-id}.json # Approval status tracking
```

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode (with auto-reload)
npm run dev

# Start the production server
npm start

# Clean build artifacts
npm run clean
```

## Troubleshooting

For comprehensive troubleshooting information, see **[SETUP.md](docs/SETUP.md#troubleshooting)**.

### Quick Help

- **Dashboard issues**: Check [SETUP.md](docs/SETUP.md#troubleshooting) for port and connection problems
- **Authentication**: See [GitHub Packages setup](docs/SETUP.md#prerequisites)
- **MCP client issues**: Refer to [client-specific setup](docs/SETUP.md#mcp-client-setup)

### Getting Help

- Check the [Issues](../../issues) page for known problems
- Create a new issue using the provided templates
- Use the workflow guides within the tools for step-by-step instructions

## License

GPL-3.0
