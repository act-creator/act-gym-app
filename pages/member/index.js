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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-gray-400">読み込み中...</div></div>

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-act-light rounded-full flex items-center justify-center">
            <span className="text-act-dark font-bold text-sm">{profile?.name?.charAt(0) || 'U'}</span>
          </div>
          <div>
            <p className="text-xs text-gray-400">おはようございます</p>
            <p className="text-sm font-medium text-gray-800">{profile?.name} さん</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-xs text-gray-400 border border-gray-200 px-3 py-1 rounded-full">ログアウト</button>
      </div>

      <div className="p-4 space-y-4">
        {latestLog && (
          <div className="card">
            <p className="text-xs text-gray-400 mb-3">最新の記録</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">体重</p>
                <p className="text-2xl font-bold text-gray-800">{latestLog.weight}<span className="text-sm font-normal text-gray-400"> kg</span></p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">体脂肪率</p>
                <p className="text-2xl font-bold text-gray-800">{latestLog.body_fat}<span className="text-sm font-normal text-gray-400"> %</span></p>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <p className="text-xs text-gray-400 mb-3">直近の予約</p>
          {bookings.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-400 mb-3">予約がありません</p>
              <button onClick={() => router.push('/member/booking')} className="btn-primary">予約を入れる</button>
            </div>
          ) : (
            <div className="space-y-2">
              {bookings.map(b => (
                <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{b.menu}</p>
                    <p className="text-xs text-gray-400">{b.date} {b.time}</p>
                  </div>
                  <span className={b.status === 'confirmed' ? 'badge-green' : 'badge-amber'}>
                    {b.status === 'confirmed' ? '確定' : '確認中'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => router.push('/member/log')} className="card flex flex-col items-center py-5 gap-2 hover:border-act-border transition-colors">
            <span className="text-2xl">📝</span>
            <span className="text-xs font-medium text-gray-700">今日の記録</span>
          </button>
          <button onClick={() => router.push('/member/training')} className="card flex flex-col items-center py-5 gap-2 hover:border-act-border transition-colors">
            <span className="text-2xl">💪</span>
            <span className="text-xs font-medium text-gray-700">メニュー確認</span>
          </button>
        </div>

        <div className="bg-act-light rounded-2xl p-4 border border-act-border">
          <p className="text-xs font-medium text-act-dark mb-1">パーソナルジムAct.</p>
          <p className="text-xs text-act-dark opacity-75">刈谷市 完全個室 · 柔道整復師資格</p>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
