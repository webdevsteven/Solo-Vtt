import { useState, useRef, useCallback, useEffect } from 'react'
import TopBar from '../components/layout/TopBar'
import { useMapStore } from '../store/mapStore'
import type { MapToken, TokenColor, TokenShape } from '../types'
import { Plus, Trash2, Layers, Eye, EyeOff, Pencil, X } from 'lucide-react'

const TOKEN_COLORS: Record<TokenColor, string> = {
  amber:  '#f59e0b',
  red:    '#ef4444',
  blue:   '#3b82f6',
  green:  '#22c55e',
  purple: '#a855f7',
  white:  '#e5e7eb',
  yellow: '#eab308',
}

const SHAPES: TokenShape[] = ['circle', 'square', 'diamond']

const PAINT_COLORS: { label: string; color: string | null }[] = [
  { label: 'Wall',  color: '#0a0a0a' },
  { label: 'Stone', color: '#57534e' },
  { label: 'Floor', color: '#e7e5e4' },
  { label: 'Grass', color: '#16a34a' },
  { label: 'Water', color: '#1d4ed8' },
  { label: 'Wood',  color: '#7c2d12' },
  { label: 'Sand',  color: '#d97706' },
  { label: 'Erase', color: null },
]

const BG_PRESETS = [
  { label: 'Black', color: '#000000' },
  { label: 'Stone', color: '#1c1917' },
  { label: 'Light', color: '#f5f5f4' },
  { label: 'Green', color: '#14532d' },
]

function hexLuminance(hex: string): number {
  const c = hex.replace('#', '')
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000
}

function drawToken(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  shape: TokenShape,
  label: string,
  selected: boolean,
  isPC: boolean,
) {
  ctx.save()
  const cx = x + size / 2
  const cy = y + size / 2
  const r = size / 2 - 2

  ctx.shadowColor = selected ? '#f59e0b' : (isPC ? '#6ee7b7' : 'transparent')
  ctx.shadowBlur = selected ? 12 : (isPC ? 8 : 0)

  ctx.fillStyle = color
  ctx.strokeStyle = selected ? '#f59e0b' : (isPC ? '#6ee7b7' : '#1c1917')
  ctx.lineWidth = selected ? 2.5 : 1.5

  ctx.beginPath()
  if (shape === 'circle') {
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
  } else if (shape === 'square') {
    ctx.roundRect(x + 2, y + 2, size - 4, size - 4, 4)
  } else {
    ctx.moveTo(cx, y + 2)
    ctx.lineTo(x + size - 2, cy)
    ctx.lineTo(cx, y + size - 2)
    ctx.lineTo(x + 2, cy)
    ctx.closePath()
  }
  ctx.fill()
  ctx.stroke()

  ctx.shadowBlur = 0
  ctx.fillStyle = '#fff'
  ctx.font = `bold ${Math.floor(size * 0.32)}px system-ui`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label.slice(0, 2).toUpperCase(), cx, cy)
  ctx.restore()
}

interface AddTokenModal {
  open: boolean
  gridX: number
  gridY: number
}

