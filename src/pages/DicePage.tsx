import { useState, useRef } from 'react'
import TopBar from '../components/layout/TopBar'
import { useDiceStore } from '../store/diceStore'
import type { DieType } from '../types'
import SaveToJournal from '../components/SaveToJournal'
import { Trash2, ChevronDown } from 'lucide-react'

const DIE_TYPES: DieType[] = [4, 6, 8, 10, 12, 20, 100]

const DIE_COLORS: Record<DieType, string> = {
  4:   '#8b5cf6',
  6:   '#3b82f6',
  8:   '#06b6d4',
  10:  '#22c55e',
  12:  '#f59e0b',
  20:  '#ef4444',
  100: '#ec4899',
}

function DieShape({ sides, size, color }: { sides: DieType; size: number; color: string }) {
  const s = size
  const cx = s / 2
  const cy = s / 2

  const paths: Record<DieType, string> = {
    4:   `M${cx},4 L${s - 4},${s - 4} L4,${s - 4} Z`,
    6:   `M6,6 L${s - 6},6 L${s - 6},${s - 6} L6,${s - 6} Z`,
    8:   `M${cx},4 L${s - 4},${cy} L${cx},${s - 4} L4,${cy} Z`,
    10:  `M${cx},4 L${s - 4},${cy} L${cx},${s - 4} L4,${cy} Z`,
    12:  `M${cx},4 L${s - 6},10 L${s - 4},${cy} L${s - 6},${s - 10} L${cx},${s - 4} L6,${s - 10} L4,${cy} L6,10 Z`,
    20:  `M${cx},4 L${s - 4},${s - 4} L4,${s - 4} Z`,
    100: `M${cx},4 L${s - 4},${cy} L${cx},${s - 4} L4,${cy} Z`,
  }

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <path d={paths[sides]} fill={color} opacity={0.9} />
      <text
        x={cx}
        y={cy + (sides === 4 ? 4 : 1)}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={sides === 100 ? 9 : 12}
        fontWeight="bold"
        fontFamily="system-ui"
      >
        d{sides}
      </text>
    </svg>
  )
}

const PRESETS = [
  { label: '1d20',  dice: [{ type: 20  as DieType, count: 1 }], mod: 0 },
  { label: '2d6',   dice: [{ type: 6   as DieType, count: 2 }], mod: 0 },
  { label: '1d100', dice: [{ type: 100 as DieType, count: 1 }], mod: 0 },
  { label: '4d6',   dice: [{ type: 6   as DieType, count: 4 }], mod: 0 },
]

