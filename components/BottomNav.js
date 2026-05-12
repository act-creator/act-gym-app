import { useRouter } from 'next/router'

const navItems = [
  { href: '/member', icon: '🏠', label: 'ホーム' },
  { href: '/member/booking', icon: '📅', label: '予約' },
  { href: '/member/log', icon: '📝', label: '記録' },
  { href: '/member/training', icon: '💪', label: 'メニュー' },
]

export default function BottomNav() {
  const router = useRouter()
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 grid grid-cols-4 py-2 px-2 z-50 max-w-lg mx-auto">
      {navItems.map(item => {
        const active = router.pathname === item.href
        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className={`flex flex-col items-center gap-1 py-1 rounded-xl transition-colors ${active ? 'text-act-green' : 'text-gray-400'}`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className={`text-xs ${active ? 'font-medium' : ''}`}>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
