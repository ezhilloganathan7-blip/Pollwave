import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { isLoggedIn, PageShell, ErrorBanner, Spinner } from '../components'

export default function Results() {
  const { slug } = useParams()
  const nav = useNavigate()
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
  const maxCount = Math.max(...poll.options.map((opt) => results.counts[opt.id] || 0))
  const voteUrl = `${window.location.origin}/vote/${slug}`

  return (
    <PageShell>
      {/* Top Status & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 font-mono text-xs">
        <div className="flex items-center gap-3 bg-[#12121A] border border-[#222230] px-4 py-2 rounded-xl shadow-md">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${connected && !poll.closed ? 'bg-emerald-400 live-dot-glow' : 'bg-slate-500'}`}></span>
            <span className="text-white font-bold">{poll.closed ? 'POLL CLOSED' : 'LIVE NOW'}</span>
          </div>
          <span className="text-slate-600">·</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-400">VOTES:</span>
            <span className="text-white font-bold tabular-nums">{results.total}</span>
          </div>
        </div>

        {/* Action buttons */}
        {owner && !poll.closed && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 font-mono text-xs transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">stop_circle</span>
              <span>End Session</span>
            </button>
          </div>
        )}
      </div>

      <ErrorBanner message={error} />

      {/* Main Results Card */}
      <div className="bg-[#14141C] border border-[#252536] rounded-2xl p-6 sm:p-8 shadow-2xl relative">
        {/* Question Title (enlarged) */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight mb-8">
          {poll.question}
        </h1>

        {/* Results Bars */}
        <div className="flex flex-col gap-5 mb-8">
          {poll.options.map((opt, i) => {
            const count = results.counts[opt.id] || 0
            const pct = results.total > 0 ? Math.round((count / results.total) * 100) : 0
            const isLeading = count === maxCount && count > 0

            return (
              <div key={opt.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-white text-sm">{opt.text}</span>
                    {isLeading && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-800 font-mono text-[9px] font-bold text-purple-300 tracking-wider">
                        LEADER
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-xs text-slate-400">
                    <span className="text-slate-300 font-semibold">{count} votes</span>
                    <span className="mx-1.5 text-slate-600">·</span>
                    <span className="text-white font-bold text-sm">{pct}%</span>
                  </div>
                </div>

                {/* Bar Track & Fill */}
                <div className="w-full h-7 rounded-xl bg-[#0F0F17] border border-[#232334] p-1 relative overflow-hidden">
                  <div
                    className={`bar-fill h-full rounded-lg transition-all duration-700 ${
                      isLeading
                        ? 'bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-400 shadow-md shadow-purple-600/30'
                        : i % 2 === 0
                        ? 'bg-gradient-to-r from-slate-700 to-slate-600'
                        : 'bg-gradient-to-r from-purple-900/60 to-purple-800/60'
                    }`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  ></div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer Audience Link & Share Bar */}
        <div className="pt-4 border-t border-[#20202E] flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-2 text-slate-400 truncate">
            <span className="material-symbols-outlined text-[16px] text-slate-500">sensors</span>
            <span>Audience view link:</span>
            <span className="text-purple-300 font-semibold truncate">{voteUrl}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1C1C28] hover:bg-[#252536] border border-[#2B2B3E] text-slate-200 text-xs font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">{copied ? 'check' : 'content_copy'}</span>
              <span>{copied ? 'Copied' : 'Copy URL'}</span>
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