export default function DicePage() {
  const store = useDiceStore()
  const [rolling, setRolling] = useState(false)
  const [rollingDie, setRollingDie] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [modInput, setModInput] = useState('0')
  const resultRef = useRef<HTMLDivElement>(null)

  const poolDescription = store.pool
    .map((d) => `${d.count}d${d.type}`)
    .join(' + ')

  const roll = async () => {
    if (store.pool.length === 0) return
    setRolling(true)
    setRollingDie('rolling')
    if (navigator.vibrate) navigator.vibrate([40, 20, 60])
    await new Promise((r) => setTimeout(r, 500))
    store.roll()
    setRolling(false)
    setRollingDie(null)
  }

  const quickRoll = async (type: DieType) => {
    setRollingDie(`${type}`)
    if (navigator.vibrate) navigator.vibrate(50)
    await new Promise((r) => setTimeout(r, 300))
    store.quickRoll(type)
    setRollingDie(null)
  }

  const lastResult = store.history[0]
  const mod = parseInt(modInput) || 0

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Dice Roller" subtitle="Your fate in these hands" />

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Quick Roll buttons */}
        <div>
          <p className="section-title">Quick Roll</p>
          <div className="grid grid-cols-4 gap-2">
            {DIE_TYPES.map((d) => (
              <button
                key={d}
                onClick={() => quickRoll(d)}
                className={`flex flex-col items-center justify-center py-3 rounded-xl bg-stone-800 border border-stone-700
                  active:scale-95 transition-all touch-manipulation
                  ${rollingDie === `${d}` ? 'dice-roll' : ''}`}
              >
                <DieShape sides={d} size={40} color={DIE_COLORS[d]} />
              </button>
            ))}
          </div>
        </div>

        {/* Dice Pool Builder */}
        <div className="card space-y-3">
          <p className="section-title">Dice Pool</p>
          <div className="grid grid-cols-4 gap-2">
            {DIE_TYPES.map((d) => {
              const inPool = store.pool.find((p) => p.type === d)
              return (
                <div key={d} className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => store.addDie(d)}
                    className="w-full py-2 rounded-lg bg-stone-700 text-stone-300 text-xs font-semibold
                               active:scale-95 transition-all touch-manipulation"
                  >
                    +d{d}
                  </button>
                  {inPool && (
                    <span
                      className="text-xs font-bold"
                      style={{ color: DIE_COLORS[d] }}
                    >
                      {inPool.count}d{d}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Modifier */}
          <div className="flex items-center gap-3">
            <label className="text-stone-400 text-sm">Modifier</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setModInput((v) => String(parseInt(v || '0') - 1))}
                className="w-8 h-8 rounded bg-stone-700 text-stone-200 font-bold"
              >−</button>
              <input
                className="input w-16 text-center text-sm"
                value={modInput}
                onChange={(e) => setModInput(e.target.value)}
                type="number"
              />
              <button
                onClick={() => setModInput((v) => String(parseInt(v || '0') + 1))}
                className="w-8 h-8 rounded bg-stone-700 text-stone-200 font-bold"
              >+</button>
            </div>
          </div>

          {/* Pool summary */}
          {store.pool.length > 0 && (
            <div className="bg-stone-900 rounded-lg px-3 py-2 text-sm text-stone-300">
              {poolDescription}
              {mod !== 0 ? (mod > 0 ? ` + ${mod}` : ` − ${Math.abs(mod)}`) : ''}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => { store.clearPool(); setModInput('0') }}
              className="btn-secondary px-3"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={() => { store.setModifier(mod); roll() }}
              disabled={store.pool.length === 0 || rolling}
              className={`btn-primary flex-1 text-base ${rolling ? 'dice-roll opacity-80' : ''}`}
            >
              {rolling ? 'Rolling…' : 'Roll!'}
            </button>
          </div>
        </div>

        {/* Presets */}
        <div>
          <p className="section-title">Presets</p>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={async () => {
                  store.clearPool()
                  p.dice.forEach(({ type, count }) => {
                    for (let i = 0; i < count; i++) store.addDie(type)
                  })
                  store.setModifier(p.mod)
                  setRolling(true)
                  if (navigator.vibrate) navigator.vibrate([40, 20, 60])
                  await new Promise((r) => setTimeout(r, 400))
                  store.roll(p.label)
                  setRolling(false)
                }}
                className="btn-secondary text-sm"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Last Result */}
        {lastResult && (
          <div ref={resultRef} className="card border-amber-800/50 text-center py-5 relative">
            <div className="absolute top-3 right-3">
              <SaveToJournal
                entry={{
                  title: `Rolled ${lastResult.dice.map((d) => `${d.count}d${d.type}`).join('+')}${lastResult.modifier ? (lastResult.modifier > 0 ? `+${lastResult.modifier}` : lastResult.modifier) : ''} = ${lastResult.total}`,
                  body: `Results: [${lastResult.results.join(', ')}]${lastResult.modifier ? ` + modifier ${lastResult.modifier}` : ''}\nTotal: ${lastResult.total}`,
                  tag: 'note',
                }}
              />
            </div>
            <p className="section-title">Last Roll</p>
            {lastResult.label && (
              <p className="text-stone-400 text-sm mb-1">{lastResult.label}</p>
            )}
            <p className="text-6xl font-bold font-display text-amber-400 glow-gold">
              {lastResult.total}
            </p>
            {lastResult.dice.length === 1 && lastResult.dice[0].count === 1 && lastResult.dice[0].type === 20 && lastResult.total === 20 && (
              <p className="text-amber-300 font-bold text-sm tracking-wider mt-1 glow-gold">NATURAL 20!</p>
            )}
            {lastResult.dice.length === 1 && lastResult.dice[0].count === 1 && lastResult.dice[0].type === 20 && lastResult.total === 1 && (
              <p className="text-red-400 font-bold text-sm tracking-wider mt-1">FUMBLE</p>
            )}
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              {lastResult.results.map((r, i) => {
                const die = lastResult.dice[0]
                const isMax = r === (die?.type ?? 0)
                const isMin = r === 1
                return (
                  <span
                    key={i}
                    className={`text-sm font-mono px-2 py-0.5 rounded ${
                      isMax ? 'bg-amber-900/60 text-amber-300 font-bold' :
                      isMin ? 'bg-red-900/60 text-red-300' :
                      'bg-stone-700 text-stone-300'
                    }`}
                  >
                    {r}
                  </span>
                )
              })}
              {lastResult.modifier !== 0 && (
                <span className="text-sm font-mono px-2 py-0.5 rounded bg-stone-700 text-stone-400">
                  {lastResult.modifier > 0 ? `+${lastResult.modifier}` : lastResult.modifier}
                </span>
              )}
            </div>
          </div>
        )}

        {/* History */}
        {store.history.length > 1 && (
          <div>
            <button
              onClick={() => setShowHistory((s) => !s)}
              className="flex items-center gap-2 text-stone-400 text-sm hover:text-stone-200 w-full"
            >
              <span className="section-title mb-0">History ({store.history.length - 1} more)</span>
              <ChevronDown size={14} className={`transition-transform ${showHistory ? 'rotate-180' : ''}`} />
            </button>
            {showHistory && (
              <div className="mt-2 space-y-1.5">
                {store.history.slice(1, 30).map((r) => (
                  <div key={r.id} className="flex items-center gap-3 bg-stone-800 rounded-lg px-3 py-2">
                    <span className="text-amber-400 font-bold font-mono text-sm min-w-[40px] text-right">{r.total}</span>
                    <span className="text-stone-400 text-xs flex-1">
                      {r.dice.map((d) => `${d.count}d${d.type}`).join('+')}
                      {r.modifier ? (r.modifier > 0 ? `+${r.modifier}` : r.modifier) : ''}
                    </span>
                    <span className="text-stone-600 text-xs">[{r.results.join(', ')}]</span>
                    <SaveToJournal
                      size={13}
                      entry={{
                        title: `Rolled ${r.dice.map((d) => `${d.count}d${d.type}`).join('+')} = ${r.total}`,
                        body: `Results: [${r.results.join(', ')}]\nTotal: ${r.total}`,
                        tag: 'note',
                      }}
                    />
                  </div>
                ))}
                <button onClick={store.clearHistory} className="text-xs text-stone-500 hover:text-red-400 flex items-center gap-1 mt-2">
                  <Trash2 size={12} /> Clear history
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
