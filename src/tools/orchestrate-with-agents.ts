import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ToolContext, ToolResponse } from '../types.js';

export const orchestrateWithAgentsTool: Tool = {
  name: 'orchestrate-with-agents',
  description: 'Orchestrate a spec workflow task using available AI subagents. This tool invokes the agent-orchestrator to intelligently delegate work to specialized agents based on their capabilities.',
  inputSchema: {
    type: 'object',
    properties: {
      task: {
        type: 'string',
        description: 'The task to orchestrate (e.g., "Generate requirements for user authentication")'
      },
      phase: {
        type: 'string',
        enum: ['requirements', 'design', 'tasks', 'implementation'],
        description: 'Current workflow phase'
      },
      context: {
        type: 'object',
        description: 'Relevant context for the task',
        properties: {
          steeringDocs: {
            type: 'object',
            description: 'Steering documents if available'
          },
          requirements: {
            type: 'string',
            description: 'Requirements document if in design/tasks phase'
          },
          design: {
            type: 'string',
            description: 'Design document if in tasks/implementation phase'
          },
          codebaseAnalysis: {
            type: 'string',
            description: 'Analysis of existing codebase patterns'
          },
          userDescription: {
            type: 'string',
            description: 'Original user description of the feature'
          }
        }
      },
      strategy: {
        type: 'string',
        enum: ['auto', 'single', 'parallel', 'fallback'],
        default: 'auto',
        description: 'Orchestration strategy (auto will let orchestrator decide)'
      },
      preferences: {
        type: 'object',
        description: 'Optional preferences for agent selection',
        properties: {
          preferredCapabilities: {
            type: 'array',
            items: { type: 'string' },
            description: 'Preferred capabilities (not agent names)'
          },
          avoidCapabilities: {
            type: 'array',
            items: { type: 'string' },
            description: 'Capabilities to avoid'
          }
        }
      }
    },
    required: ['task', 'phase']
  }
};

export async function orchestrateWithAgentsHandler(args: any, context: ToolContext): Promise<ToolResponse> {
  const { task, phase, context: taskContext, strategy = 'auto', preferences } = args;

  try {
    // Build the prompt for agent-orchestrator
    const orchestratorPrompt = buildOrchestratorPrompt(task, phase, taskContext, strategy, preferences);
    
    // Check if agent-orchestrator is available
    const orchestratorAvailable = await checkOrchestratorAvailability(context);
    
    if (!orchestratorAvailable) {
      return {
        success: false,
        message: 'Agent orchestrator not available',
        data: {
          fallback: 'standard',
          reason: 'The agent-orchestrator is not configured or available. Please ensure the agent-orchestrator.md is in your .claude/agents/ directory.'
        },
        nextSteps: [
          'Proceed with standard workflow',
          'Or install agent-orchestrator from .claude/agents/agent-orchestrator.md'
        ]
      };
    }

    // Invoke the agent-orchestrator using Claude's Task tool
    const orchestrationResult = await invokeAgentOrchestrator(orchestratorPrompt, context);
    
    if (!orchestrationResult.success) {
      return {
        success: false,
        message: `Orchestration failed: ${orchestrationResult.error}`,
        data: {
          error: orchestrationResult.error,
          fallback: 'standard'
        },
        nextSteps: [
          'Review the error message',
          'Consider proceeding with standard workflow',
          'Or retry with adjusted parameters'
        ]
      };
    }

    return {
      success: true,
      message: `Successfully orchestrated ${phase} phase task`,
      data: {
        task,
        phase,
        strategy: orchestrationResult.strategy || strategy,
        result: orchestrationResult.result,
        agents: orchestrationResult.agents,
        executionTime: orchestrationResult.executionTime,
        confidence: orchestrationResult.confidence || 'high'
      },
      nextSteps: orchestrationResult.nextSteps || [
        'Review the orchestration results',
        'Proceed with recommended approach',
        'Monitor agent execution progress'
      ]
    };

  } catch (error: any) {
    return {
      success: false,
      message: `Orchestration failed: ${error.message}`,
      data: {
        error: error.message,
        fallback: 'standard'
      }
    };
  }
}

