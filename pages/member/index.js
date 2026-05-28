import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'
import BottomNav from '../../components/BottomNav'

function getEmbedUrl(url) {
  if (!url) return null
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vm = url.match(/vimeo\.com\/(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`
  return url
}

const categoryColors = {
  '下半身': { bg: '#FFF0E8', color: '#E85D04', accent: '#E85D04' },
  '上半身': { bg: '#EEF4FF', color: '#3B6FD4', accent: '#3B6FD4' },
  '体幹':   { bg: '#EEFAF3', color: '#1E8A4C', accent: '#1E8A4C' },
  'ストレッチ': { bg: '#FDF5FF', color: '#8B3FD4', accent: '#8B3FD4' },
  '全身':   { bg: '#FFF8EE', color: '#B36800', accent: '#B36800' },
}
const levelColors = {
  '初級': { bg: '#EEFAF3', color: '#1E8A4C' },
  '中級': { bg: '#FFF8EE', color: '#B36800' },
  '上級': { bg: '#FEEEEE', color: '#C0392B' },
}

const categories = ['全て', '下半身', '上半身', '体幹', 'ストレッチ', '全身']

export default function VideoLibrary() {
  const router = useRouter()
  const [menus, setMenus] = useState([])
  const [filtered, setFiltered] = useState([])
  const [category, setCategory] = useState('全て')
  const [search, setSearch] = useState('')
  const [view, setView] = useState('grid')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data } = await supabase.from('training_menus').select('*').order('created_at')
      setMenus(data || [])
      setFiltered(data || [])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    let result = menus
    if (category !== '全て') result = result.filter(m => m.category === category)
    if (search) result = result.filter(m => m.title.includes(search) || (m.description || '').includes(search))
    setFiltered(result)
  }, [category, search, menus])

  const cc = (cat) => categoryColors[cat] || { bg: '#f5f5f5', color: '#888', accent: '#888' }
  const lc = (lvl) => levelColors[lvl] || { bg: '#f5f5f5', color: '#888' }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#fff' }}><div style={{ color: '#ccc', fontSize: '14px' }}>読み込み中...</div></div>

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f5', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <div style={{ background: '#fff', borderBottom: '0.5px solid #ebebeb', padding: '14px 16px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <img src="/act_logo_1.jpg" alt="Act." style={{ height: '28px', width: 'auto' }} />
          <div style={{ fontSize: '11px', color: '#E85D04', fontWeight: '500', background: '#FFF0E8', padding: '4px 10px', borderRadius: '20px' }}>{filtered.length} 動画</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', background: '#f7f7f5', borderRadius: '10px', padding: '9px 12px', gap: '8px', marginBottom: '12px', border: '0.5px solid #ebebeb' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="#bbb" strokeWidth="1.2"/><line x1="9.5" y1="9.5" x2="13" y2="13" stroke="#bbb" strokeWidth="1.2" strokeLinecap="round"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="動画を検索..."
            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '15px', color: '#1a1a1a', outline: 'none' }} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#bbb', fontSize: '16px', cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>}
        </div>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none' }}>
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              style={{ fontSize: '13px', padding: '7px 16px', borderRadius: '20px', border: '0.5px solid', whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                background: category === c ? '#E85D04' : '#fff',
                color: category === c ? '#fff' : '#888',
                borderColor: category === c ? '#E85D04' : '#e0e0e0' }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* コンテンツ */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 90px', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '12px', color: '#aaa' }}>{filtered.length}件</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {['grid', 'list'].map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{ width: '34px', height: '34px', borderRadius: '8px', border: '0.5px solid', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', WebkitTapHighlightColor: 'transparent',
                  background: view === v ? '#E85D04' : '#fff',
                  borderColor: view === v ? '#E85D04' : '#e0e0e0' }}>
                {v === 'grid' ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke={view==='grid'?'#fff':'#888'} strokeWidth="1.2"/><rect x="8" y="1" width="5" height="5" rx="1" stroke={view==='grid'?'#fff':'#888'} strokeWidth="1.2"/><rect x="1" y="8" width="5" height="5" rx="1" stroke={view==='grid'?'#fff':'#888'} strokeWidth="1.2"/><rect x="8" y="8" width="5" height="5" rx="1" stroke={view==='grid'?'#fff':'#888'} strokeWidth="1.2"/></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="1" y1="3" x2="13" y2="3" stroke={view==='list'?'#fff':'#888'} strokeWidth="1.2" strokeLinecap="round"/><line x1="1" y1="7" x2="13" y2="7" stroke={view==='list'?'#fff':'#888'} strokeWidth="1.2" strokeLinecap="round"/><line x1="1" y1="11" x2="13" y2="11" stroke={view==='list'?'#fff':'#888'} strokeWidth="1.2" strokeLinecap="round"/></svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#ccc' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎬</div>
            <div style={{ fontSize: '14px' }}>動画が見つかりません</div>
          </div>
        )}

        {view === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {filtered.map(m => {
              const c = cc(m.category)
              return (
                <div key={m.id} onClick={() => setSelected(m)}
                  style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '0.5px solid #ebebeb', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                  <div style={{ height: '90px', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderBottom: `2px solid ${c.accent}` }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 0, height: 0, borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderLeft: '12px solid #fff', marginLeft: '2px' }}></div>
                    </div>
                    {m.category && <div style={{ position: 'absolute', bottom: '6px', left: '8px', fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>{m.category}</div>}
                  </div>
                  <div style={{ padding: '8px 10px 10px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '5px', lineHeight: '1.3' }}>{m.title}</div>
                    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                      {m.category && <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '10px', background: c.bg, color: c.color }}>{m.category}</span>}
                      {m.level && (() => { const l = lc(m.level); return <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '10px', background: l.bg, color: l.color }}>{m.level}</span> })()}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div>
            {filtered.map(m => {
              const c = cc(m.category)
              const l = lc(m.level)
              return (
                <div key={m.id} onClick={() => setSelected(m)}
                  style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '0.5px solid #ebebeb', marginBottom: '10px', display: 'flex', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                  <div style={{ width: '4px', background: c.accent, flexShrink: 0 }}></div>
                  <div style={{ width: '100px', height: '72px', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: '9px solid #fff', marginLeft: '2px' }}></div>
                    </div>
                  </div>
                  <div style={{ padding: '10px 12px', flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a', marginBottom: '3px' }}>{m.title}</div>
                    <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>{m.sets}セット × {m.reps} · 休憩{m.rest_seconds}秒</div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {m.category && <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '10px', background: c.bg, color: c.color }}>{m.category}</span>}
                      {m.level && <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '10px', background: l.bg, color: l.color }}>{m.level}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 動画詳細モーダル */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }} onClick={() => setSelected(null)}>
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxHeight: '90vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
            borderTop: `4px solid ${cc(selected.category).accent}`, paddingBottom: 'env(safe-area-inset-bottom, 24px)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 16px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a', flex: 1, paddingRight: '12px' }}>{selected.title}</div>
                <button onClick={() => setSelected(null)} style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#f5f5f5', border: 'none', cursor: 'pointer', color: '#888', fontSize: '14px', flexShrink: 0 }}>✕</button>
              </div>
              <div style={{ display: 'flex', gap: '5px', marginBottom: '14px' }}>
                {selected.category && (() => { const c = cc(selected.category); return <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '20px', background: c.bg, color: c.color }}>{selected.category}</span> })()}
                {selected.level && (() => { const l = lc(selected.level); return <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '20px', background: l.bg, color: l.color }}>{selected.level}</span> })()}
              </div>
            </div>

            {selected.video_url ? (
              <div style={{ aspectRatio: '16/9', background: '#000' }}>
                <iframe src={getEmbedUrl(selected.video_url)} style={{ width: '100%', height: '100%' }} frameBorder="0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
              </div>
            ) : (
              <div style={{ aspectRatio: '16/9', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎬</div>
                  <div style={{ fontSize: '12px', color: '#555' }}>動画未登録</div>
                </div>
              </div>
            )}

            <div style={{ padding: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '16px' }}>
                {[['セット', selected.sets], ['回数', selected.reps], ['休憩', `${selected.rest_seconds}秒`]].map(([label, val]) => (
                  <div key={label} style={{ background: '#f7f7f5', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#aaa', marginBottom: '4px' }}>{label}</div>
                    <div style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a' }}>{val}</div>
                  </div>
                ))}
              </div>
              {selected.description && <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.7' }}>{selected.description}</p>}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
