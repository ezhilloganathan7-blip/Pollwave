import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, getVoterId } from '../lib/api'
import { PageShell, ErrorBanner, Spinner } from '../components'

export default function Vote() {
  const { slug } = useParams()
  const nav = useNavigate()
  const [poll, setPoll] = useState(null)
  const [error, setError] = useState('')
  const [selectedOption, setSelectedOption] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [voted, setVoted] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.getPoll(slug)
      .then((data) => setPoll(data.poll))
      .catch((e) => setError(e.message))
  }, [slug])

  async function castVote(optionId) {
    if (voted || submitting || !optionId) return
    setSubmitting(true)
    setError('')
    try {
      await api.vote(slug, { optionId, voterId: getVoterId() })
      setVoted(true)
      setTimeout(() => nav(`/results/${slug}`), 600)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  function shareLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (error && !poll) {
    return (
      <PageShell narrow>
        <ErrorBanner message={error} />
      </PageShell>
    )
  }
  if (!poll) {
    return (
      <PageShell narrow>
        <Spinner />
      </PageShell>
    )
  }

  // Pre-select first if none selected yet for convenience
  const currentSelection = selectedOption || poll.options[0]?.id

  return (
    <PageShell narrow>
      {/* Main Voting Card */}
      <div className="bg-[#14141C] border border-[#252536] rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Top Tag & Meta info */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/60 font-mono text-[10px] text-purple-300 font-semibold uppercase tracking-wider mb-3">
            <span>Single Choice</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
            {poll.question}
          </h1>
        </div>

        <ErrorBanner message={error} />

        {/* Option Selection List matching reference */}
        <div className="flex flex-col gap-3 mb-6">
          {poll.options.map((opt, idx) => {
            const isSelected = currentSelection === opt.id
            const letter = String.fromCharCode(65 + idx)

            return (
              <div
                key={opt.id}
                onClick={() => !poll.closed && !voted && setSelectedOption(opt.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-purple-950/30 border-purple-500 shadow-lg shadow-purple-600/10 ring-1 ring-purple-500/50'
                    : 'bg-[#0F0F17] border-[#242436] hover:border-[#3A3A52] hover:bg-[#12121D]'
                } ${poll.closed ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3.5">
                  <span
                    className={`w-8 h-8 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-[#1C1C28] text-slate-400 border border-[#2B2B3E]'
                    }`}
                  >
                    {letter}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-white leading-snug">{opt.text}</div>
                  </div>
                </div>

                {/* Radio selection circle */}
                <div className="shrink-0 pl-2">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-600'
                        : 'border-[#3A3A50] bg-[#14141E]'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom Actions Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            disabled={voted || submitting || poll.closed}
            onClick={() => castVote(currentSelection)}
            className="w-full sm:flex-1 h-12 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/30 btn-glow active:scale-[0.99] disabled:opacity-50"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>{voted ? 'Vote Submitted' : 'Submit Vote'}</span>
                <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={shareLink}
            className="w-full sm:w-auto h-12 px-4 rounded-xl bg-[#1B1B26] hover:bg-[#242434] border border-[#2B2B3E] text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">ios_share</span>
            <span>{copied ? 'Link Copied!' : 'Share poll'}</span>
          </button>
        </div>
      </div>

      {/* Powered by Footer Subtext */}
      <div className="mt-6 text-center font-mono text-[10px] text-slate-500 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
        <span>Powered by PollWave</span>
        <span>·</span>
        <span>Real-time sentiment engine</span>
        <span className="hidden sm:inline">·</span>
        <span className="text-emerald-500/80">TLS 1.3 Encrypted</span>
        <span className="hidden sm:inline">·</span>
        <span className="text-slate-400">WebSocket Live</span>
      </div>
    </PageShell>
  )
}
