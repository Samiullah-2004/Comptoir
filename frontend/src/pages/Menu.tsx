import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@apollo/client/react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GET_CATEGORIES } from '../graphql/queries'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { AnimatePresence } from 'framer-motion'
import ProductModal from '../components/ProductModal'
import Toast from '../components/Toast'
import HeroSlider from '../components/HeroSlider'
import Counter from '../components/Counter'

interface MenuItem {
  id: string
  name: string
  price: number
  imageUrl: string | null
  available: boolean
}

interface Category {
  id: string
  name: string
  menuItems: MenuItem[]
}

function formatPKR(amount: number) {
  return `Rs. ${amount.toLocaleString('en-PK')}`
}

export default function Menu() {
  const { data, loading, error } = useQuery<{ categories: Category[] }>(GET_CATEGORIES)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const { addItem, items } = useCart()
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [toastMsg, setToastMsg] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [highlightedCategory, setHighlightedCategory] = useState<string | null>(null)
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  function getQuantity(itemId: string) {
    return quantities[itemId] ?? 1
  }

  function setQuantity(itemId: string, qty: number) {
    setQuantities((prev) => ({ ...prev, [itemId]: qty }))
  }

  function handleAdd(item: MenuItem) {
    if (!user) {
      navigate('/login')
      return
    }
    const qty = getQuantity(item.id)
    addItem({ menuItemId: item.id, name: item.name, price: item.price }, qty)
    setToastMsg(`${item.name} added to cart`)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 1800)
    setQuantity(item.id, 1)
  }

  useEffect(() => {
    if (activeCategory !== null) return // only scroll-spy in "All" view

    const cats = data?.categories ?? []
    if (cats.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHighlightedCategory(entry.target.id.replace('section-', ''))
          }
        })
      },
      { rootMargin: '-120px 0px -70% 0px', threshold: 0 }
    )

    cats.forEach((cat) => {
      const el = sectionRefs.current[cat.id]
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [data, activeCategory])

  if (loading) return <div className="p-8 text-text-secondary">Loading menu...</div>
  if (error) return <div className="p-8 text-accent">Failed to load menu: {error.message}</div>

  const categories = data?.categories ?? []
  const isAllView = activeCategory === null
  const singleCategory = isAllView ? null : categories.find((c) => c.id === activeCategory)

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0)

  function renderItemCard(item: MenuItem, i: number) {
    return (
      <motion.div
        key={item.id}
        layoutId={`card-${item.id}`}
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{
          default: { type: 'spring', stiffness: 300, damping: 30 },
          opacity: { duration: 0.25, delay: (i % 4) * 0.04 },
        }}
        whileHover={{ y: -4 }}
        onClick={() => setSelectedItem(item)}
        className="bg-surface border border-border rounded-[10px] p-4 flex flex-col shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      >
        {item.imageUrl ? (
          <motion.div layoutId={`image-${item.id}`} className="w-full aspect-square bg-white border border-border rounded-[6px] mb-3 overflow-hidden">
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          </motion.div>
        ) : (
          <div className="w-full aspect-square bg-border rounded-[6px] mb-3" />
        )}
        <motion.h3 layoutId={`title-${item.id}`} className="text-text font-medium mb-1">
          {item.name}
        </motion.h3>
        <div className="mt-auto pt-2">
          <div className="flex items-center justify-between mb-2">
            <motion.span layoutId={`price-${item.id}`} className="text-accent font-medium">
              {formatPKR(item.price)}
            </motion.span>
            <div onClick={(e) => e.stopPropagation()}>
              <Counter value={getQuantity(item.id)} onChange={(q) => setQuantity(item.id, q)} />
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            disabled={!item.available}
            onClick={(e) => {
              e.stopPropagation()
              handleAdd(item)
            }}
            className="w-full bg-accent hover:bg-accent-hover disabled:opacity-40 text-white text-sm px-3 py-1.5 rounded-[6px]"
          >
            Add
          </motion.button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border px-8 py-5 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-text">Comptoir</h1>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={toggleTheme}
            className="text-text-secondary hover:text-text flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-sm"
            aria-label="Toggle dark mode"
          >
            <span>{theme === 'light' ? '🌙' : '☀️'}</span>
            <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
          </motion.button>
          {cartCount > 0 && (
            <motion.button
              key={cartCount}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              onClick={() => navigate('/cart')}
              className="text-sm text-text-secondary hover:text-text"
            >
              Cart · {cartCount}
            </motion.button>
          )}
          {user ? (
            <>
              <button onClick={() => navigate('/orders')} className="text-sm text-text-secondary hover:text-text transition-colors">
                Orders
              </button>
              {user.role === 'ADMIN' && (
                <button onClick={() => navigate('/admin')} className="text-sm text-text-secondary hover:text-text transition-colors">
                  Admin
                </button>
              )}
              <span className="text-sm text-text">{user.name || user.email}</span>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="text-sm text-text-secondary hover:text-text transition-colors">
                Login
              </button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/register')}
                className="bg-accent hover:bg-accent-hover text-white text-sm px-4 py-2 rounded-[6px]"
              >
                Sign up
              </motion.button>
            </>
          )}
        </div>
      </header>

      <div className="px-8 py-6">
        <HeroSlider />

        <div className="flex gap-2 mb-8 overflow-x-auto sticky top-0 bg-bg/95 backdrop-blur-sm py-3 z-10 -mx-8 px-8">
          <button
            onClick={() => {
              setActiveCategory(null)
              setHighlightedCategory(null)
            }}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap border transition-all duration-150 ${isAllView && !highlightedCategory
              ? 'bg-accent text-white border-accent'
              : 'bg-surface text-text-secondary border-border hover:border-accent hover:text-text'
              }`}
          >
            All
          </button>
          {categories.map((cat) => {
            const isHighlighted = isAllView ? highlightedCategory === cat.id : activeCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id)
                  setHighlightedCategory(null)
                }}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap border transition-all duration-150 ${isHighlighted
                  ? 'bg-accent text-white border-accent'
                  : 'bg-surface text-text-secondary border-border hover:border-accent hover:text-text'
                  }`}
              >
                {cat.name}
              </button>
            )
          })}
        </div>

        {isAllView ? (
          <div className="space-y-12">
            {categories.map((cat) => (
              <motion.section
                key={cat.id}
                id={`section-${cat.id}`}
                ref={(el) => { sectionRefs.current[cat.id] = el }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="font-display text-xl font-semibold text-accent whitespace-nowrap">
                    {cat.name}
                  </h2>
                  <div className="h-px bg-border flex-1" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {cat.menuItems.map((item, i) => renderItemCard(item, i))}
                </div>
              </motion.section>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {singleCategory?.menuItems.map((item, i) => renderItemCard(item, i))}
          </div>
        )}
      </div>
      <AnimatePresence>
        {selectedItem && (
          <ProductModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onAdd={(item, qty) => {
              if (!user) {
                navigate('/login')
                return
              }
              addItem({ menuItemId: item.id, name: item.name, price: item.price }, qty)
              setToastMsg(`${item.name} added to cart`)
              setShowToast(true)
              setTimeout(() => setShowToast(false), 1800)
            }}
          />
        )}
      </AnimatePresence>
      <Toast message={toastMsg} show={showToast} />
    </div>
  )
}