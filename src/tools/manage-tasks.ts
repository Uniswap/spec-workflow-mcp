import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ToolContext, ToolResponse, TaskInfo } from '../types.js';
import { PathUtils } from '../core/path-utils.js';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { parseTasksFromMarkdown, updateTaskStatus, findNextPendingTask, getTaskById, ParsedTask } from '../core/task-parser.js';

export const manageTasksTool: Tool = {
  name: 'manage-tasks',
  description: 'Task management for spec implementation with agent orchestration support. REQUIRED SEQUENCE: First mark task as in-progress, then implement (using agent orchestration if enabled), finally mark as completed. ALWAYS update status to in-progress before starting work. Implementation workflow: set-status (in-progress) → orchestrate-with-agents (if enabled) → code → set-status (completed). Status markers: [] = pending, [-] = in-progress, [x] = completed. When orchestration is enabled, the tool will suggest appropriate specialized agents for each task.',
  inputSchema: {
    type: 'object',
    properties: {
      projectPath: { 
        type: 'string',
        description: 'Absolute path to the project root'
      },
      specName: { 
        type: 'string',
        description: 'Name of the specification'
      },
      action: {
        type: 'string',
        enum: ['list', 'get', 'set-status', 'next-pending', 'context'],
        description: 'Action: list all tasks, get specific task, set task status, get next pending task, or get full implementation context',
        default: 'list'
      },
      taskId: { 
        type: 'string',
        description: 'Specific task ID (required for get, set-status, and context actions)'
      },
      status: {
        type: 'string',
        enum: ['pending', 'in-progress', 'completed'],
        description: 'New task status (required for set-status action)'
      }
    },
    required: ['projectPath', 'specName']
  }
};

