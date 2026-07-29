import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = join(root, 'dist')
const assets = join(dist, 'assets')
const files = await readdir(assets)
const cssFile = files.find((file) => file.endsWith('.css'))
const jsFile = files.find((file) => file.endsWith('.js'))

if (!cssFile || !jsFile) throw new Error('Build assets were not found.')

const [css, js] = await Promise.all([
  readFile(join(assets, cssFile), 'utf8'),
  readFile(join(assets, jsFile), 'utf8'),
])

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Skyborne Tactics — an original tabletop-style two-player air combat game." />
    <title>Skyborne Tactics</title>
    <style>${css}</style>
  </head>
  <body>
    <div id="app"></div>
    <script type="module">${js}</script>
  </body>
</html>
`

await writeFile(join(root, 'Skyborne-Tactics.html'), html, 'utf8')
console.log('Created Skyborne-Tactics.html')
