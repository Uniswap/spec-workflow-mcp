import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface GitignoreResult {
  success: boolean;
  action: 'created' | 'updated' | 'skipped' | 'failed';
  filePath?: string;
  message?: string;
  error?: Error;
}

export interface GitignorePattern {
  pattern: string;
  variations: string[];
  isComment: boolean;
  lineNumber?: number;
}

export interface RepositoryInfo {
  rootPath: string;
  gitignorePath?: string;
  isSubmodule: boolean;
  exists: boolean;
}

export interface GitignoreConfig {
  pattern: string;
  silent: boolean;
  createIfMissing: boolean;
  force: boolean;
}

export class GitignoreManager {
  private static readonly PATTERNS = [
    '**/.spec-workflow/',
    '.spec-workflow/',
    '.spec-workflow',
    '/.spec-workflow/',
    '**/.spec-workflow'
  ];
  
  private static readonly TARGET_PATTERN = '**/.spec-workflow/';
  private static readonly PATTERN_COMMENT = '# Spec workflow files';
  
  async ensure(projectPath: string, config?: Partial<GitignoreConfig>): Promise<GitignoreResult> {
    const settings: GitignoreConfig = {
      pattern: GitignoreManager.TARGET_PATTERN,
      silent: false,
      createIfMissing: true,
      force: false,
      ...config
    };
    
    try {
      // Find repository root
      const repoInfo = await this.findRepository(projectPath);
      if (!repoInfo.exists) {
        return { 
          success: true, 
          action: 'skipped', 
          message: 'Not a git repository' 
        };
      }
      
      // Check for existing .gitignore
      const gitignorePath = path.join(repoInfo.rootPath, '.gitignore');
      const exists = await this.fileExists(gitignorePath);
      
      if (exists) {
        // Check if pattern already present
        const content = await fs.promises.readFile(gitignorePath, 'utf-8');
        
        if (!settings.force && this.isPatternPresent(content)) {
          return { 
            success: true, 
            action: 'skipped', 
            filePath: gitignorePath 
          };
        }
        
        // Append pattern
        await this.appendPattern(gitignorePath, content, settings.pattern);
        return { 
          success: true, 
          action: 'updated', 
          filePath: gitignorePath,
          message: settings.silent ? undefined : `Added .spec-workflow/ to ${gitignorePath}`
        };
        
      } else if (settings.createIfMissing) {
        // Create new .gitignore
        await this.createGitignore(gitignorePath, settings.pattern);
        return { 
          success: true, 
          action: 'created', 
          filePath: gitignorePath,
          message: settings.silent ? undefined : `Created ${gitignorePath} with .spec-workflow/ entry`
        };
        
      } else {
        return {
          success: true,
          action: 'skipped',
          message: '.gitignore does not exist and createIfMissing is false'
        };
      }
    } catch (error) {
      return { 
        success: false, 
        action: 'failed', 
        error: error as Error,
        message: `Warning: Could not update .gitignore: ${(error as Error).message}`
      };
    }
  }
  
  private async findRepository(startPath: string): Promise<RepositoryInfo> {
    const gitRoot = await this.findGitRoot(startPath);
    
    if (!gitRoot) {
      return {
        rootPath: startPath,
        exists: false,
        isSubmodule: false
      };
    }
    
    // Check if it's a submodule
    const gitPath = path.join(gitRoot, '.git');
    const stats = await fs.promises.stat(gitPath);
    const isSubmodule = stats.isFile();
    
    return {
      rootPath: gitRoot,
      gitignorePath: path.join(gitRoot, '.gitignore'),
      exists: true,
      isSubmodule
    };
  }
  
  private async findGitRoot(startPath: string): Promise<string | null> {
    let currentPath = path.resolve(startPath);
    const homePath = os.homedir();
    
    while (currentPath !== homePath && currentPath !== path.dirname(currentPath)) {
      const gitPath = path.join(currentPath, '.git');
      
      try {
        const stats = await fs.promises.stat(gitPath);
        // Check for both .git directory and .git file (submodules)
        if (stats.isDirectory() || stats.isFile()) {
          return currentPath;
        }
      } catch {
        // .git doesn't exist, continue traversing
      }
      
      currentPath = path.dirname(currentPath);
    }
    
    return null;
  }
  
  isPatternPresent(content: string): boolean {
    const lines = content.split(/\r?\n/);
    return lines.some(line => {
      const trimmed = line.trim();
      // Skip comments
      if (trimmed.startsWith('#')) {
        return false;
      }
      // Check if line matches any of our patterns
      return GitignoreManager.PATTERNS.includes(trimmed) ||
             this.normalizePattern(trimmed) === this.normalizePattern(GitignoreManager.TARGET_PATTERN);
    });
  }
  
