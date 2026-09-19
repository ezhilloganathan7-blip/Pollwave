import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, getVoterId } from '../lib/api'
import { PageShell, ErrorBanner, Spinner } from '../components'

export default function Vote() {
  const { slug } = useParams()
  const nav = useNavigate()
  const [poll, setPoll] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState('')
  const [voted, setVoted] = useState(false)

  useEffect(() => {
    api.getPoll(slug)
      .then((data) => setPoll(data.poll))
      .catch((e) => setError(e.message))
  }, [slug])

  async function castVote(optionId) {
    if (voted || submitting) return
    setSubmitting(optionId)
    setError('')
    try {
      await api.vote(slug, { optionId, voterId: getVoterId() })
      setVoted(true)
      setTimeout(() => nav(`/results/${slug}`), 700)
    } catch (err) {
      setError(err.message)
      setSubmitting('')
    }
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

  return (
    <PageShell narrow>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 animate-popin">
        <div className="flex items-center gap-1.5 mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-light opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
            {poll.closed ? 'Poll closed' : 'Vote now — live'}
          </span>
        </div>

        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight leading-snug mb-1">{poll.question}</h1>
        <p className="text-sm text-slate-500 mb-6">Tap an option below. Results update in real time.</p>

        <ErrorBanner message={error} />

        <div className="flex flex-col gap-2.5">
          {poll.options.map((opt) => (
            <button
              key={opt.id}
              disabled={voted || !!submitting || poll.closed}
              onClick={() => castVote(opt.id)}
              className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all text-sm font-medium flex items-center justify-between ${
                submitting === opt.id
                  ? 'border-primary bg-emerald-50 text-primary'
                  : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-primary hover:bg-emerald-50/50 disabled:hover:border-slate-200 disabled:hover:bg-slate-50'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {opt.text}
              {submitting === opt.id && (
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              )}
            </button>
          ))}
        </div>

        {poll.closed && (
          <p className="text-sm text-slate-500 mt-4 text-center">
            This poll is no longer accepting votes.{' '}
            <button onClick={() => nav(`/results/${slug}`)} className="text-primary font-medium">
              View results →
            </button>
          </p>
        )}
      </div>
    </PageShell>
  )
}
