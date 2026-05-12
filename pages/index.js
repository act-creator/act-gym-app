import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.user) {
          await supabase.from('profiles').insert({ id: data.user.id, name, email, role: 'member' })
          router.push('/member')
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
        router.push(profile?.role === 'admin' ? '/admin' : '/member')
      }
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'メールアドレスまたはパスワードが違います' : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
          <img src="/act_logo_2_b.jpg" alt="PERSONAL GYM Act." style={{ width: '180px', height: 'auto', marginBottom: '8px', display: 'block' }} />
          <p style={{ fontSize: '11px', color: '#bbb', letterSpacing: '2px' }}>MEMBER APP</p>
        </div>
        <div className="card" style={{ borderRadius: '20px', padding: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a1a', marginBottom: '20px' }}>
            {isSignUp ? '新規会員登録' : 'ログイン'}
          </h2>
          {error && (
            <div style={{ background: '#FFF0E8', color: '#E85D04', fontSize: '13px', padding: '12px', borderRadius: '10px', marginBottom: '16px', border: '0.5px solid #FFDCC8' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleAuth}>
            {isSignUp && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>お名前</div>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="input" placeholder="山田 太郎" required />
              </div>
            )}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>メールアドレス</div>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="email@example.com" required />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>パスワード</div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input" placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? '処理中...' : isSignUp ? '登録する' : 'ログイン'}
            </button>
          </form>
          <button onClick={() => setIsSignUp(!isSignUp)} style={{ width: '100%', textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#E85D04', background: 'none', border: 'none', cursor: 'pointer' }}>
            {isSignUp ? 'すでにアカウントをお持ちの方はこちら' : '新規会員登録はこちら'}
          </button>
        </div>
        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '11px', color: '#ccc', letterSpacing: '1px' }}>PERSONAL GYM Act. 刈谷市</p>
      </div>
    </div>
  )
}
