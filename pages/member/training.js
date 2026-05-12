import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'
import BottomNav from '../../components/BottomNav'

export default function Training() {
  const router = useRouter()
  const [menus, setMenus] = useState([])
  const [selected, setSelected] = useState(null)
  const [category, setCategory] = useState('全て')
  const categories = ['全て', '下半身', '上半身', '体幹', 'ストレッチ']

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data } = await supabase.from('training_menus').select('*').order('created_at')
      setMenus(data || [])
    }
    load()
  }, [])

  const filtered = category === '全て' ? menus : menus.filter(m => m.category === category)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="text-base font-bold text-gray-800">トレーニングメニュー</h1>
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`text-sm px-3 py-1 rounded-full border whitespace-nowrap transition-colors flex-shrink-0 ${category === c ? 'bg-act-green text-white border-act-green' : 'border-gray-200 text-gray-500'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm">メニューが登録されていません</div>
        )}
        {filtered.map(m => (
          <div key={m.id} className="card cursor-pointer hover:border-act-border transition-colors" onClick={() => setSelected(m)}>
            {m.video_url && (
              <div className="relative rounded-xl overflow-hidden mb-3 bg-gray-900 h-36 flex items-center justify-center">
                <iframe src={m.video_url.replace('watch?v=', 'embed/')} className="w-full h-full" frameBorder="0" allowFullScreen />
              </div>
            )}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-gray-800 mb-1">{m.title}</p>
                <div className="flex gap-1 flex-wrap">
                  {m.category && <span className="badge-green">{m.category}</span>}
                  {m.level && <span className="badge-blue">{m.level}</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-400">セット数</p>
                <p className="text-sm font-bold text-gray-800">{m.sets}×{m.reps}</p>
              </div>
            </div>
            {m.description && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{m.description}</p>}
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-y-auto p-5" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-gray-800">{selected.title}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 text-xl">✕</button>
            </div>
            {selected.video_url && (
              <div className="rounded-xl overflow-hidden mb-4 bg-gray-900 aspect-video">
                <iframe src={selected.video_url.replace('watch?v=', 'embed/')} className="w-full h-full" frameBorder="0" allowFullScreen />
              </div>
            )}
            <div className="flex gap-2 mb-4 flex-wrap">
              {selected.category && <span className="badge-green">{selected.category}</span>}
              {selected.level && <span className="badge-blue">{selected.level}</span>}
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">セット</p>
                <p className="text-lg font-bold text-gray-800">{selected.sets}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">回数</p>
                <p className="text-lg font-bold text-gray-800">{selected.reps}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">休憩</p>
                <p className="text-lg font-bold text-gray-800">{selected.rest_seconds}秒</p>
              </div>
            </div>
            {selected.description && <p className="text-sm text-gray-600 leading-relaxed">{selected.description}</p>}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
