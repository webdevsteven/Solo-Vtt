import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Types (exported for page use) ─────────────────────────────────────────────

export interface DiceGroupResult {
  notation: string   // e.g. "4d6kh3"
  sides: number
  rolls: number[]
  kept: boolean[]    // parallel to rolls
  subtotal: number
}

export interface DiceRollResult {
  id: string
  notation: string   // full expression e.g. "4d6kh3+2d4-1"
  groups: DiceGroupResult[]
  modifier: number
  total: number
  timestamp: number
}

export interface DicePreset {
  id: string
  label: string
  notation: string
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_PRESETS: DicePreset[] = [
  { id: 'adv',  label: 'Advantage',    notation: '2d20kh1' },
  { id: 'dis',  label: 'Disadvantage', notation: '2d20kl1' },
  { id: 'stat', label: 'Stat Roll',    notation: '4d6kh3'  },
  { id: '2d6',  label: '2d6',          notation: '2d6'     },
  { id: '1d20', label: '1d20',         notation: '1d20'    },
]

// ── Parser ────────────────────────────────────────────────────────────────────

interface ParsedGroup {
  count: number
  sides: number
  keepHigh: number
  keepLow: number
  dropHigh: number
  dropLow: number
  negative: boolean
}

interface ParsedExpression {
  groups: ParsedGroup[]
  modifier: number
}

export function parseNotation(input: string): ParsedExpression | null {
  const str = input.trim().toLowerCase().replace(/\s/g, '')
  if (!str) return null

  const groups: ParsedGroup[] = []
  let modifier = 0

  // Each token: optional sign + (dice group | integer)
  // Dice group: (\d*)d(%|\d+) optionally followed by (k|d)(h|l)\d+
  const tokenRe = /([+-]?)(\d*d(?:%|\d+)(?:(?:k|d)[hl]\d+)?|\d+)/g
  let m: RegExpExecArray | null
  let hasToken = false

  while ((m = tokenRe.exec(str)) !== null) {
    hasToken = true
    const neg = m[1] === '-'
    const token = m[2]

    const dm = token.match(/^(\d*)d(%|\d+)((?:k|d)[hl]\d+)?$/)
    if (dm) {
      const count = dm[1] ? parseInt(dm[1]) : 1
      const sides = dm[2] === '%' ? 100 : parseInt(dm[2])
      let keepHigh = 0, keepLow = 0, dropHigh = 0, dropLow = 0

      if (dm[3]) {
        const km = dm[3].match(/^(k|d)(h|l)(\d+)$/)
        if (km) {
          const n = parseInt(km[3])
          if (km[1] === 'k' && km[2] === 'h') keepHigh = n
          else if (km[1] === 'k' && km[2] === 'l') keepLow = n
          else if (km[1] === 'd' && km[2] === 'h') dropHigh = n
          else if (km[1] === 'd' && km[2] === 'l') dropLow = n
        }
      }

      if (count > 0 && sides > 0) {
        groups.push({ count, sides, keepHigh, keepLow, dropHigh, dropLow, negative: neg })
      }
    } else {
      const n = parseInt(token)
      if (!isNaN(n)) modifier += neg ? -n : n
    }
  }

  if (!hasToken || (groups.length === 0 && modifier === 0)) return null
  return { groups, modifier }
}

// ── Roller ────────────────────────────────────────────────────────────────────

function execRoll(notation: string, parsed: ParsedExpression): DiceRollResult {
  const groups: DiceGroupResult[] = []

  for (const g of parsed.groups) {
    const rolls: number[] = []
    for (let i = 0; i < g.count; i++) {
      rolls.push(Math.floor(Math.random() * g.sides) + 1)
    }

    const kept = new Array<boolean>(g.count).fill(true)

    if (g.keepHigh > 0) {
      rolls.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v)
        .slice(g.keepHigh).forEach(({ i }) => { kept[i] = false })
    } else if (g.keepLow > 0) {
      rolls.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v)
        .slice(g.keepLow).forEach(({ i }) => { kept[i] = false })
    } else if (g.dropHigh > 0) {
      rolls.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v)
        .slice(0, g.dropHigh).forEach(({ i }) => { kept[i] = false })
    } else if (g.dropLow > 0) {
      rolls.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v)
        .slice(0, g.dropLow).forEach(({ i }) => { kept[i] = false })
    }

    const sum = rolls.reduce((a, v, i) => (kept[i] ? a + v : a), 0)
    const mod = g.keepHigh > 0 ? `kh${g.keepHigh}` :
      g.keepLow  > 0 ? `kl${g.keepLow}`  :
      g.dropHigh > 0 ? `dh${g.dropHigh}` :
      g.dropLow  > 0 ? `dl${g.dropLow}`  : ''

    groups.push({
      notation: `${g.negative ? '-' : ''}${g.count}d${g.sides === 100 ? '%' : g.sides}${mod}`,
      sides: g.sides,
      rolls,
      kept,
      subtotal: g.negative ? -sum : sum,
    })
  }

  const total = groups.reduce((a, g) => a + g.subtotal, 0) + parsed.modifier

  return {
    id: crypto.randomUUID(),
    notation,
    groups,
    modifier: parsed.modifier,
    total,
    timestamp: Date.now(),
  }
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface DiceStore {
  history: DiceRollResult[]
  presets: DicePreset[]
  roll: (notation: string) => DiceRollResult | null
  quickRoll: (sides: number) => DiceRollResult
  addPreset: (label: string, notation: string) => void
  updatePreset: (id: string, label: string, notation: string) => void
  deletePreset: (id: string) => void
  clearHistory: () => void
}

export const useDiceStore = create<DiceStore>()(
  persist(
    (set) => ({
      history: [],
      presets: DEFAULT_PRESETS,

      roll: (notation) => {
        const parsed = parseNotation(notation)
        if (!parsed) return null
        const result = execRoll(notation.trim(), parsed)
        set((s) => ({ history: [result, ...s.history].slice(0, 100) }))
        return result
      },

      quickRoll: (sides) => {
        const label = sides === 100 ? 'd%' : `d${sides}`
        const parsed: ParsedExpression = {
          groups: [{ count: 1, sides, keepHigh: 0, keepLow: 0, dropHigh: 0, dropLow: 0, negative: false }],
          modifier: 0,
        }
        const result = execRoll(`1${label}`, parsed)
        set((s) => ({ history: [result, ...s.history].slice(0, 100) }))
        return result
      },

      addPreset: (label, notation) =>
        set((s) => ({
          presets: [...s.presets, { id: crypto.randomUUID(), label, notation }],
        })),

      updatePreset: (id, label, notation) =>
        set((s) => ({
          presets: s.presets.map((p) => (p.id === id ? { ...p, label, notation } : p)),
        })),

      deletePreset: (id) =>
        set((s) => ({ presets: s.presets.filter((p) => p.id !== id) })),

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'solo-vtt-dice',
      merge: (persisted: any, current) => ({
        ...current,
        // Drop any old-format history entries that lack the new shape
        history: (persisted?.history ?? []).filter(
          (r: any) => r?.notation && r?.total !== undefined && Array.isArray(r?.groups),
        ),
        presets: persisted?.presets ?? current.presets,
      }),
    },
  ),
)
