import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  left?: ReactNode
  right?: ReactNode
}

export default function TopBar({ title, subtitle, left, right }: Props) {
  return (
    <header className="flex-none bg-stone-950 border-b border-stone-800 flex items-center px-4 py-3 gap-3 safe-top">
      {left && <div className="flex-none">{left}</div>}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-bold text-stone-100 truncate leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-xs text-stone-500 truncate leading-tight">{subtitle}</p>
        )}
      </div>
      {right && <div className="flex-none">{right}</div>}
    </header>
  )
}
