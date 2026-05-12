import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Character, Attribute, Skill, InventoryItem } from '../types'

const BLANK_CHARACTER: Character = {
  id: 'pc-1',
  name: 'Adventurer',
  concept: 'A lone wanderer',
  system: 'Generic',
  hp: 10,
  maxHp: 10,
  attributes: [
    { id: 'str', name: 'Strength', value: 10, max: 20 },
    { id: 'dex', name: 'Dexterity', value: 10, max: 20 },
    { id: 'con', name: 'Constitution', value: 10, max: 20 },
    { id: 'int', name: 'Intelligence', value: 10, max: 20 },
    { id: 'wis', name: 'Wisdom', value: 10, max: 20 },
    { id: 'cha', name: 'Charisma', value: 10, max: 20 },
  ],
  skills: [],
  inventory: [],
  notes: '',
  conditions: [],
  xp: 0,
}

interface CharacterStore {
  characters: Character[]
  activeCharacterId: string
  activeCharacter: () => Character
  setActiveCharacter: (id: string) => void
  addCharacter: (name: string) => void
  deleteCharacter: (id: string) => void
  updateCharacter: (id: string, partial: Partial<Character>) => void
  adjustHp: (id: string, delta: number) => void
  setAttribute: (charId: string, attrId: string, value: number) => void
  addSkill: (charId: string, skill: Skill) => void
  updateSkill: (charId: string, skillId: string, partial: Partial<Skill>) => void
  removeSkill: (charId: string, skillId: string) => void
  addItem: (charId: string, item: InventoryItem) => void
  updateItem: (charId: string, itemId: string, partial: Partial<InventoryItem>) => void
  removeItem: (charId: string, itemId: string) => void
  addCondition: (charId: string, condition: string) => void
  removeCondition: (charId: string, condition: string) => void
  addAttribute: (charId: string, attr: Attribute) => void
  removeAttribute: (charId: string, attrId: string) => void
}

export const useCharacterStore = create<CharacterStore>()(
  persist(
    (set, get) => ({
      characters: [BLANK_CHARACTER],
      activeCharacterId: 'pc-1',

      activeCharacter: () => {
        const { characters, activeCharacterId } = get()
        return characters.find((c) => c.id === activeCharacterId) ?? characters[0]
      },

      setActiveCharacter: (id) => set({ activeCharacterId: id }),

      addCharacter: (name) => {
        const id = crypto.randomUUID()
        set((s) => ({
          characters: [
            ...s.characters,
            { ...BLANK_CHARACTER, id, name, attributes: BLANK_CHARACTER.attributes.map(a => ({...a})) },
          ],
          activeCharacterId: id,
        }))
      },

      deleteCharacter: (id) =>
        set((s) => {
          const chars = s.characters.filter((c) => c.id !== id)
          return {
            characters: chars.length ? chars : [BLANK_CHARACTER],
            activeCharacterId: chars[0]?.id ?? 'pc-1',
          }
        }),

      updateCharacter: (id, partial) =>
        set((s) => ({
          characters: s.characters.map((c) => (c.id === id ? { ...c, ...partial } : c)),
        })),

      adjustHp: (id, delta) =>
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === id
              ? { ...c, hp: Math.max(0, Math.min(c.maxHp, c.hp + delta)) }
              : c,
          ),
        })),

      setAttribute: (charId, attrId, value) =>
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === charId
              ? {
                  ...c,
                  attributes: c.attributes.map((a) =>
                    a.id === attrId
                      ? { ...a, value: Math.max(0, Math.min(a.max ?? 999, value)) }
                      : a,
                  ),
                }
              : c,
          ),
        })),

      addSkill: (charId, skill) =>
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === charId ? { ...c, skills: [...c.skills, skill] } : c,
          ),
        })),

      updateSkill: (charId, skillId, partial) =>
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === charId
              ? {
                  ...c,
                  skills: c.skills.map((sk) =>
                    sk.id === skillId ? { ...sk, ...partial } : sk,
                  ),
                }
              : c,
          ),
        })),

      removeSkill: (charId, skillId) =>
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === charId
              ? { ...c, skills: c.skills.filter((sk) => sk.id !== skillId) }
              : c,
          ),
        })),

      addItem: (charId, item) =>
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === charId ? { ...c, inventory: [...c.inventory, item] } : c,
          ),
        })),

      updateItem: (charId, itemId, partial) =>
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === charId
              ? {
                  ...c,
                  inventory: c.inventory.map((it) =>
                    it.id === itemId ? { ...it, ...partial } : it,
                  ),
                }
              : c,
          ),
        })),

      removeItem: (charId, itemId) =>
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === charId
              ? { ...c, inventory: c.inventory.filter((it) => it.id !== itemId) }
              : c,
          ),
        })),

      addCondition: (charId, condition) =>
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === charId && !c.conditions.includes(condition)
              ? { ...c, conditions: [...c.conditions, condition] }
              : c,
          ),
        })),

      removeCondition: (charId, condition) =>
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === charId
              ? { ...c, conditions: c.conditions.filter((x) => x !== condition) }
              : c,
          ),
        })),

      addAttribute: (charId, attr) =>
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === charId ? { ...c, attributes: [...c.attributes, attr] } : c,
          ),
        })),

      removeAttribute: (charId, attrId) =>
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === charId
              ? { ...c, attributes: c.attributes.filter((a) => a.id !== attrId) }
              : c,
          ),
        })),
    }),
    { name: 'solo-vtt-characters' },
  ),
)
