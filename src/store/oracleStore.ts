import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OracleRoll, OddsLabel, OracleAnswer, Scene } from '../types'

// Mythic GME probability matrix
// Rows: chaos factor 1-9, Cols: odds index 0-8
// Values: threshold for Yes (roll <=), exceptional yes (roll <= val - 10 or certain), exceptional no (roll >= val + 10)
const PROBABILITY_MATRIX: Record<number, Record<number, number>> = {
  1: { 0: 95, 1: 85, 2: 75, 3: 65, 4: 50, 5: 35, 6: 25, 7: 15, 8: 5 },
  2: { 0: 97, 1: 90, 2: 80, 3: 70, 4: 55, 5: 40, 6: 30, 7: 20, 8: 8 },
  3: { 0: 98, 1: 92, 2: 82, 3: 72, 4: 57, 5: 42, 6: 32, 7: 22, 8: 10 },
  4: { 0: 99, 1: 94, 2: 84, 3: 74, 4: 59, 5: 44, 6: 34, 7: 24, 8: 13 },
  5: { 0: 99, 1: 96, 2: 86, 3: 76, 4: 61, 5: 46, 6: 36, 7: 26, 8: 15 },
  6: { 0: 99, 1: 97, 2: 88, 3: 78, 4: 63, 5: 48, 6: 38, 7: 28, 8: 18 },
  7: { 0: 99, 1: 98, 2: 90, 3: 80, 4: 65, 5: 50, 6: 40, 7: 30, 8: 20 },
  8: { 0: 99, 1: 99, 2: 92, 3: 82, 4: 67, 5: 52, 6: 42, 7: 32, 8: 23 },
  9: { 0: 99, 1: 99, 2: 94, 3: 84, 4: 69, 5: 54, 6: 44, 7: 34, 8: 26 },
}

const ODDS_INDEX: Record<OddsLabel, number> = {
  'Certain': 0,
  'Nearly Certain': 1,
  'Very Likely': 2,
  'Likely': 3,
  'Fifty-Fifty': 4,
  'Unlikely': 5,
  'Very Unlikely': 6,
  'Nearly Impossible': 7,
  'Impossible': 8,
}

// Random event focus table
const EVENT_FOCUS = [
  'Remote Event', 'NPC Action', 'Introduce an NPC', 'Move toward a thread',
  'Move away from a thread', 'Close a thread', 'PC negative', 'PC positive',
  'Ambiguous event', 'New entity',
]

export const ODDS_LABELS: OddsLabel[] = [
  'Certain', 'Nearly Certain', 'Very Likely', 'Likely',
  'Fifty-Fifty', 'Unlikely', 'Very Unlikely', 'Nearly Impossible', 'Impossible',
]

interface OracleStore {
  chaosFactor: number
  history: OracleRoll[]
  scenes: Scene[]
  currentSceneId: string | null
  threads: string[]
  npcs: string[]
  setChaos: (n: number) => void
  adjustChaos: (delta: number) => void
  askOracle: (question: string, odds: OddsLabel) => OracleRoll
  clearHistory: () => void
  addScene: (title: string, setup: string) => Scene
  updateScene: (id: string, partial: Partial<Scene>) => void
  setCurrentScene: (id: string | null) => void
  addThread: (t: string) => void
  removeThread: (t: string) => void
  addNpc: (n: string) => void
  removeNpc: (n: string) => void
}

export const useOracleStore = create<OracleStore>()(
  persist(
    (set, get) => ({
      chaosFactor: 5,
      history: [],
      scenes: [],
      currentSceneId: null,
      threads: [],
      npcs: [],

      setChaos: (n) => set({ chaosFactor: Math.max(1, Math.min(9, n)) }),
      adjustChaos: (delta) =>
        set((s) => ({
          chaosFactor: Math.max(1, Math.min(9, s.chaosFactor + delta)),
        })),

      askOracle: (question, odds) => {
        const { chaosFactor } = get()
        const roll = Math.floor(Math.random() * 100) + 1
        const threshold = PROBABILITY_MATRIX[chaosFactor][ODDS_INDEX[odds]]
        const isYes = roll <= threshold
        const isExceptional =
          isYes ? roll <= Math.floor(threshold / 5) + 1
                : roll >= threshold + Math.floor((100 - threshold) / 5) * 4

        let answer: OracleAnswer
        if (isYes && isExceptional) answer = 'Exceptional Yes'
        else if (isYes) answer = 'Yes'
        else if (!isYes && isExceptional) answer = 'Exceptional No'
        else answer = 'No'

        // Scene alteration / random event check
        const doubles = roll % 11 === 0  // 11, 22, 33 ... 99
        const sceneAlt = doubles && roll <= chaosFactor * 10
        const randomEvent = doubles && roll > chaosFactor * 10

        const entry: OracleRoll = {
          id: crypto.randomUUID(),
          question,
          odds,
          chaosFactor,
          roll,
          answer,
          timestamp: Date.now(),
          sceneAlt,
          randomEvent,
        }

        set((s) => ({ history: [entry, ...s.history].slice(0, 200) }))
        return entry
      },

      clearHistory: () => set({ history: [] }),

      addScene: (title, setup) => {
        const { scenes, chaosFactor } = get()
        const scene: Scene = {
          id: crypto.randomUUID(),
          number: scenes.length + 1,
          title,
          setup,
          chaosFactor,
          isAlt: false,
          isInterrupted: false,
          timestamp: Date.now(),
        }
        set((s) => ({ scenes: [...s.scenes, scene], currentSceneId: scene.id }))
        return scene
      },

      updateScene: (id, partial) =>
        set((s) => ({
          scenes: s.scenes.map((sc) => (sc.id === id ? { ...sc, ...partial } : sc)),
        })),

      setCurrentScene: (id) => set({ currentSceneId: id }),

      addThread: (t) => set((s) => ({ threads: [...s.threads, t] })),
      removeThread: (t) => set((s) => ({ threads: s.threads.filter((x) => x !== t) })),
      addNpc: (n) => set((s) => ({ npcs: [...s.npcs, n] })),
      removeNpc: (n) => set((s) => ({ npcs: s.npcs.filter((x) => x !== n) })),
    }),
    { name: 'solo-vtt-oracle' },
  ),
)

export { EVENT_FOCUS }
