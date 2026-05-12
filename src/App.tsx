import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import BottomNav from './components/layout/BottomNav'
import MapPage from './pages/MapPage'
import OraclePage from './pages/OraclePage'
import DicePage from './pages/DicePage'
import CharacterPage from './pages/CharacterPage'
import JournalPage from './pages/JournalPage'
import TablesPage from './pages/TablesPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col h-full w-full bg-stone-950">
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
      </div>
    </BrowserRouter>
  )
}
