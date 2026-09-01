import { useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { useNavigate, Link } from 'react-router-dom'
import { LOGIN } from '../graphql/mutations'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const [loginMutation, { loading, error }] = useMutation(LOGIN)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await loginMutation({ variables: { email, password } })
    if (res.data) {
      const data = res.data as { login: { token: string; user: { id: string; email: string; role: string } } }
      login(data.login.token, data.login.user)
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-border rounded-[10px] p-8 w-full max-w-sm"
      >
        <h1 className="font-display text-2xl font-semibold text-text mb-6">Welcome back</h1>

        <label className="block text-sm text-text-secondary mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border border-border rounded-[6px] px-3 py-2 mb-4 text-text bg-transparent"
        />

        <label className="block text-sm text-text-secondary mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border border-border rounded-[6px] px-3 py-2 mb-4 text-text bg-transparent"
        />

        {error && <p className="text-accent text-sm mb-4">{error.message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent hover:bg-accent-hover text-white rounded-[6px] py-2 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>

        <p className="text-sm text-text-secondary mt-4 text-center">
          No account? <Link to="/register" className="text-accent">Sign up</Link>
        </p>
      </form>
    </div>
  )
}