import { createContext, useContext, useState, type ReactNode } from 'react'
import { client } from '../lib/apolloClient'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

// JWTs expire after 7 days. Reading `exp` client-side lets us drop a stale
// session up front instead of failing on the first authenticated request.
function isTokenExpired(token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

function loadSession(): { token: string | null; user: User | null } {
  try {
    const token = localStorage.getItem('token')
    const stored = localStorage.getItem('user')
    if (!token || !stored || isTokenExpired(token)) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return { token: null, user: null }
    }
    return { token, user: JSON.parse(stored) }
  } catch {
    return { token: null, user: null }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(loadSession)

  function login(newToken: string, newUser: User) {
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    setSession({ token: newToken, user: newUser })
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setSession({ token: null, user: null })
    // Drop cached orders etc. so the next account doesn't see them.
    client.clearStore()
  }

  return (
    <AuthContext.Provider value={{ user: session.user, token: session.token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
