import React, { useEffect, useMemo, useState } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  UtensilsCrossed,
  ShoppingCart,
  MapPin,
  Compass,
  Home,
} from 'lucide-react'

// ─── Shared ───
import { OrderProvider } from './shared/contexts/OrderContext'
import OrderToaster from './shared/components/OrderToast'

// ─── Customer Views ───
import WelcomeView from './features/customer/welcome/WelcomeView'
import MenuView from './features/customer/menu/MenuView'
import CartView from './features/customer/cart/CartView'
import CheckoutView from './features/customer/checkout/CheckoutView'
import TrackingView from './features/customer/tracking/TrackingView'
import FloorPlanView from './features/customer/floor-plan/FloorPlanView'
import FeedbackView from './features/customer/feedback/FeedbackView'
import DiscoveryView from './features/customer/discovery/DiscoveryView'
import BillView from './features/customer/bill/BillView'

// ─── Staff Views ───
import StaffLogin from './features/staff/auth/StaffLogin'
import FOHDashboard from './features/staff/foh/FOHDashboard'
import KitchenView from './features/staff/kitchen/KitchenView'
import BarView from './features/staff/bar/BarView'
import ManagerDashboard from './features/staff/manager/ManagerDashboard'

// ─── Owner Views ───
import OwnerLogin from './features/owner/OwnerLogin'
import OwnerDashboard from './features/owner/dashboard/OwnerDashboard'

// ─── Customer Tab Bar ───
const CUSTOMER_TABS = [
  { path: '/', icon: Home, label: 'nav.home' },
  { path: '/menu', icon: UtensilsCrossed, label: 'nav.menu' },
  { path: '/floor-plan', icon: MapPin, label: 'nav.floor_plan' },
  { path: '/cart', icon: ShoppingCart, label: 'nav.cart' },
  { path: '/discover', icon: Compass, label: 'nav.discover' },
]

function CustomerTabBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const hideTabBar =
    location.pathname === '/checkout' ||
    location.pathname.startsWith('/tracking/') ||
    location.pathname.startsWith('/feedback/') ||
    location.pathname.startsWith('/bill/')

  const activeTab = useMemo(() => {
    if (location.pathname === '/') return 0
    if (location.pathname.startsWith('/menu')) return 1
    if (location.pathname.startsWith('/floor-plan')) return 2
    if (location.pathname.startsWith('/cart')) return 3
    if (location.pathname.startsWith('/discover')) return 4
    return -1
  }, [location.pathname])

  if (hideTabBar) return null

  return (
    <nav className="tab-bar fixed bottom-0 left-0 right-0 z-30">
      {CUSTOMER_TABS.map((tab, idx) => {
        const Icon = tab.icon
        const isActive = idx === activeTab
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[56px] ${
              isActive ? 'text-brand-500' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform`}>
              <Icon className="w-5 h-5" />
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-500" />
              )}
            </div>
            <span className={`text-[10px] font-medium ${isActive ? 'opacity-100' : 'opacity-60'}`}>
              {t(tab.label)}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

// ─── Platform Detection ───
function detectPlatform(): 'ios' | 'android' | 'web' {
  const ua = navigator.userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(ua)) return 'ios'
  if (/android/.test(ua)) return 'android'
  return 'web'
}

export default function App() {
  const { i18n } = useTranslation()
  const location = useLocation()
  const [platform, setPlatform] = useState<'ios' | 'android' | 'web'>('web')

  useEffect(() => {
    const plat = detectPlatform()
    setPlatform(plat)
    const root = document.documentElement
    root.classList.remove('platform-ios', 'platform-android', 'platform-web')
    root.classList.add(`platform-${plat}`)
    root.setAttribute('data-platform', plat)
  }, [])

  useEffect(() => {
    const browserLang = navigator.language.slice(0, 2).toLowerCase()
    const supported = ['es', 'en', 'fr', 'de', 'ko', 'pt']
    if (supported.includes(browserLang)) {
      i18n.changeLanguage(browserLang)
    }
  }, [i18n])

  const isStaffRoute = location.pathname.startsWith('/staff')
  const isOwnerRoute = location.pathname.startsWith('/owner')
  const platformClass = platform === 'android' ? 'platform-android' : ''
  const themeClass = isStaffRoute || isOwnerRoute ? 'dark' : ''

  return (
    <OrderProvider>
      <OrderToaster />
      <div className={`min-h-dvh flex flex-col ${platformClass} ${themeClass}`}>
        <Routes>
          <Route path="/" element={<WelcomeView />} />
          <Route path="/menu" element={<MenuView />} />
          <Route path="/cart" element={<CartView />} />
          <Route path="/checkout" element={<CheckoutView />} />
          <Route path="/tracking/:orderId" element={<TrackingView />} />
          <Route path="/floor-plan" element={<FloorPlanView />} />
          <Route path="/feedback/:orderId" element={<FeedbackView />} />
          <Route path="/discover" element={<DiscoveryView />} />
          <Route path="/bill/:orderId" element={<BillView />} />

          <Route path="/staff/login" element={<StaffLogin />} />
          <Route path="/staff/foh" element={<FOHDashboard />} />
          <Route path="/staff/kitchen" element={<KitchenView />} />
          <Route path="/staff/bar" element={<BarView />} />
          <Route path="/staff/manager/*" element={<ManagerDashboard />} />

          <Route path="/owner/login" element={<OwnerLogin />} />
          <Route path="/owner/*" element={<OwnerDashboard />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {isStaffRoute || isOwnerRoute ? null : <CustomerTabBar />}
      </div>
    </OrderProvider>
  )
}