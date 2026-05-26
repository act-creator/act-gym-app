import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'
import BottomNav from '../../components/BottomNav'

function dateKey(y, m, d) {
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}

function WeightGraph({ logs, mode }) {
  if (!logs || logs.length === 0) return <div style={{ textAlign: 'center', padding: '20px 0', color: '#ccc', fontSize: '12px' }}>データがありません</div>

  let points = []

  if (mode === 'day') {
    logs.slice(-14).forEach(l => {
      const d = parseInt(l.logged_at.split('-')[2])
      points.push({ x: d, y: parseFloat(l.weight), label: `${d}日` })
    })
  } else if (mode === 'week') {
    const weeks = {}
    logs.forEach(l => {
      const date = new Date(l.logged_at)
      const weekNum = Math.ceil(date.getDate() / 7)
      const key = `${date.getFullYear()}-${date.getMonth()}-W${weekNum}`
      if (!weeks[key]) weeks[key] = { sum: 0, count: 0, label: `第${weekNum}週`, idx: Object.keys(weeks).length }
      weeks[key].sum += parseFloat(l.weight)
      weeks[key].count++
    })
    Object.entries(weeks).forEach(([k, v], i) => {
      points.push({ x: i + 1, y: Math.round(v.sum / v.count * 10) / 10, label: v.label })
    })
  } else {
    const months = {}
    logs.forEach(l => {
      const [y, m] = l.logged_at.split('-')
      const key = `${y}-${m}`
      if (!months[key]) months[key] = { sum: 0, count: 0, label: `${parseInt(m)}月` }
      months[key].sum += parseFloat(l.weight)
      months[key].count++
    })
    Object.entries(months).forEach(([k, v], i) => {
      points.push({ x: i + 1, y: Math.round(v.sum / v.count * 10) / 10, label: v.label })
    })
  }

  if (points.length < 2) return <div style={{ textAlign: 'center', padding: '20px 0', color: '#ccc', fontSize: '12px' }}>データが不足しています</div>

  const minY = Math.min(...points.map(p => p.y)) - 0.5
  const maxY = Math.max(...points.map(p => p.y)) + 0.5
  const minX = Math.min(...points.map(p => p.x))
  const maxX = Math.max(...points.map(p => p.x))
  const toX = x => 20 + (x - minX) / (maxX - minX || 1) * 280
  const toY = y => 115 - (y - minY) / (maxY - minY || 1) * 95

  let linePath = `M ${toX(points[0].x)} ${toY(points[0].y)}`
  for (let i = 1; i < points.length; i++) {
    const cx = (toX(points[i-1].x) + toX(points[i].x)) / 2
    linePath += ` C ${cx} ${toY(points[i-1].y)}, ${cx} ${toY(points[i].y)}, ${toX(points[i].x)} ${toY(points[i].y)}`
  }
  const areaPath = linePath + ` L ${toX(points[points.length-1].x)} 130 L ${toX(points[0].x)} 130 Z`
  const showLabels = points.length <= 7 ? points : points.filter((_, i) => i === 0 || i === points.length - 1 || i % Math.ceil(points.length / 5) === 0)

  return (
    <div>
      <svg viewBox="0 0 320 135" style={{ width: '100%', height: '135px' }}>
        {[0,1,2,3,4].map(i => (
          <line key={i} x1="10" x2="310" y1={15 + i*25} y2={15 + i*25} stroke="#f0f0f0" strokeWidth="1" />
        ))}
        <path d={areaPath} fill="rgba(232,93,4,0.08)" />
        <path d={linePath} fill="none" stroke="#E85D04" strokeWidth="2" strokeLinecap="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={toX(p.x)} cy={toY(p.y)} r="3.5" fill="#E85D04" />
            <text x={toX(p.x)} y={toY(p.y) - 7} textAnchor="middle" fontSize="8" fill="#E85D04">{p.y}</text>
          </g>
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        {showLabels.map((p, i) => (
          <span key={i} style={{ fontSize: '9px', color: '#bbb' }}>{p.label}</span>
        ))}
      </div>
    </div>
  )
}

