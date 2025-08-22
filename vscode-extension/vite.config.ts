import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Plugin to copy sound assets
function copyAssetsPlugin() {
  return {
    name: 'copy-sound-assets',
    writeBundle() {
      const sourceDir = path.resolve(__dirname, 'webview-assets/sounds')
      const targetDir = path.resolve(__dirname, 'webview-dist/sounds')
      
      // Create target directory if it doesn't exist
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true })
      }
      
      // Copy sound files
      if (fs.existsSync(sourceDir)) {
        const files = fs.readdirSync(sourceDir)
        files.forEach(file => {
          const sourcePath = path.join(sourceDir, file)
          const targetPath = path.join(targetDir, file)
          fs.copyFileSync(sourcePath, targetPath)
          console.log(`Copied sound asset: ${file}`)
        })
      }
    }
  }
}

// Dynamically import Tailwind CSS v4 plugin
async function createConfig() {
  const { default: tailwindcss } = await import('@tailwindcss/vite')
  
  return {
    plugins: [
      react(),
      tailwindcss(),
      copyAssetsPlugin(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src/webview"),
      },
    },
    build: {
      outDir: path.resolve(__dirname, 'webview-dist'),
      rollupOptions: {
        input: {
          main: 'src/webview/index.html',
          'comment-modal': 'src/webview/comment-modal.html'
        },
        output: {
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          assetFileNames: '[name].[ext]'
        }
      },
      minify: 'esbuild' as const,
      target: 'es2020'
    },
    server: {
      port: 5173,
      strictPort: true
    },
    root: 'src/webview'
  }
}

// https://vite.dev/config/
export default defineConfig(createConfig())