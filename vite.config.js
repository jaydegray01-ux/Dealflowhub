import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig, transformWithEsbuild } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const stylesJsPath = path.resolve(__dirname, 'styles.js')

export default defineConfig({
  plugins: [
    {
      name: 'treat-js-files-as-jsx',
      enforce: 'pre',
      async transform(code, id) {
        if (id !== stylesJsPath) return null
        const patchedCode = [
          "import React from 'react';",
          "import { createRoot } from 'react-dom/client';",
          "const ReactDOM = { createRoot };",
          code,
        ].join('\n')
        return transformWithEsbuild(patchedCode, id, { loader: 'jsx', jsx: 'automatic' })
      },
    },
    react(),
  ],
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
})
