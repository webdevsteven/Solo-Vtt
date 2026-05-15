import { useState, useMemo } from 'react'
import TopBar from '../components/layout/TopBar'
import { useCharacterStore } from '../store/characterStore'
import type { Skill, InventoryItem, CharacterField, FieldType, SkillType } from '../types'
import { Plus, Trash2, X, Edit2, Check, ChevronDown } from 'lucide-react'

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

// ── Field widgets ─────────────────────────────────────────────────────────────

function FieldWidget({ field, charId }: { field: CharacterField; charId: string }) {
  const store = useCharacterStore()
  const upd = (p: Partial<CharacterField>) => store.updateField(charId, field.id, p)

  if (field.type === 'number') return (
    <div className="flex items-center gap-1">
      <button onClick={() => upd({ value: Math.max(0, field.value - 1) })}
        className="w-8 h-8 rounded bg-stone-700 text-stone-200 font-bold text-lg leading-none touch-manipulation">−</button>
      <span className="font-bold text-stone-100 font-mono text-xl w-10 text-center">{field.value}</span>
      <button onClick={() => upd({ value: field.max > 0 ? Math.min(field.max, field.value + 1) : field.value + 1 })}
        className="w-8 h-8 rounded bg-stone-700 text-stone-200 font-bold text-lg leading-none touch-manipulation">+</button>
      {field.max > 0 && <span className="text-stone-600 text-xs ml-1">/ {field.max}</span>}
    </div>
  )

  if (field.type === 'resource') {
    const pct = field.max > 0 ? Math.max(0, Math.min(1, field.value / field.max)) : 0
    const color = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#f59e0b' : '#ef4444'
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1">
          <button onClick={() => upd({ value: Math.max(0, field.value - 1) })}
            className="w-8 h-8 rounded bg-stone-700 text-stone-200 font-bold text-lg leading-none touch-manipulation">−</button>
          <span className="font-mono font-bold text-stone-100 text-sm min-w-[52px] text-center">{field.value} / {field.max}</span>
          <button onClick={() => upd({ value: Math.min(field.max, field.value + 1) })}
            className="w-8 h-8 rounded bg-stone-700 text-stone-200 font-bold text-lg leading-none touch-manipulation">+</button>
          <button onClick={() => upd({ value: field.max })}
            className="text-xs text-stone-500 hover:text-amber-400 ml-1 px-2 py-1 rounded bg-stone-800 touch-manipulation">Full</button>
        </div>
        <div className="bg-stone-800 rounded-full h-2 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct * 100}%`, backgroundColor: color }} />
        </div>
      </div>
    )
  }

  if (field.type === 'text') return (
    <input className="input text-sm py-1.5 w-full" value={field.text}
      onChange={(e) => upd({ text: e.target.value })} placeholder={`${field.name}…`} />
  )

  if (field.type === 'dots') return (
    <div className="flex gap-1.5 flex-wrap">
      {Array.from({ length: field.max }, (_, i) => (
        <button key={i} onClick={() => upd({ value: field.value === i + 1 ? 0 : i + 1 })}
          className={`w-5 h-5 rounded-full border-2 transition-all touch-manipulation ${
            i < field.value ? 'bg-amber-500 border-amber-600' : 'bg-stone-700 border-stone-600'}`} />
      ))}
    </div>
  )

  if (field.type === 'track') return (
    <div className="flex gap-1.5 flex-wrap">
      {Array.from({ length: field.max }, (_, i) => {
        const on = Boolean((field.value >> i) & 1)
        return (
          <button key={i} onClick={() => upd({ value: field.value ^ (1 << i) })}
            className={`w-6 h-6 rounded border-2 transition-all touch-manipulation ${
              on ? 'bg-stone-300 border-stone-200' : 'bg-stone-800 border-stone-600'}`} />
        )
      })}
    </div>
  )

  return null
}

