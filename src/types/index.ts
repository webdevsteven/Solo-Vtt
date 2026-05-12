// ── Map ──────────────────────────────────────────────────────────────────────
export type TokenShape = 'circle' | 'square' | 'diamond'
export type TokenColor =
  | 'amber' | 'red' | 'blue' | 'green' | 'purple' | 'white' | 'yellow'

export interface MapToken {
  id: string
  x: number       // grid col
  y: number       // grid row
  label: string
  color: TokenColor
  shape: TokenShape
  hp?: number
  maxHp?: number
  note?: string
  isPC?: boolean
}

export interface MapState {
  id: string
  name: string
  gridCols: number
  gridRows: number
  cellSize: number
  tokens: MapToken[]
  fogCells: string[]   // "col,row" strings
  fogEnabled: boolean
  backgroundUrl?: string
}

// ── Oracle ────────────────────────────────────────────────────────────────────
export type OddsLabel =
  | 'Certain' | 'Nearly Certain' | 'Very Likely' | 'Likely'
  | 'Fifty-Fifty' | 'Unlikely' | 'Very Unlikely' | 'Nearly Impossible' | 'Impossible'

export type OracleAnswer = 'Exceptional Yes' | 'Yes' | 'No' | 'Exceptional No'

export interface OracleRoll {
  id: string
  question: string
  odds: OddsLabel
  chaosFactor: number
  roll: number
  answer: OracleAnswer
  timestamp: number
  sceneAlt?: boolean
  randomEvent?: boolean
}

export interface Scene {
  id: string
  number: number
  title: string
  setup: string
  outcome?: string
  chaosFactor: number
  isAlt: boolean
  isInterrupted: boolean
  timestamp: number
}

// ── Dice ──────────────────────────────────────────────────────────────────────
export type DieType = 4 | 6 | 8 | 10 | 12 | 20 | 100

export interface DiceRoll {
  id: string
  dice: { type: DieType; count: number }[]
  modifier: number
  results: number[]
  total: number
  label?: string
  timestamp: number
}

// ── Character ─────────────────────────────────────────────────────────────────
export interface Attribute {
  id: string
  name: string
  value: number
  max?: number
}

export interface Skill {
  id: string
  name: string
  rank: number   // 0-5
  attribute?: string
}

export interface InventoryItem {
  id: string
  name: string
  quantity: number
  weight?: number
  note?: string
  equipped?: boolean
}

export interface Character {
  id: string
  name: string
  concept: string
  system: string
  hp: number
  maxHp: number
  attributes: Attribute[]
  skills: Skill[]
  inventory: InventoryItem[]
  notes: string
  portrait?: string
  conditions: string[]
  xp: number
}

// ── Journal ───────────────────────────────────────────────────────────────────
export type EntryTag = 'session' | 'note' | 'npc' | 'location' | 'quest' | 'clue' | 'loot'

export interface JournalEntry {
  id: string
  title: string
  body: string
  tag: EntryTag
  timestamp: number
  pinned: boolean
  sessionNumber?: number
}

// ── Random Tables ─────────────────────────────────────────────────────────────
export interface TableRow {
  min: number
  max: number
  result: string
}

export interface RandomTable {
  id: string
  name: string
  category: string
  dieType: DieType
  rows: TableRow[]
  custom: boolean
}

export interface TableRollResult {
  tableId: string
  tableName: string
  roll: number
  result: string
  timestamp: number
}

// ── App ───────────────────────────────────────────────────────────────────────
export type TabId = 'map' | 'oracle' | 'dice' | 'character' | 'journal' | 'tables'