export async function manageTasksHandler(args: any, context: ToolContext): Promise<ToolResponse> {
  const { projectPath, specName, action = 'list', taskId, status } = args;

  try {
    // Check if orchestration is enabled
    const orchestrationConfig = await checkOrchestrationConfig(projectPath);
    // Path to tasks.md
    const tasksPath = join(PathUtils.getSpecPath(projectPath, specName), 'tasks.md');
    
    // Read and parse tasks file
    const tasksContent = await readFile(tasksPath, 'utf-8');
    const parseResult = parseTasksFromMarkdown(tasksContent);
    const tasks = parseResult.tasks;
    
    if (tasks.length === 0) {
      return {
        success: true,
        message: 'No tasks found in tasks.md',
        data: { tasks: [] },
        nextSteps: ['Create tasks using the create-spec-doc tool with document: "tasks"']
      };
    }
    
    // Handle different actions
    switch (action) {
      case 'list':
        return {
          success: true,
          message: `Found ${parseResult.summary.total} tasks (${parseResult.summary.completed} completed, ${parseResult.summary.inProgress} in-progress, ${parseResult.summary.pending} pending)`,
          data: { 
            tasks,
            summary: parseResult.summary
          },
          nextSteps: [
            'Use action: "next-pending" to get the next task to work on',
            'Use action: "get" with taskId to view specific task details',
            'Use action: "set-status" to update task progress'
          ]
        };
        
      case 'get': {
        if (!taskId) {
          return {
            success: false,
            message: 'Task ID required for get action',
            nextSteps: ['Provide a taskId parameter (e.g., "1.1", "2.3")']
          };
        }
        
        const task = getTaskById(tasks, taskId);
        if (!task) {
          return {
            success: false,
            message: `Task ${taskId} not found`,
            nextSteps: ['Use action: "list" to see available task IDs']
          };
        }
        
        return {
          success: true,
          message: `Task ${taskId}: ${task.description}`,
          data: { task },
          nextSteps: [
            task.status === 'completed' 
              ? 'Task is already completed' 
              : task.status === 'in-progress'
              ? 'Task is currently in progress'
              : 'Use action: "set-status" to mark as in-progress when starting work',
            'Use action: "context" to get full implementation context for this task'
          ]
        };
      }
        
      case 'next-pending': {
        const nextTask = findNextPendingTask(tasks);
        if (!nextTask) {
          const inProgressTasks = tasks.filter(t => t.status === 'in-progress' && !t.isHeader);
          if (inProgressTasks.length > 0) {
            return {
              success: true,
              message: `No pending tasks. ${inProgressTasks.length} task(s) in progress.`,
              data: { 
                nextTask: null,
                inProgressTasks 
              },
              nextSteps: [
                `Continue working on in-progress tasks: ${inProgressTasks.map(t => t.id).join(', ')}`,
                'Mark in-progress tasks as completed when finished'
              ]
            };
          }
          return {
            success: true,
            message: 'All tasks are completed! 🎉',
            data: { nextTask: null },
            nextSteps: ['Implementation phase is complete', 'Run final testing and validation']
          };
        }
        
        const orchestrationGuidance = getOrchestrationGuidance(orchestrationConfig, nextTask);
        
        return {
          success: true,
          message: `Next pending task: ${nextTask.id} - ${nextTask.description}`,
          data: { 
            nextTask,
            orchestrationEnabled: orchestrationConfig.enabled,
            orchestrationGuidance: orchestrationConfig.enabled ? orchestrationGuidance : null
          },
          nextSteps: [
            `Use action: "set-status" with taskId: "${nextTask.id}" and status: "in-progress" to start work`,
            ...(orchestrationConfig.enabled ? [orchestrationGuidance] : []),
            `Use action: "context" with taskId: "${nextTask.id}" to get implementation details`
          ]
        };
      }

      case 'set-status': {
        if (!taskId) {
          return {
            success: false,
            message: 'Task ID required for set-status action',
            nextSteps: ['Provide a taskId parameter']
          };
        }

        if (!status) {
          return {
            success: false,
            message: 'Status required for set-status action',
            nextSteps: ['Provide status: "pending", "in-progress", or "completed"']
          };
        }

        const taskToUpdate = getTaskById(tasks, taskId);
        if (!taskToUpdate) {
          return {
            success: false,
            message: `Task ${taskId} not found`,
            nextSteps: ['Use action: "list" to see available task IDs']
          };
        }

        // Update the tasks.md file with new status using unified parser
        const updatedContent = updateTaskStatus(tasksContent, taskId, status);

        if (updatedContent === tasksContent) {
          return {
            success: false,
            message: `Could not find task ${taskId} to update status`,
            nextSteps: [
              'Check the task ID format in tasks.md',
              'Ensure task follows format: "- [ ] 1.1 Task description"'
            ]
          };
        }

        await writeFile(tasksPath, updatedContent, 'utf-8');

        const statusEmoji = status === 'completed' ? '✅' : status === 'in-progress' ? '⏳' : '⏸️';
        
        const implementationGuidance = status === 'in-progress' && orchestrationConfig.enabled ? 
          getTaskImplementationGuidance(orchestrationConfig, taskToUpdate) : null;
        
        return {
          success: true,
          message: `${statusEmoji} Task ${taskId} status updated to ${status}`,
          data: { 
            taskId,
            previousStatus: taskToUpdate.status,
            newStatus: status,
            updatedTask: { ...taskToUpdate, status },
            orchestrationEnabled: orchestrationConfig.enabled,
            implementationGuidance
          },
          nextSteps: [
            `Task status saved to tasks.md`,
            ...(status === 'in-progress' ? [
              ...(orchestrationConfig.enabled ? [
                '**MANDATORY if orchestration.enabled**: Use agent orchestration for task implementation',
                implementationGuidance || ''
              ] : []),
              'Begin implementation of this task'
            ] : []),
            ...(status === 'completed' ? ['Use action: "next-pending" to get the next task'] : []),
            ...(status === 'pending' ? ['Task marked as pending'] : []),
            'Use spec-status tool to check overall progress'
          ],
          projectContext: {
            projectPath,
            workflowRoot: PathUtils.getWorkflowRoot(projectPath),
            specName,
            currentPhase: 'implementation',
            dashboardUrl: context.dashboardUrl
          }
        };
      }

      case 'context': {
        if (!taskId) {
          return {
            success: false,
            message: 'Task ID required for context action',
            nextSteps: ['Provide a taskId parameter to get implementation context']
          };
        }
        
        const task = getTaskById(tasks, taskId);
        if (!task) {
          return {
            success: false,
            message: `Task ${taskId} not found`,
            nextSteps: ['Use action: "list" to see available task IDs']
          };
        }
        
        // Load full spec context
        const specDir = PathUtils.getSpecPath(projectPath, specName);
        let requirementsContext = '';
        let designContext = '';
        
        try {
          const requirementsContent = await readFile(join(specDir, 'requirements.md'), 'utf-8');
          requirementsContext = `## Requirements Context\n${requirementsContent}`;
        } catch {
          // Requirements file doesn't exist or can't be read
        }
        
        try {
          const designContent = await readFile(join(specDir, 'design.md'), 'utf-8');
          designContext = `## Design Context\n${designContent}`;
        } catch {
          // Design file doesn't exist or can't be read
        }

        const fullContext = `# Implementation Context for Task ${taskId}

## Task Details
**ID:** ${task.id}
**Status:** ${task.status}
**Description:** ${task.description}

${task.requirements && task.requirements.length > 0 ? `**Requirements Reference:** ${task.requirements.join(', ')}\n` : ''}
${task.leverage ? `**Leverage Existing:** ${task.leverage}\n` : ''}
${task.implementationDetails && task.implementationDetails.length > 0 ? `**Implementation Notes:**\n${task.implementationDetails.map(d => `- ${d}`).join('\n')}\n` : ''}

---

${requirementsContext}

${requirementsContext && designContext ? '---\n' : ''}

${designContext}

## Next Steps
1. Review the task requirements and design context above
2. ${task.status === 'pending' ? `Mark task as in-progress: manage-tasks with action: "set-status", taskId: "${taskId}", status: "in-progress"` : task.status === 'in-progress' ? 'Continue implementation work' : 'Task is already completed'}
${orchestrationConfig.enabled && task.status !== 'completed' ? `3. **MANDATORY**: Use agent orchestration to implement this task:\n   ${getDetailedOrchestrationInstructions(task)}\n` : ''}
${orchestrationConfig.enabled ? '4' : '3'}. Implement the specific functionality described in the task
${orchestrationConfig.enabled ? '5' : '4'}. ${task.leverage ? `Leverage the existing code mentioned: ${task.leverage}` : 'Build according to the design patterns'}
${orchestrationConfig.enabled ? '6' : '5'}. ${task.status !== 'completed' ? `Mark as completed when finished: manage-tasks with action: "set-status", taskId: "${taskId}", status: "completed"` : ''}
`;
        
        return {
          success: true,
          message: `Implementation context loaded for task ${taskId}`,
          data: { 
            task,
            context: fullContext,
            hasRequirements: requirementsContext !== '',
            hasDesign: designContext !== ''
          },
          nextSteps: [
            'Review the full context above',
            task.status === 'pending' ? 'Mark task as in-progress when starting work' : 
            task.status === 'in-progress' ? 
              orchestrationConfig.enabled ? 
                '**MANDATORY**: Use agent orchestration for implementation (see instructions above)' : 
                'Continue with implementation' : 
            'Task is already completed',
            'Reference the requirements and design sections for implementation guidance'
          ]
        };
      }
        
      default:
        return {
          success: false,
          message: `Unknown action: ${action}`,
          nextSteps: ['Use action: list, get, set-status, next-pending, or context']
        };
    }
    
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return {
        success: false,
        message: `tasks.md not found for specification '${specName}'`,
        nextSteps: [
          'Create the tasks document first using create-spec-doc tool',
          'Ensure the specification exists and has completed the tasks phase'
        ]
      };
    }
    
    return {
      success: false,
      message: `Failed to manage tasks: ${error.message}`,
      nextSteps: [
        'Check if the specification exists',
        'Verify file permissions',
        'Ensure tasks.md is properly formatted'
      ]
    };
  }
}

