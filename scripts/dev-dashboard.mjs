#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

// Usage options:
// 1) npm run dev:dashboard -- /absolute/path
// 2) npm run dev:dashboard --path=/absolute/path
// 3) PROJECT_PATH=/absolute/path npm run dev:dashboard

// Prefer npm config flag if provided: --path=...
const npmFlagPath = process.env.npm_config_path;
const args = process.argv.slice(2);

function extractPathFromArgs(argv) {
  if (!argv || argv.length === 0) return undefined;
  // Support formats: --path=/abs, --path /abs, --project=/abs, --project /abs
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--path=')) return a.split('=')[1];
    if (a === '--path' && i + 1 < argv.length) return argv[i + 1];
    if (a.startsWith('--project=')) return a.split('=')[1];
    if (a === '--project' && i + 1 < argv.length) return argv[i + 1];
  }
  // If first non-flag arg looks like a path, use it
  const first = argv.find((a) => !a.startsWith('--'));
  return first;
}

const argProvidedPath = extractPathFromArgs(args);
const rawInputPath = npmFlagPath || argProvidedPath || process.env.PROJECT_PATH;

// Compute absolute project path if provided; default to current working directory
const projectPath = rawInputPath ? resolve(process.cwd(), rawInputPath) : process.cwd();

// Spawn vite with our config, without forwarding the positional arg (to avoid overriding Vite root)
const viteArgs = ['--config', 'src/dashboard_frontend/vite.config.ts'];

// Prefer local vite binary so running this file via `node` works
const viteBin = resolve(process.cwd(), 'node_modules', '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite');

const child = spawn(viteBin, viteArgs, {
  stdio: 'inherit',
  shell: false,
  env: {
    ...process.env,
    PROJECT_PATH: projectPath,
  },
});

child.on('exit', (code) => process.exit(code ?? 1));

