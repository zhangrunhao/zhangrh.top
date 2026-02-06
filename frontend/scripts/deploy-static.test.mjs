import test from 'node:test'
import assert from 'node:assert/strict'
import {
  cacheControlForKey,
  cosPrefixForProject,
  contentDispositionForKey,
  joinCosKey,
  staticBuildDirForProject,
  toPosix,
  CONFIG,
  DEFAULT_PROJECT_NAME,
} from './deploy-static.mjs'

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

test('contentDispositionForKey returns inline', () => {
  assert.equal(contentDispositionForKey('static/app.123.js'), 'inline')
  assert.equal(contentDispositionForKey('index.html'), 'inline')
})

test('toPosix normalizes separators', () => {
  assert.equal(toPosix('a\\b\\c'), 'a/b/c')
})

test('joinCosKey prefixes and normalizes', () => {
  assert.equal(joinCosKey('static/site/', 'a/b.js'), 'static/site/a/b.js')
  assert.equal(joinCosKey('static/site', 'a/b.js'), 'static/site/a/b.js')
})

test('CONFIG uses hardcoded defaults', () => {
  assert.equal(DEFAULT_PROJECT_NAME, '20250122_website')
  assert.equal(CONFIG.COS_BUCKET, 'zhangrh-1307650972')
  assert.equal(CONFIG.COS_REGION, 'ap-beijing')
  assert.equal(
    CONFIG.CDN_BASE_URL,
    'https://zhangrh-1307650972.cos.ap-beijing.myqcloud.com',
  )
})

test('staticBuildDirForProject points to dist/<project>/static', () => {
  assert.equal(
    staticBuildDirForProject('20250122_website'),
    'dist/20250122_website/static',
  )
})

test('cosPrefixForProject points to <project>/static', () => {
  assert.equal(cosPrefixForProject('20250122_website'), '20250122_website/static')
})
