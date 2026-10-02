import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../Sidebar/'
import seo from '../../seo.json'
import './index.scss'

const Layout = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    // GitHub Pages serves the per-page HTML at /route/, so allow a trailing slash.
    const route = pathname.replace(/\/+$/, '') || '/'
    const page = seo.pages.find((p) => p.path === route)
    document.title = page ? `${page.title} | Kyle Herring` : seo.site.title
  }, [pathname])

  return (
    <div className="App">
      <Sidebar />
      <div className="page">
        <span className="tags top-tags">&lt;body&gt;</span>

        <Outlet />
        <span className="tags bottom-tags">
          &lt;/body&gt;
          <br />
          <span className="bottom-tag-html">&lt;/html&gt;</span>
        </span>
      </div>
    </div>
  )
}

export default Layout