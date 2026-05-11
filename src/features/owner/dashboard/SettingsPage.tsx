import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Save,
  Key,
  Bell,
  Globe,
  Shield,
  User,
  Smartphone,
} from 'lucide-react'

export default function SettingsPage() {
  const { t } = useTranslation()
  const [ownerName, setOwnerName] = useState('Martín Torres')
  const [ownerEmail, setOwnerEmail] = useState('dr.mtorres@icloud.com')
  const [passcode, setPasscode] = useState('')
  const [notifications, setNotifications] = useState(true)
  const [biometric, setBiometric] = useState(false)

  const handleSave = () => {
    // TODO: Persist to platform_owner table
    console.log('Settings saved')
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text">Settings</h1>
        <p className="text-sm text-text-secondary mt-1">Platform owner configuration</p>
      </div>

      {/* Profile */}
      <section className="bg-surface-alt border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-brand-400" />
          <h2 className="text-lg font-semibold text-text">Profile</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text focus:outline-none focus:border-brand-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
            <input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text focus:outline-none focus:border-brand-500 transition"
            />
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="bg-surface-alt border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-brand-400" />
          <h2 className="text-lg font-semibold text-text">Security</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                <span>Change Passcode</span>
              </div>
            </label>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter new passcode"
              className="w-full max-w-xs px-3 py-2 rounded-lg bg-surface border border-border text-text placeholder-text-muted focus:outline-none focus:border-brand-500 transition"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-text-secondary" />
              <span className="text-sm text-text">Biometric Authentication</span>
            </div>
            <button
              onClick={() => setBiometric(!biometric)}
              className={`relative w-10 h-6 rounded-full transition ${
                biometric ? 'bg-brand-500' : 'bg-border'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition ${
                  biometric ? 'left-[18px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-surface-alt border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-brand-400" />
          <h2 className="text-lg font-semibold text-text">Notifications</h2>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-text-secondary" />
            <span className="text-sm text-text">Push Notifications</span>
          </div>
          <button
            onClick={() => setNotifications(!notifications)}
            className={`relative w-10 h-6 rounded-full transition ${
              notifications ? 'bg-brand-500' : 'bg-border'
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition ${
                notifications ? 'left-[18px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>
        <p className="text-xs text-text-muted">
          Receive alerts about restaurant health, commission updates, and platform issues.
        </p>
      </section>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </div>
  )
}
