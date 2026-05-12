import { useRef, useState } from 'react'
import { Download, Upload, X, AlertTriangle, Swords } from 'lucide-react'

const STORE_KEYS = [
  'solo-vtt-maps',
  'solo-vtt-oracle',
  'solo-vtt-dice',
  'solo-vtt-characters',
  'solo-vtt-journal',
  'solo-vtt-tables',
]

const BACKUP_VERSION = 1

function today() {
  return new Date().toISOString().slice(0, 10)
}

interface Props {
  onClose: () => void
  onNewWandererGame: () => void
}

export default function BackupRestore({ onClose, onNewWandererGame }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [confirmRestore, setConfirmRestore] = useState(false)
  const [pendingData, setPendingData] = useState<Record<string, string> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleExport = () => {
    const data: Record<string, unknown> = {}
    STORE_KEYS.forEach((key) => {
      const raw = localStorage.getItem(key)
      if (raw) {
        try { data[key] = JSON.parse(raw) }
        catch { data[key] = raw }
      }
    })

    const backup = {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      data,
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `solo-vtt-backup-${today()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        if (!parsed.version || !parsed.data) {
          setError('This file doesn\'t look like a Solo VTT backup.')
          return
        }
        const restored: Record<string, string> = {}
        STORE_KEYS.forEach((key) => {
          if (parsed.data[key] !== undefined) {
            restored[key] = JSON.stringify(parsed.data[key])
          }
        })
        setPendingData(restored)
        setConfirmRestore(true)
      } catch {
        setError('Could not read this file. Make sure it\'s a valid backup.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const applyRestore = () => {
    if (!pendingData) return
    Object.entries(pendingData).forEach(([key, val]) => {
      localStorage.setItem(key, val)
    })
    window.location.reload()
  }

  return (
    <div className="absolute inset-0 bg-black/70 flex items-end z-[60]" onClick={onClose}>
      <div
        className="bg-stone-900 w-full rounded-t-2xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-stone-100 font-bold text-base">Data Backup & Restore</h2>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-300">
            <X size={20} />
          </button>
        </div>

        {/* New Wanderer Game */}
        <div className="card space-y-2 border-amber-800/40">
          <p className="text-stone-200 text-sm font-semibold">Start a New Game</p>
          <p className="text-stone-500 text-xs">
            Create a new WANDERER character and add all rules, tables, and references automatically.
          </p>
          <button
            onClick={() => { onClose(); onNewWandererGame() }}
            className="btn-primary w-full flex items-center justify-center gap-2 bg-amber-900/60 hover:bg-amber-800/70 border-amber-700/60"
          >
            <Swords size={16} /> New Wanderer Game
          </button>
        </div>

        {/* Export */}
        <div className="card space-y-2">
          <p className="text-stone-200 text-sm font-semibold">Download Backup</p>
          <p className="text-stone-500 text-xs">
            Saves all your characters, maps, journal, oracle history, and tables to a file on your device.
          </p>
          <button onClick={handleExport} className="btn-primary w-full flex items-center justify-center gap-2">
            <Download size={16} /> Download Backup
          </button>
        </div>

        {/* Import */}
        <div className="card space-y-2">
          <p className="text-stone-200 text-sm font-semibold">Restore from Backup</p>
          <p className="text-stone-500 text-xs">
            Load a previously downloaded backup file. <span className="text-amber-500 font-medium">This will replace all current data.</span>
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <Upload size={16} /> Choose Backup File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />
          {error && (
            <p className="text-red-400 text-xs flex items-center gap-1">
              <AlertTriangle size={12} /> {error}
            </p>
          )}
        </div>

        {/* Confirm restore dialog */}
        {confirmRestore && (
          <div className="bg-amber-950/60 border border-amber-800/60 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={18} className="text-amber-400 flex-none mt-0.5" />
              <div>
                <p className="text-amber-300 font-semibold text-sm">Replace all data?</p>
                <p className="text-amber-500/80 text-xs mt-0.5">
                  Your current characters, journal, and maps will be replaced with the backup. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setConfirmRestore(false); setPendingData(null) }}
                className="btn-secondary flex-1 text-sm py-2"
              >
                Cancel
              </button>
              <button onClick={applyRestore} className="btn-danger flex-1 text-sm py-2">
                Yes, Restore
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
