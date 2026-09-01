import { useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { CREATE_ORDER, CREATE_CHECKOUT_SESSION } from '../graphql/mutations'

function formatPKR(amount: number) {
  return `Rs. ${amount.toLocaleString('en-PK')}`
}

export default function Cart() {
  const { items, removeItem, total, clearCart } = useCart()
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
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4">
        <p className="text-text-secondary mb-4">Your cart is empty.</p>
        <Link to="/" className="text-accent">Back to menu</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg px-8 py-8">
      <h1 className="font-display text-2xl font-semibold text-text mb-6">Your cart</h1>

      <div className="max-w-lg space-y-3 mb-6">
        {items.map((item) => (
          <div
            key={item.menuItemId}
            className="bg-surface border border-border rounded-[10px] p-4 flex items-center justify-between"
          >
            <div>
              <p className="text-text font-medium">{item.name}</p>
              <p className="text-text-secondary text-sm">
                {item.quantity} × {formatPKR(item.price)}
              </p>
            </div>
            <button
              onClick={() => removeItem(item.menuItemId)}
              className="text-accent text-sm"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="max-w-lg flex items-center justify-between mb-6">
        <span className="text-text font-medium">Total</span>
        <span className="text-accent font-semibold text-lg">{formatPKR(total)}</span>
      </div>

      {checkoutError && <p className="text-accent text-sm mb-4">{checkoutError}</p>}

      <button
        onClick={handleCheckout}
        disabled={creatingOrder || creatingSession}
        className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-white px-6 py-3 rounded-[6px]"
      >
        {creatingOrder || creatingSession ? 'Processing...' : 'Checkout'}
      </button>
    </div>
  )
}