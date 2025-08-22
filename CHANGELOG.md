# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.20] - 2025-08-22

### Added
- Added `--AutoStartDashboard` flag to automatically start and open dashboard when running MCP server
- Added `--port` parameter support for MCP server mode (previously only worked with `--dashboard` mode)
- Added comprehensive `--help` command with usage examples and parameter documentation
- Added validation for unknown command-line flags with helpful error messages

### Improved
- Enhanced shutdown behavior messaging for MCP server mode
- Removed duplicate console logging when using custom ports
- Updated README with AutoStartDashboard configuration examples for all MCP clients
- Clarified that MCP server lifecycle is controlled by the MCP client (not Ctrl+C)

### Fixed
- Fixed issue where browser would attempt to open twice with AutoStartDashboard
- Fixed duplicate "Using custom port" messages in console output

## [0.0.19] - 2025-08-21

### Fixed
- Fixed MCP server shutdown issues where server process would stay running after MCP client disconnects
- Added proper stdio transport onclose handler to detect client disconnection
- Added stdin monitoring for additional disconnect detection safety
- Enhanced stop() method with better error handling and cleanup sequence

## [0.0.18] - 2025-08-17

### Improvements
- Selected spec on tasks page is now persisted across page refreshes and now allows for deeplinking.

## [0.0.17] - 2025-08-17

### Bug Fixes
- Fixed a bug where request approval tool would fail when starting the MCP server without a projectdir. (wasnt really a bug as projectdir was recommended but I have made this more robust).

## [0.0.16] - 2025-08-15

### Bug Fixes
- Fixed a bug where the dashboard would not automatically update task status when the MCP tool was called and a refresh was required to view new status.

## [0.0.15] - 2025-08-15

### Improvements
- Moved to custom alert & prompt modals rather than window.alert and window.prompt. This should fix issues with dashboard showing prompts in VSCode Simple Browser
- Moved highlight color picker to the comment modal rather than having it in the comments list.

### New Features
- Added Notification Volume Slider.

## [0.0.14] - 2025-08-14

### Added
- Added a new 'refresh-tasks' tool to help align the task list with the current requirements and design. This is particularly useful if you make changes to the requirements / design docs mid integration.

### Misc
- Removed some legacy markdown files that were left over from initial development.

## [0.0.13] - 2025-08-13

### Added
- Added support for relative project paths and the use of tilde (~) in project paths. Below path formats are now supported:
    - npx -y @pimzino/spec-workflow-mcp ~/my-project
    - npx -y @pimzino/spec-workflow-mcp ./relative-path
    - npx -y @pimzino/spec-workflow-mcp /absolute/path

## [0.0.12] - 2025-08-11

### Fixed
- Fixed a bug with prose containers which would limit rendered content from fully displaying in the view modals.
- Fixed a bug with package version not showing in the header / mobile menu.

## [0.0.11] - 2025-08-11

### Fixed
- Page refresh on websocket updates. Pages will no longer reset on websocket updates.
- Dashboard accessibility improvements.

### Added
- Optimized dashboard for tablets.
- Users can now specify a custom port for the dashboard web server using the `--port` parameter. If not specified, an ephemeral port will be used.
- Added the ability to change task status directly from the task page in the dashboard.

## [0.0.10] - 2025-08-10

### Fixed
- Fixed bug with spec steering page not displaying correctly on smaller screens (mobile devices).

## [0.0.9] - 2025-08-10

### Fixed
- Clipboard API wasnt working in HTTP contexts over LAN. Added fallback method using `document.execCommand('copy')` for browsers without clipboard API access.

### Changed
- Updated copy prompt to only include task id and spec name.
- Improved copy button feedback with visual success/error states and colored indicators.
- Dashboard --> Updated viewport to 80% screen width in desktop and 90% on mobile devices.

### Added
- Spec document editor directly in the dashboard.
- Spec archiving and unarchiving in the dashboard.
- Steering document page for creating, viewing and editing steering documents directly from the dashboard.


## [0.0.8] - 2025-08-09

### Updated
- Rebuilt the web dashboard with a mobile first responsive design bringing you the following improvements:
    - Responsive Design
    - Improved UI / UX
    - Improved Performance
    - Disconnected from MCP server - must be started manually
    - Can now run multiple MCP server instances for the same project on a single dashboard instance


**NOTE: This is a breaking change. The dashboard will no longer auto start and must be manually run. Please review the README for updated instructions.**

## [0.0.7] - 2025-08-08

### Fixed
- Fixed a bug with the task parser / manage-tasks tool refusing to find tasks.

### Updated
- Improved the task parser and created a task parser utility function to be shared across tools and UI.

## [0.0.6] - 2025-08-08

### Updated
- Refined the spec workflow guide to remove any ambiguity, made it more concise.
- Refined manage-tasks tool description.
- Refined request-approval tool description and next steps output.
- Refined create-spec-doc tool next steps output.

### Added
- Imporoved dashboard task parser and task counter to support Parent/Child task relationships otherwise known as subtasks.
    - Parent tasks if only including a name will be parsed as a Task Section Heading in the dashboard.
    - The parser should now be more flexible to handle tasks in various formats as long as they still follow the same checklist, task name, and status format at the very least.

## [0.0.5] - 2025-08-07

### Updated
- Refined spec workflow to include conditional web search for the design phase to ensure the agent is providing the best possible for all phases.

### Fixed
- Improved task progress cards to display all task information in the card.

## [0.0.4] - 2025-08-07

### Fixed
- Fixed clipboard copying functionality in dashboard for HTTP contexts (non-HTTPS environments)
- Added fallback clipboard method using `document.execCommand('copy')` for browsers without clipboard API access
- Improved copy button feedback with visual success/error states and colored indicators
- Enhanced mobile device compatibility for clipboard operations
- Removed development obsolete bug tracking functionality from dashboard frontend

## [0.0.3] - 2025-08-07

### Updated
- Updated README.md with example natural language prompts that will trigger the various tools.
- task-template.md updated to remove atomic task requirements and format guidelines and moved them to the spec workflow guide tool.
- Refined instructions for the agent to output the dashboard URL to the user.
- Removed the Steering Document Compliance section from tasks-template.md for simplification.

### Added
- I have added a session.json in the .spec-workflow directory that stores the dashboard URL and the process ID of the dashboard server. This allows the agent to retrieve the dashboard URL as well as the user if required. Note: This should help users one headless systems where the dashboard us unable to auto load, you can retrieve the session information from the json file.

### Fixed
- Misc fixes cause HEAP out of memory issues on the server causing the server to crash when running more than one instance.

### Added

## [0.0.2] - 2025-08-07

### Updated
- Updated README.md with showcase videos on youtube.
- Removed testing mcp.json file that was left over from initial development.

## [0.0.1] - 2025-08-07

### Added
- MCP server implementation with 13 tools for spec-driven development
- Sequential workflow enforcement (Requirements → Design → Tasks)
- Real-time web dashboard with WebSocket updates
- Document creation and validation tools
- Human-in-the-loop approval system
- Template system for consistent documentation
- Context optimization tools for efficient AI workflows
- Task management and progress tracking
- Cross-platform support (Windows, macOS, Linux)
- Support for major AI development tools (Claude Desktop, Cursor, etc.)
- Automatic project structure generation
- Dark mode dashboard interface
- GitHub issue templates