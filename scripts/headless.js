// Shared helpers for the image-generation scripts: they drive a locally installed Chrome or
// Edge in headless mode (set CHROME_PATH to override) instead of adding an image library.
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const findBrowser = () => {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean)
  const found = candidates.find((candidate) => fs.existsSync(candidate))
  if (!found) throw new Error('No Chrome/Edge found - set CHROME_PATH to a Chromium-based browser')
  return found
}

const fileUrl = (file) => `file:///${file.replace(/\\/g, '/')}`

const run = (browser, args) =>
  execFileSync(browser, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--virtual-time-budget=5000', ...args], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore'],
  })

const dataUri = (file, mime) => `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`

// Draws `source` onto canvases in the browser and returns one Buffer per output.
// Each output is { width, height, mime, quality?, crop: { x, y, size } | 'cover' }.
// The image is passed as a data URI so the canvas isn't tainted and toDataURL works;
// results come back through --dump-dom.
const renderCanvases = (browser, tmpDir, source, outputs) => {
  const html = `<!DOCTYPE html><html><body><script>
    const outputs = ${JSON.stringify(outputs)}
    const img = new Image()
    img.onload = () => {
      document.body.textContent = outputs.map(({ width, height, mime, quality, crop }) => {
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingQuality = 'high'
        if (crop === 'cover') {
          const scale = Math.max(width / img.width, height / img.height)
          const w = img.width * scale
          const h = img.height * scale
          ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h)
        } else {
          ctx.drawImage(img, crop.x, crop.y, crop.size, crop.size, 0, 0, width, height)
        }
        return 'IMG:' + canvas.toDataURL(mime, quality)
      }).join(' ')
    }
    img.src = '${dataUri(source, 'image/png')}'
  </script></body></html>`
  const file = path.join(tmpDir, `render-${path.basename(source)}.html`)
  fs.writeFileSync(file, html)
  const dom = run(browser, ['--dump-dom', fileUrl(file)])
  const images = [...dom.matchAll(/IMG:data:image\/[a-z]+;base64,([A-Za-z0-9+/=]+)/g)].map((m) => Buffer.from(m[1], 'base64'))
  if (images.length !== outputs.length) throw new Error(`Failed to render ${source}`)
  return images
}

module.exports = { findBrowser, fileUrl, run, dataUri, renderCanvases }
