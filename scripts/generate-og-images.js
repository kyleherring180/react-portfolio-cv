// Generates the 1200x630 link-preview images in public/og/. Run with `npm run og-images`
// after changing the banner below or a post's card image, then commit the output.
//
// Uses a locally installed Chrome or Edge in headless mode (set CHROME_PATH to override),
// so there's no image-processing dependency: the banner is an HTML page screenshotted at
// 1200x630, and post images are cropped to 1200x630 and re-encoded as JPEG on a canvas.
const fs = require('fs')
const os = require('os')
const path = require('path')
const { execFileSync } = require('child_process')

const root = path.join(__dirname, '..')
const outDir = path.join(root, 'public', 'og')
const assets = path.join(root, 'src', 'assets')
const WIDTH = 1200
const HEIGHT = 630

const POST_IMAGES = [
  { source: 'images/ai_bug_fixing_pipeline_blog.png', output: 'ai-bug-fixing-pipeline.jpg' },
  { source: 'images/integration_tests_blog.png', output: 'integration-tests.jpg' },
]

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

const dataUri = (file, mime) => `data:${mime};base64,${fs.readFileSync(path.join(assets, file)).toString('base64')}`

const bannerHtml = () => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  @font-face { font-family: 'Coolvetica'; src: url(${dataUri('fonts/CoolveticaRg-Regular.woff2', 'font/woff2')}) format('woff2'); }
  @font-face { font-family: 'La Belle Aurore'; src: url(${dataUri('fonts/LaBelleAurore.woff2', 'font/woff2')}) format('woff2'); }
  html, body { margin: 0; width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  body { background: #022c43; font-family: sans-serif; position: relative; }
  .tag { font-family: 'La Belle Aurore', cursive; color: #E62907; opacity: 0.6; font-size: 28px; position: absolute; }
  .content { position: absolute; left: 120px; top: 150px; right: 120px; }
  h1 { font-family: 'Coolvetica'; font-weight: 400; color: #fff; font-size: 128px; line-height: 1; margin: 0; }
  h2 { font-family: 'Coolvetica'; font-weight: 400; color: #E62907; font-size: 60px; margin: 18px 0 0; }
  p { color: #a8a8a8; font-size: 30px; letter-spacing: 1px; margin: 34px 0 0; }
  .bar { position: absolute; left: 0; top: 0; bottom: 0; width: 24px; background: #181818; }
</style></head><body>
  <div class="bar"></div>
  <span class="tag" style="left: 60px; top: 40px">&lt;body&gt;</span>
  <div class="content">
    <h1>Kyle Herring</h1>
    <h2>Software Engineer</h2>
    <p>.NET &nbsp;·&nbsp; Testing &nbsp;·&nbsp; Kubernetes &nbsp;·&nbsp; AI agents</p>
  </div>
  <span class="tag" style="left: 60px; bottom: 36px">&lt;/body&gt;</span>
</body></html>`

// Draws the image centre-cropped to 1200x630 on a canvas and writes the JPEG data URL into
// the DOM, which --dump-dom then prints. The source is a data URI so the canvas isn't tainted.
const cropHtml = (source) => `<!DOCTYPE html>
<html><body><script>
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = ${WIDTH}
    canvas.height = ${HEIGHT}
    const scale = Math.max(${WIDTH} / img.width, ${HEIGHT} / img.height)
    const w = img.width * scale
    const h = img.height * scale
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, (${WIDTH} - w) / 2, (${HEIGHT} - h) / 2, w, h)
    document.body.textContent = 'JPEG:' + canvas.toDataURL('image/jpeg', 0.85)
  }
  img.src = '${dataUri(source, 'image/png')}'
</script></body></html>`

const run = (browser, args) =>
  execFileSync(browser, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--virtual-time-budget=5000', ...args], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore'],
  })

const main = () => {
  const browser = findBrowser()
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'og-'))
  fs.mkdirSync(outDir, { recursive: true })

  const bannerFile = path.join(tmp, 'banner.html')
  fs.writeFileSync(bannerFile, bannerHtml())
  const bannerOut = path.join(outDir, 'site.png')
  run(browser, [`--window-size=${WIDTH},${HEIGHT}`, `--screenshot=${bannerOut}`, `file:///${bannerFile.replace(/\\/g, '/')}`])
  console.log(`og/site.png ${Math.round(fs.statSync(bannerOut).size / 1024)}KB`)

  for (const { source, output } of POST_IMAGES) {
    const file = path.join(tmp, `${output}.html`)
    fs.writeFileSync(file, cropHtml(source))
    const dom = run(browser, ['--dump-dom', `file:///${file.replace(/\\/g, '/')}`])
    const match = dom.match(/JPEG:data:image\/jpeg;base64,([A-Za-z0-9+/=]+)/)
    if (!match) throw new Error(`Failed to render ${source}`)
    fs.writeFileSync(path.join(outDir, output), Buffer.from(match[1], 'base64'))
    console.log(`og/${output} ${Math.round(fs.statSync(path.join(outDir, output)).size / 1024)}KB`)
  }

  fs.rmSync(tmp, { recursive: true, force: true })
}

main()
