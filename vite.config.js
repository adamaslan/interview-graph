import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base: the build works from any static path (local preview, a file
// export, or Pages later) without a repo-name prefix baked in.
export default defineConfig({
  plugins: [react()],
  base: './',
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
