#!/usr/bin/env node

import { execSync } from 'child_process';
import https from 'https';

/**
 * Analyzes git changes using Claude API to determine appropriate semantic version bump
 * Returns: 'major', 'minor', or 'patch'
 */

function getGitDiff(fromTag) {
  try {
    // Get the diff summary
    const diffSummary = execSync(`git diff ${fromTag}..HEAD --stat`, { encoding: 'utf-8' });
    
    // Get commit messages since the tag
    const commits = execSync(`git log ${fromTag}..HEAD --pretty=format:"%h %s" --no-merges`, { encoding: 'utf-8' });
    
    // Get detailed changes for key files
    const detailedDiff = execSync(`git diff ${fromTag}..HEAD --unified=3`, { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 10 }); // 10MB buffer
    
    // Truncate detailed diff if too large (Claude has token limits)
    const maxDiffLength = 50000; // Roughly 12k tokens
    const truncatedDiff = detailedDiff.length > maxDiffLength 
      ? detailedDiff.substring(0, maxDiffLength) + '\n\n[... diff truncated due to size ...]'
      : detailedDiff;
    
    return {
      summary: diffSummary,
      commits: commits,
      diff: truncatedDiff
    };
  } catch (error) {
    console.error('Error getting git diff:', error.message);
    throw error;
  }
}

function getLatestTag() {
  try {
    // Get the most recent tag
    const tag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo ""', { encoding: 'utf-8' }).trim();
    if (!tag) {
      console.log('No previous tags found, will analyze all changes');
      return null;
    }
    return tag;
  } catch (error) {
    console.log('No previous tags found, will analyze all changes');
    return null;
  }
}

async function callClaudeAPI(apiKey, prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2 // Lower temperature for more consistent responses
    });

    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          if (response.error) {
            reject(new Error(`Claude API error: ${response.error.message}`));
          } else {
            resolve(response);
          }
        } catch (error) {
          reject(new Error(`Failed to parse Claude response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.write(data);
    req.end();
  });
}

async function analyzeVersionBump(apiKey, changes) {
  const prompt = `You are a semantic versioning expert. Analyze the following git changes and determine the appropriate version bump type.

Semantic Versioning Rules:
- MAJOR version (x.0.0): Breaking changes, incompatible API changes, removing features
- MINOR version (0.x.0): New features, new functionality, backwards-compatible additions
- PATCH version (0.0.x): Bug fixes, documentation, refactoring, performance improvements

Git Commit Summary:
${changes.commits || 'No commits found'}

Files Changed Summary:
${changes.summary}

Detailed Changes (may be truncated):
${changes.diff}

Based on these changes, what type of version bump is appropriate?

IMPORTANT: Respond with ONLY ONE of these three words: "major", "minor", or "patch"
Do not include any explanation or additional text.`;

  try {
    const response = await callClaudeAPI(apiKey, prompt);
    const content = response.content[0].text.toLowerCase().trim();
    
    // Validate response
    if (!['major', 'minor', 'patch'].includes(content)) {
      console.error(`Invalid response from Claude: "${content}". Defaulting to patch.`);
      return 'patch';
    }
    
    return content;
  } catch (error) {
    console.error('Error calling Claude API:', error.message);
    console.log('Defaulting to patch version bump');
    return 'patch';
  }
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is not set');
    process.exit(1);
  }

  try {
    // Get the latest tag
    const latestTag = getLatestTag();
    
    if (!latestTag) {
      console.log('No previous version found. Defaulting to patch bump.');
      console.log('patch');
      return;
    }

    console.error(`Analyzing changes since ${latestTag}...`);
    
    // Get git changes
    const changes = getGitDiff(latestTag);
    
    if (!changes.commits || changes.commits.trim() === '') {
      console.error('No changes detected since last version');
      console.log('patch');
      return;
    }
    
    // Analyze with Claude
    console.error('Consulting Claude for version bump recommendation...');
    const versionBump = await analyzeVersionBump(apiKey, changes);
    
    console.error(`Claude recommends: ${versionBump} version bump`);
    
    // Output the result (this will be captured by the GitHub Action)
    console.log(versionBump);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Defaulting to patch version bump');
    console.log('patch');
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});