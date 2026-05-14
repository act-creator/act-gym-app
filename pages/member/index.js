import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'
import BottomNav from '../../components/BottomNav'

export default function MemberHome() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [bookings, setBookings] = useState([])
  const [latestLog, setLatestLog] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      const { data: bk } = await supabase.from('bookings').select('*').eq('user_id', user.id).gte('date', new Date().toISOString().split('T')[0]).order('date').limit(2)
      setBookings(bk || [])
      const { data: log } = await supabase.from('body_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(1)
      setLatestLog(log?.[0] || null)
      setLoading(false)
    }
    load()
  }, [])

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/') }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div style={{ color: '#ccc' }}>読み込み中...</div></div>

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f5', paddingBottom: '80px' }}>
      {/* ヘッダー */}
      <div style={{ background: '#fff', borderBottom: '0.5px solid #ebebeb', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img src="/act_logo_1.jpg" alt="Act." style={{ height: '32px', width: 'auto' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: '#999' }}>{profile?.name} さん</span>
          <button onClick={handleLogout} style={{ fontSize: '11px', color: '#ccc', border: '0.5px solid #ebebeb', padding: '4px 10px', borderRadius: '20px', background: 'none', cursor: 'pointer' }}>ログアウト</button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* 体重・体脂肪 */}
        {latestLog && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px', letterSpacing: '0.5px' }}>体重</div>
              <div style={{ fontSize: '26px', fontWeight: '500', color: '#1a1a1a' }}>{latestLog.weight}<span style={{ fontSize: '12px', color: '#ccc', fontWeight: '400' }}> kg</span></div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px', letterSpacing: '0.5px' }}>体脂肪率</div>
              <div style={{ fontSize: '26px', fontWeight: '500', color: '#1a1a1a' }}>{latestLog.body_fat}<span style={{ fontSize: '12px', color: '#ccc', fontWeight: '400' }}> %</span></div>
            </div>
          </div>
        )}

        {/* 予約 */}
        <div className="card" style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', color: '#aaa', letterSpacing: '1px', marginBottom: '12px' }}>直近の予約</div>
          {bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <p style={{ fontSize: '13px', color: '#ccc', marginBottom: '12px' }}>予約がありません</p>
              <button onClick={() => router.push('/member/booking')} className="btn-primary">予約を入れる</button>
            </div>
          ) : bookings.map(b => (
            <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid #f5f5f5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E85D04', flexShrink: 0 }}></div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>{b.menu}</div>
                  <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{b.date} {b.time}</div>
                </div>
              </div>
              <span className={b.status === 'confirmed' ? 'badge-green' : 'badge-amber'}>{b.status === 'confirmed' ? '確定' : '確認中'}</span>
            </div>
          ))}
        </div>

        {/* クイックアクション */}
        <div style={{ fontSize: '11px', color: '#aaa', letterSpacing: '1.5px', marginBottom: '10px' }}>QUICK ACTION</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
          <button onClick={() => router.push('/member/booking')} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '20px 12px', cursor: 'pointer', border: '0.5px solid #ebebeb', textAlign: 'center', background: '#fff' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#FFF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 22 22" fill="none"><rect x="2" y="4" width="18" height="15" rx="2" stroke="#E85D04" strokeWidth="1.5"/><line x1="7" y1="2" x2="7" y2="6" stroke="#E85D04" strokeWidth="1.5" strokeLinecap="round"/><line x1="15" y1="2" x2="15" y2="6" stroke="#E85D04" strokeWidth="1.5" strokeLinecap="round"/><line x1="2" y1="9" x2="20" y2="9" stroke="#E85D04" strokeWidth="1.5"/></svg>
            </div>
            <span style={{ fontSize: '12px', fontWeight: '500', color: '#1a1a1a' }}>予約</span>
          </button>
          <button onClick={() => router.push('/member/log')} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '20px 12px', cursor: 'pointer', border: '0.5px solid #ebebeb', textAlign: 'center', background: '#fff' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#FFF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 22 22" fill="none"><rect x="4" y="2" width="14" height="18" rx="2" stroke="#E85D04" strokeWidth="1.5"/><line x1="8" y1="8" x2="14" y2="8" stroke="#E85D04" strokeWidth="1.5" strokeLinecap="round"/><line x1="8" y1="11" x2="14" y2="11" stroke="#E85D04" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <span style={{ fontSize: '12px', fontWeight: '500', color: '#1a1a1a' }}>記録</span>
          </button>
        </div>


      </div>
      <BottomNav />
    </div>
  )
}
