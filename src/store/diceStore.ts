import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DiceRoll, DieType } from '../types'

interface DicePool {
  type: DieType
  count: number
}

interface DiceStore {
  pool: DicePool[]
  modifier: number
  history: DiceRoll[]
  addDie: (type: DieType) => void
  removeDie: (type: DieType) => void
  clearPool: () => void
  setModifier: (n: number) => void
  roll: (label?: string) => DiceRoll
  clearHistory: () => void
  quickRoll: (type: DieType, count?: number, modifier?: number, label?: string) => DiceRoll
}

function rollDie(sides: DieType): number {
  return Math.floor(Math.random() * sides) + 1
}

export const useDiceStore = create<DiceStore>()(
  persist(
    (set, get) => ({
      pool: [],
      modifier: 0,
      history: [],

      addDie: (type) =>
        set((s) => {
          const existing = s.pool.find((d) => d.type === type)
          if (existing) {
            return {
              pool: s.pool.map((d) =>
                d.type === type ? { ...d, count: d.count + 1 } : d,
              ),
            }
          }
          return { pool: [...s.pool, { type, count: 1 }] }
        }),

      removeDie: (type) =>
        set((s) => {
          const existing = s.pool.find((d) => d.type === type)
          if (!existing || existing.count <= 1) {
            return { pool: s.pool.filter((d) => d.type !== type) }
          }
          return {
            pool: s.pool.map((d) =>
              d.type === type ? { ...d, count: d.count - 1 } : d,
            ),
          }
        }),

      clearPool: () => set({ pool: [], modifier: 0 }),

      setModifier: (n) => set({ modifier: n }),

      roll: (label) => {
        const { pool, modifier } = get()
        const results: number[] = []
        pool.forEach(({ type, count }) => {
          for (let i = 0; i < count; i++) results.push(rollDie(type))
        })
        const total = results.reduce((a, b) => a + b, 0) + modifier
        const entry: DiceRoll = {
          id: crypto.randomUUID(),
          dice: [...pool],
          modifier,
          results,
          total,
          label,
          timestamp: Date.now(),
        }
        set((s) => ({ history: [entry, ...s.history].slice(0, 100) }))
        return entry
      },

      quickRoll: (type, count = 1, modifier = 0, label) => {
        const results: number[] = []
        for (let i = 0; i < count; i++) results.push(rollDie(type))
        const total = results.reduce((a, b) => a + b, 0) + modifier
        const entry: DiceRoll = {
          id: crypto.randomUUID(),
          dice: [{ type, count }],
          modifier,
          results,
          total,
          label: label ?? `${count}d${type}${modifier ? (modifier > 0 ? `+${modifier}` : modifier) : ''}`,
          timestamp: Date.now(),
        }
        set((s) => ({ history: [entry, ...s.history].slice(0, 100) }))
        return entry
      },

      clearHistory: () => set({ history: [] }),
    }),
    { name: 'solo-vtt-dice' },
  ),
)