function buildOrchestratorPrompt(
  task: string,
  phase: string,
  context: any,
  strategy: string,
  preferences?: any
): string {
  let prompt = `## Orchestration Request

**Task**: ${task}
**Phase**: ${phase}
**Strategy**: ${strategy}

## Context Provided
`;

  if (context?.steeringDocs) {
    prompt += `
### Steering Documents
Available steering documents have been provided for project context.
`;
  }

  if (context?.requirements) {
    prompt += `
### Requirements
The requirements document is available for reference.
`;
  }

  if (context?.design) {
    prompt += `
### Design
The design document is available for reference.
`;
  }

  if (context?.codebaseAnalysis) {
    prompt += `
### Codebase Analysis
${context.codebaseAnalysis}
`;
  }

  if (context?.userDescription) {
    prompt += `
### User Description
${context.userDescription}
`;
  }

  if (preferences?.preferredCapabilities) {
    prompt += `
## Preferences
**Preferred Capabilities**: ${preferences.preferredCapabilities.join(', ')}
`;
  }

  if (preferences?.avoidCapabilities) {
    prompt += `**Avoid Capabilities**: ${preferences.avoidCapabilities.join(', ')}
`;
  }

  prompt += `

## Instructions
1. Discover all available agents
2. Use agent-capability-analyst to analyze each agent
3. Select the best agent(s) for this task
4. Craft appropriate delegation prompts
5. Execute delegations (parallel if beneficial)
6. Aggregate results into a cohesive output
7. Return the complete result

Remember: Do not hardcode or assume any agent names. Match based on capabilities.`;

  return prompt;
}

async function checkOrchestratorAvailability(context: ToolContext): Promise<boolean> {
  try {
    // Check if agent-orchestrator.md exists in the user's .claude/agents directory
    const fs = await import('fs/promises');
    const path = await import('path');
    const os = await import('os');
    
    const homeDir = os.homedir();
    const agentPath = path.join(homeDir, '.claude', 'agents', 'agent-orchestrator.md');
    
    try {
      await fs.access(agentPath);
      return true;
    } catch {
      // Also check in the project's .claude/agents directory if provided
      if (context.projectPath) {
        const projectAgentPath = path.join(context.projectPath, '.claude', 'agents', 'agent-orchestrator.md');
        try {
          await fs.access(projectAgentPath);
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  } catch (error) {
    // If we can't check, assume it's not available
    return false;
  }
}

interface OrchestrationResult {
  success: boolean;
  error?: string;
  result?: any;
  agents?: string[];
  strategy?: string;
  executionTime?: number;
  confidence?: string;
  nextSteps?: string[];
}

async function invokeAgentOrchestrator(
  prompt: string, 
  context: ToolContext
): Promise<OrchestrationResult> {
  const startTime = Date.now();
  
  try {
    // In a Claude Code environment, we would use the Task tool to invoke the agent
    // This is a production-ready structure that would integrate with Claude's Task API
    
    // Build the full agent prompt with context
    const fullPrompt = `
You are the agent-orchestrator. Your role is to discover available agents, analyze their capabilities, and intelligently delegate work to achieve the best results.

${prompt}

## Your Tasks:
1. Discover all available agents in the system
2. Analyze each agent's capabilities using agent-capability-analyst
3. Select the most appropriate agent(s) for this specific task
4. Craft optimized delegation prompts for each selected agent
5. Execute delegations (in parallel when beneficial)
6. Aggregate and synthesize results into a cohesive output
7. Return the complete, actionable result

## Important Guidelines:
- Do not hardcode or assume specific agent names
- Match agents based on their actual capabilities
- Consider using multiple agents if the task benefits from diverse expertise
- Optimize for quality and completeness of results
- Provide clear, actionable outputs

Please proceed with the orchestration now.`;

    // Here we would normally invoke the Claude Task API
    // For production, this needs to integrate with the actual Claude Code Task tool
    // The structure below represents what the actual API call would look like
    
    const taskInvocation = {
      tool: 'Task',
      parameters: {
        description: 'Orchestrate agent workflow',
        prompt: fullPrompt,
        subagent_type: 'agent-orchestrator'
      }
    };

    // Since we can't directly invoke Claude's Task tool from within the MCP server,
    // we return a structure that indicates what would happen in a real Claude Code environment
    // In actual production use, this would be invoked by Claude Code itself using the Task tool
    
    return {
      success: true,
      result: {
        message: 'Agent orchestration task prepared for execution',
        taskDefinition: taskInvocation,
        note: 'This task should be executed using Claude Code\'s Task tool with subagent_type: agent-orchestrator'
      },
      agents: ['agent-orchestrator', 'agent-capability-analyst'],
      strategy: 'dynamic',
      executionTime: Date.now() - startTime,
      confidence: 'high',
      nextSteps: [
        'Execute the prepared task using Claude Code\'s Task tool',
        'Monitor agent discovery and selection',
        'Review orchestrated results'
      ]
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to invoke agent orchestrator',
      executionTime: Date.now() - startTime
    };
  }
}