// ── Field modals ──────────────────────────────────────────────────────────────

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
    if (type === 'number')        field = { id, name: name.trim(), type, value: startVal, max: maxVal, text: '' }
    else if (type === 'resource') field = { id, name: name.trim(), type, value: maxVal, max: maxVal, text: '' }
    else if (type === 'dots')     field = { id, name: name.trim(), type, value: 0, max: dotCount, text: '' }
    else if (type === 'track')    field = { id, name: name.trim(), type, value: 0, max: boxCount, text: '' }
    else                          field = { id, name: name.trim(), type: 'text', value: 0, max: 0, text: '' }
    store.addField(charId, field)
    onClose()
  }

  return (
    <div className="absolute inset-0 bg-black/70 flex items-end z-50" onClick={onClose}>
      <div className="modal-sheet bg-stone-900 w-full rounded-t-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <h3 className="text-stone-100 font-bold flex-1">Add Field</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-200"><X size={20} /></button>
        </div>
        <div>
          <label className="section-title block">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Field name…" autoFocus />
        </div>
        <div>
          <label className="section-title block">Type</label>
          <div className="grid grid-cols-5 gap-1.5">
            {FIELD_TYPES.map(({ type: t, label, desc }) => (
              <button key={t} onClick={() => setType(t)}
                className={`flex flex-col items-center py-2 px-1 rounded-lg border text-xs touch-manipulation ${
                  type === t ? 'bg-amber-900/40 border-amber-600 text-amber-400' : 'bg-stone-800 border-stone-700 text-stone-400'}`}>
                <span className="text-base mb-0.5">{label}</span><span>{desc}</span>
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
                    dotCount === n ? 'bg-amber-900/40 border-amber-600 text-amber-400' : 'bg-stone-800 border-stone-700 text-stone-400'}`}>{n}</button>
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
                    boxCount === n ? 'bg-amber-900/40 border-amber-600 text-amber-400' : 'bg-stone-800 border-stone-700 text-stone-400'}`}>{n}</button>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={add} disabled={!name.trim()} className="btn-primary flex-1 disabled:opacity-40">Add Field</button>
        </div>
      </div>
    </div>
  )
}

function EditFieldModal({ field, charId, onClose }: { field: CharacterField; charId: string; onClose: () => void }) {
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
      <div className="modal-sheet bg-stone-900 w-full rounded-t-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <h3 className="text-stone-100 font-bold flex-1">Edit Field</h3>
          <span className="text-xs text-stone-500 bg-stone-800 px-2 py-0.5 rounded capitalize">{field.type}</span>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-200"><X size={20} /></button>
        </div>
        <div>
          <label className="section-title block">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        {field.type === 'number'   && <div><label className="section-title block">Max (0 = no limit)</label><input className="input" type="number" min={0} value={maxVal} onChange={(e) => setMaxVal(Number(e.target.value))} /></div>}
        {field.type === 'resource' && <div><label className="section-title block">Max Value</label><input className="input" type="number" min={1} value={maxVal} onChange={(e) => setMaxVal(Number(e.target.value))} /></div>}
        {field.type === 'dots'     && <div><label className="section-title block">Max Dots</label><input className="input" type="number" min={1} max={10} value={maxVal} onChange={(e) => setMaxVal(Number(e.target.value))} /></div>}
        {field.type === 'track'    && <div><label className="section-title block">Number of Boxes</label><input className="input" type="number" min={1} max={20} value={maxVal} onChange={(e) => setMaxVal(Number(e.target.value))} /></div>}
        <div className="flex items-center gap-2">
          <button onClick={() => { store.moveField(charId, field.id, 'up'); onClose() }} className="btn-secondary px-3 py-2 text-sm" title="Move up">↑</button>
          <button onClick={() => { store.moveField(charId, field.id, 'down'); onClose() }} className="btn-secondary px-3 py-2 text-sm" title="Move down">↓</button>
          <div className="flex-1" />
          <button onClick={save} className="btn-primary px-5">Save</button>
          <button onClick={() => { store.removeField(charId, field.id); onClose() }} className="btn-danger px-3 py-2"><Trash2 size={16} /></button>
        </div>
      </div>
    </div>
  )
}

// ── Skill widgets ─────────────────────────────────────────────────────────────

