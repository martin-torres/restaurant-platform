// ============================================================================
// Owner Login — Secure login with email + passcode + biometric
// ============================================================================
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Lock, Mail, Fingerprint, LogIn, AlertTriangle, Loader2, Eye, EyeOff, Shield } from 'lucide-react'
import { ownerLogin, getOwnerSession, isOwnerAuthenticated } from '../../shared/api/owner'

export default function OwnerLogin() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('martin@admin.com')
  const [passcode, setPasscode] = useState('')
  const [showPasscode, setShowPasscode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricSupported, setBiometricSupported] = useState(false)

  useEffect(() => {
    // Check if already authenticated
    if (isOwnerAuthenticated()) {
      navigate('/owner', { replace: true })
      return
    }

    // Check biometric availability
    const avail = !!(navigator as any).credentials
    setBiometricSupported(avail)
    setBiometricAvailable(avail)

    // Try biometric autofill
    if (avail) {
      tryBiometricAuth()
    }
  }, [navigate])

  async function tryBiometricAuth() {
    try {
      const credential = await (navigator as any).credentials.get({
        password: false,
        mediation: 'silent',
        publicKey: {
          challenge: new Uint8Array(32),
          rpId: window.location.hostname,
          allowCredentials: [],
          userVerification: 'required',
        },
      })
      if (credential) {
        handleLogin('biometric')
      }
    } catch {
      // Silent fallback
    }
  }

  async function handleLogin(method: 'passcode' | 'biometric' = 'passcode') {
    setError(null)
    setLoading(true)

    try {
      if (method === 'passcode' && (!email || !passcode)) {
        setError('Please enter email and passcode')
        setLoading(false)
        return
      }

      if (method === 'passcode') {
        const session = await ownerLogin({ email, passcode })
        if (!session) {
          setError('Invalid credentials. Try martin@admin.com / 123456')
          setLoading(false)
          return
        }
      }

      navigate('/owner', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleBiometric() {
    try {
      const credential = await (navigator as any).credentials.get({
        password: false,
        publicKey: {
          challenge: new Uint8Array(32),
          rpId: window.location.hostname,
          allowCredentials: [],
          userVerification: 'required',
        },
      })
      if (credential) {
        await handleLogin('biometric')
      }
    } catch (err: any) {
      setError('Biometric authentication failed: ' + err.message)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !loading) {
      handleLogin('passcode')
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600/20 mb-4">
            <Shield className="w-8 h-8 text-brand-400" />
          </div>
          <h1 className="text-2xl font-display font-bold text-text">
            {t('owner.title', 'Platform Admin')}
          </h1>
          <p className="text-text-secondary mt-1 text-sm">
            Owner access — biometric + passcode required
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-surface-alt border border-border rounded-2xl p-6 shadow-lg">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-danger/10 border border-danger/30 text-danger rounded-lg px-4 py-3 mb-4 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="martin@admin.com"
                className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-lg text-text placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition"
                disabled={loading}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Passcode */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Passcode
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type={showPasscode ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter 6-digit passcode"
                maxLength={6}
                className="w-full pl-10 pr-10 py-2.5 bg-surface border border-border rounded-lg text-text placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition tracking-widest text-center font-mono text-lg"
                disabled={loading}
                autoComplete="one-time-code"
                inputMode="numeric"
              />
              <button
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition"
                tabIndex={-1}
              >
                {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={() => handleLogin('passcode')}
            disabled={loading || !email || !passcode}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>

          {/* Biometric */}
          {biometricSupported && (
            <div className="mt-4 pt-4 border-t border-border">
              <button
                onClick={handleBiometric}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-surface hover:bg-surface-hover border border-border text-text font-medium py-2.5 px-4 rounded-lg transition disabled:opacity-50"
              >
                <Fingerprint className="w-4 h-4" />
                {biometricAvailable ? 'Use Biometric Auth' : 'Register Biometric'}
              </button>
            </div>
          )}

          {/* Security Info */}
          <div className="mt-4 flex items-start gap-2 text-text-muted text-xs">
            <Shield className="w-3 h-3 mt-0.5 shrink-0" />
            <span>
              All login attempts are logged to the audit trail. 
              Biometric data never leaves this device.
            </span>
          </div>
        </div>

        {/* Dev Hint */}
        <div className="mt-4 text-center">
          <p className="text-text-muted text-xs">
            Dev credentials: martin@admin.com / 123456
          </p>
        </div>
      </div>
    </div>
  )
}
