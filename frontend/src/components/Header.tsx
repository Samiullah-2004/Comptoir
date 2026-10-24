import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useTheme } from '../context/ThemeContext'
import FlipLink from './FlipLink'

interface HeaderProps {
  searchQuery?: string
  onSearchChange?: (value: string) => void
}

function CartIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`${className} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3c-.6.6-.2 1.7.7 1.7H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}

export default function Header({ searchQuery, onSearchChange }: HeaderProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const { count: cartCount } = useCart()
  const { theme, toggleTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLElement>(null)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 8))

  const showSearch = onSearchChange !== undefined

  // Publish the bar's height so sticky elements below (the menu's category
  // strip) can sit flush under it at every breakpoint.
  useEffect(() => {
    const el = barRef.current
    if (!el) return
    const update = () => document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!userMenuOpen) return
    function handleClick(e: MouseEvent) {
      if (!userMenuRef.current?.contains(e.target as Node)) setUserMenuOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [userMenuOpen])

  function go(path: string) {
    navigate(path)
    setMobileOpen(false)
    setUserMenuOpen(false)
  }

  function handleLogout() {
    logout()
    go('/')
  }

  const isActive = (path: string) => (path === '/' ? pathname === '/' : pathname.startsWith(path))

  const navPillBase = 'relative text-sm px-3.5 rounded-full border transition-colors whitespace-nowrap h-9 flex items-center justify-center'
  const navPillInactive = 'border-border text-text-secondary hover:border-accent hover:text-text'
  const navPillActive = 'border-accent text-text'
  const adminPillStyle = 'border-admin text-admin bg-admin/10 hover:bg-admin hover:text-white font-medium'
  const cartPillStyle = 'relative border-accent bg-accent text-white hover:bg-accent-hover font-medium gap-1.5'

  const initial = user ? (user.name || user.email).charAt(0).toUpperCase() : ''

  const SearchInput = (
    <div className="relative w-full md:w-56 lg:w-64">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
      </svg>
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => onSearchChange?.(e.target.value)}
        placeholder="Search for a dish..."
        aria-label="Search the menu"
        className="w-full border border-border rounded-full pl-9 pr-8 py-2 text-sm bg-bg text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors [&::-webkit-search-cancel-button]:hidden"
      />
      <AnimatePresence>
        {searchQuery && (
          <motion.button
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            onClick={() => onSearchChange?.('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-border text-text-secondary hover:text-text text-[10px] flex items-center justify-center"
            aria-label="Clear search"
          >
            ✕
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )

  const ThemeToggle = (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleTheme}
      className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:text-text hover:bg-border/60 transition-colors flex-shrink-0 overflow-hidden"
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ y: -16, opacity: 0, rotate: -90 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: 16, opacity: 0, rotate: 90 }}
          transition={{ duration: 0.2 }}
          className="block"
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
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )

  const CartBadge = (
    <AnimatePresence>
      {cartCount > 0 && (
        <motion.span
          key={cartCount}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          className="bg-white text-accent text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center absolute -top-1.5 -right-1.5 ring-2 ring-accent"
        >
          {cartCount > 99 ? '99+' : cartCount}
        </motion.span>
      )}
    </AnimatePresence>
  )

  return (
    <header
      ref={barRef}
      className={`sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-300 ${scrolled
        ? 'bg-surface/80 backdrop-blur-xl border-border shadow-[0_6px_24px_-12px_rgba(0,0,0,0.25)]'
        : 'bg-surface border-border'
        }`}
    >
      <div className="px-4 sm:px-8 py-3 flex items-center gap-3 sm:gap-5 max-w-[1600px] mx-auto">
        <button onClick={() => go('/')} className="flex-shrink-0 flex items-center gap-2 group" aria-label="Comptoir home">
          <motion.img
            whileHover={{ rotate: -12, scale: 1.08 }}
            transition={{ type: 'spring', stiffness: 400, damping: 12 }}
            src="/logo-mark.png"
            alt=""
            className="w-8 h-8 object-contain"
          />
          <span className="font-display text-lg sm:text-xl font-semibold text-text whitespace-nowrap">Comptoir</span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2.5" aria-label="Main">
          <button onClick={() => go('/')} className={`${navPillBase} ${isActive('/') ? navPillActive : navPillInactive}`}>
            <FlipLink>Menu</FlipLink>
          </button>
          {user && (
            <button onClick={() => go('/orders')} className={`${navPillBase} ${isActive('/orders') ? navPillActive : navPillInactive}`}>
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

        {showSearch && <div className="hidden md:block">{SearchInput}</div>}

        <div className="hidden md:block">{ThemeToggle}</div>

        <button
          onClick={() => go('/cart')}
          className={`hidden md:flex ${navPillBase} ${cartPillStyle} px-3.5`}
          aria-label={`Cart, ${cartCount} items`}
        >
          <CartIcon />
          <FlipLink>Cart</FlipLink>
          {CartBadge}
        </button>

        {user ? (
          <div className="hidden md:block relative" ref={userMenuRef}>
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setUserMenuOpen((v) => !v)}
              className="w-9 h-9 rounded-full bg-accent text-white text-sm font-medium flex items-center justify-center flex-shrink-0 ring-2 ring-transparent hover:ring-accent/30 transition-shadow"
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              title={user.name || user.email}
            >
              {initial}
            </motion.button>
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  role="menu"
                  className="absolute right-0 mt-2 w-60 origin-top-right bg-surface border border-border rounded-[12px] shadow-xl p-1.5 z-50"
                >
                  <div className="px-3 py-2.5 border-b border-border mb-1">
                    <p className="text-sm font-medium text-text truncate">{user.name}</p>
                    <p className="text-xs text-text-secondary truncate">{user.email}</p>
                  </div>
                  <button role="menuitem" onClick={() => go('/orders')} className="w-full text-left text-sm text-text px-3 py-2 rounded-[8px] hover:bg-bg transition-colors">
                    My orders
                  </button>
                  {user.role === 'ADMIN' && (
                    <>
                      <button role="menuitem" onClick={() => go('/admin')} className="w-full text-left text-sm text-text px-3 py-2 rounded-[8px] hover:bg-bg transition-colors">
                        Admin dashboard
                      </button>
                      <button role="menuitem" onClick={() => go('/admin/menu')} className="w-full text-left text-sm text-text px-3 py-2 rounded-[8px] hover:bg-bg transition-colors">
                        Manage menu
                      </button>
                    </>
                  )}
                  <button role="menuitem" onClick={handleLogout} className="w-full text-left text-sm text-accent-fg px-3 py-2 rounded-[8px] hover:bg-accent/10 transition-colors">
                    Log out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => go('/login')} className="text-sm text-text-secondary hover:text-text transition-colors">
              Log in
            </button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => go('/register')}
              className="bg-accent hover:bg-accent-hover text-white text-sm px-4 py-2 rounded-full whitespace-nowrap transition-colors"
            >
              Sign up
            </motion.button>
          </div>
        )}

        {/* Mobile: cart pill + hamburger */}
        <div className="flex md:hidden items-center gap-1.5">
          <div>{ThemeToggle}</div>
          <button
            onClick={() => go('/cart')}
            className={`${navPillBase} ${cartPillStyle} w-9 !px-0`}
            aria-label={`Cart, ${cartCount} items`}
          >
            <CartIcon className="w-[18px] h-[18px]" />
            {CartBadge}
          </button>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="w-9 h-9 flex items-center justify-center text-text"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <motion.path
                strokeLinecap="round"
                initial={false}
                animate={{ d: mobileOpen ? 'M6 18L18 6' : 'M4 7L20 7' }}
                transition={{ duration: 0.2 }}
              />
              <motion.path
                strokeLinecap="round"
                initial={false}
                animate={{ opacity: mobileOpen ? 0 : 1 }}
                transition={{ duration: 0.1 }}
                d="M4 12h16"
              />
              <motion.path
                strokeLinecap="round"
                initial={false}
                animate={{ d: mobileOpen ? 'M6 6L18 18' : 'M4 17L20 17' }}
                transition={{ duration: 0.2 }}
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile search lives under the bar so it's always reachable */}
      {showSearch && <div className="md:hidden px-4 pb-3">{SearchInput}</div>}

      {/* Mobile dropdown panel */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden border-t border-border bg-surface"
            aria-label="Mobile"
          >
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.04 } } }}
              className="px-4 py-3 flex flex-col"
            >
              {[
                { label: 'Menu', path: '/', show: true },
                { label: 'My orders', path: '/orders', show: !!user },
                { label: 'Admin dashboard', path: '/admin', show: user?.role === 'ADMIN' },
                { label: 'Manage menu', path: '/admin/menu', show: user?.role === 'ADMIN' },
              ]
                .filter((l) => l.show)
                .map((l) => (
                  <motion.button
                    key={l.path}
                    variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
                    onClick={() => go(l.path)}
                    className={`text-left text-[15px] py-2.5 border-b border-border/60 ${isActive(l.path) ? 'text-accent-fg font-medium' : 'text-text'}`}
                  >
                    {l.label}
                  </motion.button>
                ))}

              {user ? (
                <motion.div
                  variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
                  className="flex items-center justify-between gap-2 pt-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-accent text-white text-xs font-medium flex items-center justify-center flex-shrink-0">
                      {initial}
                    </div>
                    <span className="text-sm text-text truncate">{user.name || user.email}</span>
                  </div>
                  <button onClick={handleLogout} className="text-sm text-accent-fg border border-accent/40 px-3 py-1.5 rounded-full flex-shrink-0">
                    Log out
                  </button>
                </motion.div>
              ) : (
                <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="flex gap-2 pt-3">
                  <button onClick={() => go('/login')} className="flex-1 text-sm border border-border text-text py-2.5 rounded-full">
                    Log in
                  </button>
                  <button onClick={() => go('/register')} className="flex-1 text-sm bg-accent text-white py-2.5 rounded-full">
                    Sign up
                  </button>
                </motion.div>
              )}
            </motion.div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
