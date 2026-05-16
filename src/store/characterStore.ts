import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Character, CharacterField, CharacterSection, Skill, InventoryItem } from '../types'

const DEFAULT_SECTION: CharacterSection = {
  id: 'default',
  title: 'Stats',
  collapsed: false,
  twoCol: false,
  order: 0,
}

const BLANK_CHARACTER: Character = {
  id: 'pc-1',
  name: 'Adventurer',
  concept: 'A lone wanderer',
  system: 'Generic',
  sections: [{ ...DEFAULT_SECTION }],
  fields: [
    { id: 'hp', name: 'HP', type: 'resource', value: 10, max: 10, text: '', sectionId: 'default' },
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
  // Sections
  addSection: (charId: string, title: string) => void
  updateSection: (charId: string, sectionId: string, partial: Partial<CharacterSection>) => void
  deleteSection: (charId: string, sectionId: string) => void
  // Fields
  addField: (charId: string, field: CharacterField) => void
  removeField: (charId: string, fieldId: string) => void
  updateField: (charId: string, fieldId: string, partial: Partial<CharacterField>) => void
  moveField: (charId: string, fieldId: string, dir: 'up' | 'down') => void
  // Skills
  addSkill: (charId: string, skill: Skill) => void
  updateSkill: (charId: string, skillId: string, partial: Partial<Skill>) => void
  removeSkill: (charId: string, skillId: string) => void
  // Inventory
  addItem: (charId: string, item: InventoryItem) => void
  updateItem: (charId: string, itemId: string, partial: Partial<InventoryItem>) => void
  removeItem: (charId: string, itemId: string) => void
  reorderItem: (charId: string, fromIdx: number, toIdx: number) => void
  // Conditions
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
        const secId = crypto.randomUUID()
        set((s) => ({
          characters: [
            ...s.characters,
            {
              ...BLANK_CHARACTER,
              id,
              name,
              sections: [{ ...DEFAULT_SECTION, id: secId }],
              fields: BLANK_CHARACTER.fields.map((f) => ({ ...f, id: crypto.randomUUID(), sectionId: secId })),
            },
          ],
          activeCharacterId: id,
        }))
      },

      deleteCharacter: (id) =>
        set((s) => {
          const chars = s.characters.filter((c) => c.id !== id)
          return {
            characters: chars.length
              ? chars
              : [{ ...BLANK_CHARACTER, fields: BLANK_CHARACTER.fields.map(f => ({ ...f })) }],
            activeCharacterId: chars[0]?.id ?? 'pc-1',
          }
        }),

      updateCharacter: (id, partial) =>
        set((s) => ({
          characters: s.characters.map((c) => (c.id === id ? { ...c, ...partial } : c)),
        })),

      addSection: (charId, title) => {
        const id = crypto.randomUUID()
        set((s) => ({
          characters: s.characters.map((c) => {
            if (c.id !== charId) return c
            const maxOrder = Math.max(0, ...(c.sections ?? []).map(sec => sec.order))
            return {
              ...c,
              sections: [
                ...(c.sections ?? []),
                { id, title, collapsed: false, twoCol: false, order: maxOrder + 1 },
              ],
            }
          }),
        }))
      },

      updateSection: (charId, sectionId, partial) =>
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === charId
              ? {
                  ...c,
                  sections: (c.sections ?? []).map((sec) =>
                    sec.id === sectionId ? { ...sec, ...partial } : sec,
                  ),
                }
              : c,
          ),
        })),

      deleteSection: (charId, sectionId) =>
        set((s) => ({
          characters: s.characters.map((c) => {
            if (c.id !== charId) return c
            return {
              ...c,
              sections: (c.sections ?? []).filter((sec) => sec.id !== sectionId),
              fields: (c.fields ?? []).map((f) =>
                f.sectionId === sectionId ? { ...f, sectionId: undefined } : f,
              ),
            }
          }),
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
            c.id === charId
              ? { ...c, fields: (c.fields ?? []).filter((f) => f.id !== fieldId) }
              : c,
          ),
        })),

      updateField: (charId, fieldId, partial) =>
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === charId
              ? {
                  ...c,
                  fields: (c.fields ?? []).map((f) =>
                    f.id === fieldId ? { ...f, ...partial } : f,
                  ),
                }
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

      reorderItem: (charId, fromIdx, toIdx) =>
        set((s) => ({
          characters: s.characters.map((c) => {
            if (c.id !== charId) return c
            const items = [...c.inventory]
            if (toIdx < 0 || toIdx >= items.length) return c
            const [moved] = items.splice(fromIdx, 1)
            items.splice(toIdx, 0, moved)
            return { ...c, inventory: items }
          }),
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
    }),
    {
      name: 'solo-vtt-characters',
      onRehydrateStorage: () => (state) => {
        if (!state) return
        state.characters = state.characters.map((c: any): Character => {
          // Pass 1: migrate legacy hp/attributes → fields
          let fields: CharacterField[] = Array.isArray(c.fields) && c.fields.length > 0
            ? c.fields
            : []
          if (fields.length === 0) {
            if ((c.maxHp ?? 0) > 0) {
              fields.push({ id: 'hp', name: 'HP', type: 'resource', value: c.hp ?? 0, max: c.maxHp, text: '' })
            }
            if (Array.isArray(c.attributes)) {
              c.attributes.forEach((a: any) => {
                fields.push({ id: a.id || crypto.randomUUID(), name: a.name, type: 'number', value: a.value ?? 0, max: a.max ?? 0, text: '' })
              })
            }
          }

          // Pass 2: migrate characters with fields but no sections
          let sections: CharacterSection[] = Array.isArray(c.sections) ? c.sections : []
          if (sections.length === 0 && fields.length > 0) {
            sections = [{ id: 'default', title: 'Stats', collapsed: false, twoCol: false, order: 0 }]
            fields = fields.map((f: CharacterField) => ({ ...f, sectionId: f.sectionId ?? 'default' }))
          }

          return { ...c, fields, sections } as Character
        })
      },
    },
  ),
)
