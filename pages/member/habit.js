import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'
import BottomNav from '../../components/BottomNav'

function dateKey(y, m, d) {
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}

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
  const [activeTab, setActiveTab] = useState('today')
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1)
  const [completedDates, setCompletedDates] = useState(new Set())
  const [selectedCalDate, setSelectedCalDate] = useState(null)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }
      const user = session.user
      setUserId(user.id)

      const { data: habitItems } = await supabase.from('habit_items').select('*').eq('user_id', user.id).order('order_index')
      setItems(habitItems || [])

      const { data: logs } = await supabase.from('habit_logs').select('habit_item_id, logged_date').eq('user_id', user.id)
      
      // 今日の達成
      const todayDone = new Set((logs || []).filter(l => l.logged_date === today).map(l => l.habit_item_id))
      setDone(todayDone)

      // 日ごとの達成数を集計
      await loadCompletedDates(user.id, habitItems || [], logs || [])

      const { data: menuData } = await supabase.from('training_menus').select('*').order('created_at')
      setMenus(menuData || [])

      setLoading(false)
    }
    load()
  }, [])

  const loadCompletedDates = async (uid, habitItems, logs) => {
    if (!habitItems || habitItems.length === 0) return
    const total = habitItems.length
    // 日付ごとに達成数を集計
    const byDate = {}
    logs.forEach(l => {
      if (!byDate[l.logged_date]) byDate[l.logged_date] = new Set()
      byDate[l.logged_date].add(l.habit_item_id)
    })
    // 全部達成した日をセット
    const completed = new Set()
    Object.entries(byDate).forEach(([date, doneSet]) => {
      if (doneSet.size >= total) completed.add(date)
    })
    setCompletedDates(completed)
  }

  const toggle = async (item) => {
    const isDone = done.has(item.id)
    const newDone = new Set(done)
    if (isDone) {
      await supabase.from('habit_logs').delete().eq('user_id', userId).eq('habit_item_id', item.id).eq('logged_date', today)
      newDone.delete(item.id)
      // completedDatesから今日を削除
      const newCompleted = new Set(completedDates)
      newCompleted.delete(today)
      setCompletedDates(newCompleted)
    } else {
      await supabase.from('habit_logs').insert({ user_id: userId, habit_item_id: item.id, logged_date: today })
      newDone.add(item.id)
      if (newDone.size === items.length && items.length > 0) {
        setTimeout(() => setShowComplete(true), 400)
        const newCompleted = new Set(completedDates)
        newCompleted.add(today)
        setCompletedDates(newCompleted)
      }
    }
    setDone(newDone)
  }

  const addItem = async () => {
    if (!customTitle && !selectedMenu) return
    let title = customTitle, sub = customSub, category = ''
    if (selectedMenu) {
      const menu = menus.find(m => m.id === selectedMenu)
      if (menu) { title = menu.title; sub = `${menu.sets}セット × ${menu.reps} · 休憩${menu.rest_seconds}秒`; category = menu.category || '' }
    }
    const { data, error } = await supabase.from('habit_items').insert({
      user_id: userId, menu_id: selectedMenu || null, title, sub_text: sub, category, is_admin_set: false, order_index: items.length
    }).select()
    if (error) { alert('追加エラー: ' + error.message); return }
    if (data && data.length > 0) {
      setItems(prev => [...prev, data[0]])
      setShowAddModal(false)
      document.body.style.overflow = ''
      setSelectedMenu(''); setCustomTitle(''); setCustomSub('')
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

  // カレンダー
  const firstDay = new Date(calYear, calMonth - 1, 1).getDay()
  const daysInMonth = new Date(calYear, calMonth, 0).getDate()
  const todayKey = new Date().toISOString().split('T')[0]

  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh' }}><div style={{ color:'#ccc' }}>読み込み中...</div></div>

  return (
    <div style={{ minHeight:'100vh',background:'#f7f7f5',paddingBottom:'80px' }}>
      {/* ヘッダー */}
      <div style={{ background:'#fff',borderBottom:'0.5px solid #ebebeb',padding:'14px 16px' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px' }}>
          <div style={{ fontSize:'15px',fontWeight:'500',color:'#1a1a1a' }}>習慣ノルマリスト</div>
          {done.size > 0 && activeTab === 'today' && <div style={{ fontSize:'11px',color:'#E85D04',fontWeight:'500' }}>🔥 {done.size}個クリア！</div>}
        </div>
        <div style={{ display:'flex',background:'#f0f0f0',borderRadius:'10px',padding:'3px' }}>
          {['today','calendar'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ flex:1,textAlign:'center',padding:'7px 4px',fontSize:'13px',borderRadius:'8px',border:'none',cursor:'pointer',
                background:activeTab===tab?'#fff':'transparent',
                color:activeTab===tab?'#1a1a1a':'#999',
                fontWeight:activeTab===tab?'500':'400' }}>
              {tab === 'today' ? '今日のノルマ' : '達成カレンダー'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:'14px 16px' }}>

        {activeTab === 'today' && (
          <>
            {/* プログレスバー */}
            <div style={{ background:'#fff',borderRadius:'16px',border:'0.5px solid #ebebeb',padding:'14px',marginBottom:'12px' }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px' }}>
                <span style={{ fontSize:'11px',color:'#aaa',letterSpacing:'0.5px' }}>TODAY'S PROGRESS · {todayStr}</span>
                <span style={{ fontSize:'13px',fontWeight:'500',color:'#1a1a1a' }}>{done.size} / {items.length}</span>
              </div>
              <div style={{ height:'6px',background:'#f0f0f0',borderRadius:'3px',overflow:'hidden' }}>
                <div style={{ height:'100%',background:'#E85D04',borderRadius:'3px',width:`${progress}%`,transition:'width 0.4s ease' }}></div>
              </div>
            </div>

            {items.length === 0 ? (
              <div style={{ textAlign:'center',padding:'40px 0' }}>
                <div style={{ fontSize:'32px',marginBottom:'12px' }}>📋</div>
                <div style={{ fontSize:'14px',color:'#aaa',marginBottom:'4px' }}>ノルマがまだありません</div>
                <div style={{ fontSize:'12px',color:'#ccc' }}>下のボタンからメニューを追加してください</div>
              </div>
            ) : (
              <div style={{ marginBottom:'12px' }}>
                {items.map(item => (
                  <div key={item.id}
                    style={{ background:done.has(item.id)?'#FFF8F5':'#fff',border:`0.5px solid ${done.has(item.id)?'#FFDCC8':'#ebebeb'}`,borderRadius:'14px',padding:'14px',marginBottom:'10px',display:'flex',alignItems:'center',gap:'12px',cursor:'pointer',transition:'all 0.2s' }}
                    onClick={() => toggle(item)}>
                    <div style={{ width:'28px',height:'28px',borderRadius:'50%',border:`1.5px solid ${done.has(item.id)?'#E85D04':'#ddd'}`,background:done.has(item.id)?'#E85D04':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.2s' }}>
                      {done.has(item.id) && <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><polyline points="2,7 5.5,10.5 12,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'14px',fontWeight:'500',color:done.has(item.id)?'#E85D04':'#1a1a1a',transition:'color 0.2s' }}>{item.title}</div>
                      {item.sub_text && <div style={{ fontSize:'11px',color:'#aaa',marginTop:'2px' }}>{item.sub_text}</div>}
                    </div>
                    <div style={{ display:'flex',alignItems:'center',gap:'8px' }}>
                      {item.category && <span style={{ fontSize:'10px',padding:'3px 8px',borderRadius:'20px',background:done.has(item.id)?'#FFF0E8':'#f5f5f5',color:done.has(item.id)?'#E85D04':'#888' }}>{item.category}</span>}
                      <button onClick={e => { e.stopPropagation(); deleteItem(item.id) }} style={{ background:'none',border:'none',color:'#ddd',fontSize:'16px',cursor:'pointer',padding:'0 4px',lineHeight:1 }}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => { setShowAddModal(true); document.body.style.overflow='hidden' }}
              style={{ width:'100%',background:'#fff',border:'1px dashed #ddd',borderRadius:'14px',padding:'14px',fontSize:'13px',color:'#bbb',cursor:'pointer',textAlign:'center' }}>
              ＋ メニューを追加する
            </button>
          </>
        )}

        {activeTab === 'calendar' && (
          <>
            {/* 達成カレンダー */}
            <div style={{ background:'#fff',borderRadius:'16px',border:'0.5px solid #ebebeb',padding:'14px',marginBottom:'12px' }}>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px' }}>
                <button onClick={() => { let m=calMonth-1,y=calYear; if(m<1){m=12;y--} setCalMonth(m);setCalYear(y) }}
                  style={{ width:'28px',height:'28px',borderRadius:'50%',border:'0.5px solid #ebebeb',background:'#fff',cursor:'pointer',color:'#999',fontSize:'14px' }}>‹</button>
                <div style={{ fontSize:'14px',fontWeight:'500',color:'#1a1a1a' }}>{calYear}年{calMonth}月</div>
                <button onClick={() => { let m=calMonth+1,y=calYear; if(m>12){m=1;y++} setCalMonth(m);setCalYear(y) }}
                  style={{ width:'28px',height:'28px',borderRadius:'50%',border:'0.5px solid #ebebeb',background:'#fff',cursor:'pointer',color:'#999',fontSize:'14px' }}>›</button>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',marginBottom:'4px' }}>
                {['日','月','火','水','木','金','土'].map((d,i) => (
                  <div key={d} style={{ textAlign:'center',fontSize:'9px',color:i===0?'#E85D04':i===6?'#3B6FD4':'#aaa',padding:'3px 0' }}>{d}</div>
                ))}
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'4px' }}>
                {Array(firstDay).fill(null).map((_,i) => <div key={`e${i}`} />)}
                {Array(daysInMonth).fill(null).map((_,i) => {
                  const d = i + 1
                  const key = dateKey(calYear, calMonth, d)
                  const isCompleted = completedDates.has(key)
                  const isToday = key === todayKey
                  const isSel = key === selectedCalDate
                  return (
                    <div key={d} onClick={() => setSelectedCalDate(key)}
                      style={{ aspectRatio:'1',borderRadius:'50%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',position:'relative',
                        background:isCompleted?'#E85D04':isSel?'#FFF0E8':'transparent',
                        border:isToday&&!isCompleted?'1.5px solid #E85D04':'1.5px solid transparent' }}>
                      <div style={{ fontSize:'12px',color:isCompleted?'#fff':isToday?'#E85D04':'#1a1a1a',fontWeight:isToday||isCompleted?'600':'400',lineHeight:1 }}>{d}</div>
                      {isCompleted && <div style={{ fontSize:'8px',color:'rgba(255,255,255,0.8)',lineHeight:1,marginTop:'1px' }}>✓</div>}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 凡例 */}
            <div style={{ display:'flex',gap:'16px',marginBottom:'12px',padding:'0 4px' }}>
              <div style={{ display:'flex',alignItems:'center',gap:'6px',fontSize:'11px',color:'#888' }}>
                <div style={{ width:'16px',height:'16px',borderRadius:'50%',background:'#E85D04' }}></div>
                全ノルマ達成
              </div>
              <div style={{ display:'flex',alignItems:'center',gap:'6px',fontSize:'11px',color:'#888' }}>
                <div style={{ width:'16px',height:'16px',borderRadius:'50%',border:'1.5px solid #E85D04' }}></div>
                今日
              </div>
            </div>

            {/* 達成数サマリー */}
            <div style={{ background:'#fff',borderRadius:'16px',border:'0.5px solid #ebebeb',padding:'14px' }}>
              <div style={{ fontSize:'11px',color:'#aaa',letterSpacing:'0.5px',marginBottom:'12px' }}>今月の達成</div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px' }}>
                <div style={{ background:'#FFF0E8',borderRadius:'12px',padding:'14px',textAlign:'center' }}>
                  <div style={{ fontSize:'28px',fontWeight:'500',color:'#E85D04' }}>
                    {Array(daysInMonth).fill(null).filter((_,i) => completedDates.has(dateKey(calYear, calMonth, i+1))).length}
                  </div>
                  <div style={{ fontSize:'11px',color:'#E85D04',marginTop:'4px' }}>達成日数</div>
                </div>
                <div style={{ background:'#f7f7f5',borderRadius:'12px',padding:'14px',textAlign:'center' }}>
                  <div style={{ fontSize:'28px',fontWeight:'500',color:'#1a1a1a' }}>{daysInMonth}</div>
                  <div style={{ fontSize:'11px',color:'#aaa',marginTop:'4px' }}>今月の日数</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 追加モーダル */}
      {showAddModal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:50,display:'flex',alignItems:'flex-end' }} onClick={() => { setShowAddModal(false); document.body.style.overflow='' }}>
          <div style={{ background:'#fff',borderRadius:'24px 24px 0 0',width:'100%',padding:'24px 16px 48px',height:'75vh',overflowY:'scroll',WebkitOverflowScrolling:'touch' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:'15px',fontWeight:'500',color:'#1a1a1a',marginBottom:'16px' }}>メニューを追加</div>
            <div style={{ fontSize:'11px',color:'#aaa',marginBottom:'8px',letterSpacing:'0.5px' }}>登録済みメニューから選ぶ</div>
            <select value={selectedMenu} onChange={e => { setSelectedMenu(e.target.value); setCustomTitle(''); setCustomSub('') }}
              style={{ width:'100%',padding:'12px 14px',borderRadius:'12px',border:'0.5px solid #ebebeb',fontSize:'14px',background:'#f7f7f5',color:'#1a1a1a',marginBottom:'14px',fontFamily:'inherit' }}>
              <option value="">選択してください</option>
              {menus.map(m => <option key={m.id} value={m.id}>{m.title}（{m.category}）</option>)}
            </select>
            <div style={{ display:'flex',alignItems:'center',gap:'8px',margin:'12px 0',color:'#ccc',fontSize:'12px' }}>
              <div style={{ flex:1,height:'0.5px',background:'#ebebeb' }}></div>または自由入力<div style={{ flex:1,height:'0.5px',background:'#ebebeb' }}></div>
            </div>
            <input value={customTitle} onChange={e => { setCustomTitle(e.target.value); setSelectedMenu('') }} placeholder="習慣名（例：ウォーキング30分）"
              style={{ width:'100%',padding:'12px 14px',borderRadius:'12px',border:'0.5px solid #ebebeb',fontSize:'14px',background:'#f7f7f5',marginBottom:'10px',fontFamily:'inherit' }} />
            <input value={customSub} onChange={e => setCustomSub(e.target.value)} placeholder="メモ（例：朝食前に実施）"
              style={{ width:'100%',padding:'12px 14px',borderRadius:'12px',border:'0.5px solid #ebebeb',fontSize:'14px',background:'#f7f7f5',marginBottom:'16px',fontFamily:'inherit' }} />
            <button onClick={addItem} disabled={!selectedMenu && !customTitle}
              style={{ width:'100%',background:(!selectedMenu&&!customTitle)?'#f4a87a':'#E85D04',color:'#fff',border:'none',borderRadius:'12px',padding:'13px',fontSize:'14px',fontWeight:'500',cursor:'pointer' }}>
              追加する
            </button>
          </div>
        </div>
      )}

      {/* コンプリートオーバーレイ */}
      {showComplete && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center' }}>
          <div style={{ background:'#fff',borderRadius:'24px',padding:'32px 24px',textAlign:'center',width:'280px' }}>
            <div style={{ fontSize:'48px',marginBottom:'12px' }}>🏆</div>
            <div style={{ fontSize:'22px',fontWeight:'500',color:'#1a1a1a',marginBottom:'6px' }}>COMPLETE！</div>
            <div style={{ fontSize:'13px',color:'#aaa',marginBottom:'20px',lineHeight:'1.6' }}>今日のノルマを全部クリア！<br/>この調子で続けていこう💪</div>
            <button onClick={() => setShowComplete(false)}
              style={{ width:'100%',background:'#E85D04',color:'#fff',border:'none',borderRadius:'12px',padding:'13px',fontSize:'14px',fontWeight:'500',cursor:'pointer' }}>
              最高！
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
