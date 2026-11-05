import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

const budget = 200 * 1024
const html = readFileSync('dist/index.html', 'utf8')
const files = [...html.matchAll(/\/assets\/[^"]+\.(?:js|css)/g)].map((m) => m[0])
const total = files.reduce((sum, f) => sum + gzipSync(readFileSync(`dist${f}`)).length, 0)
const kb = (n) => `${(n / 1024).toFixed(1)} kB`

console.log(`First load: ${kb(total)} gzip across ${files.length} files (budget ${kb(budget)})`)
if (!files.length || total > budget) {
  console.error(
    files.length ? 'Over the first-load budget.' : 'No assets found in dist/index.html.',
  )
  process.exit(1)
}
