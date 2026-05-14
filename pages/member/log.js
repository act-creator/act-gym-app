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
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('body')

  // AI食事分析
  const [image, setImage] = useState(null)
  const [imageBase64, setImageBase64] = useState('')
  const [imageType, setImageType] = useState('image/jpeg')
  const [analyzing, setAnalyzing] = useState(false)
  const [aiResult, setAiResult] = useState(null)
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
      ai_score: aiResult?.score || null,
      ai_feedback: aiResult ? JSON.stringify(aiResult) : null
    })
    setSuccess('食事を記録しました！')
    setMealContent('')
    setImage(null)
    setAiResult(null)
    setTimeout(() => setSuccess(''), 3000)
    setLoading(false)
  }

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageType('image/jpeg')
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxSize = 800
        let w = img.width
        let h = img.height
        if (w > h && w > maxSize) { h = Math.round(h * maxSize / w); w = maxSize }
        else if (h > maxSize) { w = Math.round(w * maxSize / h); h = maxSize }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        const compressed = canvas.toDataURL('image/jpeg', 0.7)
        setImage(compressed)
        setImageBase64(compressed.split(',')[1])
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  const analyzeImage = async () => {
    if (!imageBase64) return
    setAnalyzing(true)
    setAiResult(null)
    try {
      const res = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, imageType })
      })
      const data = await res.json()
      if (data.error) {
        alert('分析エラー: ' + data.error)
      } else {
        setAiResult(data)
      }
    } catch (e) {
      alert('通信エラー: ' + e.message)
    }
    setAnalyzing(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="text-base font-bold text-gray-800">記録</h1>
        <div className="flex gap-2 mt-3">
          {['body', 'meal'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${activeTab === tab ? 'bg-act-green text-white border-act-green' : 'border-gray-200 text-gray-500'}`}>
              {tab === 'body' ? '体重・体脂肪' : '食事ログ'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {success && <div className="bg-act-light text-act-dark text-sm p-3 rounded-lg">{success}</div>}

        {activeTab === 'body' && (
          <>
            <div className="card">
              <h2 className="text-sm font-medium text-gray-700 mb-3">今日の記録</h2>
              <form onSubmit={saveBodyLog} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">体重 (kg)</label>
                    <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} className="input" placeholder="68.0" required />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">体脂肪率 (%)</label>
                    <input type="number" step="0.1" value={bodyFat} onChange={e => setBodyFat(e.target.value)} className="input" placeholder="22.0" />
                  </div>
                </div>
                <textarea value={memo} onChange={e => setMemo(e.target.value)} className="input" rows={2} placeholder="今日の体調・メモ..." />
                <button type="submit" disabled={loading} className="btn-primary">{loading ? '保存中...' : '記録する'}</button>
              </form>
            </div>

            <div className="card">
              <h2 className="text-sm font-medium text-gray-700 mb-3">記録履歴</h2>
              {logs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-3">まだ記録がありません</p>
              ) : (
                <div className="space-y-2">
                  {logs.map(l => (
                    <div key={l.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <span className="text-xs text-gray-400">{l.logged_at}</span>
                      <div className="flex gap-4">
                        <span className="text-sm font-medium text-gray-800">{l.weight} kg</span>
                        {l.body_fat && <span className="text-sm text-gray-500">{l.body_fat} %</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'meal' && (
          <>
            <div className="card">
              <h2 className="text-sm font-medium text-gray-700 mb-3">AI食事分析</h2>
              <input type="file" ref={fileRef} accept="image/*" onChange={handleImage} className="hidden" />

              {!image ? (
                <button onClick={() => fileRef.current.click()} className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center gap-2 text-gray-400 hover:border-act-green transition-colors">
                  <span className="text-3xl">📷</span>
                  <span className="text-sm">食事の写真を撮る・選ぶ</span>
                </button>
              ) : (
                <div>
                  <div className="relative rounded-xl overflow-hidden mb-3">
                    <img src={image} alt="食事" className="w-full max-h-48 object-cover" />
                    <button onClick={() => { setImage(null); setAiResult(null) }} className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">変更</button>
                  </div>
                  {!aiResult && (
                    <button onClick={analyzeImage} disabled={analyzing} className="btn-primary">
                      {analyzing ? 'AI分析中...' : 'AIで分析する'}
                    </button>
                  )}
                  {aiResult && (
                    <div className="space-y-3">
                      <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">総合スコア</span>
                        <span className={`text-2xl font-bold ${aiResult.score >= 80 ? 'text-act-green' : aiResult.score >= 60 ? 'text-amber-500' : 'text-red-500'}`}>{aiResult.score}<span className="text-sm font-normal text-gray-400">/100</span></span>
                      </div>
                      <div className="bg-act-light rounded-xl p-3">
                        <p className="text-xs font-medium text-act-dark mb-1">良かった点</p>
                        {aiResult.good_points?.map((p, i) => <p key={i} className="text-xs text-act-dark">✓ {p}</p>)}
                      </div>
                      <div className="space-y-2">
                        {aiResult.improvements?.map((imp, i) => (
                          <div key={i} className="bg-white border border-gray-100 rounded-xl p-3">
                            <p className="text-xs font-medium text-gray-700">{imp.priority === 'high' ? '⚠️' : imp.priority === 'mid' ? '💡' : '✅'} {imp.title}</p>
                            <p className="text-xs text-gray-500 mt-1">{imp.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="text-sm font-medium text-gray-700 mb-3">食事を記録</h2>
              <form onSubmit={saveMealLog} className="space-y-3">
                <select value={mealType} onChange={e => setMealType(e.target.value)} className="input">
                  {['朝食', '昼食', '夕食', '間食'].map(t => <option key={t}>{t}</option>)}
                </select>
                <textarea value={mealContent} onChange={e => setMealContent(e.target.value)} className="input" rows={3} placeholder="例：天丼、味噌汁、サラダ..." required />
                <button type="submit" disabled={loading} className="btn-primary">{loading ? '保存中...' : '記録する'}</button>
              </form>
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
