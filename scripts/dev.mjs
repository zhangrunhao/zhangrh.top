import { spawn } from 'node:child_process'

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'

const frontend = spawn(npmCmd, ['run', 'dev'], {
  cwd: new URL('../frontend', import.meta.url),
  stdio: 'inherit',
})

const backend = spawn(npmCmd, ['run', 'dev'], {
  cwd: new URL('../backend', import.meta.url),
  stdio: 'inherit',
})

const shutdown = () => {
  frontend.kill('SIGINT')
  backend.kill('SIGINT')
}

process.on('SIGINT', () => {
  shutdown()
  process.exit(0)
})

process.on('SIGTERM', () => {
  shutdown()
  process.exit(0)
})

frontend.on('exit', (code) => {
  if (code && code !== 0) {
    backend.kill('SIGINT')
    process.exit(code)
  }
})

backend.on('exit', (code) => {
  if (code && code !== 0) {
    frontend.kill('SIGINT')
    process.exit(code)
  }
})
