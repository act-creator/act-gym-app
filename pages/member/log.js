import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'
import BottomNav from '../../components/BottomNav'

export default function Log() {
  const router = useRouter()
  const [userId, setUserId] = useState(null)
  const [weight, setWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [memo, setMemo] = useState('')
  const [mealType, setMealType] = useState('朝食')
  const [mealContent, setMealContent] = useState('')
  const [image, setImage] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('body')
  const fileRef = useRef()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUserId(user.id)
      const { data } = await supabase.from('body_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(7)
      setLogs(data || [])
    }
    load()
  }, [])

  const saveBodyLog = async (e) => {
    e.preventDefault()
    setLoading(true)
    await supabase.from('body_logs').insert({ user_id: userId, weight: parseFloat(weight), body_fat: parseFloat(bodyFat), memo })
    const { data } = await supabase.from('body_logs').select('*').eq('user_id', userId).order('logged_at', { ascending: false }).limit(7)
    setLogs(data || [])
    setSuccess('記録しました！')
    setWeight('')
    setBodyFat('')
    setMemo('')
    setTimeout(() => setSuccess(''), 3000)
    setLoading(false)
  }

  const saveMealLog = async (e) => {
    e.preventDefault()
    setLoading(true)
    await supabase.from('meal_logs').insert({
      user_id: userId,
      meal_type: mealType,
      content: mealContent,
    })
    setSuccess('食事を記録しました！')
    setMealContent('')
    setImage(null)
    setTimeout(() => setSuccess(''), 3000)
    setLoading(false)
  }

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setImage(ev.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f5', paddingBottom: '80px' }}>
      <div style={{ background: '#fff', borderBottom: '0.5px solid #ebebeb', padding: '14px 16px' }}>
        <div style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a1a', marginBottom: '12px' }}>記録</div>
        <div style={{ display: 'flex', gap: '0', background: '#f0f0f0', borderRadius: '10px', padding: '3px' }}>
          {['body', 'meal'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ flex: 1, textAlign: 'center', padding: '7px 4px', fontSize: '13px', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: activeTab === tab ? '#fff' : 'transparent',
                color: activeTab === tab ? '#1a1a1a' : '#999',
                fontWeight: activeTab === tab ? '500' : '400',
              }}>
              {tab === 'body' ? '体重・体脂肪' : '食事記録'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>
        {success && <div style={{ background: '#FFF0E8', color: '#E85D04', fontSize: '13px', padding: '12px', borderRadius: '12px', marginBottom: '14px', border: '0.5px solid #FFDCC8' }}>{success}</div>}

        {activeTab === 'body' && (
          <>
            <div style={{ background: '#fff', borderRadius: '16px', border: '0.5px solid #ebebeb', padding: '16px', marginBottom: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '14px' }}>今日の記録</div>
              <form onSubmit={saveBodyLog}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>体重 (kg)</div>
                    <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} className="input" placeholder="68.0" required />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>体脂肪率 (%)</div>
                    <input type="number" step="0.1" value={bodyFat} onChange={e => setBodyFat(e.target.value)} className="input" placeholder="22.0" />
                  </div>
                </div>
                <textarea value={memo} onChange={e => setMemo(e.target.value)} className="input" rows={2} placeholder="今日の体調・メモ..." style={{ marginBottom: '10px' }} />
                <button type="submit" disabled={loading} className="btn-primary">{loading ? '保存中...' : '記録する'}</button>
              </form>
            </div>

            <div style={{ background: '#fff', borderRadius: '16px', border: '0.5px solid #ebebeb', padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '12px' }}>記録履歴</div>
              {logs.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#ccc', textAlign: 'center', padding: '16px 0' }}>まだ記録がありません</p>
              ) : logs.map(l => (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '0.5px solid #f5f5f5' }}>
                  <span style={{ fontSize: '12px', color: '#aaa' }}>{l.logged_at}</span>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>{l.weight} kg</span>
                    {l.body_fat && <span style={{ fontSize: '13px', color: '#aaa' }}>{l.body_fat} %</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'meal' && (
          <div style={{ background: '#fff', borderRadius: '16px', border: '0.5px solid #ebebeb', padding: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '14px' }}>食事を記録</div>
            <input type="file" ref={fileRef} accept="image/*" onChange={handleImage} style={{ display: 'none' }} />

            {image ? (
              <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' }}>
                <img src={image} alt="食事" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }} />
                <button onClick={() => setImage(null)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '20px', fontSize: '11px', padding: '4px 10px', cursor: 'pointer' }}>変更</button>
              </div>
            ) : (
              <button onClick={() => fileRef.current.click()}
                style={{ width: '100%', border: '1.5px dashed #e0e0e0', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#fafafa', marginBottom: '12px' }}>
                <span style={{ fontSize: '28px' }}>📷</span>
                <span style={{ fontSize: '13px', color: '#bbb' }}>写真を追加する</span>
              </button>
            )}

            <form onSubmit={saveMealLog}>
              <select value={mealType} onChange={e => setMealType(e.target.value)} className="input" style={{ marginBottom: '10px' }}>
                {['朝食', '昼食', '夕食', '間食'].map(t => <option key={t}>{t}</option>)}
              </select>
              <textarea value={mealContent} onChange={e => setMealContent(e.target.value)} className="input" rows={3} placeholder="例：天丼、味噌汁、サラダ..." style={{ marginBottom: '10px' }} required />
              <button type="submit" disabled={loading} className="btn-primary">{loading ? '保存中...' : '記録する'}</button>
            </form>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
