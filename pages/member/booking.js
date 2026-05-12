import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'
import BottomNav from '../../components/BottomNav'

const menus = ['パーソナルトレーニング', 'コンディショニング', 'アニマルフロー', '体験トレーニング']
const times = ['10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00']

export default function Booking() {
  const router = useRouter()
  const [userId, setUserId] = useState(null)
  const [bookings, setBookings] = useState([])
  const [menu, setMenu] = useState(menus[0])
  const [date, setDate] = useState('')
  const [time, setTime] = useState(times[0])
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUserId(user.id)
      const { data } = await supabase.from('bookings').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(5)
      setBookings(data || [])
    }
    load()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('bookings').insert({ user_id: userId, menu, date, time, note, status: 'pending' })
    if (!error) {
      setSuccess(true)
      setNote('')
      const { data } = await supabase.from('bookings').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(5)
      setBookings(data || [])
      setTimeout(() => setSuccess(false), 3000)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="text-base font-bold text-gray-800">予約管理</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="card">
          <h2 className="text-sm font-medium text-gray-700 mb-3">新規予約</h2>
          {success && <div className="bg-act-light text-act-dark text-sm p-3 rounded-lg mb-3">予約リクエストを送信しました！</div>}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">メニュー</label>
              <select value={menu} onChange={e => setMenu(e.target.value)} className="input">
                {menus.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">希望日</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" required min={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">希望時間</label>
                <select value={time} onChange={e => setTime(e.target.value)} className="input">
                  {times.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">メモ（任意）</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} className="input" rows={2} placeholder="気になることがあれば..." />
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? '送信中...' : '予約リクエストを送る'}
            </button>
          </form>
        </div>

        <div className="card">
          <h2 className="text-sm font-medium text-gray-700 mb-3">予約履歴</h2>
          {bookings.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">予約履歴がありません</p>
          ) : (
            <div className="space-y-2">
              {bookings.map(b => (
                <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{b.menu}</p>
                    <p className="text-xs text-gray-400">{b.date} {b.time}</p>
                  </div>
                  <span className={b.status === 'confirmed' ? 'badge-green' : b.status === 'cancelled' ? 'badge-red' : 'badge-amber'}>
                    {b.status === 'confirmed' ? '確定' : b.status === 'cancelled' ? 'キャンセル' : '確認中'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
