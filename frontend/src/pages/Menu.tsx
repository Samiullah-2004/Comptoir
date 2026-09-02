import { useState } from 'react'
import { useQuery } from '@apollo/client/react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GET_CATEGORIES } from '../graphql/queries'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import Toast from '../components/Toast'

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
  const navigate = useNavigate()
  const [toastMsg, setToastMsg] = useState('')
  const [showToast, setShowToast] = useState(false)

  function handleAdd(item: MenuItem) {
    if (!user) {
      navigate('/login')
      return
    }
    addItem({ menuItemId: item.id, name: item.name, price: item.price })
    setToastMsg(`${item.name} added to cart`)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 1800)
  }

  if (loading) return <div className="p-8 text-text-secondary">Loading menu...</div>
  if (error) return <div className="p-8 text-accent">Failed to load menu: {error.message}</div>

  const categories = data?.categories ?? []
  const currentCategory = activeCategory
    ? categories.find((c) => c.id === activeCategory)
    : categories[0]

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border px-8 py-5 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-text">Comptoir</h1>
        <div className="flex items-center gap-3">
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
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap border transition-all duration-150 ${
                (currentCategory?.id === cat.id)
                  ? 'bg-accent text-white border-accent'
                  : 'bg-surface text-text-secondary border-border hover:border-accent hover:text-text'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {currentCategory?.menuItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              whileHover={{ y: -4 }}
              className="bg-surface border border-border rounded-[10px] p-4 flex flex-col shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-full h-32 bg-border rounded-[6px] mb-3" />
              <h3 className="text-text font-medium mb-1">{item.name}</h3>
              <div className="mt-auto flex items-center justify-between pt-2">
                <span className="text-accent font-medium">{formatPKR(item.price)}</span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  disabled={!item.available}
                  onClick={() => handleAdd(item)}
                  className="bg-accent hover:bg-accent-hover disabled:opacity-40 text-white text-sm px-3 py-1.5 rounded-[6px]"
                >
                  Add
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <Toast message={toastMsg} show={showToast} />
    </div>
  )
}