import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { PageShell, ErrorBanner, Spinner } from '../components'

export default function Dashboard() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [copiedSlug, setCopiedSlug] = useState('')
  const nav = useNavigate()

  useEffect(() => {
    api.myPolls().then(setItems).catch((e) => setError(e.message))
  }, [])

  function copyLink(slug) {
    const url = `${window.location.origin}/vote/${slug}`
    navigator.clipboard.writeText(url)
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(''), 1500)
  }

  return (
    <PageShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">My Polls</h1>
          <p className="text-sm text-slate-500">Everything you've created, live counts included.</p>
        </div>
        <Link
          to="/create"
          className="flex items-center gap-1.5 h-10 px-4 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium text-sm transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Poll
        </Link>
      </div>

      <ErrorBanner message={error} />

      {items === null && !error && <Spinner />}

      {items && items.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm py-16 text-center">
          <p className="text-slate-500 text-sm mb-4">You haven't created any polls yet.</p>
          <Link to="/create" className="text-primary font-medium text-sm hover:text-primary-dark">
            Create your first poll →
          </Link>
        </div>
      )}

      {items && items.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map(({ poll, total }) => (
            <div
              key={poll.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-slate-900 text-sm leading-snug line-clamp-2">{poll.question}</h3>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                    poll.closed
                      ? 'bg-slate-100 text-slate-500 border border-slate-200'
                      : 'bg-emerald-50 text-primary border border-emerald-200'
                  }`}
                >
                  {poll.closed ? 'CLOSED' : 'LIVE'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="material-symbols-outlined text-[16px]">how_to_vote</span>
                {total} {total === 1 ? 'vote' : 'votes'}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => nav(`/results/${poll.slug}`)}
                  className="flex-1 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                >
                  View results
                </button>
                <button
                  onClick={() => copyLink(poll.slug)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors shrink-0"
                  title="Copy voting link"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copiedSlug === poll.slug ? 'check' : 'link'}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  )
}
