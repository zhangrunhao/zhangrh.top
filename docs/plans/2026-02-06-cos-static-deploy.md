# COS Static Deploy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan.

**Goal:** Add a deploy script that uploads built static assets to Tencent COS with correct cache headers and prints a CDN entry URL.

**Architecture:** A Node.js ESM script in `frontend/scripts/deploy-static.mjs` walks the build directory, uploads files to COS with `Content-Type` and `Cache-Control` derived from file type, and prints `ENTRY_URL` using `CDN_BASE_URL` (if set) or COS default URL. The script is wired as `npm run deploy` in `frontend/package.json`.

**Tech Stack:** Node.js ESM, `cos-nodejs-sdk-v5`, `mime-types`, npm scripts.

### Task 1: Add Unit Tests For Helper Functions

**Files:**
- Create: `/Users/runhaozhang/Documents/project/zhangrh.top/frontend/scripts/deploy-static.test.mjs`

**Step 1: Write the failing test**

```js
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
  assert.equal(toPosix('a\\\\b\\\\c'), 'a/b/c')
})

test('joinCosKey prefixes and normalizes', () => {
  assert.equal(joinCosKey('static/site/', 'a/b.js'), 'static/site/a/b.js')
  assert.equal(joinCosKey('static/site', 'a/b.js'), 'static/site/a/b.js')
})
```

**Step 2: Run test to verify it fails**

Run: `node --test /Users/runhaozhang/Documents/project/zhangrh.top/frontend/scripts/deploy-static.test.mjs`  
Expected: FAIL with module import or missing export errors.

**Step 3: Commit**

```bash
git add /Users/runhaozhang/Documents/project/zhangrh.top/frontend/scripts/deploy-static.test.mjs
git commit -m "test: add deploy script helper tests"
```

### Task 2: Implement Deploy Script

**Files:**
- Create: `/Users/runhaozhang/Documents/project/zhangrh.top/frontend/scripts/deploy-static.mjs`

**Step 1: Write minimal implementation to satisfy tests**

```js
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import COS from 'cos-nodejs-sdk-v5'
import mime from 'mime-types'

const {
  COS_SECRET_ID,
  COS_SECRET_KEY,
  COS_BUCKET,
  COS_REGION,
  COS_PREFIX = '',
  BUILD_DIR = 'dist',
  CDN_BASE_URL = '',
} = process.env

export const toPosix = (value) => value.split(path.sep).join('/')

export const joinCosKey = (prefix, rel) => {
  const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`
  return `${normalizedPrefix}${toPosix(rel)}`.replace(/^\\/+/, '')
}

export const cacheControlForKey = (key) => {
  if (key.endsWith('index.html') || key.endsWith('.html')) {
    return 'no-cache'
  }
  return 'public, max-age=31536000, immutable'
}

const must = (value, name) => {
  if (!value) {
    console.error(`Missing env: ${name}`)
    process.exit(1)
  }
}

const walkFiles = (dir) => {
  const out = []
  const stack = [dir]
  while (stack.length) {
    const current = stack.pop()
    const items = fs.readdirSync(current, { withFileTypes: true })
    for (const item of items) {
      const nextPath = path.join(current, item.name)
      if (item.isDirectory()) {
        stack.push(nextPath)
      } else if (item.isFile()) {
        out.push(nextPath)
      }
    }
  }
  return out
}

const putObject = (cos, { key, filePath }) =>
  new Promise((resolve, reject) => {
    const contentType = mime.lookup(filePath) || 'application/octet-stream'
    cos.putObject(
      {
        Bucket: COS_BUCKET,
        Region: COS_REGION,
        Key: key,
        Body: fs.createReadStream(filePath),
        ContentType: contentType,
        CacheControl: cacheControlForKey(key),
      },
      (err, data) => (err ? reject(err) : resolve(data)),
    )
  })

export async function main() {
  must(COS_SECRET_ID, 'COS_SECRET_ID')
  must(COS_SECRET_KEY, 'COS_SECRET_KEY')
  must(COS_BUCKET, 'COS_BUCKET')
  must(COS_REGION, 'COS_REGION')

  const absBuild = path.resolve(process.cwd(), BUILD_DIR)
  if (!fs.existsSync(absBuild)) {
    console.error(`BUILD_DIR not found: ${absBuild}`)
    process.exit(1)
  }

  const files = walkFiles(absBuild)
  if (!files.length) {
    console.error(`No files found in: ${absBuild}`)
    process.exit(1)
  }

  const cos = new COS({
    SecretId: COS_SECRET_ID,
    SecretKey: COS_SECRET_KEY,
  })

  console.log(`Uploading ${files.length} files from ${BUILD_DIR} to cos://${COS_BUCKET}/${COS_PREFIX}`)
  for (const filePath of files) {
    const rel = path.relative(absBuild, filePath)
    const key = joinCosKey(COS_PREFIX, rel)
    await putObject(cos, { key, filePath })
    console.log(`OK  ${key}`)
  }

  const base = CDN_BASE_URL
    ? CDN_BASE_URL.replace(/\\/+$/, '')
    : `https://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com`
  const prefix = COS_PREFIX.endsWith('/') || COS_PREFIX.length === 0 ? COS_PREFIX : `${COS_PREFIX}/`
  const entry = `${base}/${prefix}index.html`
  console.log(`\\nENTRY_URL=${entry}`)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error('Upload failed:', error?.message || error)
    process.exit(1)
  })
}
```

**Step 2: Run tests to verify they pass**

Run: `node --test /Users/runhaozhang/Documents/project/zhangrh.top/frontend/scripts/deploy-static.test.mjs`  
Expected: PASS.

**Step 3: Commit**

```bash
git add /Users/runhaozhang/Documents/project/zhangrh.top/frontend/scripts/deploy-static.mjs
git commit -m "feat: add COS static deploy script"
```

### Task 3: Wire Dependencies And npm Script

**Files:**
- Modify: `/Users/runhaozhang/Documents/project/zhangrh.top/frontend/package.json`

**Step 1: Verify deps are missing**

Run: `npm ls cos-nodejs-sdk-v5 mime-types`  
Expected: non-zero exit or missing dependency output.

**Step 2: Add dependencies and script**

```json
{
  "scripts": {
    "deploy": "node scripts/deploy-static.mjs"
  },
  "devDependencies": {
    "cos-nodejs-sdk-v5": "^2.12.3",
    "mime-types": "^2.1.35"
  }
}
```

**Step 3: Install and verify**

Run: `npm install`  
Expected: dependencies installed without errors.

**Step 4: Commit**

```bash
git add /Users/runhaozhang/Documents/project/zhangrh.top/frontend/package.json
git commit -m "chore: add deploy dependencies and script"
```

### Task 4: Manual Smoke Check (No Upload)

**Files:**
- None

**Step 1: Build a project**

Run: `npm run build <project-name>`  
Expected: `dist/<project-name>/index.html` exists.

**Step 2: Dry safety check**

Run: `BUILD_DIR=dist/<project-name> node /Users/runhaozhang/Documents/project/zhangrh.top/frontend/scripts/deploy-static.mjs`  
Expected: FAIL with missing env vars, confirming guards work before real upload.

**Step 3: Commit**

No commit needed.
