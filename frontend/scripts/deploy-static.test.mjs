import test from 'node:test'
import assert from 'node:assert/strict'
import { cacheControlForKey, joinCosKey, toPosix } from './deploy-static.mjs'

test('cacheControlForKey returns no-cache for html', () => {
  assert.equal(cacheControlForKey('index.html'), 'no-cache')
  assert.equal(cacheControlForKey('foo/bar/page.html'), 'no-cache')
})

test('cacheControlForKey returns long cache for non-html', () => {
  assert.equal(
    cacheControlForKey('static/app.123.js'),
    'public, max-age=31536000, immutable',
  )
})

test('toPosix normalizes separators', () => {
  assert.equal(toPosix('a\\b\\c'), 'a/b/c')
})

test('joinCosKey prefixes and normalizes', () => {
  assert.equal(joinCosKey('static/site/', 'a/b.js'), 'static/site/a/b.js')
  assert.equal(joinCosKey('static/site', 'a/b.js'), 'static/site/a/b.js')
})
