import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  const [mobileOpen, setMobileOpen] = useState(false)

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const showSearch = onSearchChange !== undefined

  function goHome() {
    navigate('/')
    setMobileOpen(false)
  }

  function go(path: string) {
    navigate(path)
    setMobileOpen(false)
  }

  const navPillBase = 'text-sm px-3.5 rounded-full border transition-colors whitespace-nowrap h-9 flex items-center justify-center'
  const navPillInactive = 'border-border text-text-secondary hover:border-accent hover:text-text'
  const adminPillStyle = 'border-admin text-admin bg-admin/10 hover:bg-admin hover:text-white font-medium'
  const cartPillStyle = 'relative border-accent text-accent bg-accent/10 hover:bg-accent hover:text-white font-medium gap-1.5'

  const SearchInput = (
    <div className="relative w-full md:w-56">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
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
  )

  const ThemeToggle = (
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
  )

  return (
    <header className="border-b border-border px-4 sm:px-8 py-3 sm:py-4 flex items-center gap-3 sm:gap-6 bg-surface relative">
      <button onClick={goHome} className="flex-shrink-0">
        <h1 className="font-display text-lg sm:text-xl font-semibold text-text whitespace-nowrap">Comptoir</h1>
      </button>

      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-3">
        <button onClick={() => go('/')} className={`${navPillBase} ${navPillInactive}`}>
          <FlipLink>Menu</FlipLink>
        </button>
        {user && (
          <button onClick={() => go('/orders')} className={`${navPillBase} ${navPillInactive}`}>
            <FlipLink>Orders</FlipLink>
          </button>
        )}
        {user?.role === 'ADMIN' && (
          <button onClick={() => go('/admin')} className={`${navPillBase} ${adminPillStyle}`}>
            <FlipLink>Admin</FlipLink>
          </button>
        )}
      </nav>

      <div className="flex-1" />

      {/* Desktop search */}
      {showSearch && <div className="hidden md:block">{SearchInput}</div>}

      <div className="hidden md:block">{ThemeToggle}</div>

      <button
        onClick={() => go('/cart')}
        className={`hidden md:flex ${navPillBase} ${cartPillStyle} px-3`}
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
      </button>

      {user ? (
        <button
          onClick={() => go('/orders')}
          className="hidden md:flex w-8 h-8 rounded-full bg-accent text-white text-sm font-medium items-center justify-center flex-shrink-0"
          title={user.name || user.email}
        >
          {(user.name || user.email).charAt(0).toUpperCase()}
        </button>
      ) : (
        <div className="hidden md:flex items-center gap-3">
          <button onClick={() => go('/login')} className="text-sm text-text-secondary hover:text-text transition-colors">
            Login
          </button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => go('/register')}
            className="bg-accent hover:bg-accent-hover text-white text-sm px-4 py-2 rounded-[6px] whitespace-nowrap"
          >
            Sign up
          </motion.button>
        </div>
      )}

      {/* Mobile: cart pill + hamburger */}
      <div className="flex md:hidden items-center gap-2">
        <button
          onClick={() => go('/cart')}
          className={`relative ${navPillBase} ${cartPillStyle} px-2.5`}
        >
          🛒
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-accent text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="w-9 h-9 flex items-center justify-center text-text"
          aria-label="Menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown panel */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 bg-surface border-b border-border px-4 py-4 flex flex-col gap-3 md:hidden z-30"
          >
            {showSearch && SearchInput}

            <button onClick={() => go('/')} className="text-left text-sm text-text-secondary hover:text-text py-1.5">
              Menu
            </button>
            {user && (
              <button onClick={() => go('/orders')} className="text-left text-sm text-text-secondary hover:text-text py-1.5">
                Orders
              </button>
            )}
            {user?.role === 'ADMIN' && (
              <button onClick={() => go('/admin')} className="text-left text-sm text-admin font-medium py-1.5">
                Admin
              </button>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-sm text-text-secondary">Theme</span>
              {ThemeToggle}
            </div>

            {user ? (
              <div className="flex items-center gap-2 pt-1">
                <div className="w-7 h-7 rounded-full bg-accent text-white text-xs font-medium flex items-center justify-center">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-text">{user.name || user.email}</span>
              </div>
            ) : (
              <div className="flex gap-2 pt-1">
                <button onClick={() => go('/login')} className="flex-1 text-sm border border-border text-text py-2 rounded-[6px]">
                  Login
                </button>
                <button onClick={() => go('/register')} className="flex-1 text-sm bg-accent text-white py-2 rounded-[6px]">
                  Sign up
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}