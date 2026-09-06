import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useTheme } from '../context/ThemeContext'
import FlipLink from './FlipLink'

interface HeaderProps {
  searchQuery?: string
  onSearchChange?: (value: string) => void
}

export default function Header({ searchQuery, onSearchChange }: HeaderProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { items } = useCart()
  const { theme, toggleTheme } = useTheme()

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const showSearch = onSearchChange !== undefined

  function goHome() {
    navigate('/')
  }

  const navButtonBase =
    'text-sm px-3.5 py-1.5 rounded-full border transition-colors whitespace-nowrap'
  const navButtonInactive =
    'border-border text-text-secondary hover:border-accent hover:text-text'
  const adminButtonStyle =
    'border-accent text-accent bg-accent/10 hover:bg-accent hover:text-white font-medium'

  return (
    <header className="border-b border-border px-8 py-4 flex items-center gap-6 bg-surface">
      <button onClick={goHome} className="flex-shrink-0">
        <h1 className="font-display text-xl font-semibold text-text whitespace-nowrap">Comptoir</h1>
      </button>

      <nav className="hidden md:flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="text-sm px-3.5 py-1.5 rounded-full border border-border text-text-secondary hover:border-accent hover:text-text transition-colors"
        >
          <FlipLink>Menu</FlipLink>
        </button>
        {user && (
          <button
            onClick={() => navigate('/orders')}
            className="text-sm px-3.5 py-1.5 rounded-full border border-border text-text-secondary hover:border-accent hover:text-text transition-colors"
          >
            <FlipLink>Orders</FlipLink>
          </button>
        )}
        {user?.role === 'ADMIN' && (
          <button
            onClick={() => navigate('/admin')}
            className="text-sm px-3.5 py-1.5 rounded-full border border-admin text-admin bg-admin/10 hover:bg-admin hover:text-white font-medium transition-colors"
          >
            <FlipLink>Admin</FlipLink>
          </button>
        )}
      </nav>

      <div className="flex-1" />

      {showSearch && (
        <div className="relative w-56">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search for a dish..."
            className="w-full border border-border rounded-full pl-9 pr-7 py-1.5 text-sm bg-bg text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange?.('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text text-xs"
            >
              ✕
            </button>
          )}
        </div>
      )}

      <motion.button
        whileHover={{ scale: 1.1, rotate: 15 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleTheme}
        className="text-text-secondary hover:text-text flex-shrink-0"
        aria-label="Toggle dark mode"
      >
        {theme === 'light' ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )}
      </motion.button>

      <motion.button
        onClick={() => navigate('/cart')}
        className="relative text-sm px-3.5 py-1.5 rounded-full border border-accent text-accent bg-accent/10 hover:bg-accent hover:text-white font-medium transition-colors whitespace-nowrap flex-shrink-0 flex items-center gap-1.5"
      >
        <FlipLink>Cart</FlipLink>
        {cartCount > 0 && (
          <motion.span
            key={cartCount}
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
            className="bg-white text-accent text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
          >
            {cartCount}
          </motion.span>
        )}
      </motion.button>

      {user ? (
        <button
          onClick={() => navigate('/orders')}
          className="w-8 h-8 rounded-full bg-accent text-white text-sm font-medium flex items-center justify-center flex-shrink-0"
          title={user.name || user.email}
        >
          {(user.name || user.email).charAt(0).toUpperCase()}
        </button>
      ) : (
        <>
          <button onClick={() => navigate('/login')} className="text-sm text-text-secondary hover:text-text transition-colors hidden md:inline flex-shrink-0">
            Login
          </button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/register')}
            className="bg-accent hover:bg-accent-hover text-white text-sm px-4 py-2 rounded-[6px] whitespace-nowrap flex-shrink-0"
          >
            Sign up
          </motion.button>
        </>
      )}
    </header>
  )
}