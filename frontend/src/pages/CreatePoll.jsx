import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const poll = await api.createPoll({ question, options })
      nav(`/results/${poll.slug}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell narrow>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 animate-popin">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight mb-1">Create a poll</h1>
        <p className="text-sm text-slate-500 mb-6">Ask a question, add up to 6 options, and share the link.</p>

        <ErrorBanner message={error} />

        <form onSubmit={submit} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Your question</label>
            <textarea
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              minLength={5}
              maxLength={200}
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition text-sm resize-none"
              placeholder="What's your favorite way to deploy an app?"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Options</label>
            <div className="flex flex-col gap-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-7 h-9 flex items-center justify-center text-xs font-medium text-slate-400 shrink-0">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <input
                    required
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    maxLength={100}
                    className="flex-1 h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition text-sm"
                    placeholder={`Option ${i + 1}`}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 6 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Add option
              </button>
            )}
          </div>

          <button
            disabled={loading}
            className="w-full h-11 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium text-sm transition-colors disabled:opacity-60 mt-2"
          >
            {loading ? 'Creating…' : 'Create Poll'}
          </button>
        </form>
      </div>
    </PageShell>
  )
}
