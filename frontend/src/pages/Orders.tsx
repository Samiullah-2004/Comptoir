import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@apollo/client/react'
import { Navigate, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { GET_MY_ORDERS } from '../graphql/queries'
import { useAuth } from '../context/AuthContext'
import { socket } from '../lib/socket'
import { useCart } from '../context/CartContext'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { EmptyState, ErrorState, ListSkeleton, SlowLoadingHint } from '../components/StatusViews'
import { usePageTitle } from '../hooks/usePageTitle'
import { formatPKR } from '../lib/pricing'
import { optimizedImage } from '../lib/image'
import { ORDER_STATUSES, statusStyles, titleCase } from '../types'

interface OrderItem {
  quantity: number
  menuItem: { id: string; name: string; price: number; imageUrl: string | null; available: boolean }
}

interface Order {
  id: string
  status: string
  total: number
  createdAt: string
  items: OrderItem[]
}

const STEPS = ['PENDING', 'PREPARING', 'READY', 'COMPLETED']

function OrderProgress({ status }: { status: string }) {
  if (status === 'CANCELLED') {
    return <div className="text-accent-fg text-xs font-medium py-2">This order was cancelled</div>
  }
  const currentIndex = Math.max(0, STEPS.indexOf(status))
  const pct = (currentIndex / (STEPS.length - 1)) * 100
  return (
    <div className="py-3">
      <div className="relative mx-3 sm:mx-4">
        <div className="absolute top-1/2 -translate-y-1/2 inset-x-0 h-1 bg-border rounded-full" />
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 left-0 h-1 bg-accent rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="relative flex justify-between">
          {STEPS.map((step, i) => {
            const done = i <= currentIndex
            const current = i === currentIndex && status !== 'COMPLETED'
            return (
              <div key={step} className="relative flex items-center justify-center">
                {current && (
                  <motion.span
                    className="absolute w-7 h-7 rounded-full bg-accent/30"
                    animate={{ scale: [1, 1.6, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  />
                )}
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: done ? 'var(--color-accent)' : 'var(--color-surface)',
                    borderColor: done ? 'var(--color-accent)' : 'var(--color-border)',
                    scale: current ? 1.15 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  className="relative w-7 h-7 rounded-full border-2 flex items-center justify-center text-white"
                  aria-hidden
                >
                  {current ? (
                    <span className="w-2 h-2 rounded-full bg-white" />
                  ) : done ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : null}
                </motion.div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="flex justify-between mt-2">
        {STEPS.map((step, i) => (
          <span
            key={step}
            className={`text-[10px] sm:text-xs w-16 text-center first:text-left last:text-right ${i <= currentIndex ? 'text-text font-medium' : 'text-text-secondary'}`}
          >
            {titleCase(step)}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function Orders() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { addItem, clearCart } = useCart()
  const { data, loading, error, refetch } = useQuery<{ myOrders: Order[] }>(GET_MY_ORDERS, {
    skip: !user,
    fetchPolicy: 'cache-and-network',
  })
  const [liveStatuses, setLiveStatuses] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState<string>('ALL')
  const [justPaid, setJustPaid] = useState(() => searchParams.get('checkout') === 'success')
  const joinedRooms = useRef<string[]>([])
  usePageTitle('Your Orders')

  // Returning from Stripe: empty the cart now that payment went through.
  const paymentHandled = useRef(false)
  useEffect(() => {
    if (searchParams.get('checkout') !== 'success' || paymentHandled.current) return
    paymentHandled.current = true
    clearCart()
    try {
      sessionStorage.removeItem('cart-notes')
    } catch {
      // Non-essential.
    }
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams, clearCart])

  useEffect(() => {
    if (!user) return

    function handleUpdate(payload: { orderId: string; status: string }) {
      setLiveStatuses((prev) => ({ ...prev, [payload.orderId]: payload.status }))
    }
    // Rooms are per-connection, so re-join after every (re)connect.
    function rejoin() {
      joinedRooms.current.forEach((id) => socket.emit('joinOrderRoom', id))
    }

    socket.on('orderStatusUpdated', handleUpdate)
    socket.on('connect', rejoin)
    socket.connect()

    return () => {
      socket.off('orderStatusUpdated', handleUpdate)
      socket.off('connect', rejoin)
    }
  }, [user])

  useEffect(() => {
    const ids = (data?.myOrders ?? []).map((o) => o.id)
    joinedRooms.current = ids
    ids.forEach((id) => socket.emit('joinOrderRoom', id))
  }, [data])

  const orders = useMemo(
    () => (data?.myOrders ?? []).map((o) => ({ ...o, status: liveStatuses[o.id] || o.status })),
    [data, liveStatuses]
  )

  const stats = useMemo(() => {
    const billable = orders.filter((o) => o.status !== 'CANCELLED')
    return {
      totalOrders: orders.length,
      totalSpent: billable.reduce((sum, o) => sum + o.total, 0),
      activeCount: orders.filter((o) => ['PENDING', 'PREPARING', 'READY'].includes(o.status)).length,
    }
  }, [orders])

  if (!user) return <Navigate to="/login" replace state={{ from: '/orders' }} />

  function handleReorder(order: Order) {
    order.items.forEach((item) => {
      if (item.menuItem.available) {
        addItem(
          {
            menuItemId: item.menuItem.id,
            name: item.menuItem.name,
            price: item.menuItem.price,
            imageUrl: item.menuItem.imageUrl,
          },
          item.quantity
        )
      }
    })
    navigate('/cart')
  }

  const filteredOrders = filter === 'ALL' ? orders : orders.filter((o) => o.status === filter)

  let body: React.ReactNode
  if (loading && !data) {
    body = (
      <>
        <SlowLoadingHint />
        <ListSkeleton />
      </>
    )
  } else if (error && !data) {
    body = <ErrorState error={error} onRetry={() => refetch()} />
  } else if (orders.length === 0) {
    body = (
      <EmptyState
        emoji="🍽️"
        title="No orders yet"
        description="Once you place an order you can follow it here, live, from kitchen to pickup."
        action={
          <Link to="/" className="inline-block bg-accent hover:bg-accent-hover text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors">
            Start an order
          </Link>
        }
      />
    )
  } else {
    body = (
      <>
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
          {[
            { label: 'Total orders', value: stats.totalOrders },
            { label: 'Active now', value: stats.activeCount },
            { label: 'Total spent', value: formatPKR(stats.totalSpent) },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-surface border border-border rounded-[14px] p-3 sm:p-5"
            >
              <p className="text-text-secondary text-[10px] sm:text-xs mb-1 uppercase tracking-wide">{stat.label}</p>
              <p className="text-text text-sm sm:text-2xl font-semibold tabular-nums">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-2 mb-5 sm:mb-6 overflow-x-auto no-scrollbar">
          {['ALL', ...ORDER_STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`relative px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm whitespace-nowrap border transition-colors ${filter === s
                ? 'text-white border-accent'
                : 'bg-surface text-text-secondary border-border hover:border-accent hover:text-text'
                }`}
            >
              {filter === s && (
                <motion.span layoutId="orders-filter" className="absolute inset-0 bg-accent rounded-full" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
              )}
              <span className="relative">{s === 'ALL' ? 'All' : titleCase(s)}</span>
            </button>
          ))}
        </div>

        <div className="space-y-3 sm:space-y-4">
          <AnimatePresence initial={false} mode="popLayout">
            {filteredOrders.map((order, i) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3, delay: Math.min(i, 6) * 0.04 }}
                className="bg-surface border border-border rounded-[14px] p-4 sm:p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-2 gap-3">
                  <div>
                    <p className="text-text font-medium text-sm sm:text-base">
                      Order <span className="font-mono text-text-secondary">#{order.id.slice(0, 8).toUpperCase()}</span>
                    </p>
                    <p className="text-text-secondary text-xs sm:text-sm">
                      {new Date(order.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={order.status}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.25 }}
                      className={`text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide flex-shrink-0 ${statusStyles[order.status] ?? 'text-text'}`}
                    >
                      {order.status}
                    </motion.span>
                  </AnimatePresence>
                </div>

                <OrderProgress status={order.status} />

                <div className="flex gap-2 my-3 overflow-x-auto no-scrollbar">
                  {order.items.map((item, j) => {
                    const image = optimizedImage(item.menuItem.imageUrl, 80)
                    return (
                      <div key={j} className="flex items-center gap-2 bg-bg border border-border rounded-[10px] px-2 py-1.5 whitespace-nowrap">
                        {image ? (
                          <div className="w-8 h-8 rounded-[6px] overflow-hidden bg-white border border-border flex-shrink-0">
                            <img src={image} alt={item.menuItem.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-[6px] bg-border flex-shrink-0" />
                        )}
                        <span className="text-text text-xs">{item.quantity}× {item.menuItem.name}</span>
                      </div>
                    )
                  })}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <p className="text-accent-fg text-base sm:text-lg font-semibold tabular-nums">{formatPKR(order.total)}</p>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleReorder(order)}
                    className="text-xs sm:text-sm border border-accent text-accent-fg hover:bg-accent hover:text-white transition-colors px-3.5 py-1.5 rounded-full font-medium"
                  >
                    ↻ Reorder
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredOrders.length === 0 && (
            <p className="text-text-secondary text-sm text-center py-8">No {titleCase(filter)} orders.</p>
          )}
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Header />
      <main className="flex-1 px-4 sm:px-8 py-5 sm:py-10 w-full max-w-3xl mx-auto">
        <AnimatePresence>
          {justPaid && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="relative overflow-hidden mb-6 bg-success/10 border border-success/30 rounded-[14px] p-4 sm:p-5 flex items-start gap-3"
              role="status"
            >
              <motion.span
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 12 }}
                className="text-2xl"
                aria-hidden
              >
                🎉
              </motion.span>
              <div className="flex-1">
                <p className="text-text font-semibold">Payment received — your order is in!</p>
                <p className="text-text-secondary text-sm">The kitchen has it. This page updates live as it moves along.</p>
              </div>
              <button onClick={() => setJustPaid(false)} className="text-text-secondary hover:text-text" aria-label="Dismiss">
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-5 sm:mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-text">Your orders</h1>
          {orders.length > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-text-secondary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              Live
            </span>
          )}
        </div>

        {body}
      </main>
      <Footer />
    </div>
  )
}
