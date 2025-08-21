#!/bin/bash

# Launch script for spec-workflow-mcp with orchestration support
# Usage: ./launch-mcp.sh [project-path]

PROJECT_PATH=${1:-"/Users/nick.koutrelakos/Projects/universe/"}
DASHBOARD_PORT=${2:-3456}

echo "Starting spec-workflow-mcp with orchestration support..."
echo "Project: $PROJECT_PATH"
echo "Dashboard: http://localhost:$DASHBOARD_PORT"

# Set environment variables
export PROJECT_PATH="$PROJECT_PATH"
export DASHBOARD_PORT="$DASHBOARD_PORT"

# Launch the MCP server
node /Users/nick.koutrelakos/Projects/forked/spec-workflow-mcp/dist/index.js "$PROJECT_PATH"