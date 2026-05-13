import { useState, useMemo } from 'react'
import TopBar from '../components/layout/TopBar'
import { useJournalStore } from '../store/journalStore'
import type { EntryTag, JournalEntry } from '../types'
import { Plus, Trash2, Pin, Search, X, ChevronLeft, Check } from 'lucide-react'

const TAG_COLORS: Record<EntryTag, { bg: string; text: string; border: string }> = {
  session:  { bg: 'bg-amber-900/40',  text: 'text-amber-400',  border: 'border-amber-800/60' },
  note:     { bg: 'bg-stone-800',     text: 'text-stone-400',  border: 'border-stone-700' },
  npc:      { bg: 'bg-blue-900/40',   text: 'text-blue-400',   border: 'border-blue-800/60' },
  location: { bg: 'bg-green-900/40',  text: 'text-green-400',  border: 'border-green-800/60' },
  quest:    { bg: 'bg-purple-900/40', text: 'text-purple-400', border: 'border-purple-800/60' },
  clue:     { bg: 'bg-yellow-900/40', text: 'text-yellow-400', border: 'border-yellow-800/60' },
  loot:     { bg: 'bg-red-900/40',    text: 'text-red-400',    border: 'border-red-800/60' },
}

const TAGS: EntryTag[] = ['session', 'note', 'npc', 'location', 'quest', 'clue', 'loot']

function relativeTime(ts: number): string {
  const d = Math.floor((Date.now() - ts) / 86400000)
  if (d === 0) return 'today'
  if (d === 1) return 'yesterday'
  if (d < 7) return `${d}d ago`
  if (d < 30) return `${Math.floor(d / 7)}w ago`
  return `${Math.floor(d / 30)}mo ago`
}

