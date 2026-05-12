import { useState } from 'react'
import TopBar from '../components/layout/TopBar'
import { useCharacterStore } from '../store/characterStore'
import type { Skill, InventoryItem, CharacterField, FieldType } from '../types'
import { Plus, Trash2, X, Edit2, Check } from 'lucide-react'

type Tab = 'stats' | 'skills' | 'inventory' | 'notes'

const CONDITIONS = [
  'Exhausted', 'Poisoned', 'Bleeding', 'Stunned', 'Frightened',
  'Blinded', 'Deafened', 'Charmed', 'Paralyzed', 'Unconscious',
]

const FIELD_TYPES: { type: FieldType; label: string; desc: string }[] = [
  { type: 'number',   label: '#',  desc: 'Number'   },
  { type: 'resource', label: '❤',  desc: 'Resource' },
  { type: 'dots',     label: '●●', desc: 'Dots'     },
  { type: 'track',    label: '☐☐', desc: 'Track'    },
  { type: 'text',     label: 'Aa', desc: 'Text'     },
]

function SkillDots({ rank, onChange }: { rank: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          onClick={() => onChange(rank === i ? 0 : i)}
          className={`w-4 h-4 rounded-full border transition-all ${
            i <= rank ? 'bg-amber-500 border-amber-600' : 'bg-stone-700 border-stone-600'
          }`}
        />
      ))}
    </div>
  )
}

function FieldWidget({
  field,
  charId,
}: {
  field: CharacterField
  charId: string
}) {
  const store = useCharacterStore()

  const update = (partial: Partial<CharacterField>) =>
    store.updateField(charId, field.id, partial)

  if (field.type === 'number') {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => update({ value: Math.max(0, field.value - 1) })}
          className="w-8 h-8 rounded bg-stone-700 text-stone-200 font-bold text-lg leading-none touch-manipulation"
        >−</button>
        <span className="font-bold text-stone-100 font-mono text-xl w-10 text-center">{field.value}</span>
        <button
          onClick={() => update({ value: field.max > 0 ? Math.min(field.max, field.value + 1) : field.value + 1 })}
          className="w-8 h-8 rounded bg-stone-700 text-stone-200 font-bold text-lg leading-none touch-manipulation"
        >+</button>
        {field.max > 0 && <span className="text-stone-600 text-xs ml-1">/ {field.max}</span>}
      </div>
    )
  }

  if (field.type === 'resource') {
    const pct = field.max > 0 ? Math.max(0, Math.min(1, field.value / field.max)) : 0
    const color = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#f59e0b' : '#ef4444'
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1">
          <button
            onClick={() => update({ value: Math.max(0, field.value - 1) })}
            className="w-8 h-8 rounded bg-stone-700 text-stone-200 font-bold text-lg leading-none touch-manipulation"
          >−</button>
          <span className="font-mono font-bold text-stone-100 text-sm min-w-[52px] text-center">
            {field.value} / {field.max}
          </span>
          <button
            onClick={() => update({ value: Math.min(field.max, field.value + 1) })}
            className="w-8 h-8 rounded bg-stone-700 text-stone-200 font-bold text-lg leading-none touch-manipulation"
          >+</button>
          <button
            onClick={() => update({ value: field.max })}
            className="text-xs text-stone-500 hover:text-amber-400 ml-1 px-2 py-1 rounded bg-stone-800 touch-manipulation"
          >Full</button>
        </div>
        <div className="bg-stone-800 rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${pct * 100}%`, backgroundColor: color }}
          />
        </div>
      </div>
    )
  }

  if (field.type === 'text') {
    return (
      <input
        className="input text-sm py-1.5 w-full"
        value={field.text}
        onChange={(e) => update({ text: e.target.value })}
        placeholder={`${field.name}…`}
      />
    )
  }

  if (field.type === 'dots') {
    return (
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: field.max }, (_, i) => (
          <button
            key={i}
            onClick={() => update({ value: field.value === i + 1 ? 0 : i + 1 })}
            className={`w-5 h-5 rounded-full border-2 transition-all touch-manipulation ${
              i < field.value ? 'bg-amber-500 border-amber-600' : 'bg-stone-700 border-stone-600'
            }`}
          />
        ))}
      </div>
    )
  }

  if (field.type === 'track') {
    return (
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: field.max }, (_, i) => {
          const on = Boolean((field.value >> i) & 1)
          return (
            <button
              key={i}
              onClick={() => update({ value: field.value ^ (1 << i) })}
              className={`w-6 h-6 rounded border-2 transition-all touch-manipulation ${
                on ? 'bg-stone-300 border-stone-200' : 'bg-stone-800 border-stone-600'
              }`}
            />
          )
        })}
      </div>
    )
  }

  return null
}

