import { useState, useMemo } from 'react'
import TopBar from '../components/layout/TopBar'
import { useTablesStore } from '../store/tablesStore'
import type { RandomTable, TableRollResult, DieType } from '../types'
import SaveToJournal from '../components/SaveToJournal'
import { Dices, Trash2, ChevronDown, ChevronRight, Plus, X } from 'lucide-react'

const DIE_TYPES: DieType[] = [4, 6, 8, 10, 12, 20, 100]

function TableCard({
  table,
  onRoll,
  onDelete,
}: {
  table: RandomTable
  onRoll: (id: string) => void
  onDelete?: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="card border border-stone-700">
      <div className="flex items-center gap-2">
        <button onClick={() => setExpanded((s) => !s)} className="flex-1 flex items-center gap-2 text-left">
          {expanded ? <ChevronDown size={14} className="text-stone-500" /> : <ChevronRight size={14} className="text-stone-500" />}
          <div>
            <span className="text-stone-100 text-sm font-semibold">{table.name}</span>
            <span className="text-stone-500 text-xs ml-2">d{table.dieType}</span>
          </div>
        </button>
        <div className="flex gap-2">
          {table.custom && onDelete && (
            <button
              onClick={() => onDelete(table.id)}
              className="p-1.5 text-stone-600 hover:text-red-400"
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={() => onRoll(table.id)}
            className="flex items-center gap-1.5 bg-amber-800/40 hover:bg-amber-700/60 text-amber-400
                       text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors touch-manipulation"
          >
            <Dices size={14} /> Roll
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-1">
          {table.rows.map((row, i) => (
            <div key={i} className="flex gap-3 text-xs">
              <span className="text-stone-500 font-mono min-w-[40px]">
                {row.min === row.max ? row.min : `${row.min}–${row.max}`}
              </span>
              <span className="text-stone-300">{row.result}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CreateTableModal({ onClose }: { onClose: () => void }) {
  const store = useTablesStore()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Custom')
  const [dieType, setDieType] = useState<DieType>(6)
  const [rows, setRows] = useState<{ min: string; max: string; result: string }[]>(
    Array.from({ length: 6 }, (_, i) => ({ min: String(i + 1), max: String(i + 1), result: '' })),
  )

  const setDieAndRows = (d: DieType) => {
    setDieType(d)
    setRows(Array.from({ length: d }, (_, i) => ({ min: String(i + 1), max: String(i + 1), result: '' })))
  }

  const save = () => {
    if (!name.trim()) return
    const filledRows = rows
      .filter((r) => r.result.trim())
      .map((r) => ({ min: Number(r.min), max: Number(r.max), result: r.result.trim() }))
    if (!filledRows.length) return
    store.addCustomTable({ name: name.trim(), category, dieType, rows: filledRows })
    onClose()
  }

  return (
    <div className="absolute inset-0 bg-black/70 flex items-end z-50" onClick={onClose}>
      <div className="bg-stone-900 w-full rounded-t-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-4 border-b border-stone-700">
          <h2 className="text-stone-100 font-bold flex-1">Create Custom Table</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-200">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="section-title block">Table Name</label>
            <input className="input" placeholder="My Table" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="section-title block">Category</label>
            <input className="input" placeholder="Custom" value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div>
            <label className="section-title block">Die Type</label>
            <div className="flex flex-wrap gap-2">
              {DIE_TYPES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDieAndRows(d)}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${
                    dieType === d
                      ? 'bg-amber-900/40 border-amber-600 text-amber-400'
                      : 'bg-stone-800 border-stone-700 text-stone-400'
                  }`}
                >
                  d{d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="section-title block">Results</label>
            <div className="space-y-1.5">
              {rows.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-xs text-stone-500 font-mono w-8 text-right">{row.min}</span>
                  <input
                    className="input flex-1 text-sm py-1.5"
                    placeholder={`Result for ${row.min}`}
                    value={row.result}
                    onChange={(e) =>
                      setRows((rs) => rs.map((r, j) => j === i ? { ...r, result: e.target.value } : r))
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-stone-700 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={save} className="btn-primary flex-1">Create Table</button>
        </div>
      </div>
    </div>
  )
}

export default function TablesPage() {
  const store = useTablesStore()
  const [activeCategory, setActiveCategory] = useState('All')
  const [lastResult, setLastResult] = useState<TableRollResult | null>(null)
  const [rolling, setRolling] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const categories = useMemo(() => {
    const cats = new Set(store.tables.map((t) => t.category))
    return ['All', ...Array.from(cats).filter((c) => c !== 'All')]
  }, [store.tables])

  const filteredTables = useMemo(
    () =>
      activeCategory === 'All'
        ? store.tables
        : store.tables.filter((t) => t.category === activeCategory),
    [store.tables, activeCategory],
  )

  const rollTable = async (tableId: string) => {
    setRolling(tableId)
    await new Promise((r) => setTimeout(r, 350))
    const result = store.rollTable(tableId)
    if (result) setLastResult(result)
    setRolling(null)
  }

  return (
    <div className="flex flex-col h-full relative">
      <TopBar
        title="Random Tables"
        subtitle={`${store.tables.length} tables available`}
        right={
          <button
            onClick={() => setShowCreate(true)}
            className="text-amber-500 hover:text-amber-400 flex items-center gap-1 text-sm"
          >
            <Plus size={16} /> New
          </button>
        }
      />

      {/* Last result banner */}
      {lastResult && (
        <div className="flex-none bg-amber-950/60 border-b border-amber-800/40 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-500 font-semibold">{lastResult.tableName}</span>
                <span className="text-xs text-stone-500">· roll: {lastResult.roll}</span>
              </div>
              <p className="text-stone-100 text-sm mt-0.5 font-medium">{lastResult.result}</p>
            </div>
            <SaveToJournal
              entry={{
                title: `${lastResult.tableName}: ${lastResult.result}`,
                body: `Table: ${lastResult.tableName}\nRoll: ${lastResult.roll}\nResult: ${lastResult.result}`,
                tag: 'note',
              }}
            />
            <button onClick={() => setLastResult(null)} className="text-stone-600 hover:text-stone-400 flex-none">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex-none border-b border-stone-800 bg-stone-950">
        <div className="flex gap-1 overflow-x-auto px-4 py-2 pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-full flex-none border transition-colors ${
                activeCategory === cat
                  ? 'bg-amber-900/40 text-amber-400 border-amber-700/60'
                  : 'bg-transparent text-stone-500 border-stone-700 hover:text-stone-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tables list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredTables.map((table) => (
          <div key={table.id} className={rolling === table.id ? 'dice-roll' : ''}>
            <TableCard
              table={table}
              onRoll={rollTable}
              onDelete={store.deleteCustomTable}
            />
          </div>
        ))}

        {filteredTables.length === 0 && (
          <p className="text-center text-stone-600 text-sm py-12">
            No tables in this category.
          </p>
        )}

        {/* Roll History */}
        {store.rollHistory.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowHistory((s) => !s)}
              className="flex items-center gap-2 text-stone-500 text-sm hover:text-stone-300 w-full"
            >
              <span className="section-title mb-0">Roll History ({store.rollHistory.length})</span>
              {showHistory ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {showHistory && (
              <div className="mt-2 space-y-1.5">
                {store.rollHistory.slice(0, 20).map((r, i) => (
                  <div key={i} className="flex gap-3 bg-stone-800 rounded-lg px-3 py-2 text-xs items-center">
                    <span className="text-amber-400 font-mono font-bold min-w-[24px]">{r.roll}</span>
                    <span className="text-stone-400 flex-none truncate max-w-[80px]">{r.tableName}:</span>
                    <span className="text-stone-300 flex-1 truncate">{r.result}</span>
                    <SaveToJournal
                      size={13}
                      entry={{
                        title: `${r.tableName}: ${r.result}`,
                        body: `Table: ${r.tableName}\nRoll: ${r.roll}\nResult: ${r.result}`,
                        tag: 'note',
                      }}
                    />
                  </div>
                ))}
                <button onClick={store.clearHistory} className="text-xs text-stone-500 hover:text-red-400 flex items-center gap-1 mt-1">
                  <Trash2 size={12} /> Clear
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showCreate && <CreateTableModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
