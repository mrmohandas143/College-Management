import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false) }, [pathname])

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setSidebarOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="layout">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <Navbar onMenuClick={() => setSidebarOpen(o => !o)} />
        <main className="page fade-in">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  )
}