function AddFieldModal({ charId, onClose }: { charId: string; onClose: () => void }) {
  const store = useCharacterStore()
  const [name, setName] = useState('')
  const [type, setType] = useState<FieldType>('number')
  const [startVal, setStartVal] = useState(0)
  const [maxVal, setMaxVal] = useState(10)
  const [boxCount, setBoxCount] = useState(5)
  const [dotCount, setDotCount] = useState(5)

  const add = () => {
    if (!name.trim()) return
    const id = crypto.randomUUID()
    let field: CharacterField
    if (type === 'number') {
      field = { id, name: name.trim(), type, value: startVal, max: maxVal, text: '' }
    } else if (type === 'resource') {
      field = { id, name: name.trim(), type, value: maxVal, max: maxVal, text: '' }
    } else if (type === 'dots') {
      field = { id, name: name.trim(), type, value: 0, max: dotCount, text: '' }
    } else if (type === 'track') {
      field = { id, name: name.trim(), type, value: 0, max: boxCount, text: '' }
    } else {
      field = { id, name: name.trim(), type: 'text', value: 0, max: 0, text: '' }
    }
    store.addField(charId, field)
    onClose()
  }

  return (
    <div className="absolute inset-0 bg-black/70 flex items-end z-50" onClick={onClose}>
      <div className="bg-stone-900 w-full rounded-t-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <h3 className="text-stone-100 font-bold flex-1">Add Field</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-200"><X size={20} /></button>
        </div>

        <div>
          <label className="section-title block">Name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Field name…"
            autoFocus
          />
        </div>

        <div>
          <label className="section-title block">Type</label>
          <div className="grid grid-cols-5 gap-1.5">
            {FIELD_TYPES.map(({ type: t, label, desc }) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex flex-col items-center py-2 px-1 rounded-lg border text-xs touch-manipulation ${
                  type === t
                    ? 'bg-amber-900/40 border-amber-600 text-amber-400'
                    : 'bg-stone-800 border-stone-700 text-stone-400'
                }`}
              >
                <span className="text-base mb-0.5">{label}</span>
                <span>{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {type === 'number' && (
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="section-title block">Starting Value</label>
              <input className="input" type="number" value={startVal} onChange={(e) => setStartVal(Number(e.target.value))} />
            </div>
            <div className="flex-1">
              <label className="section-title block">Max (0 = no limit)</label>
              <input className="input" type="number" min={0} value={maxVal} onChange={(e) => setMaxVal(Number(e.target.value))} />
            </div>
          </div>
        )}

        {type === 'resource' && (
          <div>
            <label className="section-title block">Max Value</label>
            <input className="input" type="number" min={1} value={maxVal} onChange={(e) => setMaxVal(Number(e.target.value))} />
          </div>
        )}

        {type === 'dots' && (
          <div>
            <label className="section-title block">Max Dots</label>
            <div className="flex gap-2 flex-wrap">
              {[3, 5, 6, 10].map((n) => (
                <button key={n} onClick={() => setDotCount(n)}
                  className={`px-3 py-1.5 rounded-lg border text-sm touch-manipulation ${
                    dotCount === n ? 'bg-amber-900/40 border-amber-600 text-amber-400' : 'bg-stone-800 border-stone-700 text-stone-400'
                  }`}
                >{n}</button>
              ))}
            </div>
          </div>
        )}

        {type === 'track' && (
          <div>
            <label className="section-title block">Boxes</label>
            <div className="flex gap-2 flex-wrap">
              {[3, 4, 5, 6, 8, 10].map((n) => (
                <button key={n} onClick={() => setBoxCount(n)}
                  className={`px-3 py-1.5 rounded-lg border text-sm touch-manipulation ${
                    boxCount === n ? 'bg-amber-900/40 border-amber-600 text-amber-400' : 'bg-stone-800 border-stone-700 text-stone-400'
                  }`}
                >{n}</button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={add} disabled={!name.trim()} className="btn-primary flex-1 disabled:opacity-40">
            Add Field
          </button>
        </div>
      </div>
    </div>
  )
}

function EditFieldModal({
  field,
  charId,
  onClose,
}: {
  field: CharacterField
  charId: string
  onClose: () => void
}) {
  const store = useCharacterStore()
  const [name, setName] = useState(field.name)
  const [maxVal, setMaxVal] = useState(field.max)

  const save = () => {
    const partial: Partial<CharacterField> = { name: name.trim() || field.name }
    if (field.type !== 'text') partial.max = maxVal
    store.updateField(charId, field.id, partial)
    onClose()
  }

  return (
    <div className="absolute inset-0 bg-black/70 flex items-end z-50" onClick={onClose}>
      <div className="bg-stone-900 w-full rounded-t-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <h3 className="text-stone-100 font-bold flex-1">Edit Field</h3>
          <span className="text-xs text-stone-500 bg-stone-800 px-2 py-0.5 rounded capitalize">{field.type}</span>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-200"><X size={20} /></button>
        </div>

        <div>
          <label className="section-title block">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>

        {field.type === 'number' && (
          <div>
            <label className="section-title block">Max (0 = no limit)</label>
            <input className="input" type="number" min={0} value={maxVal} onChange={(e) => setMaxVal(Number(e.target.value))} />
          </div>
        )}
        {field.type === 'resource' && (
          <div>
            <label className="section-title block">Max Value</label>
            <input className="input" type="number" min={1} value={maxVal} onChange={(e) => setMaxVal(Number(e.target.value))} />
          </div>
        )}
        {field.type === 'dots' && (
          <div>
            <label className="section-title block">Max Dots</label>
            <input className="input" type="number" min={1} max={10} value={maxVal} onChange={(e) => setMaxVal(Number(e.target.value))} />
          </div>
        )}
        {field.type === 'track' && (
          <div>
            <label className="section-title block">Number of Boxes</label>
            <input className="input" type="number" min={1} max={20} value={maxVal} onChange={(e) => setMaxVal(Number(e.target.value))} />
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => { store.moveField(charId, field.id, 'up'); onClose() }}
            className="btn-secondary px-3 py-2 text-sm"
            title="Move up"
          >↑</button>
          <button
            onClick={() => { store.moveField(charId, field.id, 'down'); onClose() }}
            className="btn-secondary px-3 py-2 text-sm"
            title="Move down"
          >↓</button>
          <div className="flex-1" />
          <button onClick={save} className="btn-primary px-5">Save</button>
          <button
            onClick={() => { store.removeField(charId, field.id); onClose() }}
            className="btn-danger px-3 py-2"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CharacterPage() {
  const store = useCharacterStore()
  const char = store.activeCharacter()
  const [tab, setTab] = useState<Tab>('stats')
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(char.name)
  const [showConditions, setShowConditions] = useState(false)
  const [newSkillName, setNewSkillName] = useState('')
  const [newItemName, setNewItemName] = useState('')
  const [newItemQty, setNewItemQty] = useState(1)
  const [showNewSkill, setShowNewSkill] = useState(false)
  const [showNewItem, setShowNewItem] = useState(false)
  const [showCharList, setShowCharList] = useState(false)
  const [showAddField, setShowAddField] = useState(false)
  const [editingField, setEditingField] = useState<CharacterField | null>(null)

  const primaryResource = (char.fields ?? []).find((f) => f.type === 'resource')
  const resourcePct = primaryResource && primaryResource.max > 0
    ? primaryResource.value / primaryResource.max : 0
  const resourceColor = resourcePct > 0.5 ? '#22c55e' : resourcePct > 0.25 ? '#f59e0b' : '#ef4444'

  const addSkill = () => {
    if (!newSkillName.trim()) return
    const skill: Skill = { id: crypto.randomUUID(), name: newSkillName.trim(), rank: 1 }
    store.addSkill(char.id, skill)
    setNewSkillName('')
    setShowNewSkill(false)
  }

  const addItem = () => {
    if (!newItemName.trim()) return
    const item: InventoryItem = { id: crypto.randomUUID(), name: newItemName.trim(), quantity: newItemQty }
    store.addItem(char.id, item)
    setNewItemName('')
    setNewItemQty(1)
    setShowNewItem(false)
  }

  return (
    <div className="flex flex-col h-full relative">
      <TopBar
        title={char.name}
        subtitle={char.concept || 'Solo Adventurer'}
        left={
          <button
            onClick={() => setShowCharList((s) => !s)}
            className="text-stone-400 hover:text-stone-200 text-xs bg-stone-800 px-2 py-1 rounded"
          >▾</button>
        }
        right={
          <span className="text-xs text-stone-500">
            XP: <span className="text-amber-500 font-bold">{char.xp}</span>
          </span>
        }
      />

      {/* Character list */}
      {showCharList && (
        <div className="bg-stone-900 border-b border-stone-700 p-3 space-y-2">
          {store.characters.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <button
                onClick={() => { store.setActiveCharacter(c.id); setShowCharList(false) }}
                className={`flex-1 text-left text-sm px-3 py-2 rounded-lg ${
                  c.id === char.id ? 'bg-amber-900/40 text-amber-400' : 'text-stone-300 hover:bg-stone-800'
                }`}
              >{c.name}</button>
              {store.characters.length > 1 && (
                <button onClick={() => store.deleteCharacter(c.id)} className="p-1 text-stone-500 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => { store.addCharacter('New Hero'); setShowCharList(false) }}
            className="flex items-center gap-1 text-sm text-amber-500"
          >
            <Plus size={14} /> New Character
          </button>
        </div>
      )}

      {/* Primary resource bar */}
      {primaryResource && (
        <div className="flex-none bg-stone-900 border-b border-stone-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold w-8 truncate">
              {primaryResource.name}
            </span>
            <div className="flex-1 bg-stone-800 rounded-full h-4 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${resourcePct * 100}%`, backgroundColor: resourceColor }}
              />
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => store.updateField(char.id, primaryResource.id, { value: Math.max(0, primaryResource.value - 1) })}
                className="w-8 h-8 rounded bg-stone-700 text-stone-200 font-bold text-lg leading-none touch-manipulation"
              >−</button>
              <span className="font-mono text-sm font-bold text-stone-100 min-w-[52px] text-center">
                {primaryResource.value}/{primaryResource.max}
              </span>
              <button
                onClick={() => store.updateField(char.id, primaryResource.id, { value: Math.min(primaryResource.max, primaryResource.value + 1) })}
                className="w-8 h-8 rounded bg-stone-700 text-stone-200 font-bold text-lg leading-none touch-manipulation"
              >+</button>
            </div>
          </div>

          {char.conditions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {char.conditions.map((c) => (
                <button
                  key={c}
                  onClick={() => store.removeCondition(char.id, c)}
                  className="text-xs bg-red-900/40 text-red-300 border border-red-800/50 px-2 py-0.5 rounded-full flex items-center gap-1"
                >
                  {c} <X size={10} />
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowConditions((s) => !s)}
            className="text-xs text-stone-500 hover:text-stone-300 mt-1.5 flex items-center gap-1"
          >
            <Plus size={11} /> Add Condition
          </button>

          {showConditions && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {CONDITIONS.filter((c) => !char.conditions.includes(c)).map((c) => (
                <button
                  key={c}
                  onClick={() => { store.addCondition(char.id, c); setShowConditions(false) }}
                  className="text-xs bg-stone-800 text-stone-300 border border-stone-700 px-2 py-0.5 rounded-full hover:border-red-700 hover:text-red-300"
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex-none flex border-b border-stone-800 bg-stone-950">
        {(['stats', 'skills', 'inventory', 'notes'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-colors capitalize ${
              tab === t ? 'text-amber-500 border-b-2 border-amber-500' : 'text-stone-500 hover:text-stone-300'
            }`}
          >{t}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">

        {/* ── Stats ── */}
        {tab === 'stats' && (
          <div className="space-y-4">
            {/* Name / Concept / System / XP */}
            <div className="card space-y-3">
              <div className="flex items-center gap-2">
                {editingName ? (
                  <>
                    <input
                      className="input flex-1 text-sm"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        store.updateCharacter(char.id, { name: nameInput.trim() || char.name })
                        setEditingName(false)
                      }}
                      className="p-1.5 text-amber-500"
                    ><Check size={16} /></button>
                  </>
                ) : (
                  <>
                    <span className="text-stone-100 font-semibold flex-1">{char.name}</span>
                    <button onClick={() => { setNameInput(char.name); setEditingName(true) }} className="p-1 text-stone-500 hover:text-stone-300">
                      <Edit2 size={14} />
                    </button>
                  </>
                )}
              </div>
              <div>
                <label className="section-title block">Concept</label>
                <input
                  className="input text-sm"
                  value={char.concept}
                  onChange={(e) => store.updateCharacter(char.id, { concept: e.target.value })}
                  placeholder="A lone wanderer…"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="section-title block">System</label>
                  <input
                    className="input text-sm"
                    value={char.system}
                    onChange={(e) => store.updateCharacter(char.id, { system: e.target.value })}
                    placeholder="OSR, PbtA…"
                  />
                </div>
                <div className="flex-1">
                  <label className="section-title block">XP</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => store.updateCharacter(char.id, { xp: Math.max(0, char.xp - 1) })} className="w-7 h-7 rounded bg-stone-700 text-stone-200 font-bold">−</button>
                    <span className="flex-1 text-center font-mono font-bold text-amber-400">{char.xp}</span>
                    <button onClick={() => store.updateCharacter(char.id, { xp: char.xp + 1 })} className="w-7 h-7 rounded bg-stone-700 text-stone-200 font-bold">+</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Fields */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="section-title mb-0">Fields</p>
                <button
                  onClick={() => setShowAddField(true)}
                  className="text-amber-500 text-sm flex items-center gap-1"
                >
                  <Plus size={14} /> Add
                </button>
              </div>

              {(char.fields ?? []).length === 0 && (
                <p className="text-stone-600 text-sm text-center py-8">
                  No fields yet. Add stats, resources, tracks and more.
                </p>
              )}

              <div className="space-y-2">
                {(char.fields ?? []).map((field) => (
                  <div key={field.id} className="card py-2 px-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-stone-500 mb-1.5 uppercase tracking-wide">{field.name}</p>
                        <FieldWidget field={field} charId={char.id} />
                      </div>
                      <button
                        onClick={() => setEditingField(field)}
                        className="p-1.5 text-stone-600 hover:text-stone-300 flex-none mt-0.5 touch-manipulation"
                      >
                        <Edit2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Skills ── */}
        {tab === 'skills' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="section-title mb-0">Skills</p>
              <button onClick={() => setShowNewSkill((s) => !s)} className="text-amber-500 text-sm flex items-center gap-1">
                <Plus size={14} /> Add Skill
              </button>
            </div>

            {showNewSkill && (
              <div className="card flex gap-2 items-end">
                <input className="input flex-1 text-sm" placeholder="Skill name…" value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} />
                <button onClick={addSkill} className="btn-primary px-3 py-2 text-sm">Add</button>
              </div>
            )}

            {char.skills.length === 0 && (
              <p className="text-stone-600 text-sm text-center py-8">No skills yet. Add some!</p>
            )}

            <div className="space-y-2">
              {char.skills.map((sk) => (
                <div key={sk.id} className="card flex items-center gap-3">
                  <span className="text-stone-200 text-sm flex-1">{sk.name}</span>
                  <SkillDots rank={sk.rank} onChange={(n) => store.updateSkill(char.id, sk.id, { rank: n })} />
                  <button onClick={() => store.removeSkill(char.id, sk.id)} className="text-stone-600 hover:text-red-400">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Inventory ── */}
        {tab === 'inventory' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="section-title mb-0">Inventory ({char.inventory.length} items)</p>
              <button onClick={() => setShowNewItem((s) => !s)} className="text-amber-500 text-sm flex items-center gap-1">
                <Plus size={14} /> Add Item
              </button>
            </div>

            {showNewItem && (
              <div className="card space-y-2">
                <input className="input text-sm" placeholder="Item name…" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} />
                <div className="flex gap-2 items-center">
                  <label className="text-xs text-stone-400">Qty</label>
                  <input className="input w-20 text-sm" type="number" min={1} value={newItemQty} onChange={(e) => setNewItemQty(Number(e.target.value))} />
                  <button onClick={addItem} className="btn-primary flex-1 text-sm py-2">Add</button>
                </div>
              </div>
            )}

            {char.inventory.length === 0 && (
              <p className="text-stone-600 text-sm text-center py-8">Empty pack. Add items!</p>
            )}

            <div className="space-y-2">
              {char.inventory.map((item) => (
                <div key={item.id} className={`card flex items-center gap-3 ${item.equipped ? 'border-amber-800/50' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${item.equipped ? 'text-amber-300' : 'text-stone-200'}`}>{item.name}</span>
                      {item.equipped && <span className="text-xs bg-amber-900/40 text-amber-500 px-1 rounded">Equipped</span>}
                    </div>
                    {item.note && <p className="text-xs text-stone-500 mt-0.5">{item.note}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => store.updateItem(char.id, item.id, { quantity: Math.max(0, item.quantity - 1) })}
                      className="w-6 h-6 rounded bg-stone-700 text-stone-300 text-sm font-bold">−</button>
                    <span className="w-8 text-center font-mono text-sm text-stone-200">{item.quantity}</span>
                    <button onClick={() => store.updateItem(char.id, item.id, { quantity: item.quantity + 1 })}
                      className="w-6 h-6 rounded bg-stone-700 text-stone-300 text-sm font-bold">+</button>
                  </div>
                  <button
                    onClick={() => store.updateItem(char.id, item.id, { equipped: !item.equipped })}
                    className={`text-xs px-2 py-1 rounded ${item.equipped ? 'bg-amber-900/40 text-amber-400' : 'bg-stone-700 text-stone-400'}`}
                  >{item.equipped ? '⚔' : 'Eq'}</button>
                  <button onClick={() => store.removeItem(char.id, item.id)} className="text-stone-600 hover:text-red-400">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Notes ── */}
        {tab === 'notes' && (
          <div className="space-y-3">
            <p className="section-title">Character Notes</p>
            <textarea
              className="textarea w-full"
              rows={18}
              placeholder="Backstory, personality, goals, secrets…"
              value={char.notes}
              onChange={(e) => store.updateCharacter(char.id, { notes: e.target.value })}
            />
          </div>
        )}
      </div>

      {showAddField && <AddFieldModal charId={char.id} onClose={() => setShowAddField(false)} />}
      {editingField && (
        <EditFieldModal
          field={editingField}
          charId={char.id}
          onClose={() => setEditingField(null)}
        />
      )}
    </div>
  )
}
