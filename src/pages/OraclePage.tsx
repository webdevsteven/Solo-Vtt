import { useState } from 'react'
import TopBar from '../components/layout/TopBar'
import { useOracleStore, ODDS_LABELS, EVENT_FOCUS } from '../store/oracleStore'
import type { OddsLabel, OracleAnswer, Scene } from '../types'
import SaveToJournal from '../components/SaveToJournal'
import { Trash2, Plus, X, ChevronDown, ChevronRight, Edit2, Check } from 'lucide-react'

const ANSWER_STYLE: Record<OracleAnswer, { bg: string; text: string; glow: string }> = {
  'Exceptional Yes': { bg: 'bg-emerald-900/40', text: 'text-emerald-300', glow: 'glow-gold' },
  'Yes':             { bg: 'bg-emerald-950/60', text: 'text-emerald-400', glow: '' },
  'No':              { bg: 'bg-red-950/60',     text: 'text-red-400',     glow: '' },
  'Exceptional No':  { bg: 'bg-red-900/40',     text: 'text-red-300',     glow: 'glow-red' },
}

type Panel = 'oracle' | 'scenes' | 'threads'

function SceneCard({ scene, isActive }: { scene: Scene; isActive: boolean }) {
  const store = useOracleStore()
  const [expanded, setExpanded] = useState(isActive)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState(scene.title)
  const [editingSetup, setEditingSetup] = useState(false)
  const [setupInput, setSetupInput] = useState(scene.setup)

  const saveTitle = () => {
    store.updateScene(scene.id, { title: titleInput.trim() || scene.title })
    setEditingTitle(false)
  }

  const saveSetup = () => {
    store.updateScene(scene.id, { setup: setupInput })
    setEditingSetup(false)
  }

  return (
    <div className={`card border ${isActive ? 'border-amber-700/60 bg-stone-800/60' : 'border-stone-700'}`}>
      {/* Header */}
      <div className="flex items-center gap-2 min-w-0">
        <button onClick={() => setExpanded((s) => !s)} className="flex-none text-stone-600">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <span className="text-xs text-stone-600 flex-none font-mono">#{scene.number}</span>

        {editingTitle ? (
          <input
            className="input flex-1 text-sm py-1"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') saveTitle() }}
            autoFocus
          />
        ) : (
          <span
            className={`flex-1 font-semibold text-sm truncate ${isActive ? 'text-amber-200' : 'text-stone-100'}`}
            onClick={() => setExpanded((s) => !s)}
          >
            {scene.title}
          </span>
        )}

        {isActive && !editingTitle && (
          <span className="text-xs bg-amber-900/60 text-amber-400 px-1.5 py-0.5 rounded flex-none">Active</span>
        )}

        {editingTitle ? (
          <button onClick={saveTitle} className="p-1 text-amber-500 flex-none"><Check size={14} /></button>
        ) : (
          <button onClick={() => { setTitleInput(scene.title); setEditingTitle(true) }}
            className="p-1 text-stone-600 hover:text-stone-300 flex-none touch-manipulation"><Edit2 size={13} /></button>
        )}
        <button
          onClick={() => store.deleteScene(scene.id)}
          className="p-1 text-stone-600 hover:text-red-400 flex-none touch-manipulation"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3">
          {/* Setup */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-stone-600 uppercase tracking-wide">Setup</span>
              {!editingSetup && (
                <button onClick={() => { setSetupInput(scene.setup); setEditingSetup(true) }}
                  className="text-xs text-stone-600 hover:text-stone-400 flex items-center gap-0.5 touch-manipulation">
                  <Edit2 size={11} /> Edit
                </button>
              )}
            </div>
            {editingSetup ? (
              <div className="space-y-2">
                <textarea
                  className="textarea text-sm"
                  rows={2}
                  value={setupInput}
                  onChange={(e) => setSetupInput(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={() => setEditingSetup(false)} className="btn-secondary text-xs py-1 flex-1">Cancel</button>
                  <button onClick={saveSetup} className="btn-primary text-xs py-1 flex-1">Save</button>
                </div>
              </div>
            ) : (
              <p className="text-stone-400 text-sm italic">
                {scene.setup || <span className="text-stone-600">No setup written.</span>}
              </p>
            )}
          </div>

          {/* Notes / Outcome */}
          <div>
            <span className="text-xs text-stone-600 uppercase tracking-wide block mb-1">Notes</span>
            <textarea
              className="textarea text-sm"
              rows={3}
              placeholder="What happened… record outcomes, twists, discoveries."
              value={scene.outcome ?? ''}
              onChange={(e) => store.updateScene(scene.id, { outcome: e.target.value })}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-stone-600">Chaos {scene.chaosFactor}</span>
            {scene.isAlt && <span className="text-xs text-amber-600 font-medium">⚡ Altered</span>}
            {scene.isInterrupted && <span className="text-xs text-red-500 font-medium">⚡ Interrupted</span>}
            <div className="flex-1" />
            {!isActive && (
              <button
                onClick={() => store.setCurrentScene(scene.id)}
                className="text-xs text-stone-500 hover:text-amber-400 border border-stone-700 px-2 py-1 rounded touch-manipulation"
              >
                Set Active
              </button>
            )}
          </div>

          {isActive && (
            <div className="flex gap-2">
              <button
                onClick={() => store.adjustChaos(1)}
                className="btn-secondary text-xs py-1.5 flex-1"
              >
                Chaos +1
              </button>
              <button
                onClick={() => store.adjustChaos(-1)}
                className="btn-secondary text-xs py-1.5 flex-1"
              >
                Chaos −1
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function OraclePage() {
  const store = useOracleStore()
  const [question, setQuestion] = useState('')
  const [odds, setOdds] = useState<OddsLabel>('Fifty-Fifty')
  const [activePanel, setActivePanel] = useState<Panel>('oracle')
  const [lastRoll, setLastRoll] = useState<ReturnType<typeof store.askOracle> | null>(null)
  const [rolling, setRolling] = useState(false)
  const [newThread, setNewThread] = useState('')
  const [newNpc, setNewNpc] = useState('')
  const [newSceneTitle, setNewSceneTitle] = useState('')
  const [newSceneSetup, setNewSceneSetup] = useState('')

  const ask = async () => {
    if (!question.trim()) return
    setRolling(true)
    await new Promise((r) => setTimeout(r, 400))
    const result = store.askOracle(question.trim(), odds)
    setLastRoll(result)
    setRolling(false)
    setQuestion('')
  }

  const randomEventFocus = () =>
    EVENT_FOCUS[Math.floor(Math.random() * EVENT_FOCUS.length)]

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Oracle"
        subtitle="Mythic GME · Ask the fates"
        right={
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500">Chaos</span>
            <button onClick={() => store.adjustChaos(-1)} className="w-7 h-7 rounded bg-stone-800 text-stone-300 font-bold text-sm">−</button>
            <span
              className="text-lg font-bold w-6 text-center"
              style={{ color: `hsl(${30 - store.chaosFactor * 3}, 80%, 60%)` }}
            >
              {store.chaosFactor}
            </span>
            <button onClick={() => store.adjustChaos(1)} className="w-7 h-7 rounded bg-stone-800 text-stone-300 font-bold text-sm">+</button>
          </div>
        }
      />

      {/* Panel tabs */}
      <div className="flex-none flex border-b border-stone-800 bg-stone-950">
        {(['oracle', 'scenes', 'threads'] as Panel[]).map((p) => (
          <button
            key={p}
            onClick={() => setActivePanel(p)}
            className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activePanel === p
                ? 'text-amber-500 border-b-2 border-amber-500'
                : 'text-stone-500 hover:text-stone-300'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ── Oracle Panel ── */}
        {activePanel === 'oracle' && (
          <div className="p-4 space-y-4">
            {/* Odds selector */}
            <div>
              <p className="section-title">Odds</p>
              <div className="grid grid-cols-3 gap-1.5">
                {ODDS_LABELS.map((o) => (
                  <button
                    key={o}
                    onClick={() => setOdds(o)}
                    className={`text-xs py-2 px-1 rounded-lg border transition-colors ${
                      odds === o
                        ? 'bg-amber-900/40 border-amber-600 text-amber-400'
                        : 'bg-stone-800 border-stone-700 text-stone-400 hover:border-stone-600'
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            {/* Question input */}
            <div>
              <p className="section-title">Question</p>
              <textarea
                className="textarea"
                rows={2}
                placeholder="Is the guard sleeping?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask() } }}
              />
            </div>

            <button
              onClick={ask}
              disabled={!question.trim() || rolling}
              className={`btn-primary w-full text-base ${rolling ? 'oracle-thinking opacity-70' : ''}`}
            >
              {rolling ? 'Consulting the fates…' : 'Ask Oracle'}
            </button>

            {/* Latest result */}
            {lastRoll && (
              <div className={`card ${ANSWER_STYLE[lastRoll.answer].bg} border-stone-600`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-stone-400 text-sm mb-1 italic flex-1">"{lastRoll.question}"</p>
                  <SaveToJournal
                    entry={{
                      title: `Oracle: "${lastRoll.question}"`,
                      body: `Answer: ${lastRoll.answer}\nOdds: ${lastRoll.odds} · Roll: ${lastRoll.roll} · Chaos: ${lastRoll.chaosFactor}${lastRoll.sceneAlt ? '\n⚡ Scene Alteration!' : ''}${lastRoll.randomEvent ? '\n🎲 Random Event' : ''}`,
                      tag: 'note',
                    }}
                  />
                </div>
                <p className={`text-3xl font-bold font-display ${ANSWER_STYLE[lastRoll.answer].text} ${ANSWER_STYLE[lastRoll.answer].glow}`}>
                  {lastRoll.answer}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-stone-500">
                  <span>Roll: {lastRoll.roll}</span>
                  <span>·</span>
                  <span>{lastRoll.odds}</span>
                  {lastRoll.sceneAlt && (
                    <span className="text-amber-400 font-semibold">⚡ Scene Alteration!</span>
                  )}
                  {lastRoll.randomEvent && (
                    <span className="text-purple-400 font-semibold">
                      🎲 Random Event: {randomEventFocus()}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* History */}
            {store.history.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="section-title mb-0">History</p>
                  <button
                    onClick={store.clearHistory}
                    className="text-xs text-stone-500 hover:text-red-400 flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Clear
                  </button>
                </div>
                <div className="space-y-2">
                  {store.history.slice(0, 20).map((r) => {
                    const style = ANSWER_STYLE[r.answer]
                    return (
                      <div key={r.id} className={`rounded-lg p-3 ${style.bg} border border-stone-700`}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-stone-300 text-sm flex-1">{r.question}</p>
                          <div className="flex items-center gap-1 flex-none">
                            <span className={`text-sm font-bold ${style.text}`}>{r.answer}</span>
                            <SaveToJournal
                              size={14}
                              entry={{
                                title: `Oracle: "${r.question}"`,
                                body: `Answer: ${r.answer}\nOdds: ${r.odds} · Roll: ${r.roll} · Chaos: ${r.chaosFactor}`,
                                tag: 'note',
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-1 text-xs text-stone-600">
                          <span>{r.odds}</span>
                          <span>·</span>
                          <span>d100={r.roll}</span>
                          <span>·</span>
                          <span>Chaos {r.chaosFactor}</span>
                          {r.sceneAlt && <span className="text-amber-600">⚡ Alt</span>}
                          {r.randomEvent && <span className="text-purple-600">🎲 Event</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Scenes Panel ── */}
        {activePanel === 'scenes' && (
          <div className="p-4 space-y-3">
            {/* New scene form */}
            <div className="card space-y-2.5">
              <input
                className="input"
                placeholder="Scene title…"
                value={newSceneTitle}
                onChange={(e) => setNewSceneTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && newSceneTitle.trim()) {
                  store.addScene(newSceneTitle.trim(), newSceneSetup.trim())
                  setNewSceneTitle(''); setNewSceneSetup('')
                }}}
              />
              <textarea
                className="textarea text-sm"
                rows={2}
                placeholder="Setup / what you expect to happen… (optional)"
                value={newSceneSetup}
                onChange={(e) => setNewSceneSetup(e.target.value)}
              />
              <button
                className="btn-primary w-full"
                disabled={!newSceneTitle.trim()}
                onClick={() => {
                  if (!newSceneTitle.trim()) return
                  store.addScene(newSceneTitle.trim(), newSceneSetup.trim())
                  setNewSceneTitle('')
                  setNewSceneSetup('')
                }}
              >
                Begin Scene
              </button>
            </div>

            {store.scenes.length === 0 && (
              <p className="text-stone-600 text-sm text-center py-8">No scenes yet. Start your adventure!</p>
            )}

            {[...store.scenes].reverse().map((scene) => (
              <SceneCard
                key={scene.id}
                scene={scene}
                isActive={store.currentSceneId === scene.id}
              />
            ))}
          </div>
        )}

        {/* ── Threads & NPCs Panel ── */}
        {activePanel === 'threads' && (
          <div className="p-4 space-y-5">
            {/* Threads */}
            <div>
              <p className="section-title">Active Threads</p>
              <div className="flex gap-2 mb-3">
                <input
                  className="input flex-1"
                  placeholder="New thread…"
                  value={newThread}
                  onChange={(e) => setNewThread(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newThread.trim()) {
                      store.addThread(newThread.trim())
                      setNewThread('')
                    }
                  }}
                />
                <button
                  onClick={() => { if (newThread.trim()) { store.addThread(newThread.trim()); setNewThread('') } }}
                  className="btn-primary px-3"
                >
                  <Plus size={16} />
                </button>
              </div>
              {store.threads.length === 0 && (
                <p className="text-stone-600 text-sm">No active threads.</p>
              )}
              <div className="space-y-1.5">
                {store.threads.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 bg-stone-800 rounded-lg px-3 py-2">
                    <span className="text-stone-400 text-sm flex-none">{i + 1}.</span>
                    <span className="text-stone-200 text-sm flex-1">{t}</span>
                    <button onClick={() => store.removeThread(t)} className="text-stone-600 hover:text-red-400">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* NPCs */}
            <div>
              <p className="section-title">NPCs</p>
              <div className="flex gap-2 mb-3">
                <input
                  className="input flex-1"
                  placeholder="NPC name…"
                  value={newNpc}
                  onChange={(e) => setNewNpc(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newNpc.trim()) {
                      store.addNpc(newNpc.trim())
                      setNewNpc('')
                    }
                  }}
                />
                <button
                  onClick={() => { if (newNpc.trim()) { store.addNpc(newNpc.trim()); setNewNpc('') } }}
                  className="btn-primary px-3"
                >
                  <Plus size={16} />
                </button>
              </div>
              {store.npcs.length === 0 && (
                <p className="text-stone-600 text-sm">No NPCs yet.</p>
              )}
              <div className="space-y-1.5">
                {store.npcs.map((n, i) => (
                  <div key={i} className="flex items-center gap-2 bg-stone-800 rounded-lg px-3 py-2">
                    <span className="text-stone-400 text-sm flex-none">{i + 1}.</span>
                    <span className="text-stone-200 text-sm flex-1">{n}</span>
                    <button onClick={() => store.removeNpc(n)} className="text-stone-600 hover:text-red-400">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Chaos Factor display */}
            <div className="card text-center">
              <p className="section-title">Current Chaos Factor</p>
              <p
                className="text-6xl font-bold font-display"
                style={{ color: `hsl(${30 - store.chaosFactor * 3}, 80%, 60%)` }}
              >
                {store.chaosFactor}
              </p>
              <p className="text-stone-500 text-xs mt-1">
                {store.chaosFactor <= 3 ? 'Things are under control' :
                 store.chaosFactor <= 6 ? 'Things are getting complicated' :
                 'Chaos reigns — anything can happen!'}
              </p>
              <div className="flex justify-center gap-4 mt-3">
                <button onClick={() => store.adjustChaos(-1)} className="btn-secondary px-6">−1</button>
                <button onClick={() => store.adjustChaos(1)} className="btn-secondary px-6">+1</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
