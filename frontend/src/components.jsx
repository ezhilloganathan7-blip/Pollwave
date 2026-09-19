import { Link, useNavigate, useLocation } from 'react-router-dom'

export function isLoggedIn() {
  return !!localStorage.getItem('pw_token')
}

export function logout(navigate) {
  localStorage.removeItem('pw_token')
  localStorage.removeItem('pw_user')
  navigate('/login')
}

export function Header() {
  const nav = useNavigate()
  const loc = useLocation()
  const loggedIn = isLoggedIn()
  const user = JSON.parse(localStorage.getItem('pw_user') || 'null')

  const linkClass = (path) =>
    `px-2.5 py-1.5 rounded-lg transition-colors text-[13px] font-medium ${
      loc.pathname === path
        ? 'bg-slate-100 text-slate-900'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`

  return (
    <header className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="h-14 max-w-[960px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm shrink-0">
              <span className="material-symbols-outlined text-white text-[18px]">bar_chart</span>
            </div>
            <span className="text-base sm:text-lg tracking-tight text-slate-900 font-bold">PollWave</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-primary border border-emerald-200">
              LIVE
            </span>
          </Link>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-light opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">Telemetry Live</span>
          </div>
          {loggedIn && (
            <nav className="hidden md:flex items-center gap-1">
              <Link to="/dashboard" className={linkClass('/dashboard')}>My Polls</Link>
              <Link to="/create" className={linkClass('/create')}>Create Poll</Link>
            </nav>
          )}
        </div>
        <div className="flex items-center gap-3">
          {loggedIn ? (
            <>
              <span className="hidden sm:block text-xs text-slate-500">Hi, {user?.name?.split(' ')[0] || 'there'}</span>
              <button
                onClick={() => logout(nav)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export function PageShell({ children, narrow = false }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className={`pt-20 pb-16 px-4 sm:px-6 mx-auto ${narrow ? 'max-w-[520px]' : 'max-w-[960px]'}`}>
        {children}
      </main>
    </div>
  )
}

export function ErrorBanner({ message }) {
  if (!message) return null
  return (
    <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
      <span className="material-symbols-outlined text-[18px]">error</span>
      {message}
    </div>
  )
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-[3px] border-slate-200 border-t-primary rounded-full animate-spin"></div>
    </div>
  )
}
