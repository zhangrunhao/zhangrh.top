import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import COS from 'cos-nodejs-sdk-v5'
import mime from 'mime-types'

const { COS_SECRET_ID, COS_SECRET_KEY } = process.env

export const PROJECT_NAME = '20250122_website'
const DIST_ROOT = 'dist'
const BUILD_DATE_PATTERN = /^\d{8}$/

export const CONFIG = {
  COS_BUCKET: 'zhangrh-1307650972',
  COS_REGION: 'ap-beijing',
  CDN_BASE_URL: 'https://zhangrh-1307650972.cos.ap-beijing.myqcloud.com',
}

const { COS_BUCKET, COS_REGION, CDN_BASE_URL } = CONFIG

export const pickLatestBuildDate = (directoryNames) =>
  directoryNames
    .filter((name) => BUILD_DATE_PATTERN.test(name))
    .sort()
    .at(-1) ?? null

export const toPosix = (value) => value.split(path.sep).join('/').replace(/\\/g, '/')

export const joinCosKey = (prefix, rel) => {
  const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`
  return `${normalizedPrefix}${toPosix(rel)}`.replace(/^\/+/, '')
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

  const projectDistDir = path.resolve(process.cwd(), DIST_ROOT, PROJECT_NAME)
  if (!fs.existsSync(projectDistDir)) {
    console.error(`Project dist dir not found: ${projectDistDir}`)
    process.exit(1)
  }

  const buildDate = pickLatestBuildDate(
    fs
      .readdirSync(projectDistDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name),
  )
  if (!buildDate) {
    console.error(`No YYYYMMDD build directory found in: ${projectDistDir}`)
    process.exit(1)
  }

  const BUILD_DIR = path.join(DIST_ROOT, PROJECT_NAME, buildDate)
  const COS_PREFIX = `${PROJECT_NAME}/${buildDate}`
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

  console.log(
    `Uploading ${files.length} files from ${BUILD_DIR} to cos://${COS_BUCKET}/${COS_PREFIX}`,
  )
  for (const filePath of files) {
    const rel = path.relative(absBuild, filePath)
    const key = joinCosKey(COS_PREFIX, rel)
    await putObject(cos, { key, filePath })
    console.log(`OK  ${key}`)
  }

  const base = CDN_BASE_URL
    ? CDN_BASE_URL.replace(/\/+$/, '')
    : `https://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com`
  const prefix =
    COS_PREFIX.endsWith('/') || COS_PREFIX.length === 0
      ? COS_PREFIX
      : `${COS_PREFIX}/`
  const entry = `${base}/${prefix}index.html`
  console.log(`\nENTRY_URL=${entry}`)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error('Upload failed:', error?.message || error)
    process.exit(1)
  })
}