  private normalizePattern(pattern: string): string {
    // Remove leading/trailing slashes and wildcards for comparison
    return pattern
      .replace(/^\*\*\//, '')
      .replace(/^\//, '')
      .replace(/\/$/, '')
      .replace(/^\*\*/, '')
      .trim();
  }
  
  private matchesSpecWorkflow(pattern: string): boolean {
    const normalized = this.normalizePattern(pattern);
    return normalized === '.spec-workflow' || 
           normalized === 'spec-workflow';
  }
  
  private async appendPattern(gitignorePath: string, existingContent: string, pattern: string): Promise<void> {
    // Ensure file ends with newline
    let content = existingContent;
    if (content.length > 0 && !content.endsWith('\n')) {
      content += '\n';
    }
    
    // Add blank line if content exists and doesn't end with blank line
    if (content.length > 0 && !content.endsWith('\n\n')) {
      content += '\n';
    }
    
    // Add comment and pattern
    content += `${GitignoreManager.PATTERN_COMMENT}\n`;
    content += `${pattern}\n`;
    
    // Write file with retry logic for concurrent access
    await this.writeFileWithRetry(gitignorePath, content);
  }
  
  private async createGitignore(gitignorePath: string, pattern: string): Promise<void> {
    const content = `${GitignoreManager.PATTERN_COMMENT}\n${pattern}\n`;
    await this.writeFileWithRetry(gitignorePath, content);
  }
  
  private async writeFileWithRetry(filePath: string, content: string, maxRetries: number = 3): Promise<void> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await fs.promises.writeFile(filePath, content, 'utf-8');
        return; // Success
      } catch (error) {
        lastError = error as Error;
        
        // If it's a permission error, don't retry
        if ((error as any).code === 'EACCES' || (error as any).code === 'EPERM') {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt - 1)));
        }
      }
    }
    
    throw lastError || new Error('Failed to write file after retries');
  }
  
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
  
  async parseGitignore(gitignorePath: string): Promise<GitignorePattern[]> {
    try {
      const content = await fs.promises.readFile(gitignorePath, 'utf-8');
      const lines = content.split(/\r?\n/);
      const patterns: GitignorePattern[] = [];
      
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        
        if (trimmed.length === 0) {
          return; // Skip empty lines
        }
        
        const isComment = trimmed.startsWith('#');
        
        patterns.push({
          pattern: trimmed,
          variations: this.getPatternVariations(trimmed),
          isComment,
          lineNumber: index + 1
        });
      });
      
      return patterns;
    } catch {
      return [];
    }
  }
  
  private getPatternVariations(pattern: string): string[] {
    if (pattern.startsWith('#') || pattern.length === 0) {
      return [];
    }
    
    const variations: string[] = [pattern];
    const normalized = this.normalizePattern(pattern);
    
    // Add common variations
    if (normalized === '.spec-workflow') {
      variations.push(
        '.spec-workflow/',
        '/.spec-workflow/',
        '**/.spec-workflow/',
        '**/.spec-workflow'
      );
    }
    
    return [...new Set(variations)]; // Remove duplicates
  }
  
  async removePattern(gitignorePath: string): Promise<GitignoreResult> {
    try {
      if (!await this.fileExists(gitignorePath)) {
        return {
          success: true,
          action: 'skipped',
          message: '.gitignore does not exist'
        };
      }
      
      const content = await fs.promises.readFile(gitignorePath, 'utf-8');
      const lines = content.split(/\r?\n/);
      const filteredLines: string[] = [];
      let removed = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        // Check if this is our comment
        if (trimmed === GitignoreManager.PATTERN_COMMENT) {
          // Skip this line and potentially the next if it's our pattern
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim();
            if (GitignoreManager.PATTERNS.includes(nextLine)) {
              i++; // Skip the pattern line too
              removed = true;
              continue;
            }
          }
        }
        
        // Check if this line is one of our patterns (without comment)
        if (!trimmed.startsWith('#') && GitignoreManager.PATTERNS.includes(trimmed)) {
          removed = true;
          continue;
        }
        
        filteredLines.push(line);
      }
      
      if (removed) {
        // Clean up extra blank lines
        const cleanedContent = filteredLines.join('\n').replace(/\n{3,}/g, '\n\n');
        await this.writeFileWithRetry(gitignorePath, cleanedContent);
        
        return {
          success: true,
          action: 'updated',
          filePath: gitignorePath,
          message: 'Removed .spec-workflow/ pattern from .gitignore'
        };
      } else {
        return {
          success: true,
          action: 'skipped',
          message: 'Pattern not found in .gitignore'
        };
      }
    } catch (error) {
      return {
        success: false,
        action: 'failed',
        error: error as Error,
        message: `Failed to remove pattern: ${(error as Error).message}`
      };
    }
  }
}

// Singleton instance for global use
export const gitignoreManager = new GitignoreManager();