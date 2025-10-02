import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  McpError,
  ErrorCode
} from '@modelcontextprotocol/sdk/types.js';
import { registerTools, handleToolCall } from './tools/index.js';
import { registerResources, handleResourceOperation } from './resources/index.js';
import { validateProjectPath } from './core/path-utils.js';
import { DashboardServer } from './dashboard/server.js';
import { SessionManager } from './core/session-manager.js';

export interface DashboardStartOptions {
  autoStart: boolean;
  port?: number;
}

export class SpecWorkflowMCPServer {
  private server: Server;
  private projectPath!: string;
  private dashboardServer?: DashboardServer;
  private dashboardUrl?: string;
  private sessionManager?: SessionManager;
  private dashboardMonitoringInterval?: NodeJS.Timeout;
  private browserOpened: boolean = false;

  constructor() {
    this.server = new Server({
      name: 'spec-workflow',
      version: '1.0.0',
      instructions: `You are an AI assistant specialized in spec-driven development using MCP tools.

## CRITICAL FIRST STEP
**ALWAYS call the spec-workflow-guide tool FIRST** when users request:
- Spec creation or feature development
- Any mention of specifications, requirements, design, or tasks
- Working on new features or project planning

The spec-workflow-guide tool contains the complete workflow instructions that MUST be followed exactly.

## Key Principles
- Use ONLY the provided MCP tools - never create documents manually
- Follow the exact workflow sequence: Requirements → Design → Tasks → Implementation
- Request user approval after EACH document before proceeding
- Never skip steps or phases

## Available Tools Overview
- **spec-workflow-guide**: Get complete workflow instructions (call this FIRST)
- **get-template-context**: Load specification templates
- **get-steering-context**: Load project steering documents (optional)
- **create-spec-doc**: Create requirements, design, or tasks documents
- **request-approval**: Request user approval for documents
- **get-approval-status**: Check approval status
- **delete-approval**: Clean up completed approvals
- **manage-tasks**: Track implementation progress

Remember: The spec-workflow-guide tool contains all the detailed instructions you need to follow. Call it first, then execute the workflow it describes exactly.`
    }, {
      capabilities: {
        tools: {},
        resources: { subscribe: false }
      }
    });
  }

  async initialize(projectPath: string, dashboardOptions?: DashboardStartOptions) {
    this.projectPath = projectPath;
    try {
      // Validate project path
      await validateProjectPath(this.projectPath);
      
      // Initialize session manager
      this.sessionManager = new SessionManager(this.projectPath);
      
      // Start dashboard if requested
      if (dashboardOptions?.autoStart) {
        this.dashboardServer = new DashboardServer({
          projectPath: this.projectPath,
          autoOpen: true,  // Auto-open browser when dashboard is auto-started
          port: dashboardOptions.port
        });
        this.dashboardUrl = await this.dashboardServer.start();
        
        // Log dashboard startup info
        console.log(`Dashboard auto-started at: ${this.dashboardUrl}`);
      }
      
      // Create context for tools
      const context = {
        projectPath: this.projectPath,
        dashboardUrl: this.dashboardUrl,
        sessionManager: this.sessionManager
      };
      
      // Register handlers
      this.setupHandlers(context);
      
      // Connect to stdio transport
      const transport = new StdioServerTransport();
      
      // Handle client disconnection - exit gracefully when transport closes
      transport.onclose = async () => {
        await this.stop();
        process.exit(0);
      };
      
      await this.server.connect(transport);
      
      // Monitor stdin for client disconnection (additional safety net)
      process.stdin.on('end', async () => {
        await this.stop();
        process.exit(0);
      });
      
      // Handle stdin errors
      process.stdin.on('error', async (error) => {
        console.error('stdin error:', error);
        await this.stop();
        process.exit(1);
      });
      
      // MCP server initialized successfully
      
    } catch (error) {
      throw error;
    }
  }

  private setupHandlers(context: any) {
    // Tool handlers
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: registerTools()
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        // Open browser on first spec-workflow-guide call if auto-start is enabled
        if (request.params.name === 'spec-workflow-guide' &&
            !this.browserOpened &&
            this.dashboardServer &&
            this.dashboardUrl) {
          this.browserOpened = true; // Set flag before awaiting to prevent race conditions

          // Create session tracking (overwrites any existing session.json)
          await this.sessionManager!.createSession(this.dashboardUrl);

          try {
            await this.dashboardServer.openBrowser();
            console.log('Dashboard opened in browser (first spec-workflow-guide call)');
          } catch (error) {
            console.error('Failed to open browser:', error);
          }
        }

        // Create dynamic context with current dashboard URL
        const dynamicContext = {
          ...context,
          dashboardUrl: this.dashboardUrl
        };
        return await handleToolCall(request.params.name, request.params.arguments || {}, dynamicContext);
      } catch (error: any) {
        throw new McpError(ErrorCode.InternalError, error.message);
      }
    });

    // Resource handlers  
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: registerResources(this.projectPath)
    }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      try {
        return await handleResourceOperation(request.params.uri, this.projectPath);
      } catch (error: any) {
        throw new McpError(ErrorCode.InternalError, error.message);
      }
    });
  }

  startDashboardMonitoring() {
    // Check immediately
    this.checkForDashboardSession();
    
    // Then check every 2 seconds
    this.dashboardMonitoringInterval = setInterval(() => {
      this.checkForDashboardSession();
    }, 2000);
  }
  
  private async checkForDashboardSession() {
    if (!this.sessionManager) {
      return; // No session manager
    }
    
    try {
      const dashboardUrl = await this.sessionManager.getDashboardUrl();
      if (dashboardUrl && dashboardUrl !== this.dashboardUrl) {
        // Test if the dashboard is actually reachable
        const isReachable = await this.testDashboardConnection(dashboardUrl);
        if (isReachable) {
          this.dashboardUrl = dashboardUrl;
          // Update context for tools that might need dashboard URL
          // Note: Dashboard URL is now available to MCP tools
        }
      } else if (this.dashboardUrl) {
        // We have a dashboard URL, but let's verify it's still reachable
        const isReachable = await this.testDashboardConnection(this.dashboardUrl);
        if (!isReachable) {
          // Dashboard is no longer reachable, clear it so we can discover a new one
          this.dashboardUrl = undefined;
        }
      }
    } catch (error) {
      // Session file doesn't exist yet, continue monitoring
      if (this.dashboardUrl) {
        // Clear stale dashboard URL if session file is gone
        this.dashboardUrl = undefined;
      }
    }
  }

  private async testDashboardConnection(url: string): Promise<boolean> {
    try {
      // Try to fetch the dashboard's test endpoint with a short timeout
      const response = await fetch(`${url}/api/test`, {
        method: 'GET',
        signal: AbortSignal.timeout(1000) // 1 second timeout
      });
      return response.ok;
    } catch (error) {
      // Connection failed
      return false;
    }
  }

  async stop() {
    try {
      // Stop dashboard monitoring
      if (this.dashboardMonitoringInterval) {
        clearInterval(this.dashboardMonitoringInterval);
        this.dashboardMonitoringInterval = undefined;
      }
      
      // Stop dashboard
      if (this.dashboardServer) {
        await this.dashboardServer.stop();
        this.dashboardServer = undefined;
      }
      
      // Stop MCP server
      await this.server.close();
    } catch (error) {
      console.error('Error during shutdown:', error);
      // Continue with shutdown even if there are errors
    }
  }
  
  getDashboardUrl(): string | undefined {
    return this.dashboardUrl;
  }
}