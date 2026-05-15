import { NavLink } from 'react-router-dom'
import {
  Home, Map, Eye, Dices, User, BookOpen, Table2,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',          icon: Home,     label: 'Home',   end: true  },
  { to: '/map',       icon: Map,      label: 'Map'               },
  { to: '/oracle',    icon: Eye,      label: 'Oracle'            },
  { to: '/dice',      icon: Dices,    label: 'Dice'              },
  { to: '/character', icon: User,     label: 'Hero'              },
  { to: '/journal',   icon: BookOpen, label: 'Journal'           },
  { to: '/tables',    icon: Table2,   label: 'Tables'            },
]

export default function BottomNav() {
  return (
    <nav className="flex-none bg-stone-950 border-t border-stone-800 flex safe-bottom">
      {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-1.5 gap-0.5 transition-colors touch-manipulation ${
              isActive
                ? 'text-amber-500'
                : 'text-stone-500 hover:text-stone-300'
            }`
          }
        >
          <Icon size={18} strokeWidth={1.5} />
          <span className="text-[9px] font-medium">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