function EntryCard({
  entry,
  onOpen,
  onPin,
  onDelete,
}: {
  entry: JournalEntry
  onOpen: (e: JournalEntry) => void
  onPin: () => void
  onDelete: () => void
}) {
  const tc = TAG_COLORS[entry.tag]
  return (
    <div
      className={`card border ${tc.border} cursor-pointer active:opacity-80 transition-opacity`}
      onClick={() => onOpen(entry)}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${tc.bg} ${tc.text}`}>
              {entry.tag}
            </span>
            {entry.sessionNumber && (
              <span className="text-xs text-stone-600">Session {entry.sessionNumber}</span>
            )}
            <span className="text-xs text-stone-700 ml-auto">{relativeTime(entry.timestamp)}</span>
          </div>
          <h3 className="text-stone-100 font-semibold text-sm mt-1.5 truncate">{entry.title}</h3>
          <p className="text-stone-500 text-xs mt-0.5 line-clamp-2">{entry.body}</p>
        </div>

        {/* Always-visible actions — stopPropagation so card click doesn't fire */}
        <div
          className="flex flex-col items-center gap-1.5 flex-none ml-1 pt-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onPin}
            className={`p-1.5 rounded-lg touch-manipulation ${
              entry.pinned ? 'bg-amber-900/60 text-amber-400' : 'bg-stone-700/60 text-stone-500 hover:text-stone-300'
            }`}
            title={entry.pinned ? 'Unpin' : 'Pin'}
          >
            <Pin size={13} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg bg-stone-700/60 text-stone-600 hover:text-red-400 touch-manipulation"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

function EntryEditor({ entry, onClose }: { entry: JournalEntry | null; isNew?: boolean; onClose: () => void }) {
  const store = useJournalStore()
  const [title, setTitle] = useState(entry?.title ?? '')
  const [body, setBody] = useState(entry?.body ?? '')
  const [tag, setTag] = useState<EntryTag>(entry?.tag ?? 'note')

  const save = () => {
    if (!title.trim()) return
    if (entry) {
      store.updateEntry(entry.id, { title: title.trim(), body, tag })
    } else {
      store.addEntry(title.trim(), body, tag)
    }
    onClose()
  }

  const deleteEntry = () => {
    if (entry) {
      store.deleteEntry(entry.id)
      onClose()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none flex items-center gap-3 px-4 py-3 border-b border-stone-800 bg-stone-950">
        <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-200">
          <ChevronLeft size={20} />
        </button>
        <span className="flex-1 text-sm font-semibold text-stone-200">
          {entry ? 'Edit Entry' : 'New Entry'}
        </span>
        {entry && (
          <button onClick={deleteEntry} className="p-1.5 text-stone-600 hover:text-red-400 touch-manipulation">
            <Trash2 size={16} />
          </button>
        )}
        <button onClick={save} disabled={!title.trim()} className="btn-primary py-1.5 px-4 text-sm flex items-center gap-1 disabled:opacity-40">
          <Check size={14} /> Save
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="section-title block">Tag</label>
          <div className="flex flex-wrap gap-1.5">
            {TAGS.map((t) => {
              const tc = TAG_COLORS[t]
              return (
                <button
                  key={t}
                  onClick={() => setTag(t)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize transition-all touch-manipulation ${
                    tag === t ? `${tc.bg} ${tc.text} ${tc.border}` : 'bg-stone-800 text-stone-500 border-stone-700'
                  }`}
                >
                  {t}
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <label className="section-title block">Title</label>
          <input
            className="input"
            placeholder="Entry title…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus={!entry}
          />
        </div>
        <div>
          <label className="section-title block">Content</label>
          <textarea
            className="textarea"
            rows={16}
            placeholder="Write your adventure notes here…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}

export default function JournalPage() {
  const store = useJournalStore()
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState<EntryTag | 'all'>('all')
  const [editing, setEditing] = useState<JournalEntry | null | 'new'>(null)

  const entries = useMemo(() => {
    let list = search.trim() ? store.searchEntries(search) : store.entries
    if (filterTag !== 'all') list = list.filter((e) => e.tag === filterTag)
    const pinned = list.filter((e) => e.pinned)
    const rest = list.filter((e) => !e.pinned)
    return [...pinned, ...rest]
  }, [store.entries, search, filterTag, store.searchEntries])

  if (editing !== null) {
    return (
      <EntryEditor
        entry={editing === 'new' ? null : editing}
        isNew={editing === 'new'}
        onClose={() => setEditing(null)}
      />
    )
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Journal"
        subtitle={`${store.entries.length} entries · Session ${store.sessionNumber}`}
        right={
          <button onClick={store.incrementSession} className="text-xs text-stone-500 hover:text-stone-300 px-2 py-1 rounded bg-stone-800">
            +Session
          </button>
        }
      />

      {/* Search + Filter */}
      <div className="flex-none bg-stone-950 border-b border-stone-800 px-4 py-2 space-y-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            className="input pl-8 text-sm"
            placeholder="Search entries…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setFilterTag('all')}
            className={`text-xs px-2.5 py-1 rounded-full flex-none border ${
              filterTag === 'all'
                ? 'bg-stone-700 text-stone-100 border-stone-600'
                : 'bg-transparent text-stone-500 border-stone-700'
            }`}
          >
            All
          </button>
          {TAGS.map((t) => {
            const tc = TAG_COLORS[t]
            return (
              <button
                key={t}
                onClick={() => setFilterTag(filterTag === t ? 'all' : t)}
                className={`text-xs px-2.5 py-1 rounded-full flex-none border capitalize ${
                  filterTag === t ? `${tc.bg} ${tc.text} ${tc.border}` : 'bg-transparent text-stone-500 border-stone-700'
                }`}
              >
                {t}
              </button>
            )
          })}
        </div>
      </div>

      {/* Entries list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {entries.length === 0 && (
          <div className="text-center py-16 text-stone-600">
            <p className="text-4xl mb-3">📖</p>
            <p className="text-sm">No entries yet. Start writing your adventure!</p>
          </div>
        )}
        {entries.map((e) => (
          <EntryCard
            key={e.id}
            entry={e}
            onOpen={(entry) => setEditing(entry)}
            onPin={() => store.togglePin(e.id)}
            onDelete={() => store.deleteEntry(e.id)}
          />
        ))}
      </div>

      {/* FAB */}
      <button
        onClick={() => setEditing('new')}
        className="absolute bottom-20 right-4 w-14 h-14 rounded-full bg-amber-700 hover:bg-amber-600
                   shadow-lg flex items-center justify-center text-white active:scale-95 transition-all touch-manipulation"
      >
        <Plus size={24} />
      </button>
    </div>
  )
}
