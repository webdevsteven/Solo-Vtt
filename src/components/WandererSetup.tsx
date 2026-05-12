import { useState } from 'react'
import { X, ChevronRight, ChevronLeft, Sword, Check } from 'lucide-react'
import { useCharacterStore } from '../store/characterStore'
import { useJournalStore } from '../store/journalStore'

interface Props {
  onClose: () => void
}

const SKILLS = ['Swords', 'Bows', 'Stealth', 'Arcana', 'Athletics', 'Persuasion', 'Survival', 'Locks']

const GEAR_OPTIONS = [
  { name: 'Sword', note: 'Standard weapon (3 dmg)', quantity: 1 },
  { name: 'Dagger', note: 'Light weapon (2 dmg)', quantity: 1 },
  { name: 'Short Bow', note: 'Light ranged (2 dmg)', quantity: 1 },
  { name: 'Shield', note: '+1 to defend rolls', quantity: 1 },
  { name: 'Leather Armour', note: 'Reduce damage by 1', quantity: 1 },
  { name: 'Rope', note: '50 ft.', quantity: 1 },
  { name: 'Torch', note: '', quantity: 3 },
  { name: 'Rations', note: '1 day each', quantity: 3 },
  { name: 'Healing Potion', note: 'Restore 2d4+2 HP', quantity: 1 },
  { name: 'Lockpicks', note: 'Needed for Locks skill', quantity: 1 },
]

const RULES_BODY = `CORE ROLL: 2d6 + Attribute vs Difficulty
Easy 7  |  Moderate 10  |  Hard 13  |  Extreme 16

Full Success — beat the target
Partial (miss by 1–2) — succeed, but with a cost
Failure (miss by 3+) — something goes wrong

── ATTRIBUTES ──────────────────
BRAWN  Melee, strength, endurance
EDGE   Speed, stealth, ranged, dodge
WITS   Magic, perception, trickery
GRIT   Toughness, willpower, survival

HP = BRAWN + GRIT + 4

── ORACLE ──────────────────────
Before each scene: Roll 2d6 vs Chaos.
If ≤ Chaos → scene is altered (ask oracle).
Partial success → ask "Do I avoid the cost?" (Fifty-Fifty).
Chaos rises when things go badly; falls when you achieve a goal.

── ADVANCEMENT ─────────────────
1 XP per completed scene (log in journal)
2 XP → skill rank +1 (max 5)
4 XP → attribute +1 (max 6)
6 XP → Special Ability (roll the table)`

const COMBAT_BODY = `1. INITIATIVE
   Both roll 2d6 + EDGE. Highest acts first.

2. ATTACK
   2d6 + BRAWN (melee) or EDGE (ranged)
   vs Enemy Defense:
   Weak=7 · Tough=10 · Dangerous=13 · Boss=16

3. DAMAGE ON HIT
   Unarmed 1 · Light 2 · Standard 3 · Heavy 4
   Partial hit → deal damage, but take 1 back

4. ENEMY ATTACKS (each round)
   Weak d4 · Tough d6 · Dangerous d8 · Boss d10

5. DEFEND
   Roll 2d6 + EDGE vs enemy attack roll
   Beat it → full dodge
   Partial (miss by 1–2) → halve damage

6. AT 0 HP
   Roll GRIT vs 10
   Success → Wounded but alive (gain Wounded condition)
   Failure → roll the Injury table`

type Step = 'character' | 'skills' | 'gear' | 'done'

interface Attrs {
  brawn: number
  edge: number
  wits: number
  grit: number
}

