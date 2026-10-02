import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../Sidebar/'
import './index.scss'

const SITE_TITLE = 'Kyle Herring – Software Engineer'

const PAGE_TITLES = {
  '/about': 'About',
  '/contact': 'Contact',
  '/blog': 'Blog',
  '/integration-test-blog': 'Integration Tests using Testcontainers for .NET and Microsoft SQL Server',
  '/ai-bug-fixing-pipeline-blog': 'Building an Autonomous AI Bug-Fixing Pipeline',
}

const Layout = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    const pageTitle = PAGE_TITLES[pathname]
    document.title = pageTitle ? `${pageTitle} | Kyle Herring` : SITE_TITLE
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