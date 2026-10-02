// Generates the 1200x630 link-preview images in public/og/. Run with `npm run og-images`
// after changing the banner below or a post's card image, then commit the output.
//
// The banner is an HTML page screenshotted at 1200x630; post images are centre-cropped to
// 1200x630 and re-encoded as JPEG. Both use headless Chrome/Edge (see headless.js).
const fs = require('fs')
const os = require('os')
const path = require('path')
const { findBrowser, fileUrl, run, dataUri, renderCanvases } = require('./headless')

const root = path.join(__dirname, '..')
const outDir = path.join(root, 'public', 'og')
const assets = path.join(root, 'src', 'assets')
const WIDTH = 1200
const HEIGHT = 630

const POST_IMAGES = [
  { source: 'images/ai_bug_fixing_pipeline_blog.png', output: 'ai-bug-fixing-pipeline.jpg' },
  { source: 'images/integration_tests_blog.png', output: 'integration-tests.jpg' },
]

const font = (file) => dataUri(path.join(assets, 'fonts', file), 'font/woff2')

const bannerHtml = () => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  @font-face { font-family: 'Coolvetica'; src: url(${font('CoolveticaRg-Regular.woff2')}) format('woff2'); }
  @font-face { font-family: 'La Belle Aurore'; src: url(${font('LaBelleAurore.woff2')}) format('woff2'); }
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

const main = () => {
  const browser = findBrowser()
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'og-'))
  fs.mkdirSync(outDir, { recursive: true })
  const report = (file) => console.log(`og/${file} ${Math.round(fs.statSync(path.join(outDir, file)).size / 1024)}KB`)

  const bannerFile = path.join(tmp, 'banner.html')
  fs.writeFileSync(bannerFile, bannerHtml())
  run(browser, [`--window-size=${WIDTH},${HEIGHT}`, `--screenshot=${path.join(outDir, 'site.png')}`, fileUrl(bannerFile)])
  report('site.png')

  for (const { source, output } of POST_IMAGES) {
    const [jpeg] = renderCanvases(browser, tmp, path.join(assets, source), [
      { width: WIDTH, height: HEIGHT, mime: 'image/jpeg', quality: 0.85, crop: 'cover' },
    ])
    fs.writeFileSync(path.join(outDir, output), jpeg)
    report(output)
  }

  fs.rmSync(tmp, { recursive: true, force: true })
}

main()
