import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

const tabs = ['予約管理', '会員一覧', 'メニュー管理']

export default function Admin() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('予約管理')
  const [bookings, setBookings] = useState([])
  const [members, setMembers] = useState([])
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)

  // メニュー追加フォーム
  const [newMenu, setNewMenu] = useState({ title: '', category: '下半身', level: '初級', sets: 3, reps: '12回', rest_seconds: 60, description: '', video_url: '' })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (prof?.role !== 'admin') { router.push('/member'); return }

      const [bk, mb, mn] = await Promise.all([
        supabase.from('bookings').select('*, profiles(name)').order('date', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('training_menus').select('*').order('created_at')
      ])
      setBookings(bk.data || [])
      setMembers(mb.data || [])
      setMenus(mn.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const updateBookingStatus = async (id, status) => {
    await supabase.from('bookings').update({ status }).eq('id', id)
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
  }

  const addMenu = async (e) => {
    e.preventDefault()
    const { data } = await supabase.from('training_menus').insert(newMenu).select()
    if (data) setMenus(prev => [...prev, data[0]])
    setNewMenu({ title: '', category: '下半身', level: '初級', sets: 3, reps: '12回', rest_seconds: 60, description: '', video_url: '' })
  }

  const deleteMenu = async (id) => {
    await supabase.from('training_menus').delete().eq('id', id)
    setMenus(prev => prev.filter(m => m.id !== id))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-gray-400">読み込み中...</div></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-800">Act. 管理画面</h1>
          <p className="text-xs text-gray-400">パーソナルジムAct. 刈谷市</p>
        </div>
        <button onClick={handleLogout} className="text-xs text-gray-400 border border-gray-200 px-3 py-1 rounded-full">ログアウト</button>
      </div>

      <div className="flex border-b border-gray-100 bg-white px-4 overflow-x-auto">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`py-3 px-4 text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === t ? 'border-act-green text-act-green font-medium' : 'border-transparent text-gray-400'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">
        {activeTab === '予約管理' && (
          <>
            <div className="grid grid-cols-3 gap-3">
              {['pending', 'confirmed', 'cancelled'].map(s => (
                <div key={s} className="card text-center">
                  <p className="text-2xl font-bold text-gray-800">{bookings.filter(b => b.status === s).length}</p>
                  <p className="text-xs text-gray-400 mt-1">{s === 'pending' ? '確認中' : s === 'confirmed' ? '確定' : 'キャンセル'}</p>
                </div>
              ))}
            </div>
            <div className="card">
              <h2 className="text-sm font-medium text-gray-700 mb-3">予約一覧</h2>
              {bookings.map(b => (
                <div key={b.id} className="py-3 border-b border-gray-50 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{b.profiles?.name || '不明'}</p>
                      <p className="text-xs text-gray-400">{b.menu} · {b.date} {b.time}</p>
                      {b.note && <p className="text-xs text-gray-400 mt-1">💬 {b.note}</p>}
                    </div>
                    <span className={b.status === 'confirmed' ? 'badge-green' : b.status === 'cancelled' ? 'badge-red' : 'badge-amber'}>
                      {b.status === 'confirmed' ? '確定' : b.status === 'cancelled' ? 'キャンセル' : '確認中'}
                    </span>
                  </div>
                  {b.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => updateBookingStatus(b.id, 'confirmed')} className="flex-1 text-xs py-1.5 bg-act-green text-white rounded-lg">確定する</button>
                      <button onClick={() => updateBookingStatus(b.id, 'cancelled')} className="flex-1 text-xs py-1.5 border border-gray-200 text-gray-500 rounded-lg">キャンセル</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === '会員一覧' && (
          <div className="card">
            <h2 className="text-sm font-medium text-gray-700 mb-3">会員 ({members.filter(m => m.role === 'member').length}名)</h2>
            {members.filter(m => m.role === 'member').map(m => (
              <div key={m.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                <div className="w-9 h-9 bg-act-light rounded-full flex items-center justify-center">
                  <span className="text-act-dark text-sm font-bold">{m.name?.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{m.name}</p>
                  <p className="text-xs text-gray-400">{m.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'メニュー管理' && (
          <>
            <div className="card">
              <h2 className="text-sm font-medium text-gray-700 mb-3">メニューを追加</h2>
              <form onSubmit={addMenu} className="space-y-3">
                <input value={newMenu.title} onChange={e => setNewMenu({...newMenu, title: e.target.value})} className="input" placeholder="メニュー名" required />
                <div className="grid grid-cols-2 gap-3">
                  <select value={newMenu.category} onChange={e => setNewMenu({...newMenu, category: e.target.value})} className="input">
                    {['下半身', '上半身', '体幹', 'ストレッチ'].map(c => <option key={c}>{c}</option>)}
                  </select>
                  <select value={newMenu.level} onChange={e => setNewMenu({...newMenu, level: e.target.value})} className="input">
                    {['初級', '中級', '上級'].map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" value={newMenu.sets} onChange={e => setNewMenu({...newMenu, sets: parseInt(e.target.value)})} className="input" placeholder="セット数" />
                  <input value={newMenu.reps} onChange={e => setNewMenu({...newMenu, reps: e.target.value})} className="input" placeholder="回数(例:12回)" />
                  <input type="number" value={newMenu.rest_seconds} onChange={e => setNewMenu({...newMenu, rest_seconds: parseInt(e.target.value)})} className="input" placeholder="休憩(秒)" />
                </div>
                <input value={newMenu.video_url} onChange={e => setNewMenu({...newMenu, video_url: e.target.value})} className="input" placeholder="YouTube URL（任意）" />
                <textarea value={newMenu.description} onChange={e => setNewMenu({...newMenu, description: e.target.value})} className="input" rows={2} placeholder="説明・注意点（任意）" />
                <button type="submit" className="btn-primary">追加する</button>
              </form>
            </div>

            <div className="card">
              <h2 className="text-sm font-medium text-gray-700 mb-3">登録済みメニュー ({menus.length}件)</h2>
              {menus.map(m => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{m.title}</p>
                    <div className="flex gap-1 mt-0.5">
                      <span className="badge-green">{m.category}</span>
                      <span className="badge-blue">{m.level}</span>
                    </div>
                  </div>
                  <button onClick={() => deleteMenu(m.id)} className="text-xs text-red-400 border border-red-100 px-2 py-1 rounded-lg hover:bg-red-50">削除</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
