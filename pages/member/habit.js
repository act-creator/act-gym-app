import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'
import BottomNav from '../../components/BottomNav'

export default function Habit() {
  const router = useRouter()
  const [userId, setUserId] = useState(null)
  const [items, setItems] = useState([])
  const [done, setDone] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [showComplete, setShowComplete] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [menus, setMenus] = useState([])
  const [selectedMenu, setSelectedMenu] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [customSub, setCustomSub] = useState('')

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUserId(user.id)

      const { data: habitItems } = await supabase
        .from('habit_items')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index')
      setItems(habitItems || [])

      const { data: logs } = await supabase
        .from('habit_logs')
        .select('habit_item_id')
        .eq('user_id', user.id)
        .eq('logged_date', today)
      const doneSet = new Set((logs || []).map(l => l.habit_item_id))
      setDone(doneSet)

      const { data: menuData } = await supabase
        .from('training_menus')
        .select('*')
        .order('created_at')
      setMenus(menuData || [])

      setLoading(false)
    }
    load()
  }, [])

  const toggle = async (item) => {
    const isDone = done.has(item.id)
    const newDone = new Set(done)

    if (isDone) {
      await supabase.from('habit_logs')
        .delete()
        .eq('user_id', userId)
        .eq('habit_item_id', item.id)
        .eq('logged_date', today)
      newDone.delete(item.id)
    } else {
      await supabase.from('habit_logs')
        .insert({ user_id: userId, habit_item_id: item.id, logged_date: today })
      newDone.add(item.id)
      if (newDone.size === items.length && items.length > 0) {
        setTimeout(() => setShowComplete(true), 400)
      }
    }
    setDone(newDone)
  }

  const addItem = async () => {
    if (!customTitle && !selectedMenu) return
    let title = customTitle
    let sub = customSub
    let category = ''

    if (selectedMenu) {
      const menu = menus.find(m => m.id === selectedMenu)
      if (menu) {
        title = menu.title
        sub = `${menu.sets}セット × ${menu.reps} · 休憩${menu.rest_seconds}秒`
        category = menu.category || ''
      }
    }

    const { data } = await supabase.from('habit_items').insert({
      user_id: userId,
      menu_id: selectedMenu || null,
      title,
      sub_text: sub,
      category,
      is_admin_set: false,
      order_index: items.length
    }).select()

    if (data) {
      setItems(prev => [...prev, data[0]])
      setShowAddModal(false)
      setSelectedMenu('')
      setCustomTitle('')
      setCustomSub('')
    }
  }

  const deleteItem = async (id) => {
    await supabase.from('habit_logs').delete().eq('habit_item_id', id)
    await supabase.from('habit_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
    const newDone = new Set(done)
    newDone.delete(id)
    setDone(newDone)
  }

  const progress = items.length > 0 ? Math.round((done.size / items.length) * 100) : 0
  const todayStr = new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div style={{ color: '#ccc' }}>読み込み中...</div></div>

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f5', paddingBottom: '100px', overflowY: 'auto' }}>
      {/* ヘッダー */}
      <div style={{ background: '#fff', borderBottom: '0.5px solid #ebebeb', padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a1a' }}>習慣ノルマリスト</div>
            <div style={{ fontSize: '11px', color: '#aaa', marginTop: '1px' }}>{todayStr}</div>
          </div>
          {done.size > 0 && <div style={{ fontSize: '11px', color: '#E85D04', fontWeight: '500' }}>🔥 {done.size}個クリア！</div>}
        </div>
      </div>

      {/* プログレスバー */}
      <div style={{ background: '#fff', padding: '14px 16px', borderBottom: '0.5px solid #ebebeb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', color: '#aaa', letterSpacing: '0.5px' }}>TODAY'S PROGRESS</span>
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>{done.size} / {items.length}</span>
        </div>
        <div style={{ height: '6px', background: '#f0f0f0', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#E85D04', borderRadius: '3px', width: `${progress}%`, transition: 'width 0.4s ease' }}></div>
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
            <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '4px' }}>ノルマがまだありません</div>
            <div style={{ fontSize: '12px', color: '#ccc' }}>下のボタンからメニューを追加してください</div>
          </div>
        ) : (
          <div style={{ marginBottom: '12px' }}>
            {items.map(item => (
              <div key={item.id}
                style={{ background: done.has(item.id) ? '#FFF8F5' : '#fff', border: `0.5px solid ${done.has(item.id) ? '#FFDCC8' : '#ebebeb'}`, borderRadius: '14px', padding: '14px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => toggle(item)}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: `1.5px solid ${done.has(item.id) ? '#E85D04' : '#ddd'}`, background: done.has(item.id) ? '#E85D04' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                  {done.has(item.id) && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <polyline points="2,7 5.5,10.5 12,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: done.has(item.id) ? '#E85D04' : '#1a1a1a', transition: 'color 0.2s' }}>{item.title}</div>
                  {item.sub_text && <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{item.sub_text}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {item.category && <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '20px', background: done.has(item.id) ? '#FFF0E8' : '#f5f5f5', color: done.has(item.id) ? '#E85D04' : '#888' }}>{item.category}</span>}
                  <button onClick={e => { e.stopPropagation(); deleteItem(item.id) }} style={{ background: 'none', border: 'none', color: '#ddd', fontSize: '16px', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>×</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => setShowAddModal(true)} style={{ width: '100%', background: '#fff', border: '1px dashed #ddd', borderRadius: '14px', padding: '14px', fontSize: '13px', color: '#bbb', cursor: 'pointer', textAlign: 'center' }}>
          ＋ メニューを追加する
        </button>
      </div>

      {/* 追加モーダル */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowAddModal(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', padding: '24px 16px 40px', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a1a', marginBottom: '16px' }}>メニューを追加</div>

            <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '8px', letterSpacing: '0.5px' }}>登録済みメニューから選ぶ</div>
            <select value={selectedMenu} onChange={e => { setSelectedMenu(e.target.value); setCustomTitle(''); setCustomSub('') }}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '0.5px solid #ebebeb', fontSize: '14px', background: '#f7f7f5', color: '#1a1a1a', marginBottom: '14px', fontFamily: 'inherit' }}>
              <option value="">選択してください</option>
              {menus.map(m => <option key={m.id} value={m.id}>{m.title}（{m.category}）</option>)}
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '12px 0', color: '#ccc', fontSize: '12px' }}>
              <div style={{ flex: 1, height: '0.5px', background: '#ebebeb' }}></div>
              または自由入力
              <div style={{ flex: 1, height: '0.5px', background: '#ebebeb' }}></div>
            </div>

            <input value={customTitle} onChange={e => { setCustomTitle(e.target.value); setSelectedMenu('') }}
              placeholder="習慣名（例：ウォーキング30分）"
              style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '0.5px solid #ebebeb', fontSize: '14px', background: '#f7f7f5', marginBottom: '10px', fontFamily: 'inherit' }} />
            <input value={customSub} onChange={e => setCustomSub(e.target.value)}
              placeholder="メモ（例：朝食前に実施）"
              style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '0.5px solid #ebebeb', fontSize: '14px', background: '#f7f7f5', marginBottom: '16px', fontFamily: 'inherit' }} />

            <button onClick={addItem} disabled={!selectedMenu && !customTitle}
              style={{ width: '100%', background: (!selectedMenu && !customTitle) ? '#f4a87a' : '#E85D04', color: '#fff', border: 'none', borderRadius: '12px', padding: '13px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
              追加する
            </button>
          </div>
        </div>
      )}

      {/* コンプリートオーバーレイ */}
      {showComplete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '24px', padding: '32px 24px', textAlign: 'center', width: '280px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏆</div>
            <div style={{ fontSize: '22px', fontWeight: '500', color: '#1a1a1a', marginBottom: '6px' }}>COMPLETE！</div>
            <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '20px', lineHeight: '1.6' }}>
              今日のノルマを全部クリア！<br/>この調子で続けていこう💪
            </div>
            <button onClick={() => setShowComplete(false)}
              style={{ width: '100%', background: '#E85D04', color: '#fff', border: 'none', borderRadius: '12px', padding: '13px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
              最高！
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
