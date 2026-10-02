// Runs after `react-scripts build`. Link-preview crawlers (LinkedIn, Slack, X...) don't run
// JavaScript, so they only ever see the static HTML. For every route in src/seo.json this
// writes build/<route>/index.html - a copy of the SPA shell with that page's title and
// Open Graph tags filled in. GitHub Pages serves those files directly, so crawlers get the
// right preview and browsers load the same app, which then renders the route as usual.
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const buildDir = path.join(root, 'build')
const { homepage } = require(path.join(root, 'package.json'))
const { site, pages } = require(path.join(root, 'src', 'seo.json'))

const siteUrl = homepage.endsWith('/') ? homepage : `${homepage}/`
const absolute = (relative) => new URL(relative.replace(/^\//, ''), siteUrl).href

const escapeHtml = (value) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const setMeta = (html, attr, key, value) => {
  const tag = `<meta ${attr}="${key}" content="${escapeHtml(value)}"/>`
  const existing = new RegExp(`<meta ${attr}="${key.replace(/[.:]/g, '\\$&')}"[^>]*>`)
  return existing.test(html) ? html.replace(existing, tag) : html.replace('</head>', `${tag}</head>`)
}

const render = (shell, page) => {
  const title = page.title ? `${page.title} | Kyle Herring` : site.title
  const description = page.description || site.description
  const image = absolute(page.image || site.image)
  // Trailing slash: GitHub Pages redirects /route to /route/ when serving a directory.
  const url = absolute(page.path ? `${page.path}/` : '')

  let html = shell.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
  html = setMeta(html, 'name', 'description', description)
  html = setMeta(html, 'property', 'og:type', page.type || 'website')
  html = setMeta(html, 'property', 'og:title', page.title || site.title)
  html = setMeta(html, 'property', 'og:description', description)
  html = setMeta(html, 'property', 'og:url', url)
  html = setMeta(html, 'property', 'og:image', image)
  html = setMeta(html, 'property', 'og:image:width', '1200')
  html = setMeta(html, 'property', 'og:image:height', '630')
  html = setMeta(html, 'name', 'twitter:card', 'summary_large_image')
  html = html.replace(/<link rel="canonical"[^>]*>/, '')
  return html.replace('</head>', `<link rel="canonical" href="${url}"/></head>`)
}

const shellPath = path.join(buildDir, 'index.html')
const shell = fs.readFileSync(shellPath, 'utf8')

fs.writeFileSync(shellPath, render(shell, {}))

for (const page of pages) {
  const dir = path.join(buildDir, page.path.replace(/^\//, ''))
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), render(shell, page))
}

console.log(`Wrote page meta for / and ${pages.length} routes (${siteUrl})`)
