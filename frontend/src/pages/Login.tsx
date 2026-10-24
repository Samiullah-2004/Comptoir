import { useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { LOGIN } from '../graphql/mutations'
import { useAuth } from '../context/AuthContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { friendlyError } from '../lib/errors'
import AuthLayout, { Field, FormError, SubmitButton } from '../components/AuthLayout'

interface AuthUser {
  id: string
  name: string
  email: string
  role: string
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'
  const [loginMutation, { loading }] = useMutation(LOGIN)
  usePageTitle('Log in')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const res = await loginMutation({ variables: { email, password } })
      const data = res.data as { login: { token: string; user: AuthUser } }
      login(data.login.token, data.login.user)
      navigate(from, { replace: true })
    } catch (err) {
      setError(friendlyError(err))
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to order and track your food.">
      <form onSubmit={handleSubmit}>
        <Field id="email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Field id="password" label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
        <FormError message={error} />
        <SubmitButton loading={loading} loadingText="Logging in...">
          Log in
        </SubmitButton>
      </form>
      <p className="text-sm text-text-secondary mt-6 text-center">
        No account?{' '}
        <Link to="/register" state={{ from }} className="text-accent-fg hover:opacity-75 font-medium">
          Create one
        </Link>
      </p>
    </AuthLayout>
  )
}
