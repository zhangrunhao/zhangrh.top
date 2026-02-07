import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, mergeConfig } from 'vite'

const sharedConfig = defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})

export const createProjectConfig = ({
  projectRoot,
  entry,
}: {
  projectRoot: string
  entry?: Record<string, string>
}) => {
  const projectName = path.basename(projectRoot)
  const htmlInputs = entry
    ? Object.fromEntries(
        Object.entries(entry).map(([name, entryPath]) => [name, path.resolve(projectRoot, entryPath)]),
      )
    : { index: path.resolve(projectRoot, 'index.html') }
  const distRoot = path.resolve(projectRoot, '../../dist', projectName)
  const basePath = `/${projectName}/`

  if (!htmlInputs.index) {
    throw new Error(`Missing index.html entry for ${projectRoot}.`)
  }

  return defineConfig(({ command }) =>
    mergeConfig(sharedConfig, {
      root: projectRoot,
      base: command === 'build' ? basePath : '/',
      appType: 'spa',
      build: {
        outDir: distRoot,
        assetsDir: 'static',
        emptyOutDir: true,
        rollupOptions: {
          input: { index: htmlInputs.index },
        },
      },
    }),
  )
}

export default sharedConfig
