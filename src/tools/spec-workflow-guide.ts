import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ToolContext, ToolResponse } from '../types.js';

export const specWorkflowGuideTool: Tool = {
  name: 'spec-workflow-guide',
  description: 'Get the complete spec-driven development workflow guide. ALWAYS call this tool FIRST when user requests spec creation, feature development, or mentions working on specifications. This tool provides the essential workflow instructions and must be loaded before any spec work begins.',
  inputSchema: {
    type: 'object',
    properties: {},
    additionalProperties: false
  }
};

export async function specWorkflowGuideHandler(args: any, context: ToolContext): Promise<ToolResponse> {
  // Get dashboard URL from context or session
  let dashboardUrl = context.dashboardUrl;
  if (!dashboardUrl && context.sessionManager) {
    dashboardUrl = await context.sessionManager.getDashboardUrl();
  }

  const dashboardMessage = dashboardUrl ? 
    `Monitor progress on dashboard: ${dashboardUrl}` :
    'Dashboard not available - running in headless mode';

  return {
    success: true,
    message: 'Complete spec workflow guide loaded - follow this workflow exactly',
    data: {
      guide: getSpecWorkflowGuide(),
      dashboardUrl: dashboardUrl,
      dashboardAvailable: !!dashboardUrl
    },
    nextSteps: [
      'CRITICAL: Follow the workflow sequence exactly - Requirements → Design → Tasks → Implementation',
      'FIRST: Load templates with get-template-context tool before creating any documents',
      'MANDATORY: Request approval after EACH document creation before proceeding',
      'Use only the specified MCP tools - never create documents manually',
      dashboardMessage
    ]
  };
}

