import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RandomTable, TableRollResult } from '../types'

const BUILT_IN_TABLES: RandomTable[] = [
  {
    id: 'weather',
    name: 'Weather',
    category: 'Environment',
    dieType: 12,
    custom: false,
    rows: [
      { min: 1, max: 1, result: 'Heavy fog, visibility severely reduced' },
      { min: 2, max: 2, result: 'Torrential rain, paths become muddy' },
      { min: 3, max: 3, result: 'Thunderstorm with lightning' },
      { min: 4, max: 5, result: 'Light rain, overcast skies' },
      { min: 6, max: 6, result: 'Bitterly cold, risk of frostbite' },
      { min: 7, max: 7, result: 'Strong winds, difficult to travel' },
      { min: 8, max: 8, result: 'Overcast but dry' },
      { min: 9, max: 10, result: 'Partly cloudy, pleasant' },
      { min: 11, max: 11, result: 'Clear and sunny' },
      { min: 12, max: 12, result: 'Eerily calm, unsettling stillness' },
    ],
  },
  {
    id: 'encounter',
    name: 'Wilderness Encounter',
    category: 'Encounter',
    dieType: 20,
    custom: false,
    rows: [
      { min: 1, max: 1, result: 'Ambush! Bandits spring from hiding' },
      { min: 2, max: 2, result: 'Pack of wolves, hungry and circling' },
      { min: 3, max: 3, result: 'Wounded traveler begging for aid' },
      { min: 4, max: 4, result: 'Abandoned campfire, still warm' },
      { min: 5, max: 5, result: 'Merchant with unusual wares' },
      { min: 6, max: 7, result: 'Patrol of guards, suspicious' },
      { min: 8, max: 8, result: 'A strange shrine, offerings left' },
      { min: 9, max: 9, result: 'Giant spider web across the path' },
      { min: 10, max: 10, result: 'Skeleton half-buried in the earth' },
      { min: 11, max: 11, result: 'Hermit who knows local secrets' },
      { min: 12, max: 12, result: 'Dire boar, aggressive' },
      { min: 13, max: 13, result: 'Lost child, afraid' },
      { min: 14, max: 14, result: 'Sign of recent battle, bodies' },
      { min: 15, max: 15, result: 'Glowing mushroom ring, fey portal?' },
      { min: 16, max: 16, result: 'Patrol of undead, mindless' },
      { min: 17, max: 17, result: 'Damaged bridge, must find a way' },
      { min: 18, max: 18, result: 'Strange tracks, unknown creature' },
      { min: 19, max: 19, result: 'Thieves guild scouts' },
      { min: 20, max: 20, result: 'Dragon sighting overhead!' },
    ],
  },
  {
    id: 'dungeon-room',
    name: 'Dungeon Room',
    category: 'Dungeon',
    dieType: 12,
    custom: false,
    rows: [
      { min: 1, max: 1, result: 'Guard chamber, armed skeletons' },
      { min: 2, max: 2, result: 'Collapsed ceiling, rubble blocks half the room' },
      { min: 3, max: 3, result: 'Treasure vault, locked and trapped' },
      { min: 4, max: 4, result: 'Pit trap with iron spikes' },
      { min: 5, max: 5, result: 'Torture chamber with old implements' },
      { min: 6, max: 6, result: 'Flooded room, waist-deep black water' },
      { min: 7, max: 7, result: 'Shrine to a dark god' },
      { min: 8, max: 8, result: 'Barracks, sleeping monsters' },
      { min: 9, max: 9, result: 'Kitchen or larder, supplies & vermin' },
      { min: 10, max: 10, result: 'Alchemist\'s lab, bubbling experiments' },
      { min: 11, max: 11, result: 'Throne room, grand and silent' },
      { min: 12, max: 12, result: 'Secret door concealed in the wall' },
    ],
  },
  {
    id: 'npc-trait',
    name: 'NPC Trait',
    category: 'NPC',
    dieType: 20,
    custom: false,
    rows: [
      { min: 1, max: 1, result: 'Paranoid, trusts nobody' },
      { min: 2, max: 2, result: 'Greedy, everything has a price' },
      { min: 3, max: 3, result: 'Kind but naive' },
      { min: 4, max: 4, result: 'Secretly working for the enemy' },
      { min: 5, max: 5, result: 'Grieving a recent loss' },
      { min: 6, max: 6, result: 'Arrogant, underestimates others' },
      { min: 7, max: 7, result: 'Desperately in debt' },
      { min: 8, max: 8, result: 'Deeply religious, zealous' },
      { min: 9, max: 9, result: 'Former adventurer, retired' },
      { min: 10, max: 10, result: 'Speaks in riddles and metaphor' },
      { min: 11, max: 11, result: 'Fearful of a specific monster' },
      { min: 12, max: 12, result: 'Loyal to a fault' },
      { min: 13, max: 13, result: 'Harbors a dark secret' },
      { min: 14, max: 14, result: 'Obsessed with collecting something' },
      { min: 15, max: 15, result: 'Cheerful despite hardship' },
      { min: 16, max: 16, result: 'Looking for a missing person' },
      { min: 17, max: 17, result: 'Disguised noble or royalty' },
      { min: 18, max: 18, result: 'Has prophetic dreams' },
      { min: 19, max: 19, result: 'Master of a useful craft' },
      { min: 20, max: 20, result: 'Not entirely human' },
    ],
  },
  {
    id: 'loot',
    name: 'Treasure Loot',
    category: 'Loot',
    dieType: 20,
    custom: false,
    rows: [
      { min: 1, max: 3, result: 'Copper coins (2d10 cp)' },
      { min: 4, max: 6, result: 'Silver coins (1d20 sp)' },
      { min: 7, max: 8, result: 'Gold coins (1d10 gp)' },
      { min: 9, max: 9, result: 'Gemstone (roll d6: 1-2 quartz, 3-4 amethyst, 5 ruby, 6 diamond)' },
      { min: 10, max: 10, result: 'Ornate jewelry, worth 1d6 × 10 gp' },
      { min: 11, max: 11, result: 'Potion of healing (2d4+2)' },
      { min: 12, max: 12, result: 'Scroll with a random spell' },
      { min: 13, max: 13, result: '+1 weapon, roll for type' },
      { min: 14, max: 14, result: 'Armor or shield, masterwork' },
      { min: 15, max: 15, result: 'Magic ring, unknown effect' },
      { min: 16, max: 16, result: 'Mysterious map to a location' },
      { min: 17, max: 17, result: 'Arcane focus or holy symbol' },
      { min: 18, max: 18, result: 'Cursed item in disguise' },
      { min: 19, max: 19, result: 'Rare crafting material' },
      { min: 20, max: 20, result: 'Legendary artifact (GM decides)' },
    ],
  },
  {
    id: 'plot-twist',
    name: 'Plot Twist',
    category: 'Story',
    dieType: 10,
    custom: false,
    rows: [
      { min: 1, max: 1, result: 'A trusted ally betrays you' },
      { min: 2, max: 2, result: 'The enemy is not who you thought' },
      { min: 3, max: 3, result: 'A long-dead figure returns' },
      { min: 4, max: 4, result: 'The treasure is cursed or fake' },
      { min: 5, max: 5, result: 'You are being hunted as well' },
      { min: 6, max: 6, result: 'A third faction enters the conflict' },
      { min: 7, max: 7, result: 'The location is not what it seemed' },
      { min: 8, max: 8, result: 'Someone is using you as a pawn' },
      { min: 9, max: 9, result: 'A ticking clock is revealed' },
      { min: 10, max: 10, result: 'The truth was in front of you all along' },
    ],
  },
  {
    id: 'action-meaning',
    name: 'Action Meaning (Oracle)',
    category: 'Oracle',
    dieType: 100,
    custom: false,
    rows: [
      { min: 1, max: 2, result: 'Attainment' },
      { min: 3, max: 4, result: 'Starting' },
      { min: 5, max: 6, result: 'Neglect' },
      { min: 7, max: 8, result: 'Fight' },
      { min: 9, max: 10, result: 'Recruit' },
      { min: 11, max: 12, result: 'Triumph' },
      { min: 13, max: 14, result: 'Violate' },
      { min: 15, max: 16, result: 'Oppose' },
      { min: 17, max: 18, result: 'Restore' },
      { min: 19, max: 20, result: 'Oppress' },
      { min: 21, max: 22, result: 'Release' },
      { min: 23, max: 24, result: 'Befriend' },
      { min: 25, max: 26, result: 'Judge' },
      { min: 27, max: 28, result: 'Desert' },
      { min: 29, max: 30, result: 'Dominate' },
      { min: 31, max: 32, result: 'Procrastinate' },
      { min: 33, max: 34, result: 'Praise' },
      { min: 35, max: 36, result: 'Carry' },
      { min: 37, max: 38, result: 'Borrow' },
      { min: 39, max: 40, result: 'Expose' },
      { min: 41, max: 42, result: 'Haggle' },
      { min: 43, max: 44, result: 'Attack' },
      { min: 45, max: 46, result: 'Understand' },
      { min: 47, max: 48, result: 'Harm' },
      { min: 49, max: 50, result: 'Debase' },
      { min: 51, max: 52, result: 'Transform' },
      { min: 53, max: 54, result: 'Overthrow' },
      { min: 55, max: 56, result: 'Inform' },
      { min: 57, max: 58, result: 'Disrupt' },
      { min: 59, max: 60, result: 'Help' },
      { min: 61, max: 62, result: 'Pursue' },
      { min: 63, max: 64, result: 'Inspect' },
      { min: 65, max: 66, result: 'Arrive' },
      { min: 67, max: 68, result: 'Communicate' },
      { min: 69, max: 70, result: 'Take' },
      { min: 71, max: 72, result: 'Spy' },
      { min: 73, max: 74, result: 'Collect' },
      { min: 75, max: 76, result: 'Reduce' },
      { min: 77, max: 78, result: 'Protect' },
      { min: 79, max: 80, result: 'Create' },
      { min: 81, max: 82, result: 'Discover' },
      { min: 83, max: 84, result: 'Suppress' },
      { min: 85, max: 86, result: 'Abandon' },
      { min: 87, max: 88, result: 'Record' },
      { min: 89, max: 90, result: 'Bestow' },
      { min: 91, max: 92, result: 'Talk' },
      { min: 93, max: 94, result: 'Warn' },
      { min: 95, max: 96, result: 'Prepare' },
      { min: 97, max: 98, result: 'Trick' },
      { min: 99, max: 100, result: 'Confront' },
    ],
  },
]

