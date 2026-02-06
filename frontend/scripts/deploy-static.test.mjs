import test from 'node:test'
import assert from 'node:assert/strict'
import {
  cacheControlForKey,
  joinCosKey,
  toPosix,
  CONFIG,
  PROJECT_NAME,
  pickLatestBuildDate,
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

test('toPosix normalizes separators', () => {
  assert.equal(toPosix('a\\b\\c'), 'a/b/c')
})

test('joinCosKey prefixes and normalizes', () => {
  assert.equal(joinCosKey('static/site/', 'a/b.js'), 'static/site/a/b.js')
  assert.equal(joinCosKey('static/site', 'a/b.js'), 'static/site/a/b.js')
})

test('CONFIG uses hardcoded defaults', () => {
  assert.equal(PROJECT_NAME, '20250122_website')
  assert.equal(CONFIG.COS_BUCKET, 'zhangrh-1307650972')
  assert.equal(CONFIG.COS_REGION, 'ap-beijing')
  assert.equal(
    CONFIG.CDN_BASE_URL,
    'https://zhangrh-1307650972.cos.ap-beijing.myqcloud.com',
  )
})

test('pickLatestBuildDate picks max yyyymmdd directory name', () => {
  assert.equal(pickLatestBuildDate(['20260206', '20260207']), '20260207')
})

test('pickLatestBuildDate ignores non-date directories', () => {
  assert.equal(pickLatestBuildDate(['static', 'abc', '20260207']), '20260207')
})

test('pickLatestBuildDate returns null when no date directory exists', () => {
  assert.equal(pickLatestBuildDate(['static', 'html']), null)
})
