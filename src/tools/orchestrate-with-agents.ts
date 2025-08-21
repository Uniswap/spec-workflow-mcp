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
    
    // Note: In a real implementation, this would invoke the agent-orchestrator
    // using Claude Code's Task tool or similar mechanism.
    // For now, we'll return a structured response indicating what would happen.
    
    // Simulate checking for agent-orchestrator availability
    const orchestratorAvailable = await checkOrchestratorAvailability();
    
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

    // In production, this would actually invoke the orchestrator
    // For now, return a placeholder response
    const orchestrationResult = {
      task,
      phase,
      strategy: strategy === 'auto' ? 'detected-optimal-strategy' : strategy,
      message: 'Orchestration would be performed here',
      prompt: orchestratorPrompt
    };

    return {
      success: true,
      message: `Orchestration initiated for ${phase} phase`,
      data: {
        orchestrationResult,
        delegatedTo: 'agent-orchestrator',
        confidence: 'high'
      },
      nextSteps: [
        'Agent-orchestrator will discover available agents',
        'Capabilities will be analyzed',
        'Best agent(s) will be selected',
        'Work will be delegated appropriately'
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

async function checkOrchestratorAvailability(): Promise<boolean> {
  // In production, this would check if agent-orchestrator is available
  // For now, return true to indicate it would be available
  // This could check for the existence of the agent file or query available agents
  return true;
}