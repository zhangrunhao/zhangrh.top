import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const cwd = process.cwd()
const projectRoot = path.join(cwd, 'project')

const listProjects = () => {
  if (!fs.existsSync(projectRoot)) {
    return []
  }
  return fs
    .readdirSync(projectRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
}

const projects = listProjects()

const usage = () => {
  const available = projects.length ? projects.join(', ') : 'none'
  console.log('Usage: npm run publish <project-name>')
  console.log(`Available projects: ${available}`)
  console.log('Publish flow: build -> rsync dist/<project>/ to server')
  console.log('Rsync target: root@101.200.185.29:/var/www/zhangrh.shop/<project>/')
}

const parseProjectFromNpm = (command) => {
  const raw = process.env.npm_config_argv
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw)
    const original = Array.isArray(parsed.original) ? parsed.original : parsed.cooked
    if (!Array.isArray(original)) {
      return null
    }
    const commandIndex = original.findIndex((arg) => arg === command)
    if (commandIndex === -1) {
      return null
    }
    const candidate = original[commandIndex + 1]
    if (typeof candidate !== 'string' || candidate.startsWith('-')) {
      return null
    }
    return projects.includes(candidate) ? candidate : null
  } catch {
    return null
  }
}

const extractProjectArg = (args) => {
  let project = null
  const rest = []
  for (const arg of args) {
    if (!project && projects.includes(arg)) {
      project = arg
      continue
    }
    rest.push(arg)
  }
  return { project, rest }
}

const findRepoRoot = (start) => {
  let current = start
  while (true) {
    if (fs.existsSync(path.join(current, '.git'))) {
      return current
    }
    const parent = path.dirname(current)
    if (parent === current) {
      return null
    }
    current = parent
  }
}

const [command, ...rawArgs] = process.argv.slice(2)
const directProject = command && projects.includes(command) ? command : null
const { project: projectFromArgs } = extractProjectArg(rawArgs)
const project = directProject ?? projectFromArgs ?? parseProjectFromNpm(command ?? 'publish')

if (!project) {
  console.error('Missing project name.')
  usage()
  process.exit(1)
}

const repoRoot = findRepoRoot(cwd) ?? path.resolve(cwd, '..')

const run = (commandName, args, options) => {
  const result = spawnSync(commandName, args, { stdio: 'inherit', ...options })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

run('git', ['pull'], { cwd: repoRoot })
run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build', '--', project], { cwd })
run(
  process.platform === 'win32' ? 'npm.cmd' : 'npm',
  ['run', 'deploy'],
  {
    cwd,
    env: { ...process.env, DEPLOY_PROJECT: project },
  },
)
