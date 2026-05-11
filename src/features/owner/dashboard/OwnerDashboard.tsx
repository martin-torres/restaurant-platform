// ============================================================================
// Owner Dashboard — Main layout with sidebar navigation
// ============================================================================
import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Store,
  Percent,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Menu,
  X,
  Bell,
  Search,
  Users,
} from 'lucide-react'
import { isOwnerAuthenticated, clearOwnerSession, ownerLogout, getOwnerSession } from '../../../shared/api/owner'
import OwnerHome from './OwnerHome'
import RestaurantsPage from './RestaurantsPage'
import CommissionsPage from './CommissionsPage'
import MessagingPage from './MessagingPage'
import AnalyticsPage from './AnalyticsPage'
import SettingsPage from './SettingsPage'

interface NavItem {
  path: string
  label: string
  icon: typeof LayoutDashboard
  badge?: number
}

export default function OwnerDashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [ownerName, setOwnerName] = useState('Owner')

  useEffect(() => {
    const authed = isOwnerAuthenticated()
    setAuthenticated(authed)
    if (!authed) {
      navigate('/owner/login', { replace: true })
      return
    }
    const session = getOwnerSession()
    if (session) {
      setOwnerName(session.name)
    }
  }, [navigate])

  const handleLogout = async () => {
    await ownerLogout()
    navigate('/owner/login', { replace: true })
  }

  const navItems: NavItem[] = [
    { path: '/owner', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/owner/restaurants', label: 'Restaurants', icon: Store },
    { path: '/owner/commissions', label: 'Commissions', icon: Percent },
    { path: '/owner/messages', label: 'Messages', icon: MessageSquare, badge: 3 },
    { path: '/owner/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/owner/settings', label: 'Settings', icon: Settings },
  ]

  const isActive = (path: string) => {
    if (path === '/owner') {
      return location.pathname === '/owner' || location.pathname === '/owner/'
    }
    return location.pathname.startsWith(path)
  }

  if (!authenticated) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-surface">
        <div className="text-text-secondary">Redirecting to login...</div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex bg-surface dark">
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          bg-surface-alt border-r border-border
          flex flex-col transition-all duration-300
          ${sidebarCollapsed ? 'w-16' : 'w-60'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-border shrink-0">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-text truncate">Platform</div>
                <div className="text-[10px] text-text-muted truncate leading-tight">Admin Panel</div>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-full flex justify-center">
              <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded text-text-muted hover:text-text hover:bg-surface-hover transition shrink-0"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden flex items-center justify-center w-6 h-6 rounded text-text-muted hover:text-text"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path)
                setMobileOpen(false)
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
                ${isActive(item.path)
                  ? 'bg-brand-600/15 text-brand-400'
                  : 'text-text-secondary hover:text-text hover:bg-surface-hover'
                }
                ${sidebarCollapsed ? 'justify-center px-2' : ''}
              `}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <div className="relative shrink-0">
                <item.icon className="w-5 h-5" />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              {!sidebarCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Owner Info */}
        {!sidebarCollapsed && (
          <div className="px-4 py-3 border-t border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-brand-600/20 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-brand-400" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-text truncate">{ownerName}</div>
                <div className="text-[10px] text-text-muted">Platform Owner</div>
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="px-2 pb-3 pt-1 border-t border-border">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
              text-text-secondary hover:text-danger hover:bg-danger/10
              ${sidebarCollapsed ? 'justify-center px-2' : ''}
            `}
            title="Logout"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-border bg-surface-hover flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg text-text-secondary hover:text-text hover:bg-surface-hover transition"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm text-text-secondary">
              <LayoutDashboard className="w-4 h-4" />
              <span>Owner</span>
              <span className="text-text-muted">/</span>
              <span className="text-text font-medium">
                {navItems.find((n) => isActive(n.path))?.label || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative flex items-center justify-center w-8 h-8 rounded-lg text-text-secondary hover:text-text hover:bg-surface-hover transition">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger pulse-ring" />
            </button>
            <button className="flex items-center justify-center w-8 h-8 rounded-lg text-text-secondary hover:text-text hover:bg-surface-hover transition">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route index element={<OwnerHome />} />
            <Route path="restaurants" element={<RestaurantsPage />} />
            <Route path="commissions" element={<CommissionsPage />} />
            <Route path="messages" element={<MessagingPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/owner" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