// Helper function to check orchestration configuration
async function checkOrchestrationConfig(projectPath: string): Promise<{ enabled: boolean }> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const yaml = await import('yaml');
    
    const orchestrationPath = path.join(projectPath, '.spec-workflow', 'orchestration.yaml');
    
    try {
      const content = await fs.readFile(orchestrationPath, 'utf-8');
      const config = yaml.parse(content);
      
      return {
        enabled: config?.orchestration?.enabled === true && 
                config?.orchestration?.mode !== 'off'
      };
    } catch {
      // orchestration.yaml doesn't exist or can't be parsed
      return { enabled: false };
    }
  } catch {
    // Error importing modules or other issues
    return { enabled: false };
  }
}

// Get orchestration guidance for a specific task
function getOrchestrationGuidance(orchestrationConfig: { enabled: boolean }, task: ParsedTask): string {
  if (!orchestrationConfig.enabled) return '';
  
  return `**CRITICAL if orchestration.enabled**: Before implementing, use orchestrate-with-agents to find specialized agents for "${task.description}"`;
}

// Get detailed implementation guidance for task execution
function getTaskImplementationGuidance(orchestrationConfig: { enabled: boolean }, task: ParsedTask): string {
  if (!orchestrationConfig.enabled) return '';
  
  // Analyze task description to suggest appropriate agent types
  const taskLower = task.description.toLowerCase();
  const suggestedCapabilities: string[] = [];
  
  // Suggest capabilities based on task content
  if (taskLower.includes('ui') || taskLower.includes('component') || taskLower.includes('frontend') || taskLower.includes('react')) {
    suggestedCapabilities.push('frontend', 'react', 'ui/ux');
  }
  if (taskLower.includes('api') || taskLower.includes('backend') || taskLower.includes('database') || taskLower.includes('server')) {
    suggestedCapabilities.push('backend', 'api', 'database');
  }
  if (taskLower.includes('test') || taskLower.includes('spec') || taskLower.includes('unit')) {
    suggestedCapabilities.push('testing', 'qa');
  }
  if (taskLower.includes('style') || taskLower.includes('css') || taskLower.includes('design')) {
    suggestedCapabilities.push('css', 'styling', 'design');
  }
  if (taskLower.includes('deploy') || taskLower.includes('docker') || taskLower.includes('ci/cd')) {
    suggestedCapabilities.push('devops', 'deployment', 'infrastructure');
  }
  if (taskLower.includes('security') || taskLower.includes('auth') || taskLower.includes('permission')) {
    suggestedCapabilities.push('security', 'authentication');
  }
  
  return `Call orchestrate-with-agents with:
- task: "Implement: ${task.description}"
- phase: "task-execution"
- context: { taskId: "${task.id}", requirements, design, existingCode }
${suggestedCapabilities.length > 0 ? `- preferences: { preferredCapabilities: [${suggestedCapabilities.map(c => `"${c}"`).join(', ')}] }` : ''}

**Fallback**: If no agents found, ask user: "Create a custom agent for this task? See https://docs.anthropic.com/en/docs/claude-code/sub-agents"`;
}

