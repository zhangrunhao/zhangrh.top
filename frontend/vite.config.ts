import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, mergeConfig } from 'vite'

const CDN_BASE_URL = 'https://zhangrh-1307650972.cos.ap-beijing.myqcloud.com'

export const formatBuildDate = (date = new Date()) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}${month}${day}`
}

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

const toAbsoluteEntry = (projectRoot: string, entry: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(entry).map(([name, entryPath]) => [name, path.resolve(projectRoot, entryPath)]),
  )

const scanHtmlEntries = (projectRoot: string) =>
  Object.fromEntries(
    fs
      .readdirSync(projectRoot)
      .filter((name) => name.endsWith('.html'))
      .map((name) => [path.parse(name).name, path.resolve(projectRoot, name)]),
  )

export const createProjectConfig = ({
  projectRoot,
  entry,
}: {
  projectRoot: string
  entry?: Record<string, string>
}) => {
  const projectName = path.basename(projectRoot)
  const buildDate = formatBuildDate()
  const htmlInputs = entry ? toAbsoluteEntry(projectRoot, entry) : scanHtmlEntries(projectRoot)
  const isMultiPage = Object.keys(htmlInputs).length > 1
  const distRoot = path.resolve(projectRoot, '../../dist', projectName, buildDate)
  const baseUrl = `${CDN_BASE_URL.replace(/\/+$/, '')}/${projectName}/${buildDate}/`

  if (Object.keys(htmlInputs).length === 0) {
    throw new Error(`No HTML entry files found in ${projectRoot}.`)
  }

  return defineConfig(({ command }) =>
    mergeConfig(sharedConfig, {
      root: projectRoot,
      base: command === 'build' ? baseUrl : '/',
      appType: isMultiPage ? 'mpa' : 'spa',
      plugins: [
        {
          name: 'move-html-to-subdir',
          apply: 'build',
          generateBundle(_options, bundle) {
            for (const [fileName, file] of Object.entries(bundle)) {
              if (file.type !== 'asset' || !fileName.endsWith('.html')) {
                continue
              }
              delete bundle[fileName]
              file.fileName = path.posix.join('html', fileName)
              bundle[file.fileName] = file
            }
          },
        },
      ],
      build: {
        outDir: distRoot,
        assetsDir: 'static',
        emptyOutDir: true,
        rollupOptions: {
          input: htmlInputs,
        },
      },
    }),
  )
}

export default sharedConfig
