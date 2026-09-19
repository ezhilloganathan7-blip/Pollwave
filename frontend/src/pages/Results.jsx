import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { isLoggedIn, PageShell, ErrorBanner, Spinner } from '../components'

const PALETTE = ['bg-primary', 'bg-sky-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500']

export default function Results() {
  const { slug } = useParams()
  const [poll, setPoll] = useState(null)
  const [results, setResults] = useState(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const esRef = useRef(null)

  useEffect(() => {
    api.getPoll(slug)
      .then((data) => {
        setPoll(data.poll)
        setResults(data.results)
      })
      .catch((e) => setError(e.message))
  }, [slug])

  useEffect(() => {
    if (!poll) return
    const es = new EventSource(api.streamUrl(slug))
    esRef.current = es

    es.onopen = () => setConnected(true)
    es.addEventListener('results', (e) => {
      setResults(JSON.parse(e.data))
    })
    es.onerror = () => setConnected(false)

    return () => es.close()
  }, [poll, slug])

  async function handleClose() {
    try {
      await api.closePoll(slug)
      setPoll((p) => ({ ...p, closed: true }))
    } catch (err) {
      setError(err.message)
    }
  }

  function copyLink() {
    const url = `${window.location.origin}/vote/${slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (error && !poll) {
    return (
      <PageShell>
        <ErrorBanner message={error} />
      </PageShell>
    )
  }
  if (!poll || !results) {
    return (
      <PageShell>
        <Spinner />
      </PageShell>
    )
  }

  const owner = isLoggedIn() && JSON.parse(localStorage.getItem('pw_user') || 'null')?.id === poll.ownerId

  return (
    <PageShell>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 animate-popin">
        <div className="flex items-start justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              {connected && !poll.closed && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-light opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${connected && !poll.closed ? 'bg-primary' : 'bg-slate-300'}`}></span>
            </span>
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
              {poll.closed ? 'Poll closed' : connected ? 'Live results' : 'Connecting…'}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">{copied ? 'check' : 'ios_share'}</span>
              {copied ? 'Copied' : 'Share'}
            </button>
            {owner && !poll.closed && (
              <button
                onClick={handleClose}
                className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
              >
                Close poll
              </button>
            )}
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight leading-snug mt-3 mb-6">{poll.question}</h1>

        <div className="flex flex-col gap-4">
          {poll.options.map((opt, i) => {
            const count = results.counts[opt.id] || 0
            const pct = results.total > 0 ? Math.round((count / results.total) * 100) : 0
            return (
              <div key={opt.id}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-sm font-medium text-slate-800">{opt.text}</span>
                  <span className="text-sm text-slate-500 tabular-nums">
                    {count} · <span className="font-semibold text-slate-900">{pct}%</span>
                  </span>
                </div>
                <div className="w-full h-8 rounded-lg bg-slate-100 overflow-hidden">
                  <div
                    className={`bar-fill h-full rounded-lg ${PALETTE[i % PALETTE.length]}`}
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">Total votes</span>
          <span className="text-lg font-semibold text-slate-900 tabular-nums">{results.total}</span>
        </div>
      </div>
    </PageShell>
  )
}
