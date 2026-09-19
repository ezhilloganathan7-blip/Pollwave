import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, saveSession } from '../lib/api'
import { ErrorBanner } from '../components'

export default function Auth() {
  const [mode, setMode] = useState('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = mode === 'signin'
        ? await api.login({ email, password })
        : await api.signup({ name, email, password })
      saveSession(data)
      nav('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-slate-200 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow blobs */}
      <div className="glow-blob glow-purple" style={{ width: '600px', height: '600px', top: '-15%', right: '-10%', position: 'absolute' }}></div>
      <div className="glow-blob glow-green" style={{ width: '500px', height: '500px', bottom: '-15%', left: '-10%', position: 'absolute' }}></div>

      <div className="w-full max-w-[420px] relative z-10 my-8">
        {/* Main Card */}
        <div className="bg-[#14141C] border border-[#2A2A3A] rounded-2xl p-6 sm:p-7 shadow-2xl shadow-black/80 relative">
          {/* Brand Logo & Title */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#1A1A26] border border-[#2E2E42] flex items-center justify-center shadow-lg p-1 mb-3 ring-1 ring-white/5">
              <img src="/logo.png" alt="PollWave" className="w-full h-full object-contain" onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'block'
              }} />
              <svg viewBox="0 0 32 32" className="w-8 h-8 text-purple-400 hidden" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="7,20 12,12 16,18 21,9 25,15" />
                <circle cx="7" cy="20" r="2.2" fill="currentColor" />
                <circle cx="21" cy="9" r="2.8" fill="currentColor" />
                <circle cx="25" cy="15" r="2.2" fill="currentColor" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Welcome to PollWave</h1>
            <p className="text-xs text-slate-400 mt-1">Live audience polling in real time</p>
          </div>

          {/* Toggle Tabs */}
          <div className="bg-[#0C0C12] p-1 rounded-xl border border-[#222230] grid grid-cols-2 gap-1 mb-6">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          <ErrorBanner message={error} />

          {/* Form */}
          <form onSubmit={submit} className="flex flex-col gap-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  FULL NAME
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 text-[18px]">person</span>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    minLength={2}
                    maxLength={50}
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#0F0F16] border border-[#2A2A3A] focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-xs text-white placeholder-slate-600 outline-none transition-all"
                    placeholder="Jane Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                  WORK EMAIL
                </label>
                <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                  instant-sync
                </span>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 text-[18px]">mail</span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#0F0F16] border border-[#2A2A3A] focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-xs text-white placeholder-slate-600 outline-none transition-all"
                  placeholder="alex@company.com"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5">
                <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                  PASSWORD
                </label>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 text-[18px]">lock</span>
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  className="w-full h-10 pl-9 pr-10 rounded-xl bg-[#0F0F16] border border-[#2A2A3A] focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-xs text-white placeholder-slate-600 outline-none transition-all"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full h-11 rounded-xl bg-[#C4B5FD] hover:bg-[#DDD6FE] text-[#161026] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-[#161026] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In to PollWave' : 'Create Account'}</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Subtext */}
        <div className="mt-6 text-center font-mono text-[10px] text-slate-500 flex items-center justify-center gap-3">
          <span className="hover:text-slate-400 cursor-pointer">Presenter Terms</span>
          <span>·</span>
          <span className="hover:text-slate-400 cursor-pointer">Security & Privacy</span>
          <span>·</span>
          <span className="text-emerald-500/80">LATENCY &lt;14ms</span>
        </div>
      </div>
    </div>
  )
}
