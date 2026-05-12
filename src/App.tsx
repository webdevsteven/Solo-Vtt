import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import BottomNav from './components/layout/BottomNav'
import BackupRestore from './components/BackupRestore'
import MapPage from './pages/MapPage'
import OraclePage from './pages/OraclePage'
import DicePage from './pages/DicePage'
import CharacterPage from './pages/CharacterPage'
import JournalPage from './pages/JournalPage'
import TablesPage from './pages/TablesPage'
import { Settings } from 'lucide-react'

export default function App() {
  const [showBackup, setShowBackup] = useState(false)

  return (
    <BrowserRouter>
      <div className="flex flex-col h-full w-full bg-stone-950 relative">
        <div className="flex-1 flex flex-col min-h-0">
          <Routes>
            <Route path="/" element={<Navigate to="/map" replace />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/oracle" element={<OraclePage />} />
            <Route path="/dice" element={<DicePage />} />
            <Route path="/character" element={<CharacterPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/tables" element={<TablesPage />} />
          </Routes>
        </div>
        <BottomNav />

        {/* Gear / Backup button — bottom left above nav */}
        <button
          onClick={() => setShowBackup(true)}
          className="absolute bottom-[calc(56px+12px)] left-4 w-10 h-10 rounded-full
                     bg-stone-800 border border-stone-700 text-stone-500 hover:text-stone-300
                     flex items-center justify-center shadow-lg z-40 transition-colors"
          title="Backup & Restore"
        >
          <Settings size={18} />
        </button>

        {showBackup && (
          <BackupRestore onClose={() => setShowBackup(false)} />
        )}
      </div>
    </BrowserRouter>
  )
}
