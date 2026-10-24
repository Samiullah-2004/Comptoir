import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { GET_ALL_ORDERS } from '../graphql/queries'
import { UPDATE_ORDER_STATUS } from '../graphql/mutations'
import { useAuth } from '../context/AuthContext'
import { socket } from '../lib/socket'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import Header from '../components/Header'
import Toast from '../components/Toast'
import { ErrorState, ListSkeleton, SlowLoadingHint } from '../components/StatusViews'
import { usePageTitle } from '../hooks/usePageTitle'
import { formatPKR } from '../lib/pricing'
import { optimizedImage } from '../lib/image'
import { friendlyError } from '../lib/errors'
import { ORDER_STATUSES, statusStyles, titleCase } from '../types'

interface OrderItem {
  quantity: number
  menuItem: { name: string; imageUrl: string | null }
}

interface Order {
  id: string
  status: string
  total: number
  createdAt: string
  user: { name: string; email: string }
  items: OrderItem[]
}

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'ADMIN'
  const { data, loading, error, refetch } = useQuery<{ allOrders: Order[] }>(GET_ALL_ORDERS, {
    skip: !isAdmin,
    fetchPolicy: 'cache-and-network',
  })
  const [updateStatus] = useMutation(UPDATE_ORDER_STATUS)
  const [filter, setFilter] = useState<string>('ALL')
  const [toast, setToast] = useState('')
  usePageTitle('Admin Dashboard')

  useEffect(() => {
    if (!isAdmin) return
    socket.connect()
    function handleChange() {
      refetch()
    }
    socket.on('newOrder', handleChange)
    return () => {
      socket.off('newOrder', handleChange)
    }
  }, [refetch, isAdmin])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const orders = useMemo(() => data?.allOrders ?? [], [data])

  const stats = useMemo(() => {
    const today = new Date().toDateString()
    const todaysOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today)
    const pending = orders.filter((o) => o.status === 'PENDING' || o.status === 'PREPARING')
    const todaysRevenue = todaysOrders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.total, 0)

    return {
      totalOrders: orders.length,
      todaysOrders: todaysOrders.length,
      pendingCount: pending.length,
      todaysRevenue,
    }
  }, [orders])

  const bestSellers = useMemo(() => {
    const counts: Record<string, number> = {}
    orders.forEach((order) => {
      if (order.status === 'CANCELLED') return
      order.items.forEach((item) => {
        counts[item.menuItem.name] = (counts[item.menuItem.name] || 0) + item.quantity
      })
    })
    return Object.entries(counts)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
  }, [orders])

  if (!user) return <Navigate to="/login" replace state={{ from: '/admin' }} />
  if (!isAdmin) return <Navigate to="/" replace />

  async function handleStatusChange(orderId: string, status: string) {
    try {
      await updateStatus({
        variables: { orderId, status },
        optimisticResponse: {
          updateOrderStatus: { __typename: 'Order', id: orderId, status },
        },
      })
      setToast(`Order marked ${titleCase(status)}`)
    } catch (err) {
      setToast(friendlyError(err))
    }
  }

  const filteredOrders = filter === 'ALL' ? orders : orders.filter((o) => o.status === filter)

  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <main className="px-4 sm:px-8 py-5 sm:py-10 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-text">Admin dashboard</h1>
            <p className="text-sm text-text-secondary mt-1">New orders appear here automatically.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/admin/menu')}
            className="bg-accent hover:bg-accent-hover text-white text-sm px-5 py-2.5 rounded-full self-start sm:self-auto transition-colors"
          >
            Manage menu →
          </motion.button>
        </div>

        {loading && !data ? (
          <>
            <SlowLoadingHint />
            <ListSkeleton />
          </>
        ) : error && !data ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {[
                { label: 'Total orders', value: stats.totalOrders },
                { label: "Today's orders", value: stats.todaysOrders },
                { label: 'Pending / preparing', value: stats.pendingCount },
                { label: "Today's revenue", value: formatPKR(stats.todaysRevenue) },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-surface border border-border rounded-[14px] p-4 sm:p-5"
                >
                  <p className="text-text-secondary text-[10px] sm:text-xs mb-1 uppercase tracking-wide">{stat.label}</p>
                  <p className="text-text text-lg sm:text-2xl font-semibold tabular-nums">{stat.value}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-5 gap-6 items-start">
              <div className="lg:col-span-3 order-2 lg:order-1">
                <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
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
                        <motion.span layoutId="admin-filter" className="absolute inset-0 bg-accent rounded-full" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                      )}
                      <span className="relative">{s === 'ALL' ? 'All' : titleCase(s)}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <AnimatePresence initial={false} mode="popLayout">
                    {filteredOrders.map((order) => (
                      <motion.div
                        key={order.id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.25 }}
                        className="bg-surface border border-border rounded-[14px] p-4"
                      >
                        <div className="flex items-start justify-between mb-3 gap-2">
                          <div className="min-w-0">
                            <p className="text-text text-sm sm:text-base font-medium truncate">{order.user.name}</p>
                            <p className="text-text-secondary text-xs sm:text-sm truncate">{order.user.email}</p>
                            <p className="text-text-secondary text-[11px] mt-0.5">
                              <span className="font-mono">#{order.id.slice(0, 8).toUpperCase()}</span> ·{' '}
                              {new Date(order.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                          </div>
                          <AnimatePresence mode="wait">
                            <motion.span
                              key={order.status}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full flex-shrink-0 ${statusStyles[order.status] ?? 'text-text'}`}
                            >
                              {order.status}
                            </motion.span>
                          </AnimatePresence>
                        </div>

                        <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
                          {order.items.map((item, i) => {
                            const image = optimizedImage(item.menuItem.imageUrl, 80)
                            return (
                              <div key={i} className="flex items-center gap-2 bg-bg border border-border rounded-[10px] px-2 py-1.5 whitespace-nowrap">
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

                        <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
                          <span className="text-accent-fg text-sm sm:text-base font-semibold tabular-nums">{formatPKR(order.total)}</span>
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            aria-label="Order status"
                            className="border border-border rounded-full px-3 py-1.5 text-xs sm:text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s} value={s}>{titleCase(s)}</option>
                            ))}
                          </select>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {filteredOrders.length === 0 && (
                    <p className="text-text-secondary text-sm text-center py-8">No orders match this filter.</p>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 order-1 lg:order-2 lg:sticky" style={{ top: 'calc(var(--header-h, 64px) + 24px)' }}>
                <div className="bg-surface border border-border rounded-[14px] p-4 sm:p-5">
                  <h2 className="font-display text-lg text-text mb-4">Best sellers</h2>
                  {bestSellers.length > 0 ? (
                    <div className="h-[200px] sm:h-[240px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={bestSellers} layout="vertical" margin={{ left: 0, right: 16 }}>
                          <XAxis type="number" hide allowDecimals={false} />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={110}
                            tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            formatter={(value) => [value, 'Sold']}
                            contentStyle={{
                              backgroundColor: 'var(--color-surface)',
                              border: '1px solid var(--color-border)',
                              borderRadius: '8px',
                              fontSize: '12px',
                              color: 'var(--color-text)',
                            }}
                            cursor={{ fill: 'var(--color-border)', opacity: 0.3 }}
                          />
                          <Bar dataKey="qty" fill="var(--color-accent)" radius={[0, 6, 6, 0]} barSize={16} animationDuration={900} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary">Sales data will show up after the first order.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
      <Toast message={toast} show={!!toast} />
    </div>
  )
}
