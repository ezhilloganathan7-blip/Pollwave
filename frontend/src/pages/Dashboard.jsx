import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { PageShell, ErrorBanner, PollSkeleton } from '../components'

export default function Dashboard() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [copiedSlug, setCopiedSlug] = useState('')
  const [pendingRemovalSlug, setPendingRemovalSlug] = useState('')
  const [filter, setFilter] = useState('all') // 'all' | 'live' | 'closed'
  const [search, setSearch] = useState('')
  const nav = useNavigate()

  useEffect(() => {
    api.myPolls().then(setItems).catch((e) => setError(e.message))
  }, [])

  function copyLink(slug, e) {
    if (e) e.stopPropagation()
    const url = `${window.location.origin}/vote/${slug}`
    navigator.clipboard.writeText(url)
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(''), 1500)
  }

  function removePollFromView(slug) {
    setItems((prev) => prev?.filter(({ poll }) => poll.slug !== slug) || prev)
    setPendingRemovalSlug('')
  }

  const pendingPoll = items?.find(({ poll }) => poll.slug === pendingRemovalSlug)?.poll

  const activeCount = items ? items.filter(({ poll }) => !poll.closed).length : 0
  const totalCount = items ? items.length : 0

  const filteredItems = items?.filter(({ poll }) => {
    if (filter === 'live' && poll.closed) return false
    if (filter === 'closed' && !poll.closed) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchQ = poll.question.toLowerCase().includes(q)
      const matchOpt = poll.options?.some(o => o.text?.toLowerCase().includes(q))
      return matchQ || matchOpt
    }
    return true
  }).sort(({ poll: first }, { poll: second }) => Number(first.closed) - Number(second.closed))

  return (
    <PageShell>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">My Polls</h1>
            {items !== null && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#181824] border border-[#2A2A3A] font-mono text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot-glow"></span>
                {activeCount} Active · {totalCount} Total
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Your poll, your audience, your insights.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter Tabs */}
          <div className="bg-[#12121A] p-1 rounded-xl border border-[#222230] flex items-center gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`tab-control px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-300 ${
                filter === 'all'
                  ? 'bg-[#22222E] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Polls
            </button>
            <button
              onClick={() => setFilter('live')}
              className={`tab-control px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-300 ${
                filter === 'live'
                  ? 'bg-[#22222E] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Live
            </button>
            <button
              onClick={() => setFilter('closed')}
              className={`tab-control px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-300 ${
                filter === 'closed'
                  ? 'bg-[#22222E] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Closed
            </button>
          </div>

          {/* New Poll Button */}
          <Link
            to="/create"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-lg shadow-purple-600/25 btn-glow shrink-0"
          >
            <span className="text-sm font-bold">+</span>
            <span>New Poll</span>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-2 text-slate-500 text-[18px]">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for Polls..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#12121A] border border-[#2A2A3A] focus:border-purple-500 text-xs text-white placeholder-slate-500 outline-none transition-all"
          />
        </div>
      </div>

      <ErrorBanner message={error} />

      {items === null && !error && (
        <div className="grid md:grid-cols-2 gap-5" aria-label="Loading polls">
          {Array.from({ length: 4 }, (_, index) => <PollSkeleton key={index} />)}
        </div>
      )}

      {/* Empty State */}
      {items && items.length === 0 && (
        <div className="bg-[#14141C] border border-[#2A2A3A] rounded-2xl py-16 px-6 text-center shadow-lg">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#1D1D2B] border border-[#2D2D42] flex items-center justify-center text-slate-400">
            <span className="material-symbols-outlined text-[28px] text-purple-400">query_stats</span>
          </div>
          <h3 className="text-base font-bold text-white mb-1">No polling sessions yet</h3>
          <p className="text-xs text-slate-400 mb-5 max-w-sm mx-auto">
            Ask your question. Share the link. See what people think.
          </p>
          <Link
            to="/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 btn-glow"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Create First Poll
          </Link>
        </div>
      )}

      {/* Poll Cards Grid matching reference */}
      {filteredItems && filteredItems.length > 0 && (
        <div key={filter} className="tab-content-enter grid md:grid-cols-2 gap-5">
          {filteredItems.map(({ poll, counts = {}, total }, idx) => {
            const isLive = !poll.closed
            const leadingOption = poll.options?.reduce((leading, option) => {
              const count = counts[option.id] || 0
              return count > leading.count ? { option, count } : leading
            }, { option: poll.options?.[0], count: 0 })
            const topOption = leadingOption?.option?.text || 'No votes yet'

            return (
              <div
                key={poll.id}
                className="bg-[#14141C] border border-[#252536] hover:border-[#3E3E58] rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 card-interactive shadow-lg group relative"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                {/* Top Status Header */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    {isLive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 font-mono text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot-glow"></span>
                        LIVE NOW
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1C1C28] border border-[#2E2E3E] font-mono text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                        <span className="material-symbols-outlined text-[12px]">lock</span>
                        CLOSED
                      </span>
                    )}

                    <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                      <span className="material-symbols-outlined text-[13px] text-slate-500">schedule</span>
                      <span>{isLive ? 'Active window' : 'Ended recently'}</span>
                    </div>
                  </div>

                  {/* Poll Question */}
                  <h3
                    onClick={() => nav(`/results/${poll.slug}`)}
                    className="text-base font-semibold text-white hover:text-purple-300 cursor-pointer leading-snug line-clamp-2 transition-colors mb-3"
                  >
                    {poll.question}
                  </h3>

                  {/* Top Option Preview Bar */}
                  <div className="bg-[#0D0D14] border border-[#1F1F2C] rounded-xl p-3 mb-4">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Leader</div>
                    <div className="text-xs text-slate-200 font-sans font-medium truncate">{topOption}</div>
                  </div>
                </div>

                {/* Bottom Row */}
                <div>
                  <div className="flex items-center justify-between pt-1 mb-4">
                    {/* Avatars & vote count */}
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        <div className="inline-block h-6 w-6 rounded-full ring-2 ring-[#14141C] bg-purple-900/80 text-purple-200 text-[10px] font-mono font-bold flex items-center justify-center">
                          JD
                        </div>
                        <div className="inline-block h-6 w-6 rounded-full ring-2 ring-[#14141C] bg-emerald-900/80 text-emerald-200 text-[10px] font-mono font-bold flex items-center justify-center">
                          MK
                        </div>
                        {total > 2 && (
                          <div className="inline-block h-6 w-6 rounded-full ring-2 ring-[#14141C] bg-[#222230] text-slate-300 text-[9px] font-mono font-semibold flex items-center justify-center">
                            +{total - 2}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-mono text-slate-300">
                        {total} {total === 1 ? 'vote' : 'votes'}
                      </span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="border-t border-[#20202E] pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => copyLink(poll.slug, e)}
                        title="Copy participant voting link"
                        className="w-8 h-8 rounded-lg bg-[#1B1B26] hover:bg-[#252536] border border-[#2A2A3A] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          {copiedSlug === poll.slug ? 'check' : 'link'}
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      {!isLive && (
                        <button
                          type="button"
                          onClick={() => setPendingRemovalSlug(poll.slug)}
                          title="Remove from this view"
                          className="w-8 h-8 rounded-lg border border-[#2A2A3A] text-slate-500 hover:border-red-900/60 hover:bg-red-950/30 hover:text-red-300 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      )}
                      <button
                        onClick={() => nav(`/results/${poll.slug}`)}
                        className="flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>{isLive ? 'View Live Results' : 'View Archive'}</span>
                        <span className="material-symbols-outlined text-[15px]">
                          {isLive ? 'arrow_forward' : 'north_east'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {pendingPoll && (
        <div className="modal-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-poll-dialog-title"
            className="modal-surface w-full max-w-sm rounded-2xl border border-[#2A2A3A] bg-[#14141C] p-6 shadow-2xl shadow-black/80"
          >
            <h2 id="remove-poll-dialog-title" className="text-base font-semibold text-white">
              Remove poll from this view?
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              “{pendingPoll.question}” will be hidden from this dashboard until you refresh.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingRemovalSlug('')}
                className="rounded-lg border border-[#2A2A3A] px-4 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-[#22222E] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => removePollFromView(pendingRemovalSlug)}
                className="rounded-lg bg-red-500/90 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-red-500"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
