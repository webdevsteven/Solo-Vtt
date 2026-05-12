import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MapState, MapToken } from '../types'

const DEFAULT_MAP: MapState = {
  id: 'default',
  name: 'Dungeon Level 1',
  gridCols: 20,
  gridRows: 20,
  cellSize: 40,
  tokens: [],
  fogCells: [],
  fogEnabled: false,
}

interface MapStore {
  maps: MapState[]
  activeMapId: string
  activeMap: () => MapState
  addMap: (name: string) => void
  setActiveMap: (id: string) => void
  updateMap: (id: string, partial: Partial<MapState>) => void
  deleteMap: (id: string) => void
  addToken: (mapId: string, token: MapToken) => void
  updateToken: (mapId: string, tokenId: string, partial: Partial<MapToken>) => void
  deleteToken: (mapId: string, tokenId: string) => void
  moveToken: (mapId: string, tokenId: string, x: number, y: number) => void
  toggleFogCell: (mapId: string, cell: string) => void
  clearFog: (mapId: string) => void
  fillFog: (mapId: string) => void
}

export const useMapStore = create<MapStore>()(
  persist(
    (set, get) => ({
      maps: [DEFAULT_MAP],
      activeMapId: 'default',

      activeMap: () => {
        const { maps, activeMapId } = get()
        return maps.find((m) => m.id === activeMapId) ?? maps[0]
      },

      addMap: (name) => {
        const id = crypto.randomUUID()
        set((s) => ({
          maps: [
            ...s.maps,
            { ...DEFAULT_MAP, id, name, tokens: [], fogCells: [] },
          ],
          activeMapId: id,
        }))
      },

      setActiveMap: (id) => set({ activeMapId: id }),

      updateMap: (id, partial) =>
        set((s) => ({
          maps: s.maps.map((m) => (m.id === id ? { ...m, ...partial } : m)),
        })),

      deleteMap: (id) =>
        set((s) => {
          const maps = s.maps.filter((m) => m.id !== id)
          return {
            maps: maps.length ? maps : [DEFAULT_MAP],
            activeMapId: maps[0]?.id ?? 'default',
          }
        }),

      addToken: (mapId, token) =>
        set((s) => ({
          maps: s.maps.map((m) =>
            m.id === mapId ? { ...m, tokens: [...m.tokens, token] } : m,
          ),
        })),

      updateToken: (mapId, tokenId, partial) =>
        set((s) => ({
          maps: s.maps.map((m) =>
            m.id === mapId
              ? {
                  ...m,
                  tokens: m.tokens.map((t) =>
                    t.id === tokenId ? { ...t, ...partial } : t,
                  ),
                }
              : m,
          ),
        })),

      deleteToken: (mapId, tokenId) =>
        set((s) => ({
          maps: s.maps.map((m) =>
            m.id === mapId
              ? { ...m, tokens: m.tokens.filter((t) => t.id !== tokenId) }
              : m,
          ),
        })),

      moveToken: (mapId, tokenId, x, y) =>
        set((s) => ({
          maps: s.maps.map((m) =>
            m.id === mapId
              ? {
                  ...m,
                  tokens: m.tokens.map((t) =>
                    t.id === tokenId ? { ...t, x, y } : t,
                  ),
                }
              : m,
          ),
        })),

      toggleFogCell: (mapId, cell) =>
        set((s) => ({
          maps: s.maps.map((m) =>
            m.id === mapId
              ? {
                  ...m,
                  fogCells: m.fogCells.includes(cell)
                    ? m.fogCells.filter((c) => c !== cell)
                    : [...m.fogCells, cell],
                }
              : m,
          ),
        })),

      clearFog: (mapId) =>
        set((s) => ({
          maps: s.maps.map((m) =>
            m.id === mapId ? { ...m, fogCells: [] } : m,
          ),
        })),

      fillFog: (mapId) =>
        set((s) => ({
          maps: s.maps.map((m) => {
            if (m.id !== mapId) return m
            const cells: string[] = []
            for (let r = 0; r < m.gridRows; r++)
              for (let c = 0; c < m.gridCols; c++)
                cells.push(`${c},${r}`)
            return { ...m, fogCells: cells }
          }),
        })),
    }),
    { name: 'solo-vtt-maps' },
  ),
)
