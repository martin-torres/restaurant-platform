import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Fingerprint, KeyRound, Loader2, AlertCircle, LogIn, User, ShieldCheck, ChefHat, ArrowLeft
} from 'lucide-react'
import { authenticateStaff, clockIn } from '../../../shared/api/staff'
import type { StaffMember } from '../../../types'
import { resolveRestaurantId } from '../../../lib/supabase'

let _staffSession: { staff: StaffMember; restaurantId: string } | null = null

export function getStaffSession() { return _staffSession }

export function setStaffSession(staff: StaffMember, restaurantId: string) {
  _staffSession = { staff, restaurantId }
  sessionStorage.setItem('staff_session', JSON.stringify({ staff, restaurantId }))
}

export function clearStaffSession() {
  _staffSession = null; sessionStorage.removeItem('staff_session')
}

export function restoreStaffSession() {
  const raw = sessionStorage.getItem('staff_session')
  if (raw) { try { _staffSession = JSON.parse(raw) } catch { _staffSession = null } }
  return _staffSession
}

const ROLE_ROUTES: Record<string, string> = {
  manager: '/staff/manager', server: '/staff/foh', foh: '/staff/foh',
  kitchen: '/staff/kitchen', bar: '/staff/bar', owner: '/staff/manager',
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
  manager: <ShieldCheck className="w-5 h-5" />, server: <User className="w-5 h-5" />,
  foh: <User className="w-5 h-5" />, kitchen: <ChefHat className="w-5 h-5" />, bar: <Fingerprint className="w-5 h-5" />,
}

export default function StaffLogin() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [restaurantId, setRestaurantId] = useState('')
  const [pin, setPin] = useState('')
  const [pinDisplay, setPinDisplay] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [staffName, setStaffName] = useState<string | null>(null)
  const pinInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const rid = params.get('restaurant_id')
    if (rid) {
      resolveRestaurantId(rid).then((id) => {
        if (id) setRestaurantId(id)
      })
    }
    setTimeout(() => pinInputRef.current?.focus(), 300)
  }, [])

  const handlePinDigit = useCallback((digit: string) => {
    if (pin.length >= 6) return
    const newPin = pin + digit
    setPin(newPin); setPinDisplay((prev) => [...prev, '•']); setError(null)
    if (newPin.length >= 4) attemptLogin(newPin)
  }, [pin])

  const handleRemoveDigit = useCallback(() => {
    setPin((prev) => prev.slice(0, -1)); setPinDisplay((prev) => prev.slice(0, -1)); setError(null)
  }, [])

  const attemptLogin = async (fullPin: string) => {
    if (!restaurantId.trim()) { setError('Restaurant ID is required'); return }
    setLoading(true)
    try {
      const rid = (await resolveRestaurantId(restaurantId.trim())) || restaurantId.trim()
      const staff = await authenticateStaff(rid, fullPin)
      if (staff) {
        setStaffSession(staff, rid)
        setRestaurantId(rid)
        setStaffName(staff.name); setError(null)
        // Auto clock-in — fire and forget (don't block login on clock-in failure)
        clockIn(staff.id, rid).catch(() => {})
        setTimeout(() => { const route = ROLE_ROUTES[staff.role] || '/staff/foh'; navigate(route) }, 600)
      } else { setError('Invalid PIN'); setPin(''); setPinDisplay([]) }
    } catch (err) { setError('Connection error'); setPin(''); setPinDisplay([]) } finally { setLoading(false) }
  }

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (pin.length > 0) attemptLogin(pin) }

  if (staffName) return (
    <div className="min-h-dvh flex items-center justify-center bg-surface dark">
      <div className="flex flex-col items-center gap-4 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-success/20 flex items-center justify-center">
          <ShieldCheck className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-text">Welcome, {staffName}!</h2>
        <Loader2 className="w-6 h-6 animate-spin text-text-secondary" />
      </div>
    </div>
  )

  return (
    <div className="min-h-dvh flex items-center justify-center bg-surface dark p-4">
      <div className="w-full max-w-sm mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500/10 mb-4">
            <Fingerprint className="w-8 h-8 text-brand-500" />
          </div>
          <h1 className="text-2xl font-bold text-text">{t('staff.login')}</h1>
          <p className="text-text-secondary mt-1 text-sm">Enter your PIN to clock in</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-6 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" /> <span>{error}</span>
          </div>
        )}

        {/* Restaurant ID */}
        <div className="mb-5">
          <label className="block text-xs text-text-secondary mb-1.5 font-medium uppercase tracking-wider">Restaurant ID</label>
          <input type="text" value={restaurantId} onChange={(e) => setRestaurantId(e.target.value)}
            placeholder="Enter restaurant ID" disabled={loading}
            className="w-full px-4 py-2.5 bg-surface-alt border border-border rounded-xl text-text focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all text-sm" />
        </div>

        {/* PIN Display */}
        <div className="flex justify-center gap-3 mb-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${pinDisplay[i] ? 'bg-brand-500 border-brand-500 scale-110 shadow-sm' : 'border-border bg-surface-alt'}`} />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button key={n} onClick={() => handlePinDigit(String(n))} disabled={loading}
              className="h-14 rounded-xl bg-surface-alt hover:bg-surface-hover active:scale-95 text-text font-semibold text-xl transition-all duration-100 disabled:opacity-50 border border-border">
              {n}
            </button>
          ))}
          <button onClick={() => handlePinDigit('0')} disabled={loading}
            className="h-14 rounded-xl bg-surface-alt hover:bg-surface-hover active:scale-95 text-text font-semibold text-xl transition-all duration-100 disabled:opacity-50 border border-border">
            0
          </button>
          <button onClick={handleRemoveDigit} disabled={loading || pin.length === 0}
            className="h-14 rounded-xl bg-surface-alt hover:bg-surface-hover active:scale-95 text-text-secondary text-sm transition-all duration-100 disabled:opacity-30 border border-border">
            ⌫
          </button>
          <button onClick={handleSubmit} disabled={loading || pin.length === 0}
            className="h-14 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-semibold text-sm transition-all duration-100 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-4 h-4" />}
          </button>
        </div>

        <p className="text-center text-text-muted text-xs mt-8">
          <KeyRound className="w-3 h-3 inline mr-1" /> Enter your 4-6 digit staff PIN
        </p>
      </div>
    </div>
  )
}
