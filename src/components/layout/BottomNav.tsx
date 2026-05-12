import { NavLink } from 'react-router-dom'
import {
  Map, Eye, Dices, User, BookOpen, Table2,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/map',       icon: Map,      label: 'Map'      },
  { to: '/oracle',    icon: Eye,      label: 'Oracle'   },
  { to: '/dice',      icon: Dices,    label: 'Dice'     },
  { to: '/character', icon: User,     label: 'Hero'     },
  { to: '/journal',   icon: BookOpen, label: 'Journal'  },
  { to: '/tables',    icon: Table2,   label: 'Tables'   },
]

export default function BottomNav() {
  return (
    <nav className="flex-none bg-stone-950 border-t border-stone-800 flex safe-bottom">
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors touch-manipulation ${
              isActive
                ? 'text-amber-500'
                : 'text-stone-500 hover:text-stone-300'
            }`
          }
        >
          <Icon size={20} strokeWidth={1.5} />
          <span className="text-[10px] font-medium">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
