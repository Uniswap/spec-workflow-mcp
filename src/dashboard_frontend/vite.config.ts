import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import react from '@vitejs/plugin-react';
import { DashboardServer } from '../dashboard/server';

// Fixed backend port for Vite dev
const BACKEND_PORT = 5174;

// Plugin to start the dashboard backend during Vite dev and proxy traffic
function dashboardBackendDev() {
  let started = false;
  return {
    name: 'dashboard-backend-dev',
    async configureServer() {
      if (started) return;
      started = true;
      const projectPath = process.cwd();
      const server = new DashboardServer({ projectPath, autoOpen: false, port: BACKEND_PORT });
      try {
        await server.start();
        // eslint-disable-next-line no-console
        console.log(`[dashboard] backend started on http://localhost:${BACKEND_PORT}`);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[dashboard] failed to start backend:', err);
      }
    },
  };
}

// Plugin to watch the project's .spec-workflow folder and trigger reloads
function specWorkflowWatcher() {
  return {
    name: 'spec-workflow-watcher',
    configureServer(server: any) {
      const workflowRoot = resolve(process.cwd(), '.spec-workflow');
      server.watcher.add(workflowRoot);
      server.watcher.on('change', (file: string) => {
        if (file.startsWith(workflowRoot)) {
          server.ws.send({ type: 'full-reload' });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), dashboardBackendDev(), specWorkflowWatcher()],
  // Ensure Vite resolves index.html relative to this config file
  root: dirname(fileURLToPath(new URL(import.meta.url))),
  base: '/',
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: `http://localhost:${BACKEND_PORT}`,
        changeOrigin: true,
      },
      '/ws': {
        target: `ws://localhost:${BACKEND_PORT}`,
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});

