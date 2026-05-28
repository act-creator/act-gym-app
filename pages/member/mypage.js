import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'
import BottomNav from '../../components/BottomNav'

export default function MyPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
    }
    load()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f5', paddingBottom: '90px' }}>
      <div style={{ background: '#fff', borderBottom: '0.5px solid #ebebeb', padding: '14px 16px' }}>
        <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>マイページ</div>
      </div>
      <div style={{ padding: '20px 16px' }}>
        <div style={{ background: '#fff', borderRadius: '16px', border: '0.5px solid #ebebeb', padding: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#FFF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '20px', fontWeight: '600', color: '#E85D04' }}>{profile?.name?.charAt(0) || '?'}</span>
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a' }}>{profile?.name || '...'}</div>
            <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>{profile?.email || ''}</div>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', border: '0.5px solid #ebebeb', overflow: 'hidden', marginBottom: '16px' }}>
          <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#1a1a1a' }}>パーソナルジムAct.</span>
            <span style={{ fontSize: '12px', color: '#aaa' }}>刈谷市</span>
          </div>
          <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#1a1a1a' }}>会員ステータス</span>
            <span style={{ fontSize: '12px', background: '#FFF0E8', color: '#E85D04', padding: '3px 10px', borderRadius: '20px' }}>会員</span>
          </div>
        </div>

        <button onClick={handleLogout}
          style={{ width: '100%', background: '#fff', border: '0.5px solid #ebebeb', borderRadius: '16px', padding: '14px', fontSize: '14px', color: '#aaa', cursor: 'pointer', textAlign: 'center' }}>
          ログアウト
        </button>
      </div>
      <BottomNav />
    </div>
  )
}
