import { useRouter } from 'next/router'

const navItems = [
  { href: '/member', label: '動画', icon: (active) => (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="2" y="2" width="8" height="8" rx="2" stroke={active ? '#E85D04' : '#ccc'} strokeWidth="1.5"/>
      <rect x="12" y="2" width="8" height="8" rx="2" stroke={active ? '#E85D04' : '#ccc'} strokeWidth="1.5"/>
      <rect x="2" y="12" width="8" height="8" rx="2" stroke={active ? '#E85D04' : '#ccc'} strokeWidth="1.5"/>
      <rect x="12" y="12" width="8" height="8" rx="2" stroke={active ? '#E85D04' : '#ccc'} strokeWidth="1.5"/>
    </svg>
  )},
  { href: '/member/habit', label: '習慣', icon: (active) => (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="3" y="3" width="16" height="16" rx="3" stroke={active ? '#E85D04' : '#ccc'} strokeWidth="1.5"/>
      <polyline points="7,11 9.5,13.5 15,8" stroke={active ? '#E85D04' : '#ccc'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )},
  { href: '/member/mypage', label: 'マイページ', icon: (active) => (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="8" r="4" stroke={active ? '#E85D04' : '#ccc'} strokeWidth="1.5"/>
      <path d="M3 19c0-4 3.6-7 8-7s8 3 8 7" stroke={active ? '#E85D04' : '#ccc'} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )},
]

export default function BottomNav() {
  const router = useRouter()
  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '0.5px solid #ebebeb', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', paddingBottom: 'env(safe-area-inset-bottom, 16px)', paddingTop: '8px', zIndex: 50 }}>
      {navItems.map(item => {
        const active = router.pathname === item.href
        return (
          <button key={item.href} onClick={() => router.push(item.href)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', WebkitTapHighlightColor: 'transparent' }}>
            {item.icon(active)}
            <span style={{ fontSize: '10px', color: active ? '#E85D04' : '#ccc', fontWeight: active ? '500' : '400' }}>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
