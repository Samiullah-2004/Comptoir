import { useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { CREATE_ORDER, CREATE_CHECKOUT_SESSION } from '../graphql/mutations'
import Counter from '../components/Counter'

function formatPKR(amount: number) {
  return `Rs. ${amount.toLocaleString('en-PK')}`
}

export default function Cart() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [checkoutError, setCheckoutError] = useState('')

  const [createOrder, { loading: creatingOrder }] = useMutation(CREATE_ORDER)
  const [createCheckoutSession, { loading: creatingSession }] = useMutation(CREATE_CHECKOUT_SESSION)

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

  return (
    <div className="min-h-screen bg-bg px-8 py-8">
      <h1 className="font-display text-2xl font-semibold text-text mb-6">Your cart</h1>

      <div className="max-w-lg space-y-3 mb-6">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.menuItemId}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-surface border border-border rounded-[10px] p-4 flex items-center justify-between overflow-hidden gap-3"
            >
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
      </div>

      <div className="max-w-lg flex items-center justify-between mb-6">
        <span className="text-text font-medium">Total</span>
        <span className="text-accent font-semibold text-lg">{formatPKR(total)}</span>
      </div>

      {checkoutError && <p className="text-accent text-sm mb-4">{checkoutError}</p>}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleCheckout}
        disabled={creatingOrder || creatingSession}
        className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-white px-6 py-3 rounded-[6px]"
      >
        {creatingOrder || creatingSession ? 'Processing...' : 'Checkout'}
      </motion.button>
    </div>
  )
}