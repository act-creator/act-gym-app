import { useRouter } from 'next/router'

const navItems = [
  { href: '/member', label: 'ホーム', icon: (active) => (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M3 10L11 3L19 10V19H14V14H8V19H3V10Z" stroke={active ? '#E85D04' : '#ccc'} strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  )},
  { href: '/member/habit', label: '習慣', icon: (active) => (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="3" y="3" width="16" height="16" rx="3" stroke={active ? '#E85D04' : '#ccc'} strokeWidth="1.5"/>
      <polyline points="7,11 9.5,13.5 15,8" stroke={active ? '#E85D04' : '#ccc'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )},
  { href: '/member/log', label: '記録', icon: (active) => (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="4" y="2" width="14" height="18" rx="2" stroke={active ? '#E85D04' : '#ccc'} strokeWidth="1.5"/>
      <line x1="8" y1="8" x2="14" y2="8" stroke={active ? '#E85D04' : '#ccc'} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="8" y1="11" x2="14" y2="11" stroke={active ? '#E85D04' : '#ccc'} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="8" y1="14" x2="11" y2="14" stroke={active ? '#E85D04' : '#ccc'} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )},
  { href: '/member/training', label: 'メニュー', icon: (active) => (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="3" stroke={active ? '#E85D04' : '#ccc'} strokeWidth="1.5"/>
      <line x1="2" y1="11" x2="8" y2="11" stroke={active ? '#E85D04' : '#ccc'} strokeWidth="1.5"/>
      <line x1="14" y1="11" x2="20" y2="11" stroke={active ? '#E85D04' : '#ccc'} strokeWidth="1.5"/>
      <rect x="2" y="9" width="2" height="4" rx="1" stroke={active ? '#E85D04' : '#ccc'} strokeWidth="1"/>
      <rect x="18" y="9" width="2" height="4" rx="1" stroke={active ? '#E85D04' : '#ccc'} strokeWidth="1"/>
    </svg>
  )},
]

export default function BottomNav() {
  const router = useRouter()
  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '0.5px solid #ebebeb', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', paddingBottom: '16px', paddingTop: '8px', zIndex: 50 }}>
      {navItems.map(item => {
        const active = router.pathname === item.href
        return (
          <button key={item.href} onClick={() => router.push(item.href)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            {item.icon(active)}
            <span style={{ fontSize: '10px', color: active ? '#E85D04' : '#ccc', fontWeight: active ? '500' : '400' }}>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
