import fs from 'node:fs'
import path from 'node:path'

const ROOT_DIR = process.cwd()
const ENV_PATH = path.join(ROOT_DIR, '.env')
const ENV_EXAMPLE_PATH = path.join(ROOT_DIR, '.env.example')
const ENV_KEY = 'ICP_IDENTITY_PEM_PATH'
const BASE64_KEY = 'ICP_IDENTITY_PEM_BASE64'
const DEFAULT_PATH = 'icp/icp_identity.pem'
const shouldUpdateExample = process.argv.includes('--example')

function extractEnvValue(filePath: string, key: string): string | null {
  if (!fs.existsSync(filePath)) {
    return null
  }
  const contents = fs.readFileSync(filePath, 'utf8')
  const regex = new RegExp(
    `^${key}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\r\\n]+))`,
    'm'
  )
  const match = contents.match(regex)
  if (!match) {
    return null
  }
  return match[1] ?? match[2] ?? match[3] ?? null
}

function setEnvValue(filePath: string, key: string, value: string) {
  if (!fs.existsSync(filePath)) {
    console.warn(`Skipping ${path.basename(filePath)} (file not found).`)
    return
  }
  const contents = fs.readFileSync(filePath, 'utf8')
  const serialized = `${key}="${value}"`
  const regex = new RegExp(`^${key}\\s*=.*$`, 'm')
  let next = contents
  if (regex.test(contents)) {
    next = contents.replace(regex, serialized)
  } else {
    const needsNewline = !contents.endsWith('\n')
    next = `${contents}${needsNewline ? '\n' : ''}${serialized}\n`
  }
  fs.writeFileSync(filePath, next)
}

function resolveIdentityPath(): string {
  const fromEnv = extractEnvValue(ENV_PATH, ENV_KEY)
  const fromExample = extractEnvValue(ENV_EXAMPLE_PATH, ENV_KEY)
  return fromEnv ?? fromExample ?? DEFAULT_PATH
}

function main() {
  const identityPath = resolveIdentityPath()
  const resolvedPath = path.isAbsolute(identityPath)
    ? identityPath
    : path.join(ROOT_DIR, identityPath)

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(
      `ICP identity PEM not found at "${resolvedPath}". Update ${ENV_KEY} in your .env file.`
    )
  }

  const pemContents = fs.readFileSync(resolvedPath)
  const base64 = pemContents.toString('base64')

  setEnvValue(ENV_PATH, BASE64_KEY, base64)
  console.log(
    `Updated ${BASE64_KEY} in .env using ${path.relative(
      ROOT_DIR,
      resolvedPath
    )}`
  )
  if (shouldUpdateExample) {
    setEnvValue(ENV_EXAMPLE_PATH, BASE64_KEY, base64)
    console.log('Synced .env.example (requested via --example flag).')
  } else {
    console.log(
      '.env.example was left untouched; rerun with "--example" to sync it.'
    )
  }
}

main()