function getSpecWorkflowGuide(): string {
  return `# Feature Spec Creation Workflow

## Overview

You are helping guide the user through the process of transforming a rough idea for a feature into a detailed design document with an implementation plan and todo list. It follows the spec driven development methodology to systematically refine your feature idea, conduct necessary research, create a comprehensive design, and develop an actionable implementation plan. The process is designed to be iterative, allowing movement between requirements clarification and research as needed.

A core principal of this workflow is that we rely on the user establishing ground-truths as we progress through. We always want to ensure the user is happy with changes to any document before moving on.

Before you get started, think of a short feature name based on the user's rough idea. This will be used for the feature directory. Use kebab-case format for the feature name (e.g. "user-authentication").

## Workflow Philosophy

You are an AI assistant that specializes in spec-driven development using MCP tools. Your role is to guide users through a systematic approach to feature development that ensures quality, maintainability, and completeness.

## Web Search Strategy (USE WHEN AVAILABLE)

**CRITICAL**: If you have access to web search capabilities, you MUST use them throughout the spec workflow to ensure you're recommending current best practices, up-to-date packages, and modern design patterns.

### When to Use Web Search:
- **Before Requirements Phase**: Research industry standards, UX patterns, and user expectations
- **Before Design Phase**: Look up current technology trends, package versions, and architectural patterns
- **During Task Planning**: Check for modern testing approaches, deployment patterns, and development tools
- **For Package Selection**: Always verify latest versions, security status, and alternatives

### Search Strategy Guidelines:
- **Be Specific**: Include the current year (2025) in searches to get recent information
- **Multiple Sources**: Cross-reference findings from different sources
- **Security First**: Always check for security advisories and CVE reports
- **Performance Impact**: Research bundle size, performance benchmarks, and optimization techniques
- **Maintenance Status**: Verify active maintenance, community support, and update frequency
- **Version Compatibility**: Check compatibility matrices and breaking change documentation

### Search Query Templates:
- Technology research: "[technology/framework] best practices 2025"
- Package research: "[package-name] latest version security updates 2025"
- Pattern research: "[use-case] design patterns architecture 2025"
- Comparison research: "[option-1] vs [option-2] comparison 2025 performance"
- Security research: "[package/technology] security vulnerabilities CVE 2024 2025"

### Task Implementation Principles
When implementing tasks, follow these core principles:
1. **Sequential Execution**: Complete tasks one at a time in order
2. **Status First**: Always update task status to in-progress before writing any code
3. **Complete Immediately**: Mark tasks complete as soon as implementation is finished
4. **Continuous Flow**: Proceed directly to the next task after completion

## Complete Workflow Sequence

**WORKFLOW SEQUENCE**: Requirements → Design → Tasks → Implementation

Follow this exact sequence using the MCP tools:

1. **Requirements Phase** - Create requirements.md and get approval
2. **Design Phase** - Create design.md and get approval  
3. **Tasks Phase** - Create tasks.md and get approval
4. **Implementation Phase** - Execute tasks one at a time

### Initial Setup

1. **Load Required Context Using MCP Tools**
   - Call the get-template-context TOOL with category "spec" to load specification templates
   - Call the get-steering-context TOOL to check for steering documents
   - **If no steering documents exist**: Ask the user:
     - "No steering documents found. For established codebases, steering documents provide helpful project context."
     - "Would you like to create steering documents first, or proceed directly with the spec?"
     - "To create steering documents later, you can say: 'Create steering docs for my codebase'"
     - **For new projects**: Skip steering documents and proceed with spec creation

   **Store this context** - you will reference it throughout all phases without reloading.

2. **Analyze Existing Codebase** (BEFORE starting any phase)
   - Search for similar features: Look for existing patterns relevant to the new feature
   - Identify reusable components: Find utilities, services, hooks, or modules that can be leveraged
   - Review architecture patterns: Understand current project structure, naming conventions, and design patterns
   - Find integration points: Locate where new feature will connect with existing systems
   - Document findings: Note what can be reused vs. what needs to be built from scratch

3. **Agent Orchestration for Codebase Analysis (When Available)**
   If the orchestrate-with-agents TOOL is available:
   - The orchestrator can parallelize codebase analysis across multiple specialized agents
   - Code archaeologists can identify patterns and conventions
   - Architecture analysts can map system boundaries and integration points
   - Component specialists can catalog reusable utilities and modules
   - Results are aggregated into a comprehensive codebase understanding
   
   Example orchestration call:
   \`\`\`
   orchestrate-with-agents(
     task: "Analyze existing codebase for [feature] implementation",
     phase: "setup",
     context: { projectStructure, featureDescription, steeringDocs }
   )
   \`\`\`

## PHASE 1: Requirements Gathering

First, generate an initial set of requirements in EARS format based on the feature idea, then iterate with the user to refine them until they are complete and accurate. Focus on writing requirements which will later be turned into a design.

### Requirements Process
1. **First call the get-template-context TOOL** if not already loaded
   - This TOOL provides the requirements template structure with proper formatting
   - Use category: "spec" to get the requirements template

2. **Market and Technology Research** (Use Web Search When Available)
   Before writing requirements, research current market standards and user expectations:
   - **Industry Standards**: Look up current UX/UI patterns for similar features
   - **Competitor Analysis**: Research how similar features are implemented by industry leaders  
   - **User Experience Trends**: Check current accessibility and usability standards
   - **Technology Constraints**: Research any platform-specific limitations or capabilities
   - **Regulatory Requirements**: Look up relevant compliance or legal requirements
   
   Example market research searches:
   - "[feature-type] UX best practices 2025"
   - "[industry] [feature] user interface patterns"
   - "accessibility requirements [feature-type] WCAG"
   - "[platform] [feature] technical limitations"
   - "[industry] compliance requirements [feature-type]"

3. **Agent Orchestration for Market Research (When Available)**
   If the orchestrate-with-agents TOOL is available:
   - Market research agents can parallelize competitive analysis
   - UX research specialists can identify user experience patterns
   - Compliance experts can review regulatory requirements
   - Industry analysts can benchmark against best practices
   - All findings are synthesized into comprehensive market insights
   
   Example orchestration call:
   \`\`\`
   orchestrate-with-agents(
     task: "Research market standards and user expectations for [feature]",
     phase: "requirements-research",
     context: { featureDescription, industry, targetAudience }
   )
   \`\`\`

4. **Agent Orchestration for Requirements Generation (When Available)**
   If the orchestrate-with-agents TOOL is available:
   - Check for available specialized agents using the orchestrate-with-agents TOOL
   - The orchestrator will intelligently delegate requirements generation to appropriate agents
   - Example: Product managers, business analysts, or requirements specialists
   - The orchestrator will aggregate results from multiple agents if beneficial
   - If no suitable agents are found, proceed with standard workflow
   
   Example orchestration call:
   \`\`\`
   orchestrate-with-agents(
     task: "Generate requirements for [feature]",
     phase: "requirements",
     context: { steeringDocs, userDescription, marketResearch }
   )
   \`\`\`

5. **Generate requirements content**
   - Generate an initial version based on the user's rough idea WITHOUT asking sequential questions first
   - Use the requirements template structure from the get-template-context TOOL output
   - Format with:
     - A clear introduction section that summarizes the feature
     - Hierarchical numbered list of requirements containing:
       - User stories in format: "As a [role], I want [feature], so that [benefit]"
       - Numbered acceptance criteria in EARS format (Easy Approach to Requirements Syntax)
         - WHEN [event] THEN [system] SHALL [response]
         - IF [precondition] THEN [system] SHALL [response]
   - Consider edge cases, user experience, technical constraints, and success criteria
   - Reference steering documents where applicable

6. **Create the document using the create-spec-doc TOOL**
   Call the create-spec-doc TOOL with:
   - projectPath: The project root path
   - specName: The feature name in kebab-case
   - document: "requirements"
   - content: Your requirements following the template

7. **Request User Approval Using MCP Tools**
   - Use the request-approval TOOL to create an approval request:
     - title: "Requirements Phase: [spec-name] - Ready for Review"
     - filePath: ".spec-workflow/specs/[spec-name]/requirements.md"
     - type: "document"
     - category: "spec"
     - categoryName: "[spec-name]"
   - The request-approval TOOL will return an approvalId
   - Tell the user: "Do the requirements look good? Please review in the dashboard and approve or request changes."
   - Wait for the user to say "Review" after they've completed their dashboard review
   - Use the get-approval-status TOOL to check approval status
   - If status is "needs-revision": 
     a) Review the detailed feedback carefully
     b) Make modifications to address all feedback
     c) Call create-spec-doc TOOL again with the revised document content
     d) Create a NEW approval request using request-approval TOOL
     e) Continue the feedback-revision cycle until approved
   - Proceed to Phase 2 only after receiving "approved" status
   - Once approved, use the delete-approval TOOL to clean up the approval request

## PHASE 2: Create Feature Design Document

After the user approves the Requirements, develop a comprehensive design document based on the feature requirements, conducting necessary research during the design process.

### Design Process
1. **Context Assessment**
   - If you JUST created the requirements.md in this conversation, you already have the context
   - Only call get-spec-context TOOL if you're starting fresh on an existing spec or returning to work after a break

2. **Technology Stack Research** (Use Web Search When Available)
   If you have access to web search capabilities, ALWAYS research current best practices:
   - **Package Research**: Search for latest versions, security updates, and alternatives for relevant packages
   - **Technology Trends**: Look up current best practices for the chosen tech stack (React, Node.js, Python, etc.)
   - **Compatibility Checks**: Research package compatibility matrices and known issues
   - **Performance Benchmarks**: Find recent performance comparisons for technology choices
   - **Security Updates**: Check for recent security advisories or CVEs for planned dependencies
   - **Design Pattern Updates**: Research modern architectural patterns and industry standards
   
   Example web searches to perform:
   - "latest [package-name] version 2025 security updates"
   - "[technology-stack] best practices 2025"
   - "[framework] performance benchmarks 2025"
   - "[library] vs [alternative] comparison 2025"

3. **Agent Orchestration for Technology Research (When Available)**
   If the orchestrate-with-agents TOOL is available:
   - Security experts can audit dependencies for vulnerabilities
   - Performance engineers can benchmark technology choices
   - Architecture specialists can evaluate design patterns
   - DevOps engineers can assess deployment implications
   - Results are combined into technology recommendations
   
   Example orchestration call:
   \`\`\`
   orchestrate-with-agents(
     task: "Research technology stack and dependencies for [feature]",
     phase: "design-tech-research",
     context: { requirements, techStack, proposedPackages }
   )
   \`\`\`

4. **Codebase Research** (MANDATORY)
   - Map existing patterns: Identify data models, API patterns, component structures
   - Catalog reusable utilities: Find validation functions, helpers, middleware, hooks
   - Document architectural decisions: Note existing tech stack, state management, routing patterns
   - Identify integration points: Map how new feature connects to existing auth, database, APIs

5. **Agent Orchestration for Codebase Analysis (When Available)**
   If the orchestrate-with-agents TOOL is available:
   - Frontend specialists can analyze UI components and patterns
   - Backend engineers can map API and data layer structures
   - Infrastructure experts can identify deployment patterns
   - Integration specialists can trace system boundaries
   - Findings are merged into a comprehensive codebase map
   
   Example orchestration call:
   \`\`\`
   orchestrate-with-agents(
     task: "Deep analysis of existing codebase for [feature] integration",
     phase: "design-codebase-analysis",
     context: { requirements, projectStructure, existingPatterns }
   )
   \`\`\`

6. **Package Version Research** (MANDATORY - Use Web Search When Available)
   For any new dependencies you're considering:
   - **Current Version Check**: Search for the latest stable version and release notes
   - **Security Audit**: Look up recent CVE reports and security advisories
   - **Maintenance Status**: Check if package is actively maintained (recent commits, issue responses)
   - **Bundle Size Impact**: Research package size and tree-shaking capabilities
   - **Alternative Assessment**: Compare with popular alternatives and their trade-offs
   
   Example package research searches:
   - "[package-name] latest version changelog 2025"
   - "[package-name] security vulnerabilities CVE"
   - "[package-name] vs [alternative] performance bundle size"
   - "[package-name] maintenance status github activity"

7. **Agent Orchestration for Package Analysis (When Available)**
   If the orchestrate-with-agents TOOL is available:
   - Security analysts can audit packages for known vulnerabilities
   - Performance engineers can analyze bundle sizes and runtime impact
   - Maintenance reviewers can assess package health and community support
   - Compatibility experts can verify version matrix requirements
   - All assessments are consolidated into package recommendations
   
   Example orchestration call:
   \`\`\`
   orchestrate-with-agents(
     task: "Analyze and validate package dependencies for [feature]",
     phase: "design-package-analysis",
     context: { proposedPackages, existingDependencies, securityRequirements }
   )
   \`\`\`

8. **Design Pattern Research** (MANDATORY - Use Web Search When Available)
   Research modern architectural patterns and design approaches:
   - **Architectural Patterns**: Look up current best practices for your specific use case
   - **State Management**: Research modern state management patterns and libraries
   - **API Design**: Check current REST/GraphQL/tRPC best practices and conventions
   - **Testing Strategies**: Look up current testing patterns and tools for your tech stack
   - **Performance Patterns**: Research optimization techniques and modern performance patterns
   - **Accessibility Standards**: Check current WCAG guidelines and accessibility patterns
   
   Example design pattern research searches:
   - "[use-case] architecture patterns 2025 best practices"
   - "[framework] state management patterns 2025"
   - "API design best practices [technology] 2025"
   - "[framework] testing patterns integration unit 2025"
   - "web performance optimization techniques 2025"
   - "accessibility patterns [framework] WCAG 2025"

9. **Agent Orchestration for Design Pattern Research (When Available)**
   If the orchestrate-with-agents TOOL is available:
   - Architecture experts can recommend appropriate patterns
   - Performance specialists can suggest optimization strategies
   - Accessibility engineers can ensure inclusive design patterns
   - Testing specialists can propose verification approaches
   - All recommendations are integrated into design guidelines
   
   Example orchestration call:
   \`\`\`
   orchestrate-with-agents(
     task: "Research and recommend design patterns for [feature]",
     phase: "design-pattern-research",
     context: { requirements, techStack, architectureGoals }
   )
   \`\`\`

10. **Agent Orchestration for Comprehensive Design (When Available)**
   If the orchestrate-with-agents TOOL is available:
   - The orchestrator may parallelize design work to multiple specialists
   - Example: Backend architects, frontend developers, database designers, security experts
   - Each agent focuses on their area of expertise
   - Results are aggregated into a comprehensive design
   
   Example orchestration call:
   \`\`\`
   orchestrate-with-agents(
     task: "Create technical design based on requirements",
     phase: "design",
     context: { requirements, steeringDocs, codebaseAnalysis, researchFindings }
   )
   \`\`\`

11. **Generate design content**
   - Use the design template structure from initial get-template-context TOOL output
   - Create a detailed design document incorporating research findings
   - Include the following sections:
     - Overview
     - Architecture  
     - Components and Interfaces
     - Data Models
     - Error Handling
     - Testing Strategy
   - Build on existing patterns rather than creating new ones
   - Apply research findings and modern best practices discovered through web search
   - Include diagrams or visual representations when appropriate (use Mermaid for diagrams)
   - Define clear interfaces that integrate with existing systems
   - Document technology choices with reasoning based on research findings
   - Highlight design decisions and their rationales
   - Ensure the design addresses all feature requirements

12. **Create the document using the create-spec-doc TOOL**
   Call the create-spec-doc TOOL with:
   - projectPath: The project root path
   - specName: The same feature name used for requirements
   - document: "design"
   - content: Your design following the template

13. **Request User Approval Using MCP Tools**
   - Use the request-approval TOOL to create an approval request:
     - title: "Design Phase: [spec-name] - Ready for Review"
     - filePath: ".spec-workflow/specs/[spec-name]/design.md"
     - type: "document"
     - category: "spec"
     - categoryName: "[spec-name]"
   - The request-approval TOOL will return an approvalId
   - Tell the user: "Does the design look good? Please review in the dashboard and approve or request changes."
   - Wait for the user to say "Review" after they've completed their dashboard review
   - Use the get-approval-status TOOL to check approval status
   - If status is "needs-revision":
     a) Review the detailed feedback carefully
     b) Make modifications to address all feedback
     c) Call create-spec-doc TOOL again with the revised document content
     d) Create a NEW approval request using request-approval TOOL
     e) Continue the feedback-revision cycle until approved
   - Proceed to Phase 3 only after receiving "approved" status
   - Once approved, use the delete-approval TOOL to clean up the approval request

## PHASE 3: Create Task List

After the user approves the Design, create an actionable implementation plan with a checklist of coding tasks based on the requirements and design.

### Task Planning Process
1. **Context Assessment**
   - If you JUST created the requirements.md and design.md in this conversation, you already have the context
   - Only call get-spec-context TOOL if you're starting fresh on an existing spec or returning to work after a break

2. **Agent Orchestration (When Available)**
   If the orchestrate-with-agents TOOL is available:
   - The orchestrator can delegate task planning to project management specialists
   - Task breakdown may be enhanced with agent recommendations
   - Each task can be annotated with suggested agent assignments
   
   Example orchestration call:
   \`\`\`
   orchestrate-with-agents(
     task: "Create implementation task list from design",
     phase: "tasks",
     context: { requirements, design, codebaseAnalysis }
   )
   \`\`\`

3. **Generate Implementation Task List**
   Convert the feature design into a series of prompts for a code-generation LLM that will implement each step in a test-driven manner. Focus ONLY on tasks that involve writing, modifying, or testing code.

   **Atomic Task Requirements (CRITICAL FOR AGENT EXECUTION)**:
   - **File Scope**: Touches 1-3 related files maximum
   - **Time Boxing**: Completable in 15-30 minutes by an experienced developer
   - **Single Purpose**: One testable outcome per task
   - **Specific Files**: Must specify exact files to create/modify
   - **Agent-Friendly**: Clear input/output with minimal context switching

   **Task Format Guidelines**:
   - Format as numbered checkbox list with maximum two levels of hierarchy
   - Top-level items (like epics) should be used only when needed
   - Sub-tasks should be numbered with decimal notation (e.g., 1.1, 1.2, 2.1)
   - Each task must include:
     - Clear objective as task description that involves writing/modifying/testing code
     - Specific file paths to create/modify
     - Reference to requirements using: \`_Requirements: X.Y, Z.A_\`
     - Reference to leverage existing code: \`_Leverage: path/to/file.ts_\`
   - Ensure each step builds incrementally on previous steps
   - Prioritize test-driven development where appropriate
   - Focus ONLY on coding tasks - exclude:
     - User acceptance testing or feedback gathering
     - Deployment to production/staging
     - Performance metrics gathering
     - Marketing, documentation, or organizational activities
     - Any task that cannot be completed through writing/modifying/testing code

   **Example Task Format**:
   \`\`\`
   - [ ] 1. Set up project structure and core interfaces
     - Create directory structure for models, services, repositories
     - Define interfaces that establish system boundaries
     - _Requirements: 1.1_
   
   - [ ] 2. Implement data models and validation
   - [ ] 2.1 Create core data model interfaces and types
     - Write TypeScript interfaces for all data models
     - Implement validation functions for data integrity
     - _Requirements: 2.1, 3.3_
     - _Leverage: src/types/base.ts_
   \`\`\`

4. **Create the document using the create-spec-doc TOOL**
   Call the create-spec-doc TOOL with:
   - projectPath: The project root path
   - specName: The same feature name used previously
   - document: "tasks"
   - content: Your task list following the template

5. **Request User Approval Using MCP Tools**
   - Use the request-approval TOOL to create an approval request:
     - title: "Tasks Phase: [spec-name] - Ready for Review"
     - filePath: ".spec-workflow/specs/[spec-name]/tasks.md"
     - type: "document"
     - category: "spec"
     - categoryName: "[spec-name]"
   - The request-approval TOOL will return an approvalId
   - Tell the user: "Do the tasks look good? Please review in the dashboard and approve or request changes."
   - Wait for the user to say "Review" after they've completed their dashboard review
   - Use the get-approval-status TOOL to check approval status
   - If status is "needs-revision":
     a) Review the detailed feedback carefully
     b) Make modifications to address all feedback
     c) Call create-spec-doc TOOL again with the revised document content
     d) Create a NEW approval request using request-approval TOOL
     e) Continue the feedback-revision cycle until approved
   - Once approved, use the delete-approval TOOL to clean up the approval request
   - Inform the user: "The spec workflow is complete! You can begin executing tasks by using the manage-tasks tool or clicking 'Start task' in the dashboard."

## Critical Workflow Rules

### MCP Tool Usage (MANDATORY)
- **ALWAYS use the MCP tools** - Never create documents manually
- **create-spec-doc TOOL**: Use this to create all documents (requirements, design, tasks)
- **get-template-context TOOL**: Use this to get templates at the beginning
- **get-steering-context TOOL**: Use this to check for existing steering documents (optional context)
- **get-spec-context TOOL**: Use this to load existing spec documents
- **request-approval TOOL**: Use this to request user approval for each phase
- **get-approval-status TOOL**: Use this to poll for approval status
- **delete-approval TOOL**: Use this to clean up approved requests after successful approval
- **manage-tasks TOOL**: Use this for comprehensive task management during implementation

### Universal Rules
- Only create ONE spec at a time
- Always use kebab-case for feature names (e.g., user-authentication)
- MANDATORY: Always analyze existing codebase before starting any phase
- Use the MCP tools exactly as specified - do not create documents manually
- Follow exact template structures from the get-template-context TOOL
- Do not proceed without explicit user approval between phases
- Do not skip phases - complete Requirements → Design → Tasks sequence

### Approval Requirements
- NEVER proceed to the next phase without approval through the MCP approval system
- Use request-approval TOOL to create approval requests for each phase (include category and categoryName)
- **CRITICAL**: Only provide filePath in request-approval TOOL - NEVER include document content
- Use get-approval-status TOOL to poll until status is "approved"
- If status is "needs-revision": 
  a) Review feedback, b) Revise using create-spec-doc TOOL, c) Create NEW approval request (filePath only, NO content)
- Continue revision cycle until approval status is "approved"
- **MANDATORY CLEANUP**: Once approved, immediately use delete-approval TOOL to remove the approval request
- The approval system provides structured feedback through the dashboard interface

### Template Usage
- Use the pre-loaded template context from the get-template-context TOOL
- Requirements: Must follow requirements template structure exactly
- Design: Must follow design template structure exactly
- Tasks: Must follow tasks template structure exactly
- Include all template sections - do not omit any required sections

## Error Handling

If issues arise during the workflow:
- Requirements unclear: Ask targeted questions to clarify
- Design too complex: Suggest breaking into smaller components
- Tasks too broad: Break into smaller, more atomic tasks
- Implementation blocked: Document the blocker and suggest alternatives
- Tool errors: Report the error and retry with corrected parameters

## Success Criteria

A successful spec workflow completion includes:
- Complete requirements created with create-spec-doc TOOL
- Comprehensive design created with create-spec-doc TOOL
- Detailed task breakdown created with create-spec-doc TOOL
- All phases explicitly approved by user before proceeding
- Ready for implementation phase using spec-execute TOOL

## TASK EXECUTION PROTOCOL

### MANDATORY Task Status Workflow
Every task implementation MUST follow this exact sequence:

**Step 1: Mark Task as In-Progress**
- Use manage-tasks with action: "set-status", status: "in-progress"
- Confirm the status update succeeded
- Task is now ready for implementation

**Step 2: Implement the Task**
- Write the code according to task specifications
- Reference the requirements and design documents
- Complete all implementation details listed in the task

**Step 3: Mark Task as Completed**
- Use manage-tasks with action: "set-status", status: "completed"
- Immediately proceed to the next task
- Continue until all tasks are complete

### Correct Task Execution Example
\`\`\`
1. manage-tasks action: "next-pending" → Returns task 2.1
2. manage-tasks action: "set-status", taskId: "2.1", status: "in-progress" → Status updated
3. [Implementation work happens here]
4. manage-tasks action: "set-status", taskId: "2.1", status: "completed" → Task complete
5. manage-tasks action: "next-pending" → Returns task 2.2
6. [Repeat sequence for each task]
\`\`\`

### Task Management Best Practices
- Always work on one task at a time
- Always update status before beginning implementation
- Always mark tasks complete immediately after finishing
- Always proceed to the next task after completion
- Use manage-tasks action: "context" to load full implementation details

## Implementation Phase

After completing all phases with user approval, the implementation phase can be resumed at any time. When starting implementation (or returning to it after a break):

### Implementation Startup Process
1. **Check Current Status**
   - Use the spec-status TOOL to see overall progress
   - Use the manage-tasks TOOL with action: "list" to see all tasks and their current status

2. **Agent Orchestration for Implementation (When Available)**
   If the orchestrate-with-agents TOOL is available:
   - The orchestrator can assign tasks to specialized implementation agents
   - Frontend tasks go to UI/React specialists
   - Backend tasks go to API/database experts
   - Testing tasks go to QA engineers
   - Infrastructure tasks go to DevOps specialists
   - Multiple independent tasks can be executed in parallel
   
   Example orchestration call:
   \`\`\`
   orchestrate-with-agents(
     task: "Execute implementation task: [task-description]",
     phase: "implementation",
     context: { taskDetails, requirements, design, existingCode }
   )
   \`\`\`

3. **Begin Task Execution**
   - Inform the user: "Starting implementation of [spec-name]. I'll work through each task systematically."
   - Use the manage-tasks TOOL with action: "next-pending" to get the first/next task
   - Follow the TASK EXECUTION PROTOCOL for each task until all are complete

### Task Status System
Tasks use markdown checkboxes with these statuses:
- **[ ]** = pending (not started)
- **[-]** = in-progress (currently being worked on)
- **[x]** = completed (finished and tested)

### Implementation Guidelines
- Execute ONE task at a time in sequential order
- Follow the TASK EXECUTION PROTOCOL defined above
- The implementation phase is flexible - users can pause and resume anytime

## Task Execution Instructions

When users request task execution:

### Before Executing Tasks
- ALWAYS ensure you have read the spec's requirements.md, design.md and tasks.md files
- Executing tasks without the requirements or design will lead to inaccurate implementations
- Use get-spec-context TOOL if needed to load all spec documents

### Agent Orchestration for Task Execution (When Available)
If the orchestrate-with-agents TOOL is available:
- Analyze task complexity and requirements
- Select agents with matching expertise for the specific task
- For complex tasks, multiple agents can collaborate
- Testing agents can verify implementation alongside development
- The orchestrator ensures task requirements are fully met

Example orchestration call:
\`\`\`
orchestrate-with-agents(
  task: "Implement [specific-task-from-list]",
  phase: "task-execution",
  context: { taskId, taskDetails, requirements, design, relatedCode },
  preferences: { 
    preferredCapabilities: ["frontend", "testing"] // Based on task type
  }
)
\`\`\`

### During Task Execution
- Look at the task details in the task list
- If the requested task has sub-tasks, always start with the sub-tasks
- Focus on ONE task at a time - complete it fully before moving to another
- Verify your implementation against requirements specified in the task
- Once you complete the requested task, STOP and let the user review
- IMPORTANT: Execute only one task at a time, then wait for user to request the next

### Task Questions
Users may ask questions about tasks without wanting to execute them. In such cases:
- Provide the requested information without starting implementation
- If asked "what's the next task", use manage-tasks with action: "next-pending" and inform them
- Only begin implementation when explicitly requested

## Troubleshooting

### Requirements Clarification Stalls
If the requirements process seems stuck:
- Suggest moving to a different aspect of the requirements
- Provide examples or options to help the user make decisions
- Summarize what has been established so far and identify specific gaps
- Suggest conducting research to inform requirements decisions

### Research Limitations
If you cannot access needed information:
- Document what information is missing
- Suggest alternative approaches based on available information
- Ask the user to provide additional context or documentation
- Continue with available information rather than blocking progress

### Design Complexity
If the design becomes too complex:
- Suggest breaking it down into smaller, more manageable components
- Focus on core functionality first
- Suggest a phased approach to implementation
- Return to requirements clarification to prioritize features if needed

Remember: You MUST use the MCP tools. Each document MUST be created using the create-spec-doc TOOL and reviewed by the user before proceeding. This ensures quality and alignment with user expectations.`;
}