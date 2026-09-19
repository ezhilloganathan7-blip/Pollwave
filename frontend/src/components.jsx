import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { clearSession, hasValidSession } from './lib/api'

export function isLoggedIn() {
  return hasValidSession()
}

export function logout(navigate) {
  clearSession()
  navigate('/login')
}

export function Logo({ className = 'w-7 h-7' }) {
  return (
    <div className={`${className} rounded-lg bg-[#161620] border border-[#2A2A3A] flex items-center justify-center overflow-hidden shrink-0 shadow-sm`}>
      <img src="/logo.png" alt="PollWave" className="w-full h-full object-contain p-0.5" onError={(e) => {
        // Fallback SVG if image not loaded
        e.target.style.display = 'none'
        e.target.nextSibling.style.display = 'block'
      }} />
      <svg viewBox="0 0 32 32" className="w-5 h-5 text-purple-400 hidden" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="7,20 12,12 16,18 21,9 25,15" />
        <circle cx="7" cy="20" r="2.2" fill="currentColor" />
        <circle cx="21" cy="9" r="2.8" fill="currentColor" />
        <circle cx="25" cy="15" r="2.2" fill="currentColor" />
      </svg>
    </div>
  )
}

export function Header() {
  const nav = useNavigate()
  const loc = useLocation()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const loggedIn = isLoggedIn()
  const user = JSON.parse(localStorage.getItem('pw_user') || 'null')

  const linkClass = (path) =>
    `tab-control px-3 py-1.5 rounded-lg transition-colors duration-300 text-xs font-medium ${
      loc.pathname === path
        ? 'bg-[#22222E] text-white border border-[#2A2A3A]'
        : 'text-slate-400 hover:text-slate-200 hover:bg-[#161620]'
    }`

  return (
    <>
      <header className="header-dark sticky top-0 w-full z-50">
        <div className="h-14 px-4 sm:px-8 flex items-center justify-between gap-4">
        {/* Left section: Logo + Nav */}
        <div className="flex items-center gap-5 sm:gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <Logo className="w-7 h-7" />
            <span className="text-base tracking-tight text-white font-bold">PollWave</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider font-mono">
              LIVE
            </span>
          </Link>

          {/* Telemetry live chip */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#161620] border border-[#2A2A3A]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 live-dot-glow"></span>
            </span>
            <span className="text-[10px] text-slate-300 font-mono tracking-wider uppercase font-semibold">Telemetry Live</span>
          </div>

          {/* Nav links */}
          {loggedIn && (
            <nav className="hidden md:flex items-center gap-1">
              <Link to="/dashboard" className={linkClass('/dashboard')}>My Polls</Link>
              <Link to="/create" className={linkClass('/create')}>Create Poll</Link>
            </nav>
          )}
        </div>

        {/* Right section: User Profile */}
        <div className="flex items-center gap-3">
          {loggedIn ? (
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-200 leading-tight truncate max-w-[140px]">
                  {user?.name || user?.email?.split('@')[0] || 'User'}
                </div>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                title="Click to logout"
                className="w-8 h-8 rounded-full bg-purple-300 text-purple-950 font-bold text-xs flex items-center justify-center hover:opacity-90 transition-opacity ring-2 ring-purple-500/20"
              >
                <span role="img" aria-label="Profile">👤</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-xs font-semibold px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md shadow-purple-600/30 btn-glow"
            >
              Sign in
            </Link>
          )}
        </div>
        </div>
      </header>

      {showLogoutConfirm && (
        <div className="modal-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            className="modal-surface w-full max-w-sm rounded-2xl border border-[#2A2A3A] bg-[#14141C] p-6 shadow-2xl shadow-black/80"
          >
            <h2 id="logout-dialog-title" className="text-base font-semibold text-white">
              Log out of PollWave?
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              You will need to sign in again to manage your polls.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-lg border border-[#2A2A3A] px-4 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-[#22222E] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => logout(nav)}
                className="rounded-lg bg-purple-300 px-4 py-2 text-xs font-bold text-purple-950 transition-colors hover:bg-purple-200"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function PageShell({ children, narrow = false }) {
  return (
    <div className="min-h-screen bg-[#0B0B0F] text-slate-200 flex flex-col relative overflow-x-hidden">
      <Header />
      <main className={`page-content flex-1 py-8 px-4 sm:px-6 md:px-8 mx-auto w-full relative z-10 ${narrow ? 'max-w-[560px]' : 'max-w-[1100px]'}`}>
        {children}
      </main>
    </div>
  )
}

export function ErrorBanner({ message }) {
  if (!message) return null
  return (
    <div className="mb-5 px-4 py-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2.5 shadow-sm backdrop-blur-sm animate-fadeInUp">
      <div className="w-5 h-5 rounded-full bg-red-900/60 border border-red-700/50 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-[13px] text-red-400">error</span>
      </div>
      <span>{message}</span>
    </div>
  )
}

export function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5 fade-in-section">
      <div className="w-full max-w-md space-y-4">
        <div className="skeleton h-6 w-3/4 mx-auto"></div>
        <div className="skeleton h-4 w-1/2 mx-auto"></div>
        <div className="space-y-3 mt-6">
          <div className="skeleton h-14 w-full"></div>
          <div className="skeleton h-14 w-full"></div>
          <div className="skeleton h-14 w-5/6"></div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <div className="w-4 h-4 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
        <span className="text-xs text-slate-400 font-mono">Syncing cluster stream…</span>
      </div>
    </div>
  )
}

export function PollSkeleton() {
  return (
    <div className="bg-[#14141C] border border-[#252536] rounded-2xl p-5 shadow-lg animate-pulse" aria-hidden="true">
      <div className="flex items-center justify-between mb-5">
        <div className="skeleton h-5 w-20 rounded-full"></div>
        <div className="skeleton h-3 w-24 rounded"></div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="skeleton h-5 w-full rounded"></div>
        <div className="skeleton h-5 w-3/4 rounded"></div>
      </div>
      <div className="skeleton h-16 w-full rounded-xl mb-5"></div>
      <div className="flex items-center justify-between">
        <div className="skeleton h-4 w-24 rounded"></div>
        <div className="skeleton h-8 w-20 rounded-lg"></div>
      </div>
    </div>
  )
}
