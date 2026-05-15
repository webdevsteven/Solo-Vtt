import { useState } from 'react'
import TopBar from '../components/layout/TopBar'
import { useDiceStore } from '../store/diceStore'
import type { DicePreset, DiceRollResult } from '../store/diceStore'
import SaveToJournal from '../components/SaveToJournal'
import { Plus, Pencil, Trash2, ChevronDown, X } from 'lucide-react'

const QUICK_SIDES = [4, 6, 8, 10, 12, 20, 100] as const

// ── Preset editor modal ───────────────────────────────────────────────────────

function PresetModal({
  preset,
  onSave,
  onDelete,
  onClose,
}: {
  preset: DicePreset | null
  onSave: (label: string, notation: string) => void
  onDelete?: () => void
  onClose: () => void
}) {
  const [label, setLabel] = useState(preset?.label ?? '')
  const [notation, setNotation] = useState(preset?.notation ?? '')

  return (
    <div className="absolute inset-0 bg-black/70 flex items-end z-50" onClick={onClose}>
      <div
        className="modal-sheet bg-stone-900 w-full rounded-t-2xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-stone-100 font-bold">{preset ? 'Edit Preset' : 'New Preset'}</h3>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-300">
            <X size={20} />
          </button>
        </div>

        <div>
          <label className="section-title block">Label</label>
          <input
            className="input"
            placeholder="Advantage"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>

        <div>
          <label className="section-title block">Notation</label>
          <input
            className="input font-mono"
            placeholder="2d20kh1"
            value={notation}
            onChange={(e) => setNotation(e.target.value)}
          />
          <p className="text-stone-600 text-xs mt-1.5">
            kh = keep high · kl = keep low · dh = drop high · dl = drop low
          </p>
        </div>

        <div className="flex gap-3">
          {onDelete && (
            <button
              onClick={onDelete}
              className="btn-secondary px-3 text-red-400 hover:text-red-300"
            >
              <Trash2 size={15} />
            </button>
          )}
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={() => {
              if (label.trim() && notation.trim()) onSave(label.trim(), notation.trim())
            }}
            disabled={!label.trim() || !notation.trim()}
            className="btn-primary flex-1 disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Result display ────────────────────────────────────────────────────────────

function ResultDisplay({ result }: { result: DiceRollResult }) {
  const g0 = result.groups[0]
  const isNat20 =
    result.groups.length === 1 && g0.rolls.length === 1 &&
    g0.rolls[0] === 20 && g0.kept[0] && g0.sides === 20
  const isFumble =
    result.groups.length === 1 && g0.rolls.length === 1 &&
    g0.rolls[0] === 1 && g0.kept[0] && g0.sides === 20

  const hasDropped = result.groups.some((g) => g.kept.some((k) => !k))
  const showGroupLabel = result.groups.length > 1 || hasDropped

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 text-center">
      <p className="text-7xl font-display font-bold text-amber-400 glow-gold leading-none tracking-tight">
        {result.total}
      </p>

      {isNat20 && (
        <p className="text-amber-300 font-bold text-[10px] tracking-[0.3em] uppercase mt-2 glow-gold">
          Natural 20
        </p>
      )}
      {isFumble && (
        <p className="text-red-400 font-bold text-[10px] tracking-[0.3em] uppercase mt-2">
          Fumble
        </p>
      )}

      <p className="text-stone-600 text-[11px] font-mono mt-2">{result.notation}</p>

      <div className="mt-4 space-y-3">
        {result.groups.map((g, gi) => (
          <div key={gi}>
            {showGroupLabel && (
              <p className="text-stone-600 text-[10px] font-mono mb-1.5">{g.notation}</p>
            )}
            <div className="flex flex-wrap gap-1.5 justify-center">
              {g.rolls.map((r, ri) => (
                <span
                  key={ri}
                  className={`font-mono text-sm px-2.5 py-1 rounded-lg ${
                    g.kept[ri]
                      ? 'bg-stone-800 text-stone-200 font-semibold'
                      : 'bg-stone-800/40 text-stone-600 line-through'
                  }`}
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        ))}

        {result.modifier !== 0 && (
          <p className="text-stone-500 text-sm font-mono">
            {result.modifier > 0 ? `+${result.modifier}` : result.modifier}
          </p>
        )}
      </div>

      <div className="mt-4 flex justify-center">
        <SaveToJournal
          entry={{
            title: `Rolled ${result.notation} = ${result.total}`,
            body:
              result.groups
                .map((g) => `${g.notation}: [${g.rolls.join(', ')}] → ${g.subtotal}`)
                .join('\n') +
              (result.modifier
                ? `\nModifier: ${result.modifier > 0 ? '+' : ''}${result.modifier}`
                : '') +
              `\nTotal: ${result.total}`,
            tag: 'note',
          }}
        />
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DicePage() {
  const store = useDiceStore()
  const [notation, setNotation] = useState('')
  const [result, setResult] = useState<DiceRollResult | null>(() => store.history[0] ?? null)
  const [rolling, setRolling] = useState(false)
  const [parseError, setParseError] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [editingPreset, setEditingPreset] = useState<DicePreset | 'new' | null>(null)

  const doRoll = async (n: string) => {
    const trimmed = n.trim()
    if (!trimmed || rolling) return
    setRolling(true)
    setParseError(false)
    if (navigator.vibrate) navigator.vibrate(40)
    await new Promise((r) => setTimeout(r, 140))
    const res = store.roll(trimmed)
    if (res) {
      setResult(res)
    } else {
      setParseError(true)
    }
    setRolling(false)
  }

  const quickRoll = (sides: number) => {
    if (navigator.vibrate) navigator.vibrate(25)
    const res = store.quickRoll(sides)
    setResult(res)
    setNotation(res.notation)
    setParseError(false)
  }

  return (
    <div className="flex flex-col h-full relative">
      <TopBar title="Dice" subtitle="Roll &amp; track results" />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Quick-roll buttons */}
        <div className="grid grid-cols-7 gap-1.5">
          {QUICK_SIDES.map((sides) => (
            <button
              key={sides}
              onClick={() => quickRoll(sides)}
              className="py-3.5 rounded-xl bg-stone-900 border border-stone-800 hover:border-stone-600 active:bg-stone-800 active:scale-95 transition-all touch-manipulation font-mono font-bold text-sm text-stone-300"
            >
              {sides === 100 ? 'd%' : `d${sides}`}
            </button>
          ))}
        </div>

        {/* Notation input */}
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <input
              value={notation}
              onChange={(e) => { setNotation(e.target.value); setParseError(false) }}
              onKeyDown={(e) => e.key === 'Enter' && doRoll(notation)}
              placeholder="e.g. 3d6  ·  4d6kh3  ·  2d20kl1+5"
              className={`input flex-1 font-mono text-sm ${parseError ? 'border-red-700' : ''}`}
            />
            <button
              onClick={() => doRoll(notation)}
              disabled={!notation.trim() || rolling}
              className="btn-primary px-5 disabled:opacity-40"
            >
              {rolling ? '…' : 'Roll'}
            </button>
          </div>
          <p className="text-stone-700 text-[10px] font-mono px-1">
            kh · kl · dh · dl · e.g. 4d6kh3+2d4-1
          </p>
          {parseError && (
            <p className="text-red-500 text-xs px-1">Couldn't parse that notation.</p>
          )}
        </div>

        {/* Result */}
        {result && <ResultDisplay result={result} />}

        {/* Presets */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <p className="section-title mb-0 flex-1">Presets</p>
            <button
              onClick={() => setEditingPreset('new')}
              className="text-stone-600 hover:text-amber-400 transition-colors"
            >
              <Plus size={15} />
            </button>
          </div>

          {store.presets.length === 0 ? (
            <p className="text-stone-600 text-xs">No presets yet — tap + to add one.</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {store.presets.map((preset) => (
                <div
                  key={preset.id}
                  className="flex-none flex rounded-xl overflow-hidden border border-stone-800"
                >
                  <button
                    onClick={() => {
                      setNotation(preset.notation)
                      doRoll(preset.notation)
                    }}
                    className="px-3 py-2 bg-stone-900 hover:bg-stone-800 transition-colors touch-manipulation text-left"
                  >
                    <p className="text-stone-200 text-xs font-semibold whitespace-nowrap">
                      {preset.label}
                    </p>
                    <p className="text-stone-600 text-[10px] font-mono">{preset.notation}</p>
                  </button>
                  <button
                    onClick={() => setEditingPreset(preset)}
                    className="px-2 bg-stone-900 hover:bg-stone-800 border-l border-stone-800 text-stone-700 hover:text-stone-400 transition-colors"
                  >
                    <Pencil size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History */}
        {store.history.length > 0 && (
          <div>
            <button
              onClick={() => setShowHistory((s) => !s)}
              className="flex items-center gap-2 text-stone-500 w-full"
            >
              <span className="section-title mb-0">History ({store.history.length})</span>
              <ChevronDown
                size={13}
                className={`ml-auto transition-transform ${showHistory ? 'rotate-180' : ''}`}
              />
            </button>

            {showHistory && (
              <div className="mt-2 space-y-1.5">
                {store.history.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 bg-stone-900 border border-stone-800 rounded-lg px-3 py-2"
                  >
                    <span className="text-amber-400 font-bold font-mono text-sm w-10 text-right flex-none">
                      {r.total}
                    </span>
                    <span className="text-stone-500 text-xs font-mono flex-1 truncate">
                      {r.notation}
                    </span>
                    <SaveToJournal
                      size={13}
                      entry={{
                        title: `Rolled ${r.notation} = ${r.total}`,
                        body: `Notation: ${r.notation}\nTotal: ${r.total}`,
                        tag: 'note',
                      }}
                    />
                  </div>
                ))}
                <button
                  onClick={store.clearHistory}
                  className="text-xs text-stone-600 hover:text-red-400 flex items-center gap-1 mt-1 transition-colors"
                >
                  <Trash2 size={11} /> Clear history
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Preset modal */}
      {editingPreset !== null && (
        <PresetModal
          preset={editingPreset === 'new' ? null : editingPreset}
          onSave={(lbl, not) => {
            if (editingPreset === 'new') {
              store.addPreset(lbl, not)
            } else {
              store.updatePreset(editingPreset.id, lbl, not)
            }
            setEditingPreset(null)
          }}
          onDelete={
            editingPreset !== 'new'
              ? () => { store.deletePreset(editingPreset.id); setEditingPreset(null) }
              : undefined
          }
          onClose={() => setEditingPreset(null)}
        />
      )}
    </div>
  )
}
