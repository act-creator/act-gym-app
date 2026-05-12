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
          await supabase.from('profiles').insert({
            id: data.user.id,
            name,
            email,
            role: 'member'
          })
          router.push('/member')
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
        if (profile?.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/member')
        }
      }
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'メールアドレスまたはパスワードが違います' : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-act-light to-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-act-green rounded-2xl mb-4">
            <span className="text-white text-2xl font-bold">A</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">パーソナルジムAct.</h1>
          <p className="text-gray-500 text-sm mt-1">会員専用アプリ</p>
        </div>

        <div className="card">
          <h2 className="text-base font-medium text-gray-700 mb-4">
            {isSignUp ? '新規会員登録' : 'ログイン'}
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>
          )}

          <form onSubmit={handleAuth} className="space-y-3">
            {isSignUp && (
              <input
                type="text"
                placeholder="お名前"
                value={name}
                onChange={e => setName(e.target.value)}
                className="input"
                required
              />
            )}
            <input
              type="email"
              placeholder="メールアドレス"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input"
              required
            />
            <input
              type="password"
              placeholder="パスワード"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input"
              required
            />
            <button type="submit" disabled={loading} className="btn-primary mt-2">
              {loading ? '処理中...' : isSignUp ? '登録する' : 'ログイン'}
            </button>
          </form>

          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-act-green text-sm text-center w-full mt-4"
          >
            {isSignUp ? 'すでにアカウントをお持ちの方はこちら' : '新規会員登録はこちら'}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2025 パーソナルジムAct. 刈谷市
        </p>
      </div>
    </div>
  )
}
