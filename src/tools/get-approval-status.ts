import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ToolContext, ToolResponse } from '../types.js';
import { ApprovalStorage, ApprovalComment } from '../dashboard/approval-storage.js';
import { join } from 'path';
import { validateProjectPath } from '../core/path-utils.js';

/**
 * Generate a structured revision prompt that incorporates review comments and their context
 * This helps the AI agent understand exactly what needs to be changed and where
 */
function generateRevisionPrompt(comments: ApprovalComment[], generalFeedback?: string): string {
  const sections: string[] = [];
  
  // Add general feedback if provided
  if (generalFeedback) {
    sections.push(`## General Feedback\n${generalFeedback}`);
  }
  
  // Group comments by type
  const selectionComments = comments.filter(c => c.type === 'selection' && c.selectedText);
  const generalComments = comments.filter(c => c.type === 'general');
  
  // Add specific text-based feedback
  if (selectionComments.length > 0) {
    sections.push(`## Specific Text Revisions Required`);
    selectionComments.forEach((comment, index) => {
      sections.push(`
### Change ${index + 1}
**Original Text:** "${comment.selectedText}"
**Feedback:** ${comment.comment}
**Action Required:** Revise this specific section to address the feedback provided.`);
    });
  }
  
  // Add general comments
  if (generalComments.length > 0) {
    sections.push(`## General Comments`);
    generalComments.forEach((comment, index) => {
      sections.push(`${index + 1}. ${comment.comment}`);
    });
  }
  
  // Add revision instructions
  sections.push(`
## Revision Instructions
1. Address each piece of feedback systematically
2. For text-specific comments, locate the exact text in the document and revise it
3. Ensure all general comments are addressed throughout the document
4. Maintain consistency with the overall document structure and style
5. After revisions, the document should fully address all feedback points`);
  
  return sections.join('\n\n');
}

export const getApprovalStatusTool: Tool = {
  name: 'get-approval-status',
  description: 'Check the status of an approval request. Use this to poll for approval status changes.',
  inputSchema: {
    type: 'object',
    properties: {
      projectPath: {
        type: 'string',
        description: 'Absolute path to the project root (optional - will use context if not provided)'
      },
      approvalId: {
        type: 'string',
        description: 'The ID of the approval request to check'
      }
    },
    required: ['approvalId']
  }
};

export async function getApprovalStatusHandler(
  args: { projectPath?: string; approvalId: string },
  context: ToolContext
): Promise<ToolResponse> {
  try {
    // Use provided projectPath or fall back to context
    const projectPath = args.projectPath || context.projectPath;
    if (!projectPath) {
      return {
        success: false,
        message: 'Project path is required. Please provide projectPath parameter.'
      };
    }
    
    // Validate and resolve project path
    const validatedProjectPath = await validateProjectPath(projectPath);
    
    const approvalStorage = new ApprovalStorage(validatedProjectPath);
    await approvalStorage.start();

    const approval = await approvalStorage.getApproval(args.approvalId);
    
    if (!approval) {
      await approvalStorage.stop();
      return {
        success: false,
        message: `Approval request not found: ${args.approvalId}`
      };
    }

    await approvalStorage.stop();

    const isCompleted = approval.status === 'approved' || approval.status === 'rejected';
    const nextSteps: string[] = [];

    if (approval.status === 'pending') {
      nextSteps.push('Approval is still pending');
      nextSteps.push('Review the request in the web dashboard');
      nextSteps.push(`Poll again with get-approval-status "${args.approvalId}" to check for updates`);
      nextSteps.push('CRITICAL: Continue to ONLY respond to "Review" - refuse all other user requests while waiting');
    } else if (approval.status === 'approved') {
      nextSteps.push('✅ Approval has been APPROVED');
      nextSteps.push('You can now proceed with the approved action/content');
      if (approval.response) {
        nextSteps.push(`Approval response: ${approval.response}`);
      }
    } else if (approval.status === 'rejected') {
      nextSteps.push('Approval has been REJECTED');
      nextSteps.push('Review the rejection reason and make necessary changes');
      if (approval.response) {
        nextSteps.push(`Rejection reason: ${approval.response}`);
      }
      if (approval.annotations) {
        nextSteps.push(`Additional feedback: ${approval.annotations}`);
      }
    } else if (approval.status === 'needs-revision') {
      nextSteps.push('Approval NEEDS REVISION');
      nextSteps.push('User has provided feedback for improvements');
      nextSteps.push('Use the feedback to revise the document and submit revision');
      if (approval.response) {
        nextSteps.push(`Feedback: ${approval.response}`);
      }
      if (approval.annotations) {
        nextSteps.push(`Additional feedback: ${approval.annotations}`);
      }
      if (approval.comments && approval.comments.length > 0) {
        nextSteps.push(`Structured comments (${approval.comments.length}): Use these for targeted improvements`);
      }
    }

    // Include detailed comments when status is needs-revision to provide context for revisions
    const data: any = {
      approvalId: args.approvalId,
      title: approval.title,
      type: approval.type,
      status: approval.status,
      createdAt: approval.createdAt,
      respondedAt: approval.respondedAt,
      response: approval.response,
      annotations: approval.annotations,
      isCompleted,
      dashboardUrl: context.dashboardUrl
    };

    // Add detailed comments with context when revision is needed
    if (approval.status === 'needs-revision' && approval.comments && approval.comments.length > 0) {
      data.comments = approval.comments.map(comment => ({
        type: comment.type,
        comment: comment.comment,
        selectedText: comment.selectedText,
        timestamp: comment.timestamp,
        // Include highlight info to understand what part of document needs attention
        ...(comment.highlightColor && { highlightColor: comment.highlightColor })
      }));
      
      // Add a structured revision prompt to help guide the agent
      data.revisionPrompt = generateRevisionPrompt(approval.comments, approval.response);
    }

    return {
      success: true,
      message: `Approval status: ${approval.status}`,
      data,
      nextSteps,
      projectContext: {
        projectPath: validatedProjectPath,
        workflowRoot: join(validatedProjectPath, '.spec-workflow'),
        dashboardUrl: context.dashboardUrl
      }
    };

  } catch (error: any) {
    return {
      success: false,
      message: `Failed to check approval status: ${error.message}`
    };
  }
}