export default function MapPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const store = useMapStore()
  const map = store.activeMap()

  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null)
  const [addModal, setAddModal] = useState<AddTokenModal>({ open: false, gridX: 0, gridY: 0 })
  const [tokenForm, setTokenForm] = useState({ label: '', color: 'amber' as TokenColor, shape: 'circle' as TokenShape, isPC: false, hp: 10, maxHp: 10 })
  const [editingToken, setEditingToken] = useState<MapToken | null>(null)
  const [showFogTools, setShowFogTools] = useState(false)
  const [fogMode, setFogMode] = useState(false)
  const [showMapList, setShowMapList] = useState(false)
  const [showDrawTools, setShowDrawTools] = useState(false)
  const [paintMode, setPaintMode] = useState(false)
  const [paintColor, setPaintColor] = useState<string | null>('#57534e')

  // Camera pan/zoom
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 })
  const dragRef = useRef<{ startX: number; startY: number; camX: number; camY: number; isDragging: boolean } | null>(null)
  const tokenDragRef = useRef<{ tokenId: string; startX: number; startY: number; origX: number; origY: number } | null>(null)
  const lastTouchRef = useRef<{ x: number; y: number; dist?: number } | null>(null)
  const isPaintingRef = useRef(false)

  const CELL = map.cellSize * camera.zoom

  const canvasToGrid = useCallback(
    (px: number, py: number) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return { gx: 0, gy: 0 }
      const cx = (px - rect.left - camera.x) / camera.zoom
      const cy = (py - rect.top - camera.y) / camera.zoom
      return {
        gx: Math.floor(cx / map.cellSize),
        gy: Math.floor(cy / map.cellSize),
      }
    },
    [camera, map.cellSize],
  )

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = container.clientWidth
    canvas.height = container.clientHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.translate(camera.x, camera.y)
    ctx.scale(camera.zoom, camera.zoom)

    // Background
    const bgColor = map.bgColor ?? '#1c1917'
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, map.gridCols * map.cellSize, map.gridRows * map.cellSize)

    // Painted cells (below grid lines, fog, tokens)
    if (map.paintedCells) {
      Object.entries(map.paintedCells).forEach(([cell, color]) => {
        const [c, r] = cell.split(',').map(Number)
        ctx.fillStyle = color
        ctx.fillRect(c * map.cellSize, r * map.cellSize, map.cellSize, map.cellSize)
      })
    }

    // Grid lines — adaptive to background brightness
    const lum = hexLuminance(bgColor)
    ctx.strokeStyle = lum > 160 ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.10)'
    ctx.lineWidth = 0.5
    for (let c = 0; c <= map.gridCols; c++) {
      ctx.beginPath()
      ctx.moveTo(c * map.cellSize, 0)
      ctx.lineTo(c * map.cellSize, map.gridRows * map.cellSize)
      ctx.stroke()
    }
    for (let r = 0; r <= map.gridRows; r++) {
      ctx.beginPath()
      ctx.moveTo(0, r * map.cellSize)
      ctx.lineTo(map.gridCols * map.cellSize, r * map.cellSize)
      ctx.stroke()
    }

    // Fog
    if (map.fogEnabled) {
      ctx.fillStyle = 'rgba(0,0,0,0.85)'
      map.fogCells.forEach((cell) => {
        const [c, r] = cell.split(',').map(Number)
        ctx.fillRect(c * map.cellSize, r * map.cellSize, map.cellSize, map.cellSize)
      })
    }

    // Tokens
    map.tokens.forEach((token) => {
      drawToken(
        ctx,
        token.x * map.cellSize,
        token.y * map.cellSize,
        map.cellSize,
        TOKEN_COLORS[token.color],
        token.shape,
        token.label,
        token.id === selectedTokenId,
        token.isPC ?? false,
      )
      if (token.hp !== undefined && token.maxHp !== undefined && token.maxHp > 0) {
        const bw = map.cellSize - 6
        const bh = 4
        const bx = token.x * map.cellSize + 3
        const by = token.y * map.cellSize + map.cellSize - 7
        ctx.fillStyle = '#451a03'
        ctx.fillRect(bx, by, bw, bh)
        ctx.fillStyle = token.hp / token.maxHp > 0.5 ? '#22c55e' : token.hp / token.maxHp > 0.25 ? '#f59e0b' : '#ef4444'
        ctx.fillRect(bx, by, bw * (token.hp / token.maxHp), bh)
      }
    })

    ctx.restore()
  }, [camera, map, selectedTokenId])

  useEffect(() => { draw() }, [draw])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => draw())
    ro.observe(el)
    return () => ro.disconnect()
  }, [draw])

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getTokenAtGrid = (gx: number, gy: number) =>
    map.tokens.find((t) => t.x === gx && t.y === gy)

  const paintCell = (gx: number, gy: number) => {
    if (gx < 0 || gx >= map.gridCols || gy < 0 || gy >= map.gridRows) return
    store.setPaintCell(map.id, `${gx},${gy}`, paintColor)
  }

  // ── Pointer events ──────────────────────────────────────────────────────────
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return
    const { gx, gy } = canvasToGrid(e.clientX, e.clientY)

    if (paintMode) {
      paintCell(gx, gy)
      isPaintingRef.current = true
      return
    }

    if (fogMode) {
      store.toggleFogCell(map.id, `${gx},${gy}`)
      return
    }

    const token = getTokenAtGrid(gx, gy)
    if (token) {
      setSelectedTokenId(token.id)
      tokenDragRef.current = { tokenId: token.id, startX: e.clientX, startY: e.clientY, origX: token.x, origY: token.y }
    } else {
      setSelectedTokenId(null)
      dragRef.current = { startX: e.clientX, startY: e.clientY, camX: camera.x, camY: camera.y, isDragging: false }
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return

    if (paintMode && isPaintingRef.current) {
      const { gx, gy } = canvasToGrid(e.clientX, e.clientY)
      paintCell(gx, gy)
      return
    }

    if (tokenDragRef.current) {
      const dx = e.clientX - tokenDragRef.current.startX
      const dy = e.clientY - tokenDragRef.current.startY
      const newGx = tokenDragRef.current.origX + Math.round(dx / CELL)
      const newGy = tokenDragRef.current.origY + Math.round(dy / CELL)
      store.moveToken(map.id, tokenDragRef.current.tokenId, newGx, newGy)
    } else if (dragRef.current) {
      dragRef.current.isDragging = true
      setCamera((c) => ({
        ...c,
        x: dragRef.current!.camX + e.clientX - dragRef.current!.startX,
        y: dragRef.current!.camY + e.clientY - dragRef.current!.startY,
      }))
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return

    if (paintMode) {
      isPaintingRef.current = false
      return
    }

    if (tokenDragRef.current) {
      tokenDragRef.current = null
      return
    }
    if (dragRef.current && !dragRef.current.isDragging) {
      const { gx, gy } = canvasToGrid(e.clientX, e.clientY)
      if (gx >= 0 && gx < map.gridCols && gy >= 0 && gy < map.gridRows) {
        setAddModal({ open: true, gridX: gx, gridY: gy })
        setTokenForm({ label: '', color: 'amber', shape: 'circle', isPC: false, hp: 10, maxHp: 10 })
      }
    }
    dragRef.current = null
  }

  // ── Touch events ─────────────────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      lastTouchRef.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        dist: Math.sqrt(dx * dx + dy * dy),
      }
      return
    }
    const t = e.touches[0]
    const { gx, gy } = canvasToGrid(t.clientX, t.clientY)

    if (paintMode) {
      paintCell(gx, gy)
      isPaintingRef.current = true
      lastTouchRef.current = null
      return
    }

    if (fogMode) {
      store.toggleFogCell(map.id, `${gx},${gy}`)
      lastTouchRef.current = null
      return
    }

    const token = getTokenAtGrid(gx, gy)
    if (token) {
      setSelectedTokenId(token.id)
      tokenDragRef.current = { tokenId: token.id, startX: t.clientX, startY: t.clientY, origX: token.x, origY: token.y }
    } else {
      setSelectedTokenId(null)
      lastTouchRef.current = { x: t.clientX, y: t.clientY }
      dragRef.current = { startX: t.clientX, startY: t.clientY, camX: camera.x, camY: camera.y, isDragging: false }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 2 && lastTouchRef.current?.dist !== undefined) {
      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      const newDist = Math.sqrt(dx * dx + dy * dy)
      const scale = newDist / lastTouchRef.current.dist
      setCamera((c) => ({
        ...c,
        zoom: Math.max(0.3, Math.min(3, c.zoom * scale)),
      }))
      lastTouchRef.current.dist = newDist
      return
    }
    if (e.touches.length === 1) {
      const t = e.touches[0]

      if (paintMode && isPaintingRef.current) {
        const { gx, gy } = canvasToGrid(t.clientX, t.clientY)
        paintCell(gx, gy)
        return
      }

      if (tokenDragRef.current) {
        const dx = t.clientX - tokenDragRef.current.startX
        const dy = t.clientY - tokenDragRef.current.startY
        const newGx = tokenDragRef.current.origX + Math.round(dx / CELL)
        const newGy = tokenDragRef.current.origY + Math.round(dy / CELL)
        store.moveToken(map.id, tokenDragRef.current.tokenId, newGx, newGy)
      } else if (dragRef.current) {
        dragRef.current.isDragging = true
        setCamera((c) => ({
          ...c,
          x: dragRef.current!.camX + t.clientX - dragRef.current!.startX,
          y: dragRef.current!.camY + t.clientY - dragRef.current!.startY,
        }))
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (paintMode) {
      isPaintingRef.current = false
      return
    }

    if (tokenDragRef.current) {
      tokenDragRef.current = null
      return
    }
    if (dragRef.current && !dragRef.current.isDragging) {
      const t = e.changedTouches[0]
      const { gx, gy } = canvasToGrid(t.clientX, t.clientY)
      if (gx >= 0 && gx < map.gridCols && gy >= 0 && gy < map.gridRows) {
        setAddModal({ open: true, gridX: gx, gridY: gy })
        setTokenForm({ label: '', color: 'amber', shape: 'circle', isPC: false, hp: 10, maxHp: 10 })
      }
    }
    dragRef.current = null
    lastTouchRef.current = null
  }

  const handleWheel = (e: React.WheelEvent) => {
    const scale = e.deltaY < 0 ? 1.1 : 0.9
    setCamera((c) => ({ ...c, zoom: Math.max(0.3, Math.min(3, c.zoom * scale)) }))
  }

  const addToken = () => {
    if (!tokenForm.label.trim()) return
    const token: MapToken = {
      id: crypto.randomUUID(),
      x: addModal.gridX,
      y: addModal.gridY,
      label: tokenForm.label.trim(),
      color: tokenForm.color,
      shape: tokenForm.shape,
      isPC: tokenForm.isPC,
      hp: tokenForm.hp,
      maxHp: tokenForm.maxHp,
    }
    store.addToken(map.id, token)
    setAddModal((a) => ({ ...a, open: false }))
  }

  const selectedToken = map.tokens.find((t) => t.id === selectedTokenId)

  const centerMap = () => {
    const container = containerRef.current
    if (!container) return
    setCamera({
      x: (container.clientWidth - map.gridCols * map.cellSize) / 2,
      y: (container.clientHeight - map.gridRows * map.cellSize) / 2,
      zoom: 1,
    })
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title={map.name}
        subtitle={`${map.gridCols}×${map.gridRows} grid`}
        right={
          <div className="flex gap-2">
            <button
              onClick={() => { setShowDrawTools((s) => !s); setShowFogTools(false); setShowMapList(false) }}
              className={`p-1.5 rounded-lg ${showDrawTools ? 'text-amber-400' : 'text-stone-400 hover:text-stone-200'}`}
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={() => { setShowFogTools((s) => !s); setShowDrawTools(false); setShowMapList(false) }}
              className={`p-1.5 rounded-lg ${showFogTools ? 'text-amber-400' : 'text-stone-400 hover:text-stone-200'}`}
            >
              {map.fogEnabled ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <button
              onClick={() => { setShowMapList((s) => !s); setShowDrawTools(false); setShowFogTools(false) }}
              className={`p-1.5 rounded-lg ${showMapList ? 'text-amber-400' : 'text-stone-400 hover:text-stone-200'}`}
            >
              <Layers size={18} />
            </button>
          </div>
        }
      />

      {/* Map list dropdown */}
      {showMapList && (
        <div className="bg-stone-900 border-b border-stone-700 p-3 space-y-2">
          <p className="section-title">Maps</p>
          {store.maps.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <button
                onClick={() => { store.setActiveMap(m.id); setShowMapList(false) }}
                className={`flex-1 text-left text-sm px-3 py-2 rounded-lg ${
                  m.id === map.id ? 'bg-amber-900/40 text-amber-400' : 'text-stone-300 hover:bg-stone-800'
                }`}
              >
                {m.name}
              </button>
              {store.maps.length > 1 && (
                <button onClick={() => store.deleteMap(m.id)} className="p-1 text-stone-500 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => { store.addMap(`Map ${store.maps.length + 1}`); setShowMapList(false) }}
            className="flex items-center gap-1 text-sm text-amber-500 hover:text-amber-400"
          >
            <Plus size={14} /> New Map
          </button>
        </div>
      )}

      {/* Draw toolbar */}
      {showDrawTools && (
        <div className="bg-stone-900 border-b border-stone-700 p-3 space-y-3">
          <div>
            <p className="section-title mb-2">Background</p>
            <div className="flex gap-2">
              {BG_PRESETS.map(({ label, color }) => (
                <button
                  key={label}
                  onClick={() => store.updateMap(map.id, { bgColor: color })}
                  className={`flex-1 py-1.5 text-xs rounded-lg border font-medium flex items-center justify-center gap-1.5 ${
                    (map.bgColor ?? '#1c1917') === color
                      ? 'border-amber-500 text-amber-400 bg-amber-900/20'
                      : 'border-stone-700 text-stone-400 bg-stone-800'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-stone-600 inline-block flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="section-title">Paint Cells</p>
              <button
                onClick={() => setPaintMode((p) => !p)}
                className={`text-xs px-2 py-0.5 rounded border ${
                  paintMode
                    ? 'bg-amber-900/50 border-amber-600 text-amber-400'
                    : 'border-stone-700 text-stone-500'
                }`}
              >
                {paintMode ? 'On' : 'Off'}
              </button>
              <button
                onClick={() => store.clearPaintedCells(map.id)}
                className="btn-secondary text-xs py-1 px-2 ml-auto"
              >
                Clear All
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {PAINT_COLORS.map(({ label, color }) => (
                <button
                  key={label}
                  title={label}
                  onClick={() => { setPaintColor(color); setPaintMode(true) }}
                  className="w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-transform"
                  style={{
                    backgroundColor: color ?? '#292524',
                    borderColor: paintColor === color && paintMode ? '#f59e0b' : '#44403c',
                    transform: paintColor === color && paintMode ? 'scale(1.15)' : 'scale(1)',
                    ...(color === null && {
                      background: 'repeating-linear-gradient(-45deg, #292524, #292524 3px, #44403c 3px, #44403c 6px)',
                    }),
                  }}
                >
                  {color === null && <span className="text-red-400 text-xs font-bold leading-none">✕</span>}
                </button>
              ))}
            </div>
          </div>

          <button onClick={centerMap} className="btn-secondary text-sm py-1.5 px-3">Center Map</button>
        </div>
      )}

      {/* Fog toolbar */}
      {showFogTools && (
        <div className="bg-stone-900 border-b border-stone-700 p-3 flex flex-wrap gap-2 items-center">
          <button
            onClick={() => store.updateMap(map.id, { fogEnabled: !map.fogEnabled })}
            className={`btn-secondary text-sm py-1.5 px-3 ${map.fogEnabled ? 'bg-amber-900/50 text-amber-400' : ''}`}
          >
            {map.fogEnabled ? 'Fog On' : 'Fog Off'}
          </button>
          <button
            onClick={() => setFogMode((f) => !f)}
            className={`btn-secondary text-sm py-1.5 px-3 ${fogMode ? 'bg-stone-600 text-white' : ''}`}
          >
            {fogMode ? 'Painting Fog' : 'Paint Mode'}
          </button>
          <button onClick={() => store.fillFog(map.id)} className="btn-secondary text-sm py-1.5 px-3">Fill All</button>
          <button onClick={() => store.clearFog(map.id)} className="btn-secondary text-sm py-1.5 px-3">Clear All</button>
          <button onClick={centerMap} className="btn-secondary text-sm py-1.5 px-3 ml-auto">Center</button>
        </div>
      )}

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        style={{ touchAction: 'none' }}
      >
        <canvas ref={canvasRef} className="absolute inset-0" />

        <div className="absolute bottom-3 left-3 bg-stone-900/80 text-stone-400 text-xs px-2 py-1 rounded">
          {Math.round(camera.zoom * 100)}%
        </div>

        {paintMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-stone-900/95 text-stone-300 text-xs px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
            <span
              className="w-3 h-3 rounded inline-block border border-stone-500 flex-none"
              style={{
                backgroundColor: paintColor ?? 'transparent',
                ...(paintColor === null && {
                  background: 'repeating-linear-gradient(-45deg, #292524, #292524 2px, #44403c 2px, #44403c 4px)',
                }),
              }}
            />
            {paintColor === null ? 'Tap cells to erase' : 'Tap to paint'}
            <button
              onClick={() => setPaintMode(false)}
              className="ml-1 text-stone-500 hover:text-stone-200 flex-none touch-manipulation"
              title="Stop painting"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {fogMode && !paintMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-900/90 text-amber-300 text-xs px-3 py-1.5 rounded-full">
            Tap cells to toggle fog
          </div>
        )}
      </div>

      {/* Selected token panel */}
      {selectedToken && (
        <div className="bg-stone-900 border-t border-stone-700 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full border-2 border-stone-600"
                style={{ backgroundColor: TOKEN_COLORS[selectedToken.color] }}
              />
              <span className="font-semibold text-stone-100 text-sm">{selectedToken.label}</span>
              {selectedToken.isPC && <span className="text-xs bg-amber-900/40 text-amber-400 px-1.5 py-0.5 rounded">PC</span>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingToken(selectedToken)}
                className="text-xs btn-secondary py-1 px-2"
              >
                Edit
              </button>
              <button
                onClick={() => { store.deleteToken(map.id, selectedToken.id); setSelectedTokenId(null) }}
                className="text-xs btn-danger py-1 px-2"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
          {selectedToken.maxHp !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400">HP</span>
              <button onClick={() => store.updateToken(map.id, selectedToken.id, { hp: Math.max(0, (selectedToken.hp ?? 0) - 1) })} className="w-7 h-7 rounded bg-stone-700 text-stone-200 text-sm font-bold">−</button>
              <span className="text-sm font-mono text-stone-100 min-w-[60px] text-center">{selectedToken.hp}/{selectedToken.maxHp}</span>
              <button onClick={() => store.updateToken(map.id, selectedToken.id, { hp: Math.min(selectedToken.maxHp!, (selectedToken.hp ?? 0) + 1) })} className="w-7 h-7 rounded bg-stone-700 text-stone-200 text-sm font-bold">+</button>
            </div>
          )}
        </div>
      )}

      {/* Add Token Modal */}
      {addModal.open && (
        <div className="absolute inset-0 bg-black/70 flex items-end z-50" onClick={() => setAddModal((a) => ({ ...a, open: false }))}>
          <div className="bg-stone-900 w-full rounded-t-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-stone-100 font-bold text-base">Add Token at ({addModal.gridX}, {addModal.gridY})</h2>

            <div>
              <label className="section-title block">Label</label>
              <input
                className="input"
                placeholder="e.g. Gorbash"
                value={tokenForm.label}
                onChange={(e) => setTokenForm((f) => ({ ...f, label: e.target.value }))}
                autoFocus
                maxLength={12}
              />
            </div>

            <div>
              <label className="section-title block">Color</label>
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(TOKEN_COLORS) as TokenColor[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setTokenForm((f) => ({ ...f, color: c }))}
                    className="w-8 h-8 rounded-full border-2 transition-transform"
                    style={{
                      backgroundColor: TOKEN_COLORS[c],
                      borderColor: tokenForm.color === c ? '#f59e0b' : '#44403c',
                      transform: tokenForm.color === c ? 'scale(1.2)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="section-title block">Shape</label>
              <div className="flex gap-2">
                {SHAPES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setTokenForm((f) => ({ ...f, shape: s }))}
                    className={`flex-1 py-2 rounded-lg text-sm capitalize border ${
                      tokenForm.shape === s
                        ? 'bg-amber-900/40 border-amber-600 text-amber-400'
                        : 'bg-stone-800 border-stone-700 text-stone-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="section-title block">HP</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={tokenForm.hp}
                  onChange={(e) => setTokenForm((f) => ({ ...f, hp: Number(e.target.value) }))}
                />
              </div>
              <div className="flex-1">
                <label className="section-title block">Max HP</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={tokenForm.maxHp}
                  onChange={(e) => setTokenForm((f) => ({ ...f, maxHp: Number(e.target.value) }))}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-stone-300">
              <input
                type="checkbox"
                checked={tokenForm.isPC}
                onChange={(e) => setTokenForm((f) => ({ ...f, isPC: e.target.checked }))}
                className="accent-amber-500"
              />
              Player Character
            </label>

            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setAddModal((a) => ({ ...a, open: false }))}>Cancel</button>
              <button className="btn-primary flex-1" onClick={addToken}>Add Token</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Token Modal */}
      {editingToken && (
        <div className="absolute inset-0 bg-black/70 flex items-end z-50">
          <div className="bg-stone-900 w-full rounded-t-2xl p-5 space-y-4">
            <h2 className="text-stone-100 font-bold text-base">Edit Token</h2>
            <div>
              <label className="section-title block">Label</label>
              <input
                className="input"
                value={editingToken.label}
                onChange={(e) => setEditingToken((t) => t ? { ...t, label: e.target.value } : t)}
                maxLength={12}
              />
            </div>
            <div>
              <label className="section-title block">HP / Max HP</label>
              <div className="flex gap-3">
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={editingToken.hp ?? 0}
                  onChange={(e) => setEditingToken((t) => t ? { ...t, hp: Number(e.target.value) } : t)}
                />
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={editingToken.maxHp ?? 10}
                  onChange={(e) => setEditingToken((t) => t ? { ...t, maxHp: Number(e.target.value) } : t)}
                />
              </div>
            </div>
            <div>
              <label className="section-title block">Color</label>
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(TOKEN_COLORS) as TokenColor[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setEditingToken((t) => t ? { ...t, color: c } : t)}
                    className="w-8 h-8 rounded-full border-2 transition-transform"
                    style={{
                      backgroundColor: TOKEN_COLORS[c],
                      borderColor: editingToken.color === c ? '#f59e0b' : '#44403c',
                      transform: editingToken.color === c ? 'scale(1.2)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setEditingToken(null)}>Cancel</button>
              <button
                className="btn-primary flex-1"
                onClick={() => {
                  if (editingToken) {
                    store.updateToken(map.id, editingToken.id, editingToken)
                    setEditingToken(null)
                  }
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