interface TablesStore {
  tables: RandomTable[]
  rollHistory: TableRollResult[]
  addCustomTable: (table: Omit<RandomTable, 'id' | 'custom'>) => void
  deleteCustomTable: (id: string) => void
  rollTable: (tableId: string) => TableRollResult | null
  clearHistory: () => void
}

export const useTablesStore = create<TablesStore>()(
  persist(
    (set, get) => ({
      tables: BUILT_IN_TABLES,
      rollHistory: [],

      addCustomTable: (tableData) => {
        const table: RandomTable = {
          ...tableData,
          id: crypto.randomUUID(),
          custom: true,
        }
        set((s) => ({ tables: [...s.tables, table] }))
      },

      deleteCustomTable: (id) =>
        set((s) => ({ tables: s.tables.filter((t) => t.id !== id || !t.custom) })),

      rollTable: (tableId) => {
        const { tables } = get()
        const table = tables.find((t) => t.id === tableId)
        if (!table) return null
        const roll = Math.floor(Math.random() * table.dieType) + 1
        const row = table.rows.find((r) => roll >= r.min && roll <= r.max)
        const result: TableRollResult = {
          tableId,
          tableName: table.name,
          roll,
          result: row?.result ?? 'No result',
          timestamp: Date.now(),
        }
        set((s) => ({ rollHistory: [result, ...s.rollHistory].slice(0, 100) }))
        return result
      },

      clearHistory: () => set({ rollHistory: [] }),
    }),
    {
      name: 'solo-vtt-tables',
      partialize: (s) => ({
        tables: s.tables.filter((t) => t.custom),
        rollHistory: s.rollHistory,
      }),
      merge: (persisted: any, current) => ({
        ...current,
        tables: [
          ...BUILT_IN_TABLES,
          ...(persisted?.tables ?? []),
        ],
        rollHistory: persisted?.rollHistory ?? [],
      }),
    },
  ),
)
