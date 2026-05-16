import { NavLink } from 'react-router-dom'
import { useCharacterStore } from '../store/characterStore'
import { useOracleStore } from '../store/oracleStore'
import { useDiceStore } from '../store/diceStore'
import { useJournalStore } from '../store/journalStore'
import { Map, Eye, Dices, User, BookOpen, Table2, Settings } from 'lucide-react'

const SECTIONS = [
  { to: '/map',       icon: Map,      label: 'Map',     desc: 'Tactical grid'   },
  { to: '/oracle',    icon: Eye,      label: 'Oracle',  desc: 'Ask the fates'   },
  { to: '/dice',      icon: Dices,    label: 'Dice',    desc: 'Roll dice'       },
  { to: '/character', icon: User,     label: 'Hero',    desc: 'Character sheet' },
  { to: '/journal',   icon: BookOpen, label: 'Journal', desc: 'Adventure log'   },
  { to: '/tables',    icon: Table2,   label: 'Tables',  desc: 'Random tables'   },
]

export default function HomePage({ onSettingsClick }: { onSettingsClick?: () => void }) {
  const char = useCharacterStore().activeCharacter()
  const oracle = useOracleStore()
  const lastRoll = useDiceStore().history[0]
  const journalStore = useJournalStore()

  const primaryResource = (char.fields ?? []).find((f) => f.type === 'resource')
  const resPct = primaryResource && primaryResource.max > 0
    ? primaryResource.value / primaryResource.max : 1
  const resColor = resPct > 0.5 ? '#22c55e' : resPct > 0.25 ? '#f59e0b' : '#ef4444'
  const currentScene = oracle.scenes.find((s) => s.id === oracle.currentSceneId)
  const recentEntry = journalStore.entries[0]

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-2">

      {/* ── Title / hero ─────────────────────────────────────────────────── */}
      <div className="relative px-6 pt-10 pb-7 text-center">
        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-stone-600 hover:text-stone-400 hover:bg-stone-800/60 transition-colors"
            title="Settings"
          >
            <Settings size={16} strokeWidth={1.5} />
          </button>
        )}
        <p className="text-stone-600 text-xs tracking-[0.3em] uppercase mb-2">Solo Roleplaying</p>
        <h1
          className="font-display font-bold text-5xl text-amber-400 leading-none"
          style={{ textShadow: '0 0 24px rgba(217,119,6,0.45), 0 0 6px rgba(217,119,6,0.2)' }}
        >
          SOLO VTT
        </h1>
        <div className="flex items-center justify-center gap-3 mt-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-stone-700" />
          <span className="text-stone-700 text-xs tracking-widest">⚔</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-stone-700" />
        </div>
      </div>

      {/* ── Active character ─────────────────────────────────────────────── */}
      <div className="px-4 mb-3">
        <NavLink to="/character">
          <div className="bg-stone-900 border border-stone-700 hover:border-amber-800/70 rounded-xl p-4 transition-colors active:bg-stone-800">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-amber-900/30 border border-amber-800/50 flex items-center justify-center flex-none">
                <span className="font-display font-bold text-amber-400 text-xl leading-none">
                  {char.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-stone-100 font-semibold text-sm truncate">{char.name}</p>
                <p className="text-stone-500 text-xs truncate">{char.concept || char.system || 'Solo Adventurer'}</p>
              </div>
              {primaryResource && (
                <div className="text-right flex-none">
                  <p className="text-xs text-stone-600 uppercase tracking-wide">{primaryResource.name}</p>
                  <p className="font-mono font-bold text-sm" style={{ color: resColor }}>
                    {primaryResource.value}<span className="text-stone-600 font-normal">/{primaryResource.max}</span>
                  </p>
                </div>
              )}
            </div>
            {primaryResource && (
              <div className="mt-2.5 bg-stone-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${resPct * 100}%`, backgroundColor: resColor }}
                />
              </div>
            )}
          </div>
        </NavLink>
      </div>

      {/* ── Current scene ────────────────────────────────────────────────── */}
      {currentScene ? (
        <div className="px-4 mb-3">
          <NavLink to="/oracle">
            <div className="bg-stone-900 border border-stone-700 hover:border-amber-800/70 rounded-xl p-4 transition-colors active:bg-stone-800">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-stone-600 uppercase tracking-widest font-bold mb-0.5">Active Scene</p>
                  <p className="text-stone-100 text-sm font-semibold truncate">
                    #{currentScene.number} — {currentScene.title}
                  </p>
                  {currentScene.setup && (
                    <p className="text-stone-500 text-xs mt-0.5 line-clamp-1 italic">{currentScene.setup}</p>
                  )}
                </div>
                <div className="flex-none text-center pl-2">
                  <p className="text-[10px] text-stone-600 uppercase tracking-wide">Chaos</p>
                  <p
                    className="font-display font-bold text-2xl leading-tight"
                    style={{ color: `hsl(${30 - oracle.chaosFactor * 3}, 80%, 60%)` }}
                  >
                    {oracle.chaosFactor}
                  </p>
                </div>
              </div>
            </div>
          </NavLink>
        </div>
      ) : (
        <div className="px-4 mb-3">
          <NavLink to="/oracle">
            <div className="bg-stone-900/60 border border-dashed border-stone-700 rounded-xl p-4 text-center transition-colors hover:border-stone-500">
              <p className="text-stone-600 text-sm">No active scene</p>
              <p className="text-stone-700 text-xs mt-0.5">Tap to open Oracle and begin</p>
            </div>
          </NavLink>
        </div>
      )}

      {/* ── Feature grid ─────────────────────────────────────────────────── */}
      <div className="px-4 mb-3">
        <div className="grid grid-cols-3 gap-2">
          {SECTIONS.map(({ to, icon: Icon, label, desc }) => (
            <NavLink key={to} to={to}>
              <div className="bg-stone-900 border border-stone-800 hover:border-stone-600 rounded-xl py-3.5 px-2 flex flex-col items-center gap-1.5 transition-all active:bg-stone-800 active:scale-95">
                <Icon size={20} className="text-stone-400" strokeWidth={1.5} />
                <span className="text-stone-200 text-xs font-semibold">{label}</span>
                <span className="text-stone-600 text-[10px] text-center leading-tight">{desc}</span>
              </div>
            </NavLink>
          ))}
        </div>
      </div>

      {/* ── Recent roll ──────────────────────────────────────────────────── */}
      {lastRoll && (
        <div className="px-4 mb-3">
          <NavLink to="/dice">
            <div className="bg-stone-900 border border-stone-800 hover:border-stone-600 rounded-xl px-4 py-3 flex items-center gap-3 transition-colors active:bg-stone-800">
              <Dices size={16} className="text-stone-600 flex-none" strokeWidth={1.5} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-stone-600 uppercase tracking-wide">Last Roll</p>
                <p className="text-stone-400 text-xs truncate font-mono">{lastRoll.notation}</p>
              </div>
              <p className="font-display font-bold text-2xl text-amber-400 flex-none">{lastRoll.total}</p>
            </div>
          </NavLink>
        </div>
      )}

      {/* ── Most recent journal entry ─────────────────────────────────────── */}
      {recentEntry && (
        <div className="px-4 mb-3">
          <NavLink to="/journal">
            <div className="bg-stone-900 border border-stone-800 hover:border-stone-600 rounded-xl px-4 py-3 flex items-start gap-3 transition-colors active:bg-stone-800">
              <BookOpen size={16} className="text-stone-600 flex-none mt-0.5" strokeWidth={1.5} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-stone-600 uppercase tracking-wide">Latest Entry</p>
                <p className="text-stone-300 text-xs font-medium truncate">{recentEntry.title}</p>
                <p className="text-stone-600 text-xs line-clamp-1 mt-0.5">{recentEntry.body}</p>
              </div>
            </div>
          </NavLink>
        </div>
      )}
    </div>
  )
}