// Get detailed orchestration instructions for task context
function getDetailedOrchestrationInstructions(task: ParsedTask): string {
  const taskLower = task.description.toLowerCase();
  const suggestedCapabilities: string[] = [];
  
  // Determine suggested capabilities
  if (taskLower.includes('ui') || taskLower.includes('component') || taskLower.includes('frontend') || taskLower.includes('react')) {
    suggestedCapabilities.push('frontend', 'react');
  }
  if (taskLower.includes('api') || taskLower.includes('backend') || taskLower.includes('database')) {
    suggestedCapabilities.push('backend', 'api');
  }
  if (taskLower.includes('test')) {
    suggestedCapabilities.push('testing');
  }
  
  return `   orchestrate-with-agents(
     task: "Implement task ${task.id}: ${task.description}",
     phase: "task-execution",
     context: { taskId: "${task.id}", taskDetails, requirements, design, relatedCode }${
     suggestedCapabilities.length > 0 ? `,
     preferences: { preferredCapabilities: [${suggestedCapabilities.map(c => `"${c}"`).join(', ')}] }` : ''
   }
   )
   
   **Fallback Handling**:
   - If no suitable agents found, you'll be informed
   - You can create custom agents: https://docs.anthropic.com/en/docs/claude-code/sub-agents
   - Or proceed with standard implementation workflow`;
}

