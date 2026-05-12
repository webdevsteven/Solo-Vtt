import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Character, CharacterField, Skill, InventoryItem } from '../types'

const BLANK_CHARACTER: Character = {
  id: 'pc-1',
  name: 'Adventurer',
  concept: 'A lone wanderer',
  system: 'Generic',
  fields: [
    { id: 'hp', name: 'HP', type: 'resource', value: 10, max: 10, text: '' },
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
  addField: (charId: string, field: CharacterField) => void
  removeField: (charId: string, fieldId: string) => void
  updateField: (charId: string, fieldId: string, partial: Partial<CharacterField>) => void
  moveField: (charId: string, fieldId: string, dir: 'up' | 'down') => void
  addSkill: (charId: string, skill: Skill) => void
  updateSkill: (charId: string, skillId: string, partial: Partial<Skill>) => void
  removeSkill: (charId: string, skillId: string) => void
  addItem: (charId: string, item: InventoryItem) => void
  updateItem: (charId: string, itemId: string, partial: Partial<InventoryItem>) => void
  removeItem: (charId: string, itemId: string) => void
  addCondition: (charId: string, condition: string) => void
  removeCondition: (charId: string, condition: string) => void
}

export const useCharacterStore = create<CharacterStore>()(
  persist(
    (set, get) => ({
      characters: [{ ...BLANK_CHARACTER, fields: BLANK_CHARACTER.fields.map(f => ({ ...f })) }],
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
            {
              ...BLANK_CHARACTER,
              id,
              name,
              fields: BLANK_CHARACTER.fields.map((f) => ({ ...f, id: crypto.randomUUID() })),
            },
          ],
          activeCharacterId: id,
        }))
      },

      deleteCharacter: (id) =>
        set((s) => {
          const chars = s.characters.filter((c) => c.id !== id)
          return {
            characters: chars.length ? chars : [{ ...BLANK_CHARACTER, fields: BLANK_CHARACTER.fields.map(f => ({ ...f })) }],
            activeCharacterId: chars[0]?.id ?? 'pc-1',
          }
        }),

      updateCharacter: (id, partial) =>
        set((s) => ({
          characters: s.characters.map((c) => (c.id === id ? { ...c, ...partial } : c)),
        })),

      addField: (charId, field) =>
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === charId ? { ...c, fields: [...(c.fields ?? []), field] } : c,
          ),
        })),

      removeField: (charId, fieldId) =>
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === charId ? { ...c, fields: (c.fields ?? []).filter((f) => f.id !== fieldId) } : c,
          ),
        })),

      updateField: (charId, fieldId, partial) =>
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === charId
              ? { ...c, fields: (c.fields ?? []).map((f) => (f.id === fieldId ? { ...f, ...partial } : f)) }
              : c,
          ),
        })),

      moveField: (charId, fieldId, dir) =>
        set((s) => ({
          characters: s.characters.map((c) => {
            if (c.id !== charId) return c
            const fields = [...(c.fields ?? [])]
            const idx = fields.findIndex((f) => f.id === fieldId)
            if (idx === -1) return c
            const next = dir === 'up' ? idx - 1 : idx + 1
            if (next < 0 || next >= fields.length) return c
            ;[fields[idx], fields[next]] = [fields[next], fields[idx]]
            return { ...c, fields }
          }),
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
              ? { ...c, skills: c.skills.map((sk) => (sk.id === skillId ? { ...sk, ...partial } : sk)) }
              : c,
          ),
        })),

      removeSkill: (charId, skillId) =>
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === charId ? { ...c, skills: c.skills.filter((sk) => sk.id !== skillId) } : c,
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
              ? { ...c, inventory: c.inventory.map((it) => (it.id === itemId ? { ...it, ...partial } : it)) }
              : c,
          ),
        })),

      removeItem: (charId, itemId) =>
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === charId ? { ...c, inventory: c.inventory.filter((it) => it.id !== itemId) } : c,
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
            c.id === charId ? { ...c, conditions: c.conditions.filter((x) => x !== condition) } : c,
          ),
        })),
    }),
    {
      name: 'solo-vtt-characters',
      onRehydrateStorage: () => (state) => {
        if (!state) return
        state.characters = state.characters.map((c: any) => {
          if (Array.isArray(c.fields) && c.fields.length > 0) return c as Character
          const fields: CharacterField[] = []
          if ((c.maxHp ?? 0) > 0) {
            fields.push({ id: 'hp', name: 'HP', type: 'resource', value: c.hp ?? 0, max: c.maxHp, text: '' })
          }
          if (Array.isArray(c.attributes)) {
            c.attributes.forEach((a: any) => {
              fields.push({ id: a.id || crypto.randomUUID(), name: a.name, type: 'number', value: a.value ?? 0, max: a.max ?? 0, text: '' })
            })
          }
          return { ...c, fields } as Character
        })
      },
    },
  ),
)
