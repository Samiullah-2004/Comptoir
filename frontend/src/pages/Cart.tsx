import { useState } from 'react'
import { useMutation, useQuery } from '@apollo/client/react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { CREATE_ORDER, CREATE_CHECKOUT_SESSION } from '../graphql/mutations'
import { GET_CATEGORIES } from '../graphql/queries'
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

const DELIVERY_FEE = 150
const TAX_RATE = 0.05

export default function Cart() {
  const { items, removeItem, updateQuantity, addItem, total, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [checkoutError, setCheckoutError] = useState('')
  const [notes, setNotes] = useState('')

  const [createOrder, { loading: creatingOrder }] = useMutation(CREATE_ORDER)
  const [createCheckoutSession, { loading: creatingSession }] = useMutation(CREATE_CHECKOUT_SESSION)
  const { data: categoriesData } = useQuery<{ categories: Category[] }>(GET_CATEGORIES)

  if (!user) {
    navigate('/login')
    return null
  }

  async function handleCheckout() {
    setCheckoutError('')
    try {
      const orderRes = await createOrder({
        variables: {
          items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        },
      })
      const orderData = orderRes.data as { createOrder: { id: string } }
      const orderId = orderData.createOrder.id

      const sessionRes = await createCheckoutSession({ variables: { orderId } })
      const sessionData = sessionRes.data as { createCheckoutSession: { url: string } }

      clearCart()
      window.location.href = sessionData.createCheckoutSession.url
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Checkout failed')
    }
  }

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-bg flex flex-col items-center justify-center px-4"
      >
        <p className="text-text-secondary mb-4">Your cart is empty.</p>
        <Link to="/" className="text-accent hover:text-accent-hover transition-colors">Back to menu</Link>
      </motion.div>
    )
  }

  const cartItemIds = new Set(items.map((i) => i.menuItemId))
  const allItems = (categoriesData?.categories ?? []).flatMap((c) => c.menuItems)
  const recommendations = allItems
    .filter((item) => !cartItemIds.has(item.id) && item.available)
    .slice(0, 4)

  const subtotal = total
  const tax = subtotal * TAX_RATE
  const grandTotal = subtotal + DELIVERY_FEE + tax

  return (
    <div className="min-h-screen bg-bg px-8 py-8">
      <h1 className="font-display text-2xl font-semibold text-text mb-6">Your cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-4xl">
        <div className="lg:col-span-2 space-y-3">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div
                key={item.menuItemId}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-surface border border-border rounded-[10px] p-3 flex items-center gap-3 overflow-hidden"
              >
                {item.imageUrl ? (
                  <div className="w-14 h-14 rounded-[6px] overflow-hidden bg-white border border-border flex-shrink-0">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-[6px] bg-border flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-text font-medium truncate">{item.name}</p>
                  <p className="text-text-secondary text-sm">{formatPKR(item.price)} each</p>
                </div>
                <Counter
                  value={item.quantity}
                  onChange={(q) => updateQuantity(item.menuItemId, q)}
                  min={0}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => removeItem(item.menuItemId)}
                  className="text-accent text-sm hover:text-accent-hover transition-colors whitespace-nowrap"
                >
                  Remove
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>

          <div className="pt-4">
            <label className="block text-sm text-text-secondary mb-2">
              Special instructions (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Extra spicy, no onions, ring the bell twice..."
              rows={3}
              className="w-full border border-border rounded-[8px] px-3 py-2 text-text bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors resize-none"
            />
          </div>

          {recommendations.length > 0 && (
            <div className="pt-6">
              <h2 className="font-display text-lg text-text mb-3">You might also like</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {recommendations.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ y: -3 }}
                    className="bg-surface border border-border rounded-[10px] p-3 flex flex-col"
                  >
                    {item.imageUrl ? (
                      <div className="w-full aspect-square rounded-[6px] overflow-hidden bg-white border border-border mb-2">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-full aspect-square rounded-[6px] bg-border mb-2" />
                    )}
                    <p className="text-text text-sm font-medium truncate mb-1">{item.name}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-accent text-sm font-medium">{formatPKR(item.price)}</span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() =>
                          addItem({
                            menuItemId: item.id,
                            name: item.name,
                            price: item.price,
                            imageUrl: item.imageUrl,
                          })
                        }
                        className="bg-accent hover:bg-accent-hover text-white w-6 h-6 rounded-full flex items-center justify-center text-sm"
                      >
                        +
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-surface border border-border rounded-[10px] p-5 sticky top-6">
            <h2 className="font-display text-lg text-text mb-4">Order summary</h2>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal</span>
                <span>{formatPKR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Delivery fee</span>
                <span>{formatPKR(DELIVERY_FEE)}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Tax (5%)</span>
                <span>{formatPKR(Math.round(tax))}</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between text-text font-medium text-base">
                <span>Total</span>
                <span className="text-accent">{formatPKR(Math.round(grandTotal))}</span>
              </div>
            </div>

            {checkoutError && <p className="text-accent text-sm mb-3">{checkoutError}</p>}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCheckout}
              disabled={creatingOrder || creatingSession}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white px-6 py-3 rounded-[6px]"
            >
              {creatingOrder || creatingSession ? 'Processing...' : 'Checkout'}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}