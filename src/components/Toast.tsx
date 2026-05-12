import { useEffect, useRef } from 'react'
import { CheckCircle } from 'lucide-react'

interface Props {
  message: string
  visible: boolean
  onHide: () => void
}

export default function Toast({ message, visible, onHide }: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (visible) {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(onHide, 2000)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [visible, onHide])

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2
        bg-emerald-900 border border-emerald-700 text-emerald-200 text-sm font-semibold
        px-4 py-2.5 rounded-full shadow-lg transition-all duration-300 pointer-events-none
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
    >
      <CheckCircle size={16} />
      {message}
    </div>
  )
}
