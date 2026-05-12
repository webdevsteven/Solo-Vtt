import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { JournalEntry, EntryTag } from '../types'

interface JournalStore {
  entries: JournalEntry[]
  sessionNumber: number
  addEntry: (title: string, body: string, tag: EntryTag) => JournalEntry
  updateEntry: (id: string, partial: Partial<JournalEntry>) => void
  deleteEntry: (id: string) => void
  togglePin: (id: string) => void
  incrementSession: () => void
  searchEntries: (query: string) => JournalEntry[]
}

export const useJournalStore = create<JournalStore>()(
  persist(
    (set, get) => ({
      entries: [],
      sessionNumber: 1,

      addEntry: (title, body, tag) => {
        const { sessionNumber } = get()
        const entry: JournalEntry = {
          id: crypto.randomUUID(),
          title,
          body,
          tag,
          timestamp: Date.now(),
          pinned: false,
          sessionNumber,
        }
        set((s) => ({ entries: [entry, ...s.entries] }))
        return entry
      },

      updateEntry: (id, partial) =>
        set((s) => ({
          entries: s.entries.map((e) => (e.id === id ? { ...e, ...partial } : e)),
        })),

      deleteEntry: (id) =>
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),

      togglePin: (id) =>
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === id ? { ...e, pinned: !e.pinned } : e,
          ),
        })),

      incrementSession: () =>
        set((s) => ({ sessionNumber: s.sessionNumber + 1 })),

      searchEntries: (query) => {
        const { entries } = get()
        const q = query.toLowerCase()
        return entries.filter(
          (e) =>
            e.title.toLowerCase().includes(q) ||
            e.body.toLowerCase().includes(q),
        )
      },
    }),
    { name: 'solo-vtt-journal' },
  ),
)
