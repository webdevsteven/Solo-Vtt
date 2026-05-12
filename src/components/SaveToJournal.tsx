import { useState, useCallback } from 'react'
import { Bookmark } from 'lucide-react'
import { useJournalStore } from '../store/journalStore'
import Toast from './Toast'
import type { EntryTag } from '../types'

interface SaveEntry {
  title: string
  body: string
  tag: EntryTag
}

interface Props {
  entry: SaveEntry
  size?: number
}

export default function SaveToJournal({ entry, size = 16 }: Props) {
  const addEntry = useJournalStore((s) => s.addEntry)
  const [saved, setSaved] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)

  const handleSave = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      addEntry(entry.title, entry.body, entry.tag)
      setSaved(true)
      setToastVisible(true)
    },
    [addEntry, entry],
  )

  return (
    <>
      <button
        onClick={handleSave}
        title="Save to Journal"
        className={`p-1.5 rounded transition-colors touch-manipulation ${
          saved
            ? 'text-amber-400'
            : 'text-stone-600 hover:text-amber-500 active:text-amber-400'
        }`}
      >
        <Bookmark size={size} fill={saved ? 'currentColor' : 'none'} />
      </button>
      <Toast
        message="Saved to Journal"
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </>
  )
}