function SkillWidget({ skill, charId }: { skill: Skill; charId: string }) {
  const store = useCharacterStore()
  const type = skill.skillType ?? 'dots'
  const maxDots = skill.max ?? 5

  if (type === 'dots') return (
    <div className="flex gap-1 flex-wrap">
      {Array.from({ length: maxDots }, (_, i) => (
        <button key={i} onClick={() => store.updateSkill(charId, skill.id, { rank: skill.rank === i + 1 ? 0 : i + 1 })}
          className={`w-4 h-4 rounded-full border transition-all touch-manipulation ${
            i < skill.rank ? 'bg-amber-500 border-amber-600' : 'bg-stone-700 border-stone-600'}`} />
      ))}
    </div>
  )

  if (type === 'number') return (
    <div className="flex items-center gap-1">
      <button onClick={() => store.updateSkill(charId, skill.id, { rank: Math.max(0, skill.rank - 1) })}
        className="w-7 h-7 rounded bg-stone-700 text-stone-200 font-bold touch-manipulation">−</button>
      <span className="font-mono font-bold text-stone-100 w-9 text-center">{skill.rank}</span>
      <button onClick={() => store.updateSkill(charId, skill.id, { rank: (skill.max ?? 0) > 0 ? Math.min(skill.max!, skill.rank + 1) : skill.rank + 1 })}
        className="w-7 h-7 rounded bg-stone-700 text-stone-200 font-bold touch-manipulation">+</button>
      {(skill.max ?? 0) > 0 && <span className="text-stone-600 text-xs">/{skill.max}</span>}
    </div>
  )

  if (type === 'checkbox') return (
    <button onClick={() => store.updateSkill(charId, skill.id, { rank: skill.rank ? 0 : 1 })}
      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all touch-manipulation ${
        skill.rank ? 'bg-amber-500 border-amber-600' : 'bg-stone-700 border-stone-600'}`}>
      {skill.rank ? <Check size={14} className="text-stone-900" /> : null}
    </button>
  )

  return null
}

// ── Skill modals ──────────────────────────────────────────────────────────────

function AddSkillModal({ charId, onClose }: { charId: string; onClose: () => void }) {
  const store = useCharacterStore()
  const [name, setName] = useState('')
  const [skillType, setSkillType] = useState<SkillType>('dots')
  const [maxDots, setMaxDots] = useState(5)
  const [maxNum, setMaxNum] = useState(0)
  const [note, setNote] = useState('')

  const add = () => {
    if (!name.trim()) return
    store.addSkill(charId, {
      id: crypto.randomUUID(),
      name: name.trim(),
      rank: 0,
      skillType,
      max: skillType === 'dots' ? maxDots : skillType === 'number' ? maxNum : undefined,
      note: note.trim() || undefined,
    })
    onClose()
  }

  return (
    <div className="absolute inset-0 bg-black/70 flex items-end z-50" onClick={onClose}>
      <div className="modal-sheet bg-stone-900 w-full rounded-t-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <h3 className="text-stone-100 font-bold flex-1">Add Skill</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-200"><X size={20} /></button>
        </div>
        <div>
          <label className="section-title block">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Skill name…" autoFocus />
        </div>
        <div>
          <label className="section-title block">Type</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { t: 'dots',     label: '●●●', desc: 'Dots'     },
              { t: 'number',   label: '#',   desc: 'Number'   },
              { t: 'checkbox', label: '☑',   desc: 'Have / Not' },
            ] as { t: SkillType; label: string; desc: string }[]).map(({ t, label, desc }) => (
              <button key={t} onClick={() => setSkillType(t)}
                className={`flex flex-col items-center py-2.5 rounded-lg border text-xs touch-manipulation ${
                  skillType === t ? 'bg-amber-900/40 border-amber-600 text-amber-400' : 'bg-stone-800 border-stone-700 text-stone-400'}`}>
                <span className="text-lg mb-0.5">{label}</span><span>{desc}</span>
              </button>
            ))}
          </div>
        </div>
        {skillType === 'dots' && (
          <div>
            <label className="section-title block">Max Dots</label>
            <div className="flex gap-2 flex-wrap">
              {[3, 5, 6, 10].map((n) => (
                <button key={n} onClick={() => setMaxDots(n)}
                  className={`px-3 py-1.5 rounded-lg border text-sm touch-manipulation ${
                    maxDots === n ? 'bg-amber-900/40 border-amber-600 text-amber-400' : 'bg-stone-800 border-stone-700 text-stone-400'}`}>{n}</button>
              ))}
            </div>
          </div>
        )}
        {skillType === 'number' && (
          <div>
            <label className="section-title block">Max (0 = no limit)</label>
            <input className="input" type="number" min={0} value={maxNum} onChange={(e) => setMaxNum(Number(e.target.value))} />
          </div>
        )}
        <div>
          <label className="section-title block">Description (optional)</label>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Linked attribute, notes…" />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={add} disabled={!name.trim()} className="btn-primary flex-1 disabled:opacity-40">Add</button>
        </div>
      </div>
    </div>
  )
}

function EditSkillModal({ skill, charId, onClose }: { skill: Skill; charId: string; onClose: () => void }) {
  const store = useCharacterStore()
  const [name, setName] = useState(skill.name)
  const [maxVal, setMaxVal] = useState(skill.max ?? (skill.skillType === 'number' ? 0 : 5))
  const [note, setNote] = useState(skill.note ?? '')
  const type = skill.skillType ?? 'dots'

  const save = () => {
    store.updateSkill(charId, skill.id, { name: name.trim() || skill.name, max: maxVal, note: note.trim() || undefined })
    onClose()
  }

  return (
    <div className="absolute inset-0 bg-black/70 flex items-end z-50" onClick={onClose}>
      <div className="modal-sheet bg-stone-900 w-full rounded-t-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <h3 className="text-stone-100 font-bold flex-1">Edit Skill</h3>
          <span className="text-xs text-stone-500 bg-stone-800 px-2 py-0.5 rounded capitalize">{type}</span>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-200"><X size={20} /></button>
        </div>
        <div>
          <label className="section-title block">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        {(type === 'dots' || type === 'number') && (
          <div>
            <label className="section-title block">{type === 'number' ? 'Max (0 = no limit)' : 'Max Dots'}</label>
            <input className="input" type="number" min={type === 'dots' ? 1 : 0} value={maxVal} onChange={(e) => setMaxVal(Number(e.target.value))} />
          </div>
        )}
        <div>
          <label className="section-title block">Description (optional)</label>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Linked attribute, notes…" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1" />
          <button onClick={save} className="btn-primary px-5">Save</button>
          <button onClick={() => { store.removeSkill(charId, skill.id); onClose() }} className="btn-danger px-3 py-2"><Trash2 size={16} /></button>
        </div>
      </div>
    </div>
  )
}

// ── Inventory modals ──────────────────────────────────────────────────────────

function ItemFormModal({
  initial,
  title,
  onSave,
  onDelete,
  onClose,
}: {
  initial?: Partial<InventoryItem>
  title: string
  onSave: (data: Omit<InventoryItem, 'id'>) => void
  onDelete?: () => void
  onClose: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [qty, setQty] = useState(initial?.quantity ?? 1)
  const [category, setCategory] = useState(initial?.category ?? '')
  const [note, setNote] = useState(initial?.note ?? '')

  const save = () => {
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      quantity: qty,
      category: category.trim() || undefined,
      note: note.trim() || undefined,
      equipped: initial?.equipped,
    })
  }

  return (
    <div className="absolute inset-0 bg-black/70 flex items-end z-50" onClick={onClose}>
      <div className="modal-sheet bg-stone-900 w-full rounded-t-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <h3 className="text-stone-100 font-bold flex-1">{title}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-200"><X size={20} /></button>
        </div>
        <div>
          <label className="section-title block">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name…" autoFocus />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="section-title block">Quantity</label>
            <input className="input" type="number" min={0} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
          </div>
          <div className="flex-1">
            <label className="section-title block">Category</label>
            <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="weapon, gear…" />
          </div>
        </div>
        <div>
          <label className="section-title block">Note</label>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Description or stats…" />
        </div>
        <div className="flex items-center gap-2">
          {onDelete && (
            <button onClick={onDelete} className="btn-danger px-3 py-2"><Trash2 size={16} /></button>
          )}
          <div className="flex-1" />
          <button onClick={onClose} className="btn-secondary px-4">Cancel</button>
          <button onClick={save} disabled={!name.trim()} className="btn-primary px-5 disabled:opacity-40">Save</button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CharacterPage() {
  const store = useCharacterStore()
  const char = store.activeCharacter()
  const [tab, setTab] = useState<Tab>('stats')
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(char.name)
  const [showConditions, setShowConditions] = useState(false)
  const [customCondition, setCustomCondition] = useState('')
  const [showCharList, setShowCharList] = useState(false)

  // field modals
  const [showAddField, setShowAddField] = useState(false)
  const [editingField, setEditingField] = useState<CharacterField | null>(null)

  // skill modals
  const [showAddSkill, setShowAddSkill] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)

  // inventory modals
  const [showAddItem, setShowAddItem] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const primaryResource = (char.fields ?? []).find((f) => f.type === 'resource')
  const resourcePct = primaryResource && primaryResource.max > 0
    ? primaryResource.value / primaryResource.max : 0
  const resourceColor = resourcePct > 0.5 ? '#22c55e' : resourcePct > 0.25 ? '#f59e0b' : '#ef4444'

  const itemCategories = useMemo(() => {
    const cats = new Set(char.inventory.map((i) => i.category).filter(Boolean) as string[])
    return Array.from(cats)
  }, [char.inventory])

  const filteredInventory = activeCategory
    ? char.inventory.filter((i) => i.category === activeCategory)
    : char.inventory

  return (
    <div className="flex flex-col h-full relative">
      <TopBar
        title={char.name}
        subtitle={char.concept || 'Solo Adventurer'}
        left={
          <button
            onClick={() => setShowCharList((s) => !s)}
            className="flex items-center gap-1 text-stone-400 hover:text-stone-200 bg-stone-800 px-2 py-1.5 rounded-lg touch-manipulation"
            title="Switch character"
          >
            <ChevronDown size={15} className={`transition-transform duration-200 ${showCharList ? 'rotate-180' : ''}`} />
          </button>
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
              <button onClick={() => { store.setActiveCharacter(c.id); setShowCharList(false) }}
                className={`flex-1 text-left text-sm px-3 py-2 rounded-lg ${
                  c.id === char.id ? 'bg-amber-900/40 text-amber-400' : 'text-stone-300 hover:bg-stone-800'}`}>
                {c.name}
              </button>
              {store.characters.length > 1 && (
                <button onClick={() => store.deleteCharacter(c.id)} className="p-1 text-stone-500 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          <button onClick={() => { store.addCharacter('New Hero'); setShowCharList(false) }}
            className="flex items-center gap-1 text-sm text-amber-500">
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
              <div className="h-full rounded-full transition-all duration-300"
                style={{ width: `${resourcePct * 100}%`, backgroundColor: resourceColor }} />
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => store.updateField(char.id, primaryResource.id, { value: Math.max(0, primaryResource.value - 1) })}
                className="w-8 h-8 rounded bg-stone-700 text-stone-200 font-bold text-lg leading-none touch-manipulation">−</button>
              <span className="font-mono text-sm font-bold text-stone-100 min-w-[52px] text-center">
                {primaryResource.value}/{primaryResource.max}
              </span>
              <button onClick={() => store.updateField(char.id, primaryResource.id, { value: Math.min(primaryResource.max, primaryResource.value + 1) })}
                className="w-8 h-8 rounded bg-stone-700 text-stone-200 font-bold text-lg leading-none touch-manipulation">+</button>
            </div>
          </div>

          {char.conditions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {char.conditions.map((c) => (
                <button key={c} onClick={() => store.removeCondition(char.id, c)}
                  className="text-xs bg-red-900/40 text-red-300 border border-red-800/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  {c} <X size={10} />
                </button>
              ))}
            </div>
          )}

          <button onClick={() => setShowConditions((s) => !s)}
            className="text-xs text-stone-500 hover:text-stone-300 mt-1.5 flex items-center gap-1">
            <Plus size={11} /> Add Condition
          </button>

          {showConditions && (
            <div className="mt-2 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {CONDITIONS.filter((c) => !char.conditions.includes(c)).map((c) => (
                  <button key={c} onClick={() => { store.addCondition(char.id, c); setShowConditions(false) }}
                    className="text-xs bg-stone-800 text-stone-300 border border-stone-700 px-2 py-0.5 rounded-full hover:border-red-700 hover:text-red-300">
                    {c}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className="input text-xs py-1 flex-1"
                  placeholder="Custom condition…"
                  value={customCondition}
                  onChange={(e) => setCustomCondition(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customCondition.trim() && !char.conditions.includes(customCondition.trim())) {
                      store.addCondition(char.id, customCondition.trim())
                      setCustomCondition('')
                      setShowConditions(false)
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const v = customCondition.trim()
                    if (v && !char.conditions.includes(v)) {
                      store.addCondition(char.id, v)
                      setCustomCondition('')
                      setShowConditions(false)
                    }
                  }}
                  disabled={!customCondition.trim()}
                  className="btn-primary text-xs py-1 px-3 disabled:opacity-40"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex-none flex border-b border-stone-800 bg-stone-950">
        {(['stats', 'skills', 'inventory', 'notes'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-colors capitalize ${
              tab === t ? 'text-amber-500 border-b-2 border-amber-500' : 'text-stone-500 hover:text-stone-300'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">

        {/* ── Stats ── */}
        {tab === 'stats' && (
          <div className="space-y-4">
            <div className="card space-y-3">
              <div className="flex items-center gap-2">
                {editingName ? (
                  <>
                    <input className="input flex-1 text-sm" value={nameInput} onChange={(e) => setNameInput(e.target.value)} autoFocus />
                    <button onClick={() => { store.updateCharacter(char.id, { name: nameInput.trim() || char.name }); setEditingName(false) }}
                      className="p-1.5 text-amber-500"><Check size={16} /></button>
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
                <input className="input text-sm" value={char.concept}
                  onChange={(e) => store.updateCharacter(char.id, { concept: e.target.value })} placeholder="A lone wanderer…" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="section-title block">System</label>
                  <input className="input text-sm" value={char.system}
                    onChange={(e) => store.updateCharacter(char.id, { system: e.target.value })} placeholder="OSR, PbtA…" />
                </div>
                <div className="flex-1">
                  <label className="section-title block">XP</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => store.updateCharacter(char.id, { xp: Math.max(0, char.xp - 1) })} className="w-7 h-7 rounded bg-stone-700 text-stone-200 font-bold">−</button>
                    <input
                      type="number"
                      className="input w-16 text-center font-mono font-bold text-amber-400 py-1 px-1"
                      value={char.xp}
                      min={0}
                      onChange={(e) => store.updateCharacter(char.id, { xp: Math.max(0, parseInt(e.target.value) || 0) })}
                    />
                    <button onClick={() => store.updateCharacter(char.id, { xp: char.xp + 1 })} className="w-7 h-7 rounded bg-stone-700 text-stone-200 font-bold">+</button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="section-title mb-0">Fields</p>
                <button onClick={() => setShowAddField(true)} className="text-amber-500 text-sm flex items-center gap-1">
                  <Plus size={14} /> Add
                </button>
              </div>
              {(char.fields ?? []).length === 0 && (
                <p className="text-stone-600 text-sm text-center py-8">No fields yet. Add stats, resources, tracks and more.</p>
              )}
              <div className="space-y-2">
                {(char.fields ?? []).map((field) => (
                  <div key={field.id} className="card py-2 px-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-stone-500 mb-1.5 uppercase tracking-wide">{field.name}</p>
                        <FieldWidget field={field} charId={char.id} />
                      </div>
                      <button onClick={() => setEditingField(field)}
                        className="p-1.5 text-stone-600 hover:text-stone-300 flex-none mt-0.5 touch-manipulation">
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
              <button onClick={() => setShowAddSkill(true)} className="text-amber-500 text-sm flex items-center gap-1">
                <Plus size={14} /> Add
              </button>
            </div>

            {char.skills.length === 0 && (
              <p className="text-stone-600 text-sm text-center py-8">No skills yet. Tap Add to create one.</p>
            )}

            <div className="space-y-2">
              {char.skills.map((sk) => (
                <div key={sk.id} className="card py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-stone-200 text-sm">{sk.name}</p>
                      {sk.note && <p className="text-xs text-stone-500 mt-0.5">{sk.note}</p>}
                    </div>
                    <SkillWidget skill={sk} charId={char.id} />
                    <button onClick={() => setEditingSkill(sk)} className="p-1.5 text-stone-600 hover:text-stone-300 touch-manipulation">
                      <Edit2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Inventory ── */}
        {tab === 'inventory' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="section-title mb-0">Inventory ({char.inventory.length})</p>
              <button onClick={() => setShowAddItem(true)} className="text-amber-500 text-sm flex items-center gap-1">
                <Plus size={14} /> Add
              </button>
            </div>

            {/* Category filter */}
            {itemCategories.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                <button onClick={() => setActiveCategory(null)}
                  className={`text-xs px-3 py-1 rounded-full flex-none border transition-colors ${
                    activeCategory === null ? 'bg-amber-900/40 text-amber-400 border-amber-700/60' : 'text-stone-500 border-stone-700'}`}>
                  All
                </button>
                {itemCategories.map((cat) => (
                  <button key={cat} onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                    className={`text-xs px-3 py-1 rounded-full flex-none border transition-colors capitalize ${
                      activeCategory === cat ? 'bg-amber-900/40 text-amber-400 border-amber-700/60' : 'text-stone-500 border-stone-700'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {filteredInventory.length === 0 && (
              <p className="text-stone-600 text-sm text-center py-8">
                {char.inventory.length === 0 ? 'Empty pack. Tap Add to add items.' : 'No items in this category.'}
              </p>
            )}

            <div className="space-y-2">
              {filteredInventory.map((item) => (
                <div key={item.id} className={`card ${item.equipped ? 'border-amber-800/50' : ''}`}>
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-medium ${item.equipped ? 'text-amber-300' : 'text-stone-200'}`}>
                          {item.name}
                        </span>
                        {item.equipped && <span className="text-xs bg-amber-900/40 text-amber-500 px-1.5 py-0.5 rounded">Equipped</span>}
                        {item.category && (
                          <span className="text-xs bg-stone-700 text-stone-400 px-1.5 py-0.5 rounded capitalize">{item.category}</span>
                        )}
                      </div>
                      {item.note && <p className="text-xs text-stone-500 mt-0.5">{item.note}</p>}
                    </div>
                    <button onClick={() => setEditingItem(item)}
                      className="p-1.5 text-stone-600 hover:text-stone-300 flex-none touch-manipulation">
                      <Edit2 size={13} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => store.updateItem(char.id, item.id, { quantity: Math.max(0, item.quantity - 1) })}
                        className="w-6 h-6 rounded bg-stone-700 text-stone-300 text-sm font-bold touch-manipulation">−</button>
                      <span className="w-8 text-center font-mono text-sm text-stone-200">{item.quantity}</span>
                      <button onClick={() => store.updateItem(char.id, item.id, { quantity: item.quantity + 1 })}
                        className="w-6 h-6 rounded bg-stone-700 text-stone-300 text-sm font-bold touch-manipulation">+</button>
                    </div>
                    <button onClick={() => store.updateItem(char.id, item.id, { equipped: !item.equipped })}
                      className={`text-xs px-2 py-1 rounded touch-manipulation ${item.equipped ? 'bg-amber-900/40 text-amber-400' : 'bg-stone-700 text-stone-400'}`}>
                      {item.equipped ? '⚔ Unequip' : 'Equip'}
                    </button>
                    <button onClick={() => store.removeItem(char.id, item.id)}
                      className="ml-auto text-stone-600 hover:text-red-400 touch-manipulation">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Notes ── */}
        {tab === 'notes' && (
          <div className="space-y-3">
            <p className="section-title">Character Notes</p>
            <textarea className="textarea w-full" rows={18}
              placeholder="Backstory, personality, goals, secrets…"
              value={char.notes}
              onChange={(e) => store.updateCharacter(char.id, { notes: e.target.value })} />
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddField  && <AddFieldModal charId={char.id} onClose={() => setShowAddField(false)} />}
      {editingField  && <EditFieldModal field={editingField} charId={char.id} onClose={() => setEditingField(null)} />}
      {showAddSkill  && <AddSkillModal charId={char.id} onClose={() => setShowAddSkill(false)} />}
      {editingSkill  && <EditSkillModal skill={editingSkill} charId={char.id} onClose={() => setEditingSkill(null)} />}
      {showAddItem   && (
        <ItemFormModal
          title="Add Item"
          onSave={(data) => { store.addItem(char.id, { id: crypto.randomUUID(), ...data }); setShowAddItem(false) }}
          onClose={() => setShowAddItem(false)}
        />
      )}
      {editingItem   && (
        <ItemFormModal
          title="Edit Item"
          initial={editingItem}
          onSave={(data) => { store.updateItem(char.id, editingItem.id, data); setEditingItem(null) }}
          onDelete={() => { store.removeItem(char.id, editingItem.id); setEditingItem(null) }}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  )
}
