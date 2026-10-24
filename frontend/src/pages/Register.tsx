import { useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { REGISTER } from '../graphql/mutations'
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

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'
  const [registerMutation, { loading }] = useMutation(REGISTER)
  usePageTitle('Sign up')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      const res = await registerMutation({ variables: { name, email, password } })
      const data = res.data as { register: { token: string; user: AuthUser } }
      login(data.register.token, data.register.user)
      navigate(from, { replace: true })
    } catch (err) {
      setError(friendlyError(err))
    }
  }

  return (
    <AuthLayout title="Create account" subtitle="It takes ten seconds. Then the menu is yours.">
      <form onSubmit={handleSubmit}>
        <Field id="name" label="Full name" value={name} onChange={setName} autoComplete="name" />
        <Field id="email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Field
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          hint="At least 8 characters."
        />
        <Field
          id="confirm-password"
          label="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
        />
        <FormError message={error} />
        <SubmitButton loading={loading} loadingText="Creating account...">
          Sign up
        </SubmitButton>
      </form>
      <p className="text-sm text-text-secondary mt-6 text-center">
        Already have an account?{' '}
        <Link to="/login" state={{ from }} className="text-accent-fg hover:opacity-75 font-medium">
          Log in
        </Link>
      </p>
    </AuthLayout>
  )
}