export default function Log() {
  const router = useRouter()
  const [userId, setUserId] = useState(null)
  const [weight, setWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [memo, setMemo] = useState('')
  const [mealType, setMealType] = useState('朝食')
  const [mealContent, setMealContent] = useState('')
  const [image, setImage] = useState(null)
  const [bodyLogs, setBodyLogs] = useState([])
  const [mealLogs, setMealLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('body')
  const [graphMode, setGraphMode] = useState('day')
  const [selectedDate, setSelectedDate] = useState(null)
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1)
  const [showForm, setShowForm] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUserId(user.id)
      const today = new Date()
      setSelectedDate(dateKey(today.getFullYear(), today.getMonth() + 1, today.getDate()))
      const { data: bl } = await supabase.from('body_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: true })
      setBodyLogs(bl || [])
      const { data: ml } = await supabase.from('meal_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(30)
      setMealLogs(ml || [])
    }
    load()
  }, [])

  const saveBodyLog = async (e) => {
    e.preventDefault()
    setLoading(true)
    await supabase.from('body_logs').insert({ user_id: userId, weight: parseFloat(weight), body_fat: parseFloat(bodyFat), memo })
    const { data: bl } = await supabase.from('body_logs').select('*').eq('user_id', userId).order('logged_at', { ascending: true })
    setBodyLogs(bl || [])
    setSuccess('記録しました！')
    setWeight(''); setBodyFat(''); setMemo('')
    setShowForm(false)
    setTimeout(() => setSuccess(''), 3000)
    setLoading(false)
  }

  const saveMealLog = async (e) => {
    e.preventDefault()
    setLoading(true)
    let photoUrl = null
    if (image) {
      try {
        const base64 = image.split(',')[1]
        const binary = atob(base64)
        const array = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i)
        const blob = new Blob([array], { type: 'image/jpeg' })
        const fileName = `${userId}/${Date.now()}.jpg`
        const { data: uploadData, error: uploadError } = await supabase.storage.from('meal-photos').upload(fileName, blob)
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('meal-photos').getPublicUrl(fileName)
          photoUrl = urlData.publicUrl
        }
      } catch(e) { console.error('upload error', e) }
    }
    await supabase.from('meal_logs').insert({ user_id: userId, meal_type: mealType, content: mealContent, ai_feedback: photoUrl })
    const { data: ml } = await supabase.from('meal_logs').select('*').eq('user_id', userId).order('logged_at', { ascending: false }).limit(30)
    setMealLogs(ml || [])
    setSuccess('食事を記録しました！')
    setMealContent(''); setImage(null)
    setShowForm(false)
    setTimeout(() => setSuccess(''), 3000)
    setLoading(false)
  }

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setImage(ev.target.result)
    reader.readAsDataURL(file)
  }

  const bodyByDate = {}
  bodyLogs.forEach(l => { bodyByDate[l.logged_at] = l })
  const mealByDate = {}
  mealLogs.forEach(l => {
    if (!mealByDate[l.logged_at]) mealByDate[l.logged_at] = []
    mealByDate[l.logged_at].push(l)
  })

  const firstDay = new Date(calYear, calMonth - 1, 1).getDay()
  const daysInMonth = new Date(calYear, calMonth, 0).getDate()
  const today = new Date()
  const todayKey = dateKey(today.getFullYear(), today.getMonth() + 1, today.getDate())
  const selectedBody = selectedDate ? bodyByDate[selectedDate] : null
  const selectedMeals = selectedDate ? (mealByDate[selectedDate] || []) : []

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f5', paddingBottom: '80px' }}>
      <div style={{ background: '#fff', borderBottom: '0.5px solid #ebebeb', padding: '14px 16px' }}>
        <div style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a1a', marginBottom: '12px' }}>記録</div>
        <div style={{ display: 'flex', background: '#f0f0f0', borderRadius: '10px', padding: '3px' }}>
          {['body', 'meal'].map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setShowForm(false) }}
              style={{ flex: 1, textAlign: 'center', padding: '7px 4px', fontSize: '13px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: activeTab === tab ? '#fff' : 'transparent',
                color: activeTab === tab ? '#1a1a1a' : '#999',
                fontWeight: activeTab === tab ? '500' : '400' }}>
              {tab === 'body' ? '体重・体脂肪' : '食事記録'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>
        {success && <div style={{ background: '#FFF0E8', color: '#E85D04', fontSize: '13px', padding: '12px', borderRadius: '12px', marginBottom: '14px', border: '0.5px solid #FFDCC8' }}>{success}</div>}

        {activeTab === 'body' && (
          <>
            <div style={{ background: '#fff', borderRadius: '16px', border: '0.5px solid #ebebeb', padding: '14px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <button onClick={() => { let m = calMonth-1, y = calYear; if(m<1){m=12;y--} setCalMonth(m); setCalYear(y) }}
                  style={{ width:'28px',height:'28px',borderRadius:'50%',border:'0.5px solid #ebebeb',background:'#fff',cursor:'pointer',color:'#999',fontSize:'14px' }}>‹</button>
                <div style={{ fontSize:'14px',fontWeight:'500',color:'#1a1a1a' }}>{calYear}年{calMonth}月</div>
                <button onClick={() => { let m = calMonth+1, y = calYear; if(m>12){m=1;y++} setCalMonth(m); setCalYear(y) }}
                  style={{ width:'28px',height:'28px',borderRadius:'50%',border:'0.5px solid #ebebeb',background:'#fff',cursor:'pointer',color:'#999',fontSize:'14px' }}>›</button>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',marginBottom:'4px' }}>
                {['日','月','火','水','木','金','土'].map((d,i) => (
                  <div key={d} style={{ textAlign:'center',fontSize:'9px',color:i===0?'#E85D04':i===6?'#3B6FD4':'#aaa',padding:'3px 0' }}>{d}</div>
                ))}
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'2px' }}>
                {Array(firstDay).fill(null).map((_,i) => <div key={`e${i}`} />)}
                {Array(daysInMonth).fill(null).map((_,i) => {
                  const d = i+1
                  const key = dateKey(calYear,calMonth,d)
                  const body = bodyByDate[key]
                  const meals = mealByDate[key]
                  const isToday = key === todayKey
                  const isSel = key === selectedDate
                  return (
                    <div key={d} onClick={() => setSelectedDate(key)}
                      style={{ borderRadius:'8px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',padding:'3px 1px',minHeight:'44px',
                        background:isSel?'#FFF0E8':'transparent',
                        border:isSel?'0.5px solid #FFDCC8':'0.5px solid transparent' }}>
                      <div style={{ fontSize:'11px',color:isToday?'#E85D04':'#1a1a1a',fontWeight:isToday?'600':'400',lineHeight:1,marginBottom:'2px' }}>{d}</div>
                      {body && <div style={{ fontSize:'9px',color:'#E85D04',fontWeight:'500',lineHeight:1 }}>{body.weight}</div>}
                      {meals && <div style={{ fontSize:'8px',color:'#1E8A4C',lineHeight:1,marginTop:'1px' }}>食{meals.length}</div>}
                    </div>
                  )
                })}
              </div>
            </div>

            {selectedDate && (
              <div style={{ background:'#fff',borderRadius:'16px',border:'0.5px solid #ebebeb',padding:'14px',marginBottom:'12px' }}>
                <div style={{ fontSize:'11px',color:'#aaa',marginBottom:'10px',letterSpacing:'0.5px' }}>
                  {parseInt(selectedDate.split('-')[1])}月{parseInt(selectedDate.split('-')[2])}日の記録
                </div>
                {selectedBody ? (
                  <>
                    <div style={{ display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'0.5px solid #f5f5f5' }}>
                      <span style={{ fontSize:'12px',color:'#aaa' }}>体重</span>
                      <span style={{ fontSize:'14px',fontWeight:'500',color:'#E85D04' }}>{selectedBody.weight} kg</span>
                    </div>
                    {selectedBody.body_fat && (
                      <div style={{ display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'0.5px solid #f5f5f5' }}>
                        <span style={{ fontSize:'12px',color:'#aaa' }}>体脂肪率</span>
                        <span style={{ fontSize:'14px',fontWeight:'500',color:'#1a1a1a' }}>{selectedBody.body_fat} %</span>
                      </div>
                    )}
                    {selectedBody.memo && (
                      <div style={{ display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:selectedMeals.length>0?'0.5px solid #f5f5f5':'none' }}>
                        <span style={{ fontSize:'12px',color:'#aaa' }}>メモ</span>
                        <span style={{ fontSize:'12px',color:'#888' }}>{selectedBody.memo}</span>
                      </div>
                    )}
                  </>
                ) : <div style={{ fontSize:'12px',color:'#ccc',padding:'4px 0' }}>体重の記録なし</div>}
                {selectedMeals.map((m,i) => (
                  <div key={m.id} style={{ padding:'8px 0',borderTop:'0.5px solid #f5f5f5' }}>
                    <div style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom: m.ai_feedback ? '8px' : '0' }}>
                      <span style={{ fontSize:'10px',padding:'2px 7px',borderRadius:'10px',background:'#EEFAF3',color:'#1E8A4C',flexShrink:0 }}>{m.meal_type}</span>
                      <span style={{ fontSize:'13px',color:'#1a1a1a' }}>{m.content}</span>
                    </div>
                    {m.ai_feedback && (
                      <img src={m.ai_feedback} alt="食事写真" style={{ width:'100%',maxHeight:'160px',objectFit:'cover',borderRadius:'10px',display:'block' }} />
                    )}
                  </div>
                ))}
                {!selectedBody && selectedMeals.length === 0 && (
                  <div style={{ fontSize:'12px',color:'#ccc',textAlign:'center',padding:'8px 0' }}>この日の記録はありません</div>
                )}
              </div>
            )}

            <div style={{ background:'#fff',borderRadius:'16px',border:'0.5px solid #ebebeb',padding:'14px',marginBottom:'12px' }}>
              <div style={{ fontSize:'11px',color:'#aaa',letterSpacing:'0.5px',marginBottom:'10px' }}>体重グラフ</div>
              <div style={{ display:'flex',gap:'6px',marginBottom:'12px' }}>
                {['day','week','month'].map(m => (
                  <button key={m} onClick={() => setGraphMode(m)}
                    style={{ fontSize:'11px',padding:'4px 12px',borderRadius:'20px',border:'0.5px solid',cursor:'pointer',
                      background:graphMode===m?'#E85D04':'#fff',
                      color:graphMode===m?'#fff':'#888',
                      borderColor:graphMode===m?'#E85D04':'#e0e0e0' }}>
                    {m==='day'?'1日':m==='week'?'1週間':'1ヶ月'}
                  </button>
                ))}
              </div>
              <WeightGraph logs={bodyLogs} mode={graphMode} />
            </div>

            <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ marginBottom:'12px' }}>
              {showForm ? '閉じる' : '＋ 今日の記録を追加'}
            </button>

            {showForm && (
              <div style={{ background:'#fff',borderRadius:'16px',border:'0.5px solid #ebebeb',padding:'16px',marginBottom:'12px' }}>
                <form onSubmit={saveBodyLog}>
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'10px' }}>
                    <div>
                      <div style={{ fontSize:'11px',color:'#aaa',marginBottom:'6px' }}>体重 (kg)</div>
                      <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} className="input" placeholder="68.0" required />
                    </div>
                    <div>
                      <div style={{ fontSize:'11px',color:'#aaa',marginBottom:'6px' }}>体脂肪率 (%)</div>
                      <input type="number" step="0.1" value={bodyFat} onChange={e => setBodyFat(e.target.value)} className="input" placeholder="22.0" />
                    </div>
                  </div>
                  <textarea value={memo} onChange={e => setMemo(e.target.value)} className="input" rows={2} placeholder="今日の体調・メモ..." style={{ marginBottom:'10px' }} />
                  <button type="submit" disabled={loading} className="btn-primary">{loading?'保存中...':'記録する'}</button>
                </form>
              </div>
            )}
          </>
        )}

        {activeTab === 'meal' && (
          <>
            <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ marginBottom:'12px' }}>
              {showForm ? '閉じる' : '＋ 食事を記録する'}
            </button>

            {showForm && (
              <div style={{ background:'#fff',borderRadius:'16px',border:'0.5px solid #ebebeb',padding:'16px',marginBottom:'12px' }}>
                <input type="file" ref={fileRef} accept="image/*" onChange={handleImage} style={{ display:'none' }} />
                {image ? (
                  <div style={{ position:'relative',borderRadius:'12px',overflow:'hidden',marginBottom:'12px' }}>
                    <img src={image} alt="食事" style={{ width:'100%',maxHeight:'180px',objectFit:'cover',display:'block' }} />
                    <button onClick={() => setImage(null)} style={{ position:'absolute',top:'8px',right:'8px',background:'rgba(0,0,0,0.5)',color:'#fff',border:'none',borderRadius:'20px',fontSize:'11px',padding:'4px 10px',cursor:'pointer' }}>変更</button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current.click()}
                    style={{ width:'100%',border:'1.5px dashed #e0e0e0',borderRadius:'12px',padding:'20px',display:'flex',flexDirection:'column',alignItems:'center',gap:'6px',cursor:'pointer',background:'#fafafa',marginBottom:'12px' }}>
                    <span style={{ fontSize:'24px' }}>📷</span>
                    <span style={{ fontSize:'12px',color:'#bbb' }}>写真を追加する（任意）</span>
                  </button>
                )}
                <form onSubmit={saveMealLog}>
                  <select value={mealType} onChange={e => setMealType(e.target.value)} className="input" style={{ marginBottom:'10px' }}>
                    {['朝食','昼食','夕食','間食'].map(t => <option key={t}>{t}</option>)}
                  </select>
                  <textarea value={mealContent} onChange={e => setMealContent(e.target.value)} className="input" rows={3} placeholder="例：天丼、味噌汁、サラダ..." style={{ marginBottom:'10px' }} required />
                  <button type="submit" disabled={loading} className="btn-primary">{loading?'保存中...':'記録する'}</button>
                </form>
              </div>
            )}

            <div style={{ background:'#fff',borderRadius:'16px',border:'0.5px solid #ebebeb',padding:'14px' }}>
              <div style={{ fontSize:'11px',color:'#aaa',letterSpacing:'0.5px',marginBottom:'12px' }}>食事履歴</div>
              {mealLogs.length === 0 ? (
                <div style={{ textAlign:'center',padding:'20px 0',color:'#ccc',fontSize:'13px' }}>まだ記録がありません</div>
              ) : mealLogs.map((m,i) => (
                <div key={m.id} style={{ padding:'10px 0',borderBottom:i<mealLogs.length-1?'0.5px solid #f5f5f5':'none' }}>
                  <div style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px' }}>
                    <span style={{ fontSize:'10px',padding:'2px 7px',borderRadius:'10px',background:'#EEFAF3',color:'#1E8A4C' }}>{m.meal_type}</span>
                    <span style={{ fontSize:'11px',color:'#bbb' }}>{m.logged_at}</span>
                  </div>
                  <div style={{ fontSize:'13px',color:'#1a1a1a',marginBottom: m.ai_feedback ? '8px' : '0' }}>{m.content}</div>
                {m.ai_feedback && (
                  <img src={m.ai_feedback} alt="食事写真" style={{ width:'100%',maxHeight:'160px',objectFit:'cover',borderRadius:'10px',display:'block' }} />
                )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
