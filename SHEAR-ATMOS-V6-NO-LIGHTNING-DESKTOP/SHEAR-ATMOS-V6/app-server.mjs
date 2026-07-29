import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))
// V6 intentionally uses its own port so an older SHEAR-ATMOS version cannot
// be mistaken for this build when the desktop launcher starts it.
const port = Number(process.env.SHEAR_ATMOS_PORT || 8806)
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
}

createServer(async (request, response) => {
  const urlPath = decodeURIComponent((request.url || '/').split('?')[0])
  const requested = urlPath === '/' ? 'index.html' : urlPath.replace(/^[/\\]+/, '')
  const filePath = normalize(join(root, requested))

  if (relative(root, filePath).startsWith('..')) {
    response.writeHead(403)
    response.end('Forbidden')
    return
  }

  try {
    const file = await readFile(filePath)
    response.writeHead(200, { 'Content-Type': contentTypes[extname(filePath)] || 'application/octet-stream' })
    response.end(file)
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end('Not found')
  }
}).listen(port, () => {
  console.log(`SHEAR-ATMOS is running at http://localhost:${port}`)
})
