import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createProjectConfig } from '../../vite.config'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

export default createProjectConfig({
  projectRoot,
  entry: {
    index: path.resolve(projectRoot, './index.html'),
  },
})
