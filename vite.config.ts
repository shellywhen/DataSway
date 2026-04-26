import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'
import checker from 'vite-plugin-checker'
import path from 'path'
import fs from 'fs'

const WRONG_CODE = `import { bpfrpt_proptype_WindowScroller } from "../WindowScroller.js";`;

/** GitHub project Pages URL: https://<user>.github.io/<repo>/ — must match the repo name (case-sensitive path). */
const GITHUB_PAGES_BASE = '/DataSway/'

function copyIndexTo404() {
  return {
    name: 'copy-index-to-404',
    closeBundle() {
      const outDir = path.resolve(__dirname, 'docs/')
      const indexPath = path.join(outDir, 'index.html')
      const notFoundPath = path.join(outDir, '404.html')
      if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, notFoundPath)
      }
    },
  };
}


function reactVirtualized() {
  return {
    name: 'my:react-virtualized',
    configResolved() {
      const file = require
        .resolve('react-virtualized')
        .replace(
          path.join('dist', 'commonjs', 'index.js'),
          path.join('dist', 'es', 'WindowScroller', 'utils', 'onScroll.js')
        );
      const code = fs.readFileSync(file, 'utf-8');
      const modified = code.replace(WRONG_CODE, '');
      fs.writeFileSync(file, modified);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  // Dev: '/' so http://localhost:5173/ works. Production build: repo subpath for GitHub Pages.
  base: command === 'build' ? GITHUB_PAGES_BASE : '/',
  plugins: [react(), monacoEditorPlugin({
    forceBuildCDN: false,
  }), reactVirtualized(), checker({
    typescript: false
  }), copyIndexTo404()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'docs'
  }
}))
