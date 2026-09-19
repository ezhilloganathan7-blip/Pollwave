import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { PageShell, ErrorBanner } from '../components'

export default function CreatePoll() {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  function updateOption(i, val) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? val : o)))
  }
  function addOption() {
    if (options.length < 6) setOptions((prev) => [...prev, ''])
  }
  function removeOption(i) {
    if (options.length > 2) setOptions((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function submit(e) {
    if (e) e.preventDefault()
    // Validate
    const validOptions = options.map((o) => o.trim()).filter(Boolean)
    if (validOptions.length < 2) {
      setError('Please provide at least 2 non-empty options.')
      return
    }

    setError('')
    setLoading(true)
    try {
      const poll = await api.createPoll({
        question: question.trim(),
        options: validOptions,
      })
      nav(`/results/${poll.slug}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const charCount = question.length

  return (
    <PageShell>
      {/* Top Breadcrumb & Auto-save status */}
      <div className="flex items-center justify-between font-mono text-[11px] text-slate-400 mb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[15px] text-slate-500">grid_view</span>
          <Link to="/dashboard" className="hover:text-slate-200">Polls</Link>
          <span>/</span>
          <span className="text-slate-200 font-semibold">New Poll</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot-glow"></span>
          <span>Draft auto-saved 14s ago</span>
        </div>
      </div>

      {/* Main Title & Subtitle */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-white">Create Live Poll</h1>
        <p className="text-xs text-slate-400 mt-1">
          Engage your team or audience in real-time with instant live results and millisecond latency.
        </p>
      </div>

      <ErrorBanner message={error} />

      {/* Main Form Container */}
      <form onSubmit={submit} className="space-y-6 pb-20">
        {/* Section 01: Question or Topic */}
        <div className="bg-[#14141C] border border-[#252536] rounded-2xl p-5 shadow-lg">
          <div className="flex flex-col items-start gap-2 mb-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 font-mono text-xs font-semibold text-purple-400 uppercase tracking-wider">
              <span>01</span>
              <span>Question or Topic *</span>
            </div>
            <div className="font-mono text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>{charCount}/140 chars</span>
              <span>·</span>
              <span className="text-emerald-400 font-medium">Optimal length</span>
            </div>
          </div>

          <div className="relative">
            <textarea
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              minLength={5}
              maxLength={140}
              rows={3}
              className="w-full p-4 rounded-xl bg-[#0D0D14] border border-[#242434] focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm text-white font-medium placeholder-slate-600 resize-none outline-none transition-all leading-relaxed"
              placeholder="Enter question or topic here..."
            />
          </div>
        </div>

        {/* Section 02: Poll Options */}
        <div className="bg-[#14141C] border border-[#252536] rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 font-mono text-xs font-semibold text-purple-400 uppercase tracking-wider">
              <span>02</span>
              <span>Poll Options</span>
              <span className="px-2 py-0.5 rounded bg-[#1E1E2C] border border-[#2A2A3A] text-slate-300 text-[10px] lowercase">
                {options.length} of 6 added
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {options.map((opt, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 p-1 rounded-xl bg-[#0F0F17] border border-[#222230] group hover:border-[#35354A] transition-colors"
              >
                {/* Letter badge */}
                <span className="w-6 h-6 rounded bg-[#1D1D2B] border border-[#2B2B3E] font-mono text-xs font-bold text-slate-300 flex items-center justify-center shrink-0 ml-1">
                  {String.fromCharCode(65 + i)}
                </span>

                {/* Option input */}
                <input
                  required
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  maxLength={100}
                  className="flex-1 bg-transparent px-2 py-2 text-xs text-white placeholder-slate-600 outline-none font-medium"
                  placeholder="Enter option here..."
                />

                {/* Remove button */}
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    className="p-1.5 text-slate-600 hover:text-red-400 transition-colors shrink-0"
                    title="Remove option"
                  >
                    <span className="material-symbols-outlined text-[17px]">delete</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add option button */}
          {options.length < 6 && (
            <button
              type="button"
              onClick={addOption}
              className="mt-3.5 w-full py-2.5 rounded-xl border border-dashed border-[#2F2F42] hover:border-purple-500/60 text-slate-400 hover:text-purple-300 font-mono text-xs flex items-center justify-center gap-1.5 transition-all bg-[#0F0F17]/50"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Add Another Option (max 6 slots)</span>
            </button>
          )}

        </div>

        {/* Floating Bottom Quick Launch Bar matching reference */}
        <div className="sticky bottom-4 z-40 p-3 rounded-2xl bg-[#14141CEE] backdrop-blur-xl border border-[#2E2E42] shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span className="material-symbols-outlined text-[16px] text-slate-400">keyboard</span>
            <span>Quick Launch:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#1D1D2B] border border-[#2E2E40] text-slate-300 text-[10px]">
              ⌘ + Enter
            </kbd>
            <span className="text-slate-600 hidden md:inline">|</span>
            <span className="text-slate-500 hidden md:inline">Draft saved locally</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/30 btn-glow active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="text-amber-300">⚡</span>
                  <span>Launch Live Poll</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </PageShell>
  )
}
