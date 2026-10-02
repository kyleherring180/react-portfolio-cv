// Generates the favicon and app icons in public/ from src/assets/images/logo_kh_icon.png.
// Run with `npm run icons` after changing the source image, then commit the output.
//
// The source logo sits in the middle of a large dark square, so the icons are cropped
// around it: tightly for the tiny favicon sizes (so "<kh/>" is still legible at 16px),
// with more padding for the larger app icons.
const fs = require('fs')
const os = require('os')
const path = require('path')
const { findBrowser, renderCanvases } = require('./headless')

const root = path.join(__dirname, '..')
const publicDir = path.join(root, 'public')
const source = path.join(root, 'src', 'assets', 'images', 'logo_kh_icon.png')

// Centre of the "<kh/>" mark in the 1254x1254 source, and crop sizes around it.
const CENTRE = { x: 627, y: 606 }
const TIGHT = 840
const ROOMY = 1040
const crop = (size) => ({ x: CENTRE.x - size / 2, y: CENTRE.y - size / 2, size })

const FAVICON_SIZES = [16, 32, 48]

// An .ico file is a small directory header followed by one image per size. Modern browsers
// accept PNG-encoded entries, so each entry is just the PNG bytes.
const buildIco = (pngs) => {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(pngs.length, 4)
  let offset = 6 + 16 * pngs.length
  const entries = pngs.map(({ size, data }) => {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size >= 256 ? 0 : size, 0)
    entry.writeUInt8(size >= 256 ? 0 : size, 1)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(data.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += data.length
    return entry
  })
  return Buffer.concat([header, ...entries, ...pngs.map(({ data }) => data)])
}

const main = () => {
  const browser = findBrowser()
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'icons-'))
  const png = (size, cropSize) => ({ width: size, height: size, mime: 'image/png', crop: crop(cropSize) })

  const outputs = [...FAVICON_SIZES.map((size) => png(size, TIGHT)), png(180, ROOMY), png(192, ROOMY), png(512, ROOMY)]
  const images = renderCanvases(browser, tmp, source, outputs)
  const [favicons, [apple, logo192, logo512]] = [images.slice(0, FAVICON_SIZES.length), images.slice(FAVICON_SIZES.length)]

  const files = {
    'favicon.ico': buildIco(favicons.map((data, i) => ({ size: FAVICON_SIZES[i], data }))),
    'apple-touch-icon.png': apple,
    'logo192.png': logo192,
    'logo512.png': logo512,
  }
  for (const [name, data] of Object.entries(files)) {
    fs.writeFileSync(path.join(publicDir, name), data)
    console.log(`${name} ${Math.round(data.length / 1024)}KB`)
  }

  fs.rmSync(tmp, { recursive: true, force: true })
}

main()
