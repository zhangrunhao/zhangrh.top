import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export const DEFAULT_PROJECT_NAME = 'hub'
export const DEFAULT_RSYNC_USER = 'root'
export const DEFAULT_RSYNC_HOST = '101.200.185.29'
export const DEFAULT_RSYNC_DEST = '/var/www/zhangrh.shop'

export const distDirForProject = (projectName) => path.join('dist', projectName)

export const remoteDirForProject = (baseDir, projectName) =>
  `${baseDir.replace(/\/+$/, '')}/${projectName}`

export const ensureTrailingSlash = (value) => (value.endsWith('/') ? value : `${value}/`)

export const shellEscape = (value) => `'${String(value).replace(/'/g, `'\\''`)}'`

const parseArgs = (args) => {
  const options = { project: null, user: null, host: null, dest: null }
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg === '--user') {
      options.user = args[i + 1] ?? null
      i += 1
      continue
    }
    if (arg === '--host') {
      options.host = args[i + 1] ?? null
      i += 1
      continue
    }
    if (arg === '--dest') {
      options.dest = args[i + 1] ?? null
      i += 1
      continue
    }
    if (!options.project && !arg.startsWith('-')) {
      options.project = arg
    }
  }
  return options
}

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

const usage = () => {
  console.log('Usage: npm run deploy [project-name] [-- --host <host> --dest <path> --user <user>]')
  console.log(
    `Default target: ${DEFAULT_RSYNC_USER}@${DEFAULT_RSYNC_HOST}:${DEFAULT_RSYNC_DEST}/<project>/`,
  )
}

export async function main() {
  const cli = parseArgs(process.argv.slice(2))
  const projectName = cli.project || process.env.DEPLOY_PROJECT || DEFAULT_PROJECT_NAME
  if (!projectName) {
    usage()
    process.exit(1)
  }

  const rsyncUser = cli.user || process.env.DEPLOY_RSYNC_USER || DEFAULT_RSYNC_USER
  const rsyncHost = cli.host || process.env.DEPLOY_RSYNC_HOST || DEFAULT_RSYNC_HOST
  const rsyncDest = cli.dest || process.env.DEPLOY_RSYNC_DEST || DEFAULT_RSYNC_DEST

  const localDist = path.resolve(process.cwd(), distDirForProject(projectName))
  if (!fs.existsSync(localDist)) {
    console.error(`Build output not found: ${localDist}`)
    console.error(`Run: npm run build -- ${projectName}`)
    process.exit(1)
  }

  const remote = `${rsyncUser}@${rsyncHost}`
  const remoteProjectDir = remoteDirForProject(rsyncDest, projectName)

  run('ssh', [remote, `mkdir -p ${shellEscape(remoteProjectDir)}`])
  run('rsync', [
    '-avz',
    '--delete',
    ensureTrailingSlash(localDist),
    `${remote}:${ensureTrailingSlash(remoteProjectDir)}`,
  ])

  console.log(`Deployed: ${localDist} -> ${remote}:${ensureTrailingSlash(remoteProjectDir)}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error('Deploy failed:', error?.message || error)
    process.exit(1)
  })
}
