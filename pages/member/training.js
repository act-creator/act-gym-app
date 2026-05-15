import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'
import BottomNav from '../../components/BottomNav'

function getEmbedUrl(url) {
  if (!url) return null
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`
  return url
}

// 部位ごとの色
const categoryColors = {
  '下半身': { bg: '#FFF0E8', color: '#E85D04', border: '#FFDCC8' },
  '上半身': { bg: '#EEF4FF', color: '#3B6FD4', border: '#C8D8FF' },
  '体幹':   { bg: '#EEFAF3', color: '#1E8A4C', border: '#C8EDD9' },
  'ストレッチ': { bg: '#FDF5FF', color: '#8B3FD4', border: '#E2C8FF' },
  '全身':   { bg: '#FFF8EE', color: '#B36800', border: '#FFE0A8' },
}

// 難易度ごとの色
const levelColors = {
  '初級': { bg: '#EEFAF3', color: '#1E8A4C' },
  '中級': { bg: '#FFF8EE', color: '#B36800' },
  '上級': { bg: '#FEEEEE', color: '#C0392B' },
}

// カードの左ボーダー色
const cardAccent = (category) => {
  const c = categoryColors[category]
  return c ? c.color : '#E85D04'
}

export default function Training() {
  const router = useRouter()
  const [menus, setMenus] = useState([])
  const [selected, setSelected] = useState(null)
  const [category, setCategory] = useState('全て')
  const categories = ['全て', '下半身', '上半身', '体幹', 'ストレッチ', '全身']

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

  const catColor = (cat) => categoryColors[cat] || { bg: '#f5f5f5', color: '#888', border: '#e0e0e0' }
  const lvlColor = (lvl) => levelColors[lvl] || { bg: '#f5f5f5', color: '#888' }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f5', paddingBottom: '80px' }}>
      <div style={{ background: '#fff', borderBottom: '0.5px solid #ebebeb', padding: '14px 16px' }}>
        <div style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a1a', marginBottom: '12px' }}>トレーニングメニュー</div>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              style={{
                fontSize: '12px', padding: '5px 12px', borderRadius: '20px', border: '0.5px solid', whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', transition: 'all 0.15s',
                background: category === c ? '#E85D04' : '#fff',
                color: category === c ? '#fff' : '#888',
                borderColor: category === c ? '#E85D04' : '#e0e0e0',
              }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#ccc', fontSize: '14px' }}>メニューが登録されていません</div>
        )}
        {filtered.map(m => {
          const cc = catColor(m.category)
          const lc = lvlColor(m.level)
          return (
            <div key={m.id} onClick={() => setSelected(m)}
              style={{ background: '#fff', borderRadius: '16px', border: '0.5px solid #ebebeb', marginBottom: '12px', overflow: 'hidden', cursor: 'pointer', borderLeft: `3px solid ${cardAccent(m.category)}` }}>
              {m.video_url && (
                <div style={{ height: '140px', background: '#1a1a1a', overflow: 'hidden' }}>
                  <iframe src={getEmbedUrl(m.video_url)} style={{ width: '100%', height: '100%' }} frameBorder="0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
                </div>
              )}
              <div style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>{m.title}</div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
                    <div style={{ fontSize: '10px', color: '#aaa' }}>セット数</div>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>{m.sets}×{m.reps}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {m.category && (
                    <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '20px', background: cc.bg, color: cc.color, border: `0.5px solid ${cc.border}` }}>
                      {m.category}
                    </span>
                  )}
                  {m.level && (
                    <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '20px', background: lc.bg, color: lc.color }}>
                      {m.level}
                    </span>
                  )}
                </div>
                {m.description && <p style={{ fontSize: '12px', color: '#aaa', marginTop: '7px', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{m.description}</p>}
              </div>
            </div>
          )
        })}
      </div>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }} onClick={() => setSelected(null)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '20px 16px 40px', borderTop: `4px solid ${cardAccent(selected.category)}` }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '18px', fontWeight: '500', color: '#1a1a1a' }}>{selected.title}</div>
              <button onClick={() => setSelected(null)} style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', color: '#888', fontSize: '14px' }}>✕</button>
            </div>

            {selected.video_url && (
              <div style={{ borderRadius: '14px', overflow: 'hidden', marginBottom: '14px', background: '#1a1a1a', aspectRatio: '16/9' }}>
                <iframe src={getEmbedUrl(selected.video_url)} style={{ width: '100%', height: '100%' }} frameBorder="0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
              </div>
            )}

            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {selected.category && (() => { const cc = catColor(selected.category); return <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '20px', background: cc.bg, color: cc.color, border: `0.5px solid ${cc.border}` }}>{selected.category}</span> })()}
              {selected.level && (() => { const lc = lvlColor(selected.level); return <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '20px', background: lc.bg, color: lc.color }}>{selected.level}</span> })()}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '14px' }}>
              {[['セット', selected.sets], ['回数', selected.reps], ['休憩', `${selected.rest_seconds}秒`]].map(([label, val]) => (
                <div key={label} style={{ background: '#f7f7f5', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#aaa', marginBottom: '4px' }}>{label}</div>
                  <div style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a' }}>{val}</div>
                </div>
              ))}
            </div>

            {selected.description && <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.7' }}>{selected.description}</p>}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
