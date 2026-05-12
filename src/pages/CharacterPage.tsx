import { useState } from 'react'
import TopBar from '../components/layout/TopBar'
import { useCharacterStore } from '../store/characterStore'
import type { Skill, InventoryItem, Attribute } from '../types'
import { Plus, Trash2, X, Edit2, Check } from 'lucide-react'

type Tab = 'stats' | 'skills' | 'inventory' | 'notes'

const CONDITIONS = [
  'Exhausted', 'Poisoned', 'Bleeding', 'Stunned', 'Frightened',
  'Blinded', 'Deafened', 'Charmed', 'Paralyzed', 'Unconscious',
]

function SkillDots({ rank, onChange }: { rank: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          onClick={() => onChange(rank === i ? 0 : i)}
          className={`w-4 h-4 rounded-full border transition-all ${
            i <= rank
              ? 'bg-amber-500 border-amber-600'
              : 'bg-stone-700 border-stone-600'
          }`}
        />
      ))}
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
  const [newAttrName, setNewAttrName] = useState('')
  const [newAttrVal, setNewAttrVal] = useState(10)
  const [showNewSkill, setShowNewSkill] = useState(false)
  const [showNewItem, setShowNewItem] = useState(false)
  const [showNewAttr, setShowNewAttr] = useState(false)
  const [showCharList, setShowCharList] = useState(false)

  const hpPercent = char.maxHp > 0 ? char.hp / char.maxHp : 0
  const hpColor = hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#f59e0b' : '#ef4444'

  const addSkill = () => {
    if (!newSkillName.trim()) return
    const skill: Skill = { id: crypto.randomUUID(), name: newSkillName.trim(), rank: 1 }
    store.addSkill(char.id, skill)
    setNewSkillName('')
    setShowNewSkill(false)
  }

  const addItem = () => {
    if (!newItemName.trim()) return
    const item: InventoryItem = {
      id: crypto.randomUUID(),
      name: newItemName.trim(),
      quantity: newItemQty,
    }
    store.addItem(char.id, item)
    setNewItemName('')
    setNewItemQty(1)
    setShowNewItem(false)
  }

  const addAttr = () => {
    if (!newAttrName.trim()) return
    const attr: Attribute = {
      id: crypto.randomUUID(),
      name: newAttrName.trim(),
      value: newAttrVal,
      max: 20,
    }
    store.addAttribute(char.id, attr)
    setNewAttrName('')
    setNewAttrVal(10)
    setShowNewAttr(false)
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title={char.name}
        subtitle={char.concept || 'Solo Adventurer'}
        left={
          <button
            onClick={() => setShowCharList((s) => !s)}
            className="text-stone-400 hover:text-stone-200 text-xs bg-stone-800 px-2 py-1 rounded"
          >
            ▾
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
              <button
                onClick={() => { store.setActiveCharacter(c.id); setShowCharList(false) }}
                className={`flex-1 text-left text-sm px-3 py-2 rounded-lg ${
                  c.id === char.id ? 'bg-amber-900/40 text-amber-400' : 'text-stone-300 hover:bg-stone-800'
                }`}
              >
                {c.name}
              </button>
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

      {/* HP Bar */}
      <div className="flex-none bg-stone-900 border-b border-stone-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold w-6">HP</span>
          <div className="flex-1 bg-stone-800 rounded-full h-4 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${hpPercent * 100}%`, backgroundColor: hpColor }}
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => store.adjustHp(char.id, -1)}
              className="w-8 h-8 rounded bg-stone-700 text-stone-200 font-bold text-lg leading-none"
            >−</button>
            <span className="font-mono text-sm font-bold text-stone-100 min-w-[50px] text-center">
              {char.hp}/{char.maxHp}
            </span>
            <button
              onClick={() => store.adjustHp(char.id, 1)}
              className="w-8 h-8 rounded bg-stone-700 text-stone-200 font-bold text-lg leading-none"
            >+</button>
          </div>
        </div>

        {/* Conditions */}
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

      {/* Tabs */}
      <div className="flex-none flex border-b border-stone-800 bg-stone-950">
        {(['stats', 'skills', 'inventory', 'notes'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-colors capitalize ${
              tab === t
                ? 'text-amber-500 border-b-2 border-amber-500'
                : 'text-stone-500 hover:text-stone-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* ── Stats ── */}
        {tab === 'stats' && (
          <div className="space-y-4">
            {/* Name / Concept edit */}
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
                    >
                      <Check size={16} />
                    </button>
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
                  <label className="section-title block">Max HP</label>
                  <input
                    className="input text-sm"
                    type="number"
                    min={1}
                    value={char.maxHp}
                    onChange={(e) => store.updateCharacter(char.id, { maxHp: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex gap-3">
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

            {/* Attributes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="section-title mb-0">Attributes</p>
                <button onClick={() => setShowNewAttr((s) => !s)} className="text-amber-500 text-sm flex items-center gap-1">
                  <Plus size={14} /> Add
                </button>
              </div>

              {showNewAttr && (
                <div className="card mb-3 flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="section-title block">Name</label>
                    <input className="input text-sm" value={newAttrName} onChange={(e) => setNewAttrName(e.target.value)} placeholder="Luck" />
                  </div>
                  <div className="w-20">
                    <label className="section-title block">Value</label>
                    <input className="input text-sm" type="number" value={newAttrVal} onChange={(e) => setNewAttrVal(Number(e.target.value))} />
                  </div>
                  <button onClick={addAttr} className="btn-primary px-3 py-2 text-sm">Add</button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {char.attributes.map((attr) => (
                  <div key={attr.id} className="card flex items-center gap-2 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-stone-500 truncate">{attr.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <button
                          onClick={() => store.setAttribute(char.id, attr.id, attr.value - 1)}
                          className="w-6 h-6 rounded bg-stone-700 text-stone-300 text-sm font-bold leading-none"
                        >−</button>
                        <span className="font-bold text-stone-100 font-mono w-8 text-center text-lg">
                          {attr.value}
                        </span>
                        <button
                          onClick={() => store.setAttribute(char.id, attr.id, attr.value + 1)}
                          className="w-6 h-6 rounded bg-stone-700 text-stone-300 text-sm font-bold leading-none"
                        >+</button>
                      </div>
                      {attr.max && (
                        <p className="text-xs text-stone-600">max {attr.max}</p>
                      )}
                    </div>
                    <button
                      onClick={() => store.removeAttribute(char.id, attr.id)}
                      className="p-1 text-stone-600 hover:text-red-400"
                    >
                      <X size={12} />
                    </button>
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
                  <SkillDots
                    rank={sk.rank}
                    onChange={(n) => store.updateSkill(char.id, sk.id, { rank: n })}
                  />
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
                    <button
                      onClick={() => store.updateItem(char.id, item.id, { quantity: Math.max(0, item.quantity - 1) })}
                      className="w-6 h-6 rounded bg-stone-700 text-stone-300 text-sm font-bold"
                    >−</button>
                    <span className="w-8 text-center font-mono text-sm text-stone-200">{item.quantity}</span>
                    <button
                      onClick={() => store.updateItem(char.id, item.id, { quantity: item.quantity + 1 })}
                      className="w-6 h-6 rounded bg-stone-700 text-stone-300 text-sm font-bold"
                    >+</button>
                  </div>
                  <button
                    onClick={() => store.updateItem(char.id, item.id, { equipped: !item.equipped })}
                    className={`text-xs px-2 py-1 rounded ${item.equipped ? 'bg-amber-900/40 text-amber-400' : 'bg-stone-700 text-stone-400'}`}
                  >
                    {item.equipped ? '⚔' : 'Eq'}
                  </button>
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
    </div>
  )
}
