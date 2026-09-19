import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { ErrorBanner } from '../components'

export default function Auth() {
  const [mode, setMode] = useState('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      localStorage.setItem('pw_token', data.token)
      localStorage.setItem('pw_user', JSON.stringify(data.user))
      nav('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-white rounded-xl border border-slate-200 p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_25px_-5px_rgba(0,0,0,0.04)] animate-popin">
        <div className="flex flex-col items-center text-center gap-1 mb-6">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-2 shadow-sm">
            <span className="material-symbols-outlined text-white text-[24px]">bar_chart</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            {mode === 'signin' ? 'Welcome back to PollWave' : 'Create your PollWave account'}
          </h1>
          <p className="text-sm text-slate-500">Real-time audience sentiment with zero latency.</p>
        </div>

        <div className="w-full bg-slate-100 p-1 rounded-lg flex items-center gap-1 mb-6">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 py-1.5 text-center text-sm rounded font-medium transition-all ${mode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 py-1.5 text-center text-sm rounded font-medium transition-all ${mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            Create Account
          </button>
        </div>

        <ErrorBanner message={error} />

        <form onSubmit={submit} className="flex flex-col gap-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Full name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={2}
                maxLength={50}
                className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition text-sm"
                placeholder="Jane Doe"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition text-sm"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition text-sm"
              placeholder="At least 8 characters"
            />
          </div>
          <button
            disabled={loading}
            className="w-full h-11 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium text-sm transition-colors disabled:opacity-60 mt-1"
          >
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