export default function WandererSetup({ onClose }: Props) {
  const charStore = useCharacterStore()
  const journalStore = useJournalStore()

  const [step, setStep] = useState<Step>('character')
  const [name, setName] = useState('')
  const [concept, setConcept] = useState('')
  const [attrs, setAttrs] = useState<Attrs>({ brawn: 2, edge: 2, wits: 2, grit: 2 })
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [selectedGear, setSelectedGear] = useState<string[]>([])

  const hp = attrs.brawn + attrs.grit + 4
  const attrTotal = attrs.brawn + attrs.edge + attrs.wits + attrs.grit
  const pointsLeft = 10 - attrTotal

  const setAttr = (key: keyof Attrs, delta: number) => {
    setAttrs((a) => {
      const next = a[key] + delta
      if (next < 1 || next > 4) return a
      const newTotal = attrTotal - a[key] + next
      if (newTotal > 10) return a
      return { ...a, [key]: next }
    })
  }

  const toggleSkill = (s: string) => {
    setSelectedSkills((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : prev.length < 2 ? [...prev, s] : prev,
    )
  }

  const toggleGear = (g: string) => {
    setSelectedGear((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : prev.length < 3 ? [...prev, g] : prev,
    )
  }

  const finish = () => {
    const charName = name.trim() || 'The Wanderer'

    // Create character
    charStore.addCharacter(charName)
    const newChar = useCharacterStore.getState().characters.find(
      (c) => c.name === charName,
    )!
    const id = newChar.id

    // Set concept, system, HP
    charStore.updateCharacter(id, {
      concept: concept.trim() || 'A lone wanderer without roots',
      system: 'Wanderer',
      hp,
      maxHp: hp,
    })

    // Remove default D&D attributes, add Wanderer ones
    newChar.attributes.forEach((a) => charStore.removeAttribute(id, a.id))
    charStore.addAttribute(id, { id: 'brawn', name: 'BRAWN', value: attrs.brawn, max: 6 })
    charStore.addAttribute(id, { id: 'edge',  name: 'EDGE',  value: attrs.edge,  max: 6 })
    charStore.addAttribute(id, { id: 'wits',  name: 'WITS',  value: attrs.wits,  max: 6 })
    charStore.addAttribute(id, { id: 'grit',  name: 'GRIT',  value: attrs.grit,  max: 6 })

    // Add skills
    selectedSkills.forEach((sk) =>
      charStore.addSkill(id, { id: crypto.randomUUID(), name: sk, rank: 1 }),
    )

    // Add gear
    selectedGear.forEach((gName) => {
      const opt = GEAR_OPTIONS.find((g) => g.name === gName)!
      charStore.addItem(id, {
        id: crypto.randomUUID(),
        name: opt.name,
        quantity: opt.quantity,
        note: opt.note || undefined,
      })
    })

    // Set as active character
    charStore.setActiveCharacter(id)

    // Add pinned journal entries
    const rulesEntry = journalStore.addEntry('Wanderer: Rules Reference', RULES_BODY, 'session')
    journalStore.togglePin(rulesEntry.id)
    const combatEntry = journalStore.addEntry('Wanderer: Combat Quick-Ref', COMBAT_BODY, 'session')
    journalStore.togglePin(combatEntry.id)

    setStep('done')
  }

  return (
    <div className="absolute inset-0 bg-black/80 flex items-end z-[70]" onClick={onClose}>
      <div
        className="bg-stone-900 w-full rounded-t-2xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-stone-700 flex-none">
          <Sword size={20} className="text-amber-500" />
          <div className="flex-1">
            <h2 className="text-stone-100 font-bold text-base font-display">New Wanderer Game</h2>
            <p className="text-stone-500 text-xs">
              {step === 'character' && 'Step 1 of 3 — Your Hero'}
              {step === 'skills'    && 'Step 2 of 3 — Starting Skills (pick 2)'}
              {step === 'gear'      && 'Step 3 of 3 — Starting Gear (pick 3)'}
              {step === 'done'      && 'Ready to wander'}
            </p>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-300">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* ── Step 1: Character ── */}
          {step === 'character' && (
            <div className="space-y-4">
              <div>
                <label className="section-title block">Name</label>
                <input
                  className="input"
                  placeholder="The Wanderer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="section-title block">Concept</label>
                <input
                  className="input"
                  placeholder="A disgraced soldier seeking redemption…"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="section-title mb-0">Attributes</label>
                  <span className={`text-xs font-semibold ${pointsLeft === 0 ? 'text-amber-500' : 'text-stone-400'}`}>
                    {pointsLeft} point{pointsLeft !== 1 ? 's' : ''} left (max 10 total, each 1–4)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(attrs) as [keyof Attrs, number][]).map(([key, val]) => (
                    <div key={key} className="card flex items-center gap-2 py-2">
                      <div className="flex-1">
                        <p className="text-amber-500 text-xs font-bold uppercase">{key}</p>
                        <p className="text-stone-500 text-xs">
                          {key === 'brawn' && 'Strength · Melee'}
                          {key === 'edge'  && 'Speed · Stealth'}
                          {key === 'wits'  && 'Magic · Perception'}
                          {key === 'grit'  && 'Toughness · Will'}
                        </p>
                      </div>
                      <button onClick={() => setAttr(key, -1)} className="w-7 h-7 rounded bg-stone-700 text-stone-200 font-bold text-lg leading-none">−</button>
                      <span className="text-stone-100 font-bold font-mono text-lg w-6 text-center">{val}</span>
                      <button onClick={() => setAttr(key, 1)} className="w-7 h-7 rounded bg-stone-700 text-stone-200 font-bold text-lg leading-none">+</button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 bg-stone-800 rounded-lg px-4 py-2.5 text-center">
                  <span className="text-stone-400 text-sm">Starting HP: </span>
                  <span className="text-amber-400 font-bold font-mono text-lg">{hp}</span>
                  <span className="text-stone-500 text-xs ml-2">(BRAWN {attrs.brawn} + GRIT {attrs.grit} + 4)</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Skills ── */}
          {step === 'skills' && (
            <div className="space-y-3">
              <p className="text-stone-400 text-sm">
                Choose <span className="text-amber-400 font-semibold">2 skills</span> — each starts at rank 1.
                Add the skill rank to relevant rolls.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SKILLS.map((sk) => {
                  const picked = selectedSkills.includes(sk)
                  return (
                    <button
                      key={sk}
                      onClick={() => toggleSkill(sk)}
                      className={`rounded-xl border py-3 px-3 text-sm font-semibold text-left transition-all ${
                        picked
                          ? 'bg-amber-900/40 border-amber-600 text-amber-300'
                          : selectedSkills.length >= 2
                          ? 'bg-stone-800 border-stone-700 text-stone-600 opacity-50'
                          : 'bg-stone-800 border-stone-700 text-stone-300 hover:border-stone-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{sk}</span>
                        {picked && <Check size={14} className="text-amber-400" />}
                      </div>
                      <p className="text-xs font-normal text-stone-500 mt-0.5">
                        {sk === 'Swords'     && 'BRAWN melee rolls'}
                        {sk === 'Bows'       && 'EDGE ranged rolls'}
                        {sk === 'Stealth'    && 'EDGE stealth rolls'}
                        {sk === 'Arcana'     && 'WITS magic rolls'}
                        {sk === 'Athletics'  && 'BRAWN/EDGE physical'}
                        {sk === 'Persuasion' && 'WITS social rolls'}
                        {sk === 'Survival'   && 'GRIT wilderness rolls'}
                        {sk === 'Locks'      && 'EDGE (needs lockpicks)'}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Step 3: Gear ── */}
          {step === 'gear' && (
            <div className="space-y-3">
              <p className="text-stone-400 text-sm">
                Choose <span className="text-amber-400 font-semibold">3 items</span> to start your journey.
              </p>
              <div className="space-y-1.5">
                {GEAR_OPTIONS.map((g) => {
                  const picked = selectedGear.includes(g.name)
                  return (
                    <button
                      key={g.name}
                      onClick={() => toggleGear(g.name)}
                      className={`w-full flex items-center gap-3 rounded-xl border px-4 py-2.5 text-left transition-all ${
                        picked
                          ? 'bg-amber-900/40 border-amber-600'
                          : selectedGear.length >= 3
                          ? 'bg-stone-800 border-stone-700 opacity-50'
                          : 'bg-stone-800 border-stone-700 hover:border-stone-500'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-none ${
                          picked ? 'bg-amber-500 border-amber-500' : 'border-stone-600'
                        }`}
                      >
                        {picked && <Check size={12} className="text-stone-900" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-semibold ${picked ? 'text-amber-300' : 'text-stone-200'}`}>
                          {g.name}{g.quantity > 1 ? ` ×${g.quantity}` : ''}
                        </span>
                        {g.note && (
                          <span className="text-stone-500 text-xs ml-2">{g.note}</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Done ── */}
          {step === 'done' && (
            <div className="text-center py-6 space-y-4">
              <div className="text-6xl">⚔️</div>
              <h3 className="text-amber-400 font-bold font-display text-xl">
                {name.trim() || 'The Wanderer'} is ready.
              </h3>
              <p className="text-stone-400 text-sm px-4">
                Your character sheet, rules reference, and combat guide are set up.
                Check the <span className="text-amber-500">Journal</span> tab for your pinned rules,
                and the <span className="text-amber-500">Tables</span> tab for the Wanderer category.
              </p>
              <div className="bg-stone-800 rounded-xl p-4 text-left space-y-1.5 text-sm">
                <p className="text-stone-300"><span className="text-stone-500">HP:</span> <span className="font-mono font-bold text-amber-400">{hp}</span></p>
                <p className="text-stone-300"><span className="text-stone-500">Attributes:</span> BRAWN {attrs.brawn} · EDGE {attrs.edge} · WITS {attrs.wits} · GRIT {attrs.grit}</p>
                {selectedSkills.length > 0 && (
                  <p className="text-stone-300"><span className="text-stone-500">Skills:</span> {selectedSkills.join(', ')} (rank 1)</p>
                )}
                {selectedGear.length > 0 && (
                  <p className="text-stone-300"><span className="text-stone-500">Gear:</span> {selectedGear.join(', ')}</p>
                )}
              </div>
              <p className="text-stone-600 text-xs">Roll the <em>Starting Scene</em> table to begin your story.</p>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex-none p-4 border-t border-stone-700 flex gap-3">
          {step !== 'done' && (
            <>
              {step !== 'character' ? (
                <button
                  onClick={() => setStep(step === 'gear' ? 'skills' : 'character')}
                  className="btn-secondary flex items-center gap-1 px-4"
                >
                  <ChevronLeft size={16} /> Back
                </button>
              ) : (
                <button onClick={onClose} className="btn-secondary px-4">Cancel</button>
              )}
              {step === 'character' && (
                <button
                  onClick={() => setStep('skills')}
                  className="btn-primary flex-1 flex items-center justify-center gap-1"
                >
                  Skills <ChevronRight size={16} />
                </button>
              )}
              {step === 'skills' && (
                <button
                  onClick={() => setStep('gear')}
                  disabled={selectedSkills.length < 2}
                  className="btn-primary flex-1 flex items-center justify-center gap-1 disabled:opacity-40"
                >
                  Gear <ChevronRight size={16} />
                </button>
              )}
              {step === 'gear' && (
                <button
                  onClick={finish}
                  disabled={selectedGear.length < 3}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <Sword size={16} /> Begin
                </button>
              )}
            </>
          )}
          {step === 'done' && (
            <button onClick={onClose} className="btn-primary flex-1">
              Start Playing
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
