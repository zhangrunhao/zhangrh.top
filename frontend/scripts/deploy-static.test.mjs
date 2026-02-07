import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_PROJECT_NAME,
  DEFAULT_RSYNC_DEST,
  DEFAULT_RSYNC_HOST,
  DEFAULT_RSYNC_USER,
  distDirForProject,
  ensureTrailingSlash,
  remoteDirForProject,
  shellEscape,
} from './deploy-static.mjs'

test('defaults use server rsync target', () => {
  assert.equal(DEFAULT_PROJECT_NAME, 'hub')
  assert.equal(DEFAULT_RSYNC_USER, 'root')
  assert.equal(DEFAULT_RSYNC_HOST, '101.200.185.29')
  assert.equal(DEFAULT_RSYNC_DEST, '/var/www/zhangrh.shop')
})

test('distDirForProject points to dist/<project>', () => {
  assert.equal(distDirForProject('hub'), 'dist/hub')
})

test('remoteDirForProject joins base and project', () => {
  assert.equal(remoteDirForProject('/var/www/zhangrh.shop', 'hub'), '/var/www/zhangrh.shop/hub')
  assert.equal(remoteDirForProject('/var/www/zhangrh.shop/', 'hub'), '/var/www/zhangrh.shop/hub')
})

test('ensureTrailingSlash appends once', () => {
  assert.equal(ensureTrailingSlash('/var/www/zhangrh.shop/hub'), '/var/www/zhangrh.shop/hub/')
  assert.equal(ensureTrailingSlash('/var/www/zhangrh.shop/hub/'), '/var/www/zhangrh.shop/hub/')
})

test('shellEscape quotes safely', () => {
  assert.equal(shellEscape("/var/www/zhangrh.shop/hub"), "'/var/www/zhangrh.shop/hub'")
  assert.equal(shellEscape("abc'def"), "'abc'\\''def'")
})
