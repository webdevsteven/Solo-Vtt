import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import BottomNav from './components/layout/BottomNav'
import BackupRestore from './components/BackupRestore'
import WandererSetup from './components/WandererSetup'
import HomePage from './pages/HomePage'
import OraclePage from './pages/OraclePage'
import DicePage from './pages/DicePage'
import CharacterPage from './pages/CharacterPage'
import JournalPage from './pages/JournalPage'
import TablesPage from './pages/TablesPage'
export default function App() {
  const [showBackup, setShowBackup] = useState(false)
  const [showWanderer, setShowWanderer] = useState(false)

  return (
    <BrowserRouter basename="/Solo-Vtt">
      <div className="flex flex-col h-full w-full bg-stone-950 relative">
        <div className="flex-1 flex flex-col min-h-0">
          <Routes>
            <Route path="/" element={<HomePage onSettingsClick={() => setShowBackup(true)} />} />
            <Route path="/oracle" element={<OraclePage />} />
            <Route path="/dice" element={<DicePage />} />
            <Route path="/character" element={<CharacterPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/tables" element={<TablesPage />} />
          </Routes>
        </div>
        <BottomNav />

        {showBackup && (
          <BackupRestore
            onClose={() => setShowBackup(false)}
            onNewWandererGame={() => setShowWanderer(true)}
          />
        )}

        {showWanderer && (
          <WandererSetup onClose={() => setShowWanderer(false)} />
        )}
      </div>
    </BrowserRouter>
  )
}
