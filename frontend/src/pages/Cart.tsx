import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@apollo/client/react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { CREATE_ORDER, CREATE_CHECKOUT_SESSION } from '../graphql/mutations'
import { GET_CATEGORIES } from '../graphql/queries'
import Counter from '../components/Counter'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { EmptyState } from '../components/StatusViews'
import { usePageTitle } from '../hooks/usePageTitle'
import { calculateTotals, formatPKR, TAX_RATE } from '../lib/pricing'
import { optimizedImage } from '../lib/image'
import { friendlyError } from '../lib/errors'
import type { Category } from '../types'

const NOTES_KEY = 'cart-notes'

export default function Cart() {
  const { items, removeItem, updateQuantity, addItem, total, count } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [checkoutError, setCheckoutError] = useState('')
  const [redirecting, setRedirecting] = useState(false)
  const [notes, setNotes] = useState(() => {
    try {
      return sessionStorage.getItem(NOTES_KEY) ?? ''
    } catch {
      return ''
    }
  })
  const cancelled = searchParams.get('checkout') === 'cancelled'

  const [createOrder, { loading: creatingOrder }] = useMutation(CREATE_ORDER)
  const [createCheckoutSession, { loading: creatingSession }] = useMutation(CREATE_CHECKOUT_SESSION)
  const { data: categoriesData } = useQuery<{ categories: Category[] }>(GET_CATEGORIES)
  usePageTitle('Your Cart')

  const busy = creatingOrder || creatingSession || redirecting

  const recommendations = useMemo(() => {
    const cartItemIds = new Set(items.map((i) => i.menuItemId))
    // One suggestion per category reads as a curated pick rather than "the first four rows".
    return (categoriesData?.categories ?? [])
      .map((c) => c.menuItems.find((item) => !cartItemIds.has(item.id) && item.available))
      .filter((item): item is NonNullable<typeof item> => !!item)
      .slice(0, 4)
  }, [categoriesData, items])

  function updateNotes(value: string) {
    setNotes(value)
    try {
      sessionStorage.setItem(NOTES_KEY, value)
    } catch {
      // Non-essential.
    }
  }

  async function handleCheckout() {
    if (!user) {
      navigate('/login', { state: { from: '/cart' } })
      return
    }
    setCheckoutError('')
    try {
      const orderRes = await createOrder({
        variables: {
          items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        },
      })
      const orderId = (orderRes.data as { createOrder: { id: string } }).createOrder.id

      const sessionRes = await createCheckoutSession({ variables: { orderId, notes: notes || null } })
      const url = (sessionRes.data as { createCheckoutSession: { url: string } }).createCheckoutSession.url

      // The cart is cleared on the success page, not here, so backing out of
      // Stripe brings the customer back to a full cart.
      setRedirecting(true)
      window.location.href = url
    } catch (err) {
      setCheckoutError(friendlyError(err, 'Checkout failed. Please try again.'))
    }
  }

  const { tax, deliveryFee, total: grandTotal } = calculateTotals(total)

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Header />
      <main className="flex-1 px-4 sm:px-8 py-5 sm:py-10 w-full max-w-6xl mx-auto">
        <AnimatePresence>
          {cancelled && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 flex items-center justify-between gap-3 bg-surface border border-border rounded-[12px] px-4 py-3 text-sm"
            >
              <span className="text-text">Checkout was cancelled — your cart is just as you left it.</span>
              <button
                onClick={() => setSearchParams({}, { replace: true })}
                className="text-text-secondary hover:text-text"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {items.length === 0 ? (
          <EmptyState
            emoji="🛒"
            title="Your cart is empty."
            description="Looks like you haven't added anything yet. The menu is full of good ideas."
            action={
              <Link
                to="/"
                className="inline-block bg-accent hover:bg-accent-hover text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors"
              >
                Browse the menu
              </Link>
            }
          />
        ) : (
          <>
            <div className="flex items-baseline justify-between mb-5 sm:mb-8">
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-text">Your cart</h1>
              <span className="text-sm text-text-secondary">
                {count} {count === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
              <div className="lg:col-span-2 space-y-3">
                <AnimatePresence initial={false}>
                  {items.map((item) => {
                    const image = optimizedImage(item.imageUrl, 160)
                    return (
                      <motion.div
                        key={item.menuItemId}
                        layout
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                        transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                        className="bg-surface border border-border rounded-[14px] p-3 sm:p-4 flex items-center gap-3 sm:gap-4"
                      >
                        {image ? (
                          <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-[10px] overflow-hidden bg-white border border-border flex-shrink-0">
                            <img src={image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-[10px] bg-border flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-text text-sm sm:text-base font-medium truncate">{item.name}</p>
                          <p className="text-text-secondary text-xs sm:text-sm">{formatPKR(item.price)} each</p>
                          <div className="mt-2 sm:hidden">
                            <Counter value={item.quantity} onChange={(q) => updateQuantity(item.menuItemId, q)} min={0} />
                          </div>
                        </div>
                        <div className="hidden sm:block">
                          <Counter value={item.quantity} onChange={(q) => updateQuantity(item.menuItemId, q)} min={0} />
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <motion.span
                            key={item.quantity}
                            initial={{ opacity: 0.4, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-text text-sm sm:text-base font-semibold tabular-nums"
                          >
                            {formatPKR(item.price * item.quantity)}
                          </motion.span>
                          <button
                            onClick={() => removeItem(item.menuItemId)}
                            className="text-text-secondary hover:text-accent-fg text-xs transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>

                <div className="pt-3">
                  <label htmlFor="notes" className="block text-sm text-text-secondary mb-2">
                    Special instructions (optional)
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => updateNotes(e.target.value)}
                    placeholder="e.g. Extra spicy, no onions, ring the bell twice..."
                    rows={3}
                    maxLength={500}
                    className="input-field bg-surface text-sm resize-none"
                  />
                </div>

              </div>

              <div className="lg:col-span-1 lg:row-span-2">
                <div
                  className="bg-surface border border-border rounded-[16px] p-5 sm:p-6 lg:sticky shadow-sm"
                  style={{ top: 'calc(var(--header-h, 64px) + 24px)' }}
                >
                  <h2 className="font-display text-lg sm:text-xl text-text mb-5">Order summary</h2>
                  <div className="space-y-2.5 text-sm mb-5">
                    <div className="flex justify-between text-text-secondary">
                      <span>Subtotal</span>
                      <span className="tabular-nums">{formatPKR(total)}</span>
                    </div>
                    <div className="flex justify-between text-text-secondary">
                      <span>Delivery fee</span>
                      <span className="tabular-nums">{formatPKR(deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between text-text-secondary">
                      <span>Tax ({Math.round(TAX_RATE * 100)}%)</span>
                      <span className="tabular-nums">{formatPKR(tax)}</span>
                    </div>
                    <div className="h-px bg-border my-3" />
                    <div className="flex justify-between text-text font-semibold text-base">
                      <span>Total</span>
                      <motion.span
                        key={grandTotal}
                        initial={{ scale: 1.08, opacity: 0.6 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-accent-fg tabular-nums"
                      >
                        {formatPKR(grandTotal)}
                      </motion.span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {checkoutError && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-accent-fg text-sm mb-3"
                        role="alert"
                      >
                        {checkoutError}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <motion.button
                    whileHover={busy ? undefined : { scale: 1.02 }}
                    whileTap={busy ? undefined : { scale: 0.98 }}
                    onClick={handleCheckout}
                    disabled={busy}
                    className="w-full bg-accent hover:bg-accent-hover disabled:opacity-60 text-white px-6 py-3.5 rounded-full font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    {busy && <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
                    {busy ? 'Taking you to payment...' : user ? 'Checkout' : 'Log in to checkout'}
                  </motion.button>

                  <p className="text-[11px] text-text-secondary text-center mt-3 flex items-center justify-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Secure payment by Stripe · test mode
                  </p>
                </div>
              </div>

              {recommendations.length > 0 && (
                <div className="lg:col-span-2 lg:pt-2">
                  <h2 className="font-display text-lg sm:text-xl text-text mb-4">You might also like</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {recommendations.map((item, i) => {
                      const image = optimizedImage(item.imageUrl, 320)
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                          whileHover={{ y: -4 }}
                          className="group bg-surface border border-border rounded-[12px] p-2.5 sm:p-3 flex flex-col"
                        >
                          <div className="w-full aspect-square rounded-[8px] overflow-hidden bg-white border border-border mb-2">
                            {image ? (
                              <img src={image} alt={item.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            ) : (
                              <div className="w-full h-full bg-border" />
                            )}
                          </div>
                          <p className="text-text text-xs sm:text-sm font-medium truncate mb-1">{item.name}</p>
                          <div className="mt-auto flex items-center justify-between">
                            <span className="text-accent-fg text-xs sm:text-sm font-medium">{formatPKR(item.price)}</span>
                            <motion.button
                              whileHover={{ scale: 1.15, rotate: 90 }}
                              whileTap={{ scale: 0.85 }}
                              onClick={() =>
                                addItem({ menuItemId: item.id, name: item.name, price: item.price, imageUrl: item.imageUrl })
                              }
                              aria-label={`Add ${item.name}`}
                              className="bg-accent hover:bg-accent-hover text-white w-7 h-7 rounded-full flex items-center justify-center text-base flex-shrink-0"
                            >
                              +
                            </motion.button